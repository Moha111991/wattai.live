from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class PVRealtime:
    power_w: float
    today_kwh: Optional[float]  # falls der WR das direkt liefert
    timestamp: datetime

class PVAdapter(ABC):
    @abstractmethod
    async def get_realtime(self) -> PVRealtime:
        ...

class MockPVAdapter(PVAdapter):
    async def get_realtime(self) -> PVRealtime:
        # Ersetze später durch echten Aufruf (HTTP/MQTT/Modbus)
        now = datetime.now()
        # simple Demo: 3.8–4.5 kW
        power_w = 3800 + (now.second % 8) * 100
        return PVRealtime(power_w=power_w, today_kwh=12.8, timestamp=now)