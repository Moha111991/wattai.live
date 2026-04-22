#!/usr/bin/env python3
"""
Small demo script to illustrate the request_id connect flow end-to-end.

Modes:
 - e2e: POST /devices/{device_id}/connect -> receive request_id, wait, then POST /api/ingest with that request_id
 - connect: only POST /devices/{device_id}/connect (returns request_id)
 - adapter: only POST /api/ingest (requires --request-id)

Usage examples (from project root):
  python3 device_adapters/demo_request_id_adapter.py --mode e2e --device-id demo_sensor_1
  python3 device_adapters/demo_request_id_adapter.py --mode connect --device-id demo_sensor_1
  python3 device_adapters/demo_request_id_adapter.py --mode adapter --device-id demo_sensor_1 --request-id <id>

The script uses the backend at http://localhost:8000 by default. Change with --backend-url.
"""

import argparse
import time
import uuid
import json
from datetime import datetime

try:
    import requests
except ImportError:
    print("Please install requests: pip install requests")
    raise


def post_connect(backend_url: str, device_id: str, extra: dict | None = None) -> dict:
    url = f"{backend_url.rstrip('/')}/devices/{device_id}/connect"
    payload = extra or {}
    r = requests.post(url, json=payload, timeout=5)
    r.raise_for_status()
    return r.json()


def post_ingest(backend_url: str, device_id: str, device_type: str, power_w: float, request_id: str | None = None) -> dict:
    url = f"{backend_url.rstrip('/')}/api/ingest"
    payload = {
        "device_id": device_id,
        "device_type": device_type,
        "power": power_w,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    if request_id:
        payload["request_id"] = request_id
    r = requests.post(url, json=payload, timeout=5)
    r.raise_for_status()
    return r.json()


def get_connection_status(backend_url: str, request_id: str) -> dict:
    url = f"{backend_url.rstrip('/')}/connections/{request_id}"
    r = requests.get(url, timeout=5)
    if r.status_code == 404:
        return {"error": "not_found", "status_code": 404}
    r.raise_for_status()
    return r.json()


def main():
    p = argparse.ArgumentParser(description="Demo adapter showing request_id connect -> ingest flow")
    p.add_argument("--mode", choices=["e2e", "connect", "adapter"], default="e2e",
                   help="Operation mode: 'e2e' does connect + ingest; 'connect' only requests connect; 'adapter' only sends ingest (requires --request-id).")
    p.add_argument("--backend-url", default="http://localhost:8000", help="Backend base URL (default http://localhost:8000)")
    p.add_argument("--device-id", default="demo_sensor_1", help="Device ID to use")
    p.add_argument("--device-type", default="generic", help="Device type to report")
    p.add_argument("--power", type=float, default=123.4, help="Power value to send in ingest (W)")
    p.add_argument("--delay", type=float, default=2.0, help="Seconds to wait between connect and ingest in e2e mode")
    p.add_argument("--request-id", default=None, help="Optional existing request_id (used in adapter mode)")
    args = p.parse_args()

    backend = args.backend_url.rstrip('/')
    device_id = args.device_id

    try:
        if args.mode == 'connect':
            print(f"[connect] Asking backend to create/connect for device '{device_id}'")
            resp = post_connect(backend, device_id, extra={})
            print("Backend response:", json.dumps(resp, indent=2))
            print("Now you can wait or pass the request_id to an adapter process that will call /api/ingest")

        elif args.mode == 'adapter':
            if not args.request_id:
                print("adapter mode requires --request-id when you only run the adapter part")
                return
            print(f"[adapter] Sending ingest for device '{device_id}' with request_id {args.request_id}")
            resp = post_ingest(backend, device_id, args.device_type, args.power, args.request_id)
            print("Ingest response:", json.dumps(resp, indent=2))

        elif args.mode == 'e2e':
            # 1) Ask backend to create a pending connect
            print(f"[e2e] Requesting connect for device '{device_id}'")
            resp = post_connect(backend, device_id, extra={})
            print("Connect response:", json.dumps(resp, indent=2))
            request_id = resp.get('request_id')
            if not request_id:
                print("No request_id returned; aborting")
                return

            # 2) Wait a short time (simulate adapter startup)
            print(f"Waiting {args.delay}s to simulate adapter startup before sending ingest...")
            time.sleep(max(0.1, args.delay))

            # 3) Adapter sends ingest with request_id -> backend should mark pending -> connected
            print(f"[e2e] Sending ingest with request_id {request_id}")
            resp2 = post_ingest(backend, device_id, args.device_type, args.power, request_id)
            print("Ingest response:", json.dumps(resp2, indent=2))

            # 4) Query connection status
            print("Querying connection status...")
            status = get_connection_status(backend, request_id)
            print("Connection status:", json.dumps(status, indent=2))

            print("End-to-end demo finished. The backend should have updated the pending connection to 'connected' and (if running) broadcast a WebSocket event.")

    except requests.exceptions.RequestException as e:
        print(f"HTTP error while contacting backend: {e}")


if __name__ == '__main__':
    main()
