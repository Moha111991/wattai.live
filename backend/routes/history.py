from fastapi import APIRouter, Query
from datetime import datetime, timedelta
import random

router = APIRouter()

# PV-Ertragsdaten für Chart (Dummy-Daten)
@router.get("/history/pv")
def get_pv_history(hours: int = Query(24, ge=1, le=168)):
    now = datetime.now()
    data = []
    for h in range(hours):
        t = now - timedelta(hours=hours-h)
        value = round(2.5 + random.uniform(-1.0, 2.0), 2)  # kW
        data.append({"time": t.isoformat(), "value": value})
    return {"data": data}

# Verbrauchsdaten für Chart (Dummy-Daten)
@router.get("/history/consumption")
def get_consumption_history(hours: int = Query(24, ge=1, le=168)):
    now = datetime.now()
    data = []
    for h in range(hours):
        t = now - timedelta(hours=hours-h)
        value = round(1.2 + random.uniform(-0.5, 1.0), 2)  # kW
        data.append({"time": t.isoformat(), "value": value})
    return {"data": data}
