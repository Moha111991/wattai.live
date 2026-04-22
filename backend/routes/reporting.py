from fastapi import APIRouter
from datetime import datetime, timedelta
import random

router = APIRouter()

@router.get("/reporting/co2_costs")
def get_co2_costs(period: str = "2025"):
    # Hier echte Daten aus Datenbank/InfluxDB/Adapter holen
    # Dummy: Werte für CO2, Kosten, Autarkie
    # TODO: Mit echten Messwerten aus PV, Verbrauch, Netz, etc. verbinden
    co2_saved = 128.5  # kg
    cost_eur = 312.40  # €
    autarky = 78.2     # %
    # Vergleichswerte (optional)
    co2_last_year = 115.0
    cost_last_year = 339.00
    autarky_last_year = 70.0
    return {
        "co2_saved_kg": co2_saved,
        "cost_eur": cost_eur,
        "autarky": autarky,
        "period": period,
        "co2_last_year": co2_last_year,
        "cost_last_year": cost_last_year,
        "autarky_last_year": autarky_last_year
    }
