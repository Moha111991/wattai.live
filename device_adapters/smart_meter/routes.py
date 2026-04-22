from fastapi import APIRouter
from device_adapters.smart_meter.models import SmartMeter
from pydantic import BaseModel

router = APIRouter()

class Inverter(BaseModel):
    id: str
    name: str
    type: str = "Inverter"
    status: str
    soc: float = 0
    power_kw: float = 0
    manufacturer: str
    model: str
    ip: str

# Dummy-Geräteliste mit Inverter und Smart Meter
all_devices = [
    Inverter(
        id="inv1",
        name="Wechselrichter 1",
        type="Inverter",
        status="connected",
        soc=80,
        power_kw=3.2,
        manufacturer="Fronius",
        model="Symo GEN24",
        ip="192.168.1.101"
    ),
    SmartMeter(
        id="sm1",
        name="Smart Meter 1",
        type="Smart Meter",
        status="connected",
        soc=0,
        power_kw=1.5,
        manufacturer="Siemens",
        model="SM-2025",
        ip="192.168.1.50"
    )
]

@router.get("/devices")
def get_devices():
    return {"devices": [d.dict() for d in all_devices]}

api_routes = [
    {
        "method": "GET",
        "endpoint": "/devices",
        "description": "Gibt alle Geräte zurück (inkl. Smart Meter).",
        "payload_required": False,
        "example_request": None,
        "example_response": [
            {
                "id": "sm-001",
                "name": "Hauptzähler Haus",
                "type": "Smart Meter",
                "status": "connected",
                "soc": None,
                "power_kw": 3.42,
                "manufacturer": "Eastron",
                "model": "SDM630-MCT",
                "ip": "192.168.178.45"
            }
        ]
    },
    {
        "method": "GET",
        "endpoint": "/devices/{id}",
        "description": "Gibt ein einzelnes Gerät anhand der ID zurück.",
        "payload_required": False,
        "example_request": None,
        "example_response": {
            "id": "sm-001",
            "name": "Hauptzähler Haus",
            "type": "Smart Meter",
            "status": "connected",
            "soc": None,
            "power_kw": 3.42,
            "manufacturer": "Eastron",
            "model": "SDM630-MCT",
            "ip": "192.168.178.45"
        }
    },
    {
        "method": "POST",
        "endpoint": "/devices",
        "description": "Erstellt ein neues Gerät (z. B. Smart Meter).",
        "payload_required": True,
        "example_request": {
            "id": "sm1",
            "name": "Smart Meter 1",
            "type": "Smart Meter",
            "status": "connected",
            "soc": 0,
            "power_kw": 1.5,
            "manufacturer": "Siemens",
            "model": "SM-2025",
            "ip": "192.168.1.50"
        }
    },
]
