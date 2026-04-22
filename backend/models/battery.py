from dataclasses import dataclass

@dataclass
class BatteryConfig:
    capacity_kwh: float = 10.0
    max_charge_kw: float = 5.0
    max_discharge_kw: float = 5.0
    min_soc: float = 10.0
    max_soc: float = 95.0
    efficiency: float = 0.95

class BatterySimulator:
    def __init__(self, config: BatteryConfig, initial_soc: float = 50.0):
        self.config = config
        self.soc = initial_soc
        self.power_kw = 0.0
    
    def charge(self, power_kw: float, duration_h: float) -> float:
        power_kw = min(power_kw, self.config.max_charge_kw)
        available_capacity = (self.config.max_soc - self.soc) / 100 * self.config.capacity_kwh
        energy_kwh = min(power_kw * duration_h * self.config.efficiency, available_capacity)
        self.soc += (energy_kwh / self.config.capacity_kwh) * 100
        self.power_kw = power_kw
        return energy_kwh
    
    def discharge(self, power_kw: float, duration_h: float) -> float:
        power_kw = min(power_kw, self.config.max_discharge_kw)
        available_energy = (self.soc - self.config.min_soc) / 100 * self.config.capacity_kwh
        energy_kwh = min(power_kw * duration_h / self.config.efficiency, available_energy)
        self.soc -= (energy_kwh / self.config.capacity_kwh) * 100
        self.power_kw = -power_kw
        return energy_kwh
    
    def idle(self):
        self.power_kw = 0.0
    
    def get_status(self) -> dict:
        return {
            "soc": round(self.soc, 1),
            "power_kw": round(self.power_kw, 2),
            "capacity_kwh": self.config.capacity_kwh,
        }