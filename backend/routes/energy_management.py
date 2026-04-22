from fastapi import APIRouter, Body
from backend.ai_controller import get_ai_controller
from typing import Dict, Any

router = APIRouter()

@router.post("/energy/optimize")
async def optimize_energy(current_data: Dict[str, Any] = Body(...)):
    """
    KI-gestützte Optimierung des Energieflusses:
    - Berücksichtigt PV, Speicher, EV, Wetter, Verbrauch
    - Gibt Steuerempfehlung für alle Komponenten zurück
    """
    controller = await get_ai_controller()
    action = await controller.get_optimal_action(current_data)
    return action

@router.post("/energy/schedule")
async def optimize_schedule(forecast_data: Dict[str, Any] = Body(...)):
    """
    KI-gestützte Planung für die nächsten Stunden
    """
    controller = await get_ai_controller()
    schedule = await controller.optimize_schedule(forecast_data.get("data", []), forecast_data.get("horizon", 24))
    return {"schedule": schedule}

@router.get("/energy/status")
async def get_status():
    controller = await get_ai_controller()
    return controller.get_status()
