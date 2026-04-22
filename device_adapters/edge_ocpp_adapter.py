"""
Edge OCPP Adapter (hardened skeleton)

- Supports a simple HTTP websocket test server for incoming simulated MeterValues
- On-disk outbox buffering, retries with requests Session + urllib3 Retry
- TLS/CA verification options and env/config parsing

This is a lightweight skeleton intended for development and testing. For
production please run/extend a proper OCPP central system and persistent queue.
"""
import os
import asyncio
import json
import logging
import threading
import time
from datetime import datetime
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from aiohttp import web

LOG = logging.getLogger("edge_ocpp")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
DEVICE_ID = os.getenv("DEVICE_ID", "wallbox_1")
OUTBOX_DIR = os.getenv("OUTBOX_DIR", os.path.join(os.path.dirname(__file__), "outbox"))
PORT = int(os.getenv("OCPP_HTTP_PORT", "9000"))

# TLS/verify
BACKEND_VERIFY = os.getenv("BACKEND_VERIFY", "true").lower() not in ("0", "false", "no")
BACKEND_CA_BUNDLE = os.getenv("BACKEND_CA_BUNDLE")
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY", "mein_geheimer_schulkey123")

# Retry config
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "5"))
BACKOFF_FACTOR = float(os.getenv("BACKOFF_FACTOR", "0.5"))


def ensure_outbox_dir():
    os.makedirs(OUTBOX_DIR, exist_ok=True)


def session_with_retries():
    s = requests.Session()
    retries = Retry(
        total=MAX_RETRIES,
        backoff_factor=BACKOFF_FACTOR,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=["HEAD", "GET", "OPTIONS", "POST"],
    )
    s.mount("https://", HTTPAdapter(max_retries=retries))
    s.mount("http://", HTTPAdapter(max_retries=retries))
    return s


def enqueue_payload(payload: dict):
    ensure_outbox_dir()
    fname = f"{int(time.time()*1000)}_{DEVICE_ID}.json"
    path = os.path.join(OUTBOX_DIR, fname)
    try:
        with open(path, "w") as f:
            json.dump(payload, f)
        LOG.info("Enqueued payload to outbox: %s", path)
    except Exception:
        LOG.exception("Failed to enqueue payload")


def flush_outbox(session: requests.Session):
    ensure_outbox_dir()
    files = sorted(os.listdir(OUTBOX_DIR))
    for fn in files:
        path = os.path.join(OUTBOX_DIR, fn)
        try:
            with open(path, "r") as f:
                payload = json.load(f)
        except Exception:
            LOG.exception("Bad outbox file, deleting: %s", path)
            try:
                os.remove(path)
            except Exception:
                pass
            continue

        try:
            _post(session, payload)
            os.remove(path)
            LOG.info("Flushed outbox file %s", path)
        except Exception:
            LOG.exception("Failed to flush %s - will retry later", path)
            break


def _post(session: requests.Session, payload: dict):
    url = f"{BACKEND_URL.rstrip('/')}/api/ingest"
    headers = {"Content-Type": "application/json", "X-API-Key": BACKEND_API_KEY}
    verify = BACKEND_CA_BUNDLE if BACKEND_CA_BUNDLE else BACKEND_VERIFY
    resp = session.post(url, json=payload, headers=headers, timeout=10, verify=verify)
    resp.raise_for_status()
    LOG.info("Posted payload to backend status=%s", resp.status_code)
    return resp


def post_ingest(payload: dict, session: Optional[requests.Session] = None):
    session = session or session_with_retries()
    try:
        _post(session, payload)
    except Exception:
        LOG.exception("Direct post failed, enqueuing payload")
        enqueue_payload(payload)


async def fake_http_incoming_meter(request):
    """Endpoint for tests: POST JSON to /ocpp/meter to simulate incoming MeterValues from CP"""
    data = await request.json()
    payload = {
        "device_id": DEVICE_ID,
        "device_type": "wallbox",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        **data,
    }
    # Post asynchronously to avoid blocking the aiohttp worker
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, post_ingest, payload, session_with_retries())
    return web.json_response({"status": "ok"})


def run_app():
    app = web.Application()
    app.router.add_get('/', lambda r: web.Response(text="OCPP skeleton server. POST /ocpp/meter to inject data."))
    app.router.add_post('/ocpp/meter', fake_http_incoming_meter)

    # Background flusher thread to ship queued payloads
    stop_event = threading.Event()

    def flusher():
        session = session_with_retries()
        while not stop_event.is_set():
            try:
                flush_outbox(session)
            except Exception:
                LOG.exception("Outbox flusher error")
            time.sleep(2)

    t = threading.Thread(target=flusher, daemon=True)
    t.start()

    try:
        web.run_app(app, host='0.0.0.0', port=PORT)
    finally:
        stop_event.set()
        t.join(timeout=2)


if __name__ == '__main__':
    run_app()
