from fastapi import APIRouter
router = APIRouter()

devices = {
    "wallbox": {"id": "wallbox1", "type": "Wallbox", "name": "Wallbox Pro", "status": "online"},
    "battery": {"id": "battery1", "type": "Heimspeicher", "name": "Home Battery", "soc": 80},
    "inverter": {"id": "inverter1", "type": "PV-Wechselrichter", "name": "SolarEdge SE", "power_kw": 5.2}
}

@router.get("/devices")
def get_devices():
    return {"devices": list(devices.values())}

# Optional: POST, DELETE, etc. für Geräteverwaltung