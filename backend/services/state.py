from dataclasses import dataclass, asdict
from typing import Optional
from datetime import datetime
import asyncio

@dataclass
class RealtimeData:
    ev_soc: Optional[float] = None
    home_battery_soc: Optional[float] = None
    pv_power_w: Optional[float] = None
    house_load_w: Optional[float] = None
    grid_import_w: Optional[float] = None
    grid_export_w: Optional[float] = None
    ev_charging: Optional[bool] = None
    ev_v2h: Optional[bool] = None
    ev_power_w: Optional[float] = None
    # Kumulative Energiewerte des verbundenen Smart Meters (sofern vom Adapter geliefert)
    smartmeter_import_kwh: Optional[float] = None
    smartmeter_export_kwh: Optional[float] = None
    timestamp: Optional[str] = None

class RealtimeState:
    def __init__(self):
        self.data = RealtimeData()
        self._lock = asyncio.Lock()
    
    async def update(self, patch: dict):
        async with self._lock:
            for k, v in patch.items():
                if hasattr(self.data, k) and v is not None:
                    setattr(self.data, k, v)
            self.data.timestamp = datetime.utcnow().isoformat()
    
    async def get(self) -> dict:
        async with self._lock:

            return asdict(self.data)

# Globale Instanz für Systemzustand
state = RealtimeState()