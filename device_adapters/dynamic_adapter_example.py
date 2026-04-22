"""Kleiner Beispiel‑Adapter, der sich dynamisch beim Backend registriert.

Voraussetzung:
- Backend läuft auf http://localhost:8000
- Die neue Logik in backend/main.py ist aktiv (dynamic_adapters + /api/ingest)

Start:
    python -m device_adapters.dynamic_adapter_example

Nach ein paar Sekunden sollte im Frontend im Bereich "Geräte" ein neues Gerät
mit der ID "dynamic_smartmeter_1" erscheinen.
"""

import asyncio
from datetime import datetime, timezone

import httpx

API_BASE = "http://localhost:8000"
DEVICE_ID = "dynamic_smartmeter_1"
DEVICE_TYPE = "smartmeter"


async def send_measurement(client: httpx.AsyncClient) -> None:
    """Sendet eine einzelne Messung an /api/ingest."""
    timestamp = datetime.now(timezone.utc).isoformat()
    payload = {
        "device_id": DEVICE_ID,
        "device_type": DEVICE_TYPE,
        "name": "Dynamischer Smartmeter",
        "power": 1234.0,
        "voltage": 230.0,
        "current": 5.3,
        "timestamp": timestamp,
    }

    try:
        resp = await client.post(f"{API_BASE}/api/ingest", json=payload, timeout=5.0)
        print(f"[dynamic-adapter] POST /api/ingest -> {resp.status_code} {resp.text}")
    except Exception as e:
        print(f"[dynamic-adapter] Fehler beim Senden: {e}")


async def main() -> None:
    """Schickt regelmäßig Messwerte, um das Gerät sichtbar zu machen."""
    print(
        f"[dynamic-adapter] Starte dynamischen Adapter für {DEVICE_ID} "
        f"gegen {API_BASE}"
    )
    async with httpx.AsyncClient() as client:
        while True:
            await send_measurement(client)
            # alle 10 Sekunden eine Messung
            await asyncio.sleep(10)


if __name__ == "__main__":
    asyncio.run(main())
