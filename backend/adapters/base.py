import asyncio
from abc import ABC, abstractmethod
from typing import Dict, Any, Callable
from datetime import datetime

class DeviceAdapter(ABC):
    def __init__(self, name: str, cfg: Dict[str, Any], publish: Callable[[str, str], asyncio.Future]):
        self.name = name
        self.cfg = cfg
        self.publish = publish
        self.interval = cfg.get("poll_interval_s", 5)
        self.host = cfg.get("host")
        self.enabled = cfg.get("enabled", True)
        self.last_success = None
        self.error_count = 0

    @abstractmethod
    async def poll(self):
        """Override this to implement device-specific polling"""
        pass

    async def run(self):
        if not self.enabled:
            print(f"[Adapter:{self.name}] Deaktiviert in config")
            return
        
        print(f"[Adapter:{self.name}] Gestartet (Host: {self.host}, Interval: {self.interval}s)")
        
        while True:
            try:
                await self.poll()
                self.last_success = datetime.now()
                self.error_count = 0
            except Exception as e:
                self.error_count += 1
                print(f"[Adapter:{self.name}] Fehler #{self.error_count}: {e}")
                if self.error_count > 10:
                    print(f"[Adapter:{self.name}] Zu viele Fehler, pausiere 60s")
                    await asyncio.sleep(60)
                    self.error_count = 0
            
            await asyncio.sleep(self.interval)