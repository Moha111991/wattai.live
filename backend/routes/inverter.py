"""
FastAPI-Routen für Wechselrichter-Auswahl und Realtime-Daten
- /inverter/list: JSON-Auswahlliste für das Frontend
- /inverter/realtime: Echtzeitdaten für das Dashboard
- MQTT-Publish für Realtime-Daten
"""
from fastapi import APIRouter, Query
from device_adapters.inverter_adapter import INVERTER_LIST, HTTPInverterAdapter, ModbusInverterAdapter, CloudInverterAdapter
import asyncio

router = APIRouter()

@router.get("/inverter/list")
def get_inverter_list():
    """Gibt die komplette Hersteller/Modell-Liste für das Frontend zurück"""
    return {"inverters": INVERTER_LIST}

@router.get("/inverter/realtime")
async def get_inverter_realtime(
    manufacturer: str = Query(...),
    model: str = Query(...),
    protocol: str = Query(...),
    ip: str = Query(None)
):
    """Liefert Echtzeitdaten für einen ausgewählten Wechselrichter"""
    # Adapter-Instanz je nach Protokoll
    if protocol == "https":
        adapter = HTTPInverterAdapter(manufacturer, model, 0, ip)
    elif protocol == "modbus":
        adapter = ModbusInverterAdapter(manufacturer, model, 0, ip)
    elif protocol == "cloud":
        adapter = CloudInverterAdapter(manufacturer, model, 0, ip)
    else:
        return {"error": "Unknown protocol"}
    data = adapter.read_realtime()
    # Optional: MQTT publish (hier nur Dummy)
    # await mqtt_publish("energy/pv/power", str(data.get("pv_power_w", 0)))
    return data

# Die Route kann im Backend eingebunden werden:
from backend.routes.inverter import router as inverter_router
app.include_router(inverter_router)
