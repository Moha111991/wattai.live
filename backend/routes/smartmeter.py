from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random

router = APIRouter()

# Beispiel: Smart Meter Verbindung (nur Dummy)
@router.post("/smartmeter/connect")
def connect_smartmeter(ip: str, port: int, meter_id: str):
    # Hier echte Verbindung/Validierung einbauen
    return {"status": "connected", "ip": ip, "port": port, "meter_id": meter_id}

# Verbrauchsdaten für Chart (Dummy-Daten)
@router.get("/smartmeter/consumption")
def get_consumption(hours: int = Query(24, ge=1, le=168)):
    now = datetime.now()
    data = []
    for h in range(hours):
        t = now - timedelta(hours=hours-h)
        value = round(0.5 + random.uniform(-0.2, 0.5), 2)  # kW
        data.append({"time": t.isoformat(), "value": value})
    return {"data": data}

# Detaillierte Verbraucherprofile (Dummy)
@router.get("/smartmeter/consumer_profile")
def get_consumer_profile(consumer: str):
    profiles = {
        "heatpump": {"name": "Wärmepumpe", "capacity": 8, "power": 2.5, "soc": 75, "cycles": 110},
        "ev": {"name": "E-Auto", "capacity": 60, "power": 11, "soc": 45, "cycles": 220},
        "battery": {"name": "Heimspeicher", "capacity": 10, "power": 5, "soc": 80, "cycles": 150},
    }
    return profiles.get(consumer, {})
