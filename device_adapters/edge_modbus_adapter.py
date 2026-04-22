"""
Edge Modbus Adapter (hardened skeleton)

- Config via environment variables or a JSON/YAML config file path (see CONFIG_PATH)
- On-disk outbox for buffering when backend is unavailable
- Retries with exponential backoff and a requests session with urllib3 Retry
- TLS/CA verification options for backend calls

This file intentionally keeps dependencies minimal. For production use you
should replace the simple on-disk queue with a persistent queue or sqlite.

Usage example:
  export BACKEND_URL=https://backend.example.com
  export DEVICE_ID=pv_modbus_1
  export MODBUS_HOST=192.168.1.100
  export MODBUS_PORT=502
  export POLL_INTERVAL=5
  export OUTBOX_DIR=./outbox
  python device_adapters/edge_modbus_adapter.py

"""
import os
import time
import json
import logging
import threading
from datetime import datetime
from typing import Optional

import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from pymodbus.client.sync import ModbusTcpClient
except Exception:
    ModbusTcpClient = None

LOG = logging.getLogger("edge_modbus")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

# Configuration (env overrides config file)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
CONFIG_PATH = os.getenv("CONFIG_PATH")  # optional JSON/YAML with config
DEVICE_ID = os.getenv("DEVICE_ID", "modbus_device_1")
MODBUS_HOST = os.getenv("MODBUS_HOST", "127.0.0.1")
MODBUS_PORT = int(os.getenv("MODBUS_PORT", "502"))
POLL_INTERVAL = float(os.getenv("POLL_INTERVAL", "5"))
OUTBOX_DIR = os.getenv("OUTBOX_DIR", os.path.join(os.path.dirname(__file__), "outbox"))
REQUEST_ID = os.getenv("REQUEST_ID")

# TLS / verification
BACKEND_VERIFY = os.getenv("BACKEND_VERIFY", "true").lower() not in ("0", "false", "no")
BACKEND_CA_BUNDLE = os.getenv("BACKEND_CA_BUNDLE")  # path to CA bundle file if needed
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
    except Exception as e:
        LOG.exception("Failed to enqueue payload: %s", e)


def flush_outbox(session: requests.Session):
    ensure_outbox_dir()
    files = sorted(os.listdir(OUTBOX_DIR))
    for fn in files:
        path = os.path.join(OUTBOX_DIR, fn)
        try:
            with open(path, "r") as f:
                payload = json.load(f)
        except Exception:
            LOG.exception("Failed to read outbox file, removing: %s", path)
            try:
                os.remove(path)
            except Exception:
                pass
            continue

        try:
            _post(session, payload)
            os.remove(path)
            LOG.info("Successfully flushed outbox file %s", path)
        except Exception:
            LOG.exception("Failed to flush outbox file %s - will retry later", path)
            # Stop processing further files to preserve ordering/backoff
            break


def _post(session: requests.Session, payload: dict):
    url = f"{BACKEND_URL.rstrip('/')}/api/ingest"
    headers = {"Content-Type": "application/json", "X-API-Key": BACKEND_API_KEY}
    verify = BACKEND_CA_BUNDLE if BACKEND_CA_BUNDLE else BACKEND_VERIFY
    resp = session.post(url, json=payload, headers=headers, timeout=10, verify=verify)
    resp.raise_for_status()
    LOG.info("Posted payload to backend, status=%s", resp.status_code)
    return resp


def read_modbus_registers(client: ModbusTcpClient) -> dict:
    """Example read function. Adapt register addresses per your device."""
    result = {}
    try:
        rr = client.read_holding_registers(100, 2, unit=1)
        if rr and hasattr(rr, "registers"):
            registers = rr.registers
            power_raw = (registers[0] << 16) + registers[1]
            result["power"] = power_raw / 1000.0
        rv = client.read_holding_registers(102, 1, unit=1)
        if rv and hasattr(rv, "registers"):
            result["voltage"] = rv.registers[0] / 10.0
    except Exception:
        LOG.exception("Modbus read error")
    return result


def worker_loop(stop_event: threading.Event):
    LOG.info("Starting Modbus Edge Adapter (hardened)")
    if ModbusTcpClient is None:
        LOG.error("pymodbus not installed. Install with: pip install pymodbus")
        return

    session = session_with_retries()

    client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
    # We allow connection attempts inside the loop

    while not stop_event.is_set():
        try:
            if not client.connect():
                LOG.warning("Failed to connect to Modbus at %s:%s - retrying", MODBUS_HOST, MODBUS_PORT)
                time.sleep(2)
                continue

            data = read_modbus_registers(client)
            if data:
                payload = {
                    "device_id": DEVICE_ID,
                    "device_type": "modbus",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                    **data,
                }
                if REQUEST_ID:
                    payload["request_id"] = REQUEST_ID

                try:
                    _post(session, payload)
                except Exception:
                    LOG.exception("Direct post failed, enqueuing payload")
                    enqueue_payload(payload)
            else:
                LOG.debug("No data read from Modbus")

            # Try to flush any queued items (best-effort)
            try:
                flush_outbox(session)
            except Exception:
                LOG.debug("Flush outbox encountered an error, will retry later")

        except Exception:
            LOG.exception("Unhandled error in worker loop")

        stop_event.wait(POLL_INTERVAL)


def main():
    stop_event = threading.Event()
    t = threading.Thread(target=worker_loop, args=(stop_event,), daemon=True)
    t.start()
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        LOG.info("Shutting down Modbus adapter...")
        stop_event.set()
        t.join(timeout=5)


if __name__ == "__main__":
    main()
