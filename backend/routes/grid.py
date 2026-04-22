from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/realtime")
async def get_grid_realtime():
    """Grid Echtzeit-Daten (Mock)"""
    return {
        "import_w": 0,
        "export_w": 1850,
        "net_flow_w": -1850,
        "timestamp": datetime.now().isoformat()
    }