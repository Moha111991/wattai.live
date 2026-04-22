from fastapi import APIRouter
from datetime import datetime
from backend.services.state import state

router = APIRouter()

@router.get("/api/alarms")
async def get_alarms():
    alarms = []
    # Echte Fehlerquellen prüfen
    data = await state.get()
    now = datetime.now().isoformat()
    # PV-Wechselrichter offline
    pv_power = data.get("pv_power_w")
    if pv_power is not None and pv_power < 10:
        alarms.append({
            "id": "pv_offline",
            "type": "error",
            "message": "PV-Wechselrichter liefert keinen Strom!",
            "timestamp": now,
            "recommendation": "PV-Anlage und Verbindung prüfen."
        })
    # Batterie-Ladezustand niedrig
    battery_soc = data.get("home_battery_soc")
    if battery_soc is not None and battery_soc < 20:
        alarms.append({
            "id": "battery_low",
            "type": "warning",
            "message": "Batterie-Ladezustand niedrig (<20%)",
            "timestamp": now,
            "recommendation": "Ladevorgang starten oder Verbrauch reduzieren."
        })
    # EV nicht verbunden
    ev_charging = data.get("ev_charging")
    ev_v2h = data.get("ev_v2h")
    if (ev_charging is not True) and (ev_v2h is not True):
        alarms.append({
            "id": "ev_not_connected",
            "type": "info",
            "message": "E-Auto ist aktuell nicht verbunden.",
            "timestamp": now
        })
    # Weitere Adapter/Fehlerquellen können hier ergänzt werden
    return {"alarms": alarms}
