# Edge Adapter Skeletons

This folder contains two minimal Edge adapter skeletons to help you integrate local devices with the backend via HTTP `/api/ingest`.

Files
- `edge_modbus_adapter.py` - Modbus TCP polling adapter skeleton (uses `pymodbus`).
- `edge_ocpp_adapter.py` - OCPP skeleton (lightweight HTTP/ocpp placeholder); also contains a `/ocpp/meter` test endpoint to simulate MeterValues.

Design
- The Edge adapters run near the devices (Raspberry Pi, VM). They collect data from Modbus, OCPP, Cloud APIs and send JSON to the backend at `POST /api/ingest`.
- They can include an optional `REQUEST_ID` in the POST payload to correlate UI connect attempts.

Quick start
1. Install dependencies (example):

```bash
pip install pymodbus requests aiohttp
```

2. Run Modbus adapter (example):

```bash
export BACKEND_URL=http://localhost:8000
export DEVICE_ID=pv_modbus_1
export MODBUS_HOST=192.168.1.100
export MODBUS_PORT=502
python device_adapters/edge_modbus_adapter.py
```

3. Run OCPP adapter (test mode):

```bash
export BACKEND_URL=http://localhost:8000
export DEVICE_ID=WBX123456
python device_adapters/edge_ocpp_adapter.py
# Then simulate meter values
curl -X POST http://localhost:9000/ocpp/meter -H 'Content-Type: application/json' -d '{"power":3500, "status":"charging"}'
```

Adapter contract
- POST body to `/api/ingest` should contain at least:
  - `device_id` (string)
  - `device_type` (string)
  - `timestamp` (ISO8601)
  - measurement fields: `power`, `voltage`, `current`, `soc`, `energy_kwh`, `status`, ...
  - optional `request_id` to associate with frontend connect

Security
- Store cloud API keys and credentials in environment variables or a secrets store on the Edge. Do not commit keys to repository or send from the browser.

Next steps
- I can extend these skeletons to be production ready:
  - Add buffering/retry with local persistence (SQLite/LevelDB) for offline mode.
  - Add TLS and authentication when calling backend.
  - Add unit tests and type hints.

