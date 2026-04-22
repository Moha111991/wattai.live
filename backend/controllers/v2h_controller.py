import asyncio
from backend.models.battery import BatterySimulator

class V2HController:
    def __init__(self, battery: BatterySimulator):
        self.battery = battery
        self.mode = "auto"
    
    async def optimize(self, pv_kw: float, load_kw: float) -> dict:
        surplus = pv_kw - load_kw
        
        if surplus > 0.5:
            if self.battery.soc < self.battery.config.max_soc - 5:
                self.battery.charge(surplus, 1/3600)
                return {
                    "action": "charge",
                    "power_kw": surplus,
                    "reason": f"PV-Überschuss {surplus:.1f} kW",
                }
        elif surplus < -0.3:
            if self.battery.soc > self.battery.config.min_soc + 5:
                discharge_power = min(abs(surplus), self.battery.config.max_discharge_kw)
                self.battery.discharge(discharge_power, 1/3600)
                return {
                    "action": "discharge",
                    "power_kw": discharge_power,
                    "reason": f"Netzbezug reduzieren ({abs(surplus):.1f} kW)",
                }
        
        self.battery.idle()
        return {"action": "idle", "power_kw": 0, "reason": "Kein Bedarf"}