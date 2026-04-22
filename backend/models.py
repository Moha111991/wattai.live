from pydantic import BaseModel, Field
from typing import Optional, Literal

class PVSystem(BaseModel):
    manufacturer: str = Field(..., description="Hersteller (z.B. SolarEdge, Fronius)")
    model: str = Field(..., description="Modell")
    peak_power_kw: float = Field(..., ge=1, le=50, description="Nennleistung in kW")
    panel_count: int = Field(..., ge=1, le=100, description="Anzahl Module")

class Wallbox(BaseModel):
    manufacturer: str = Field(..., description="Hersteller (z.B. Heidelberg, ABL)")
    model: str = Field(..., description="Modell")
    max_power_kw: float = Field(..., ge=3.7, le=22, description="Ladeleistung in kW")
    phases: Literal[1, 3] = Field(3, description="Phasen (1 oder 3)")

class HomeBattery(BaseModel):
    manufacturer: str = Field(..., description="Hersteller (z.B. BYD, Tesla)")
    model: str = Field(..., description="Modell")
    capacity_kwh: float = Field(..., ge=5, le=50, description="Kapazität in kWh")
    max_charge_kw: float = Field(..., ge=2, le=15, description="Max. Ladeleistung in kW")
    max_discharge_kw: float = Field(..., ge=2, le=15, description="Max. Entladeleistung in kW")

class EVehicle(BaseModel):
    manufacturer: str = Field(..., description="Hersteller (z.B. Tesla, VW, BMW)")
    model: str = Field(..., description="Modell (z.B. Model 3, ID.4)")
    battery_capacity_kwh: float = Field(..., ge=30, le=120, description="Akkukapazität in kWh")
    max_charge_kw: float = Field(..., ge=7, le=250, description="Max. Ladeleistung AC in kW")
    v2h_capable: bool = Field(False, description="V2H/V2G fähig?")

class HouseholdConfig(BaseModel):
    persons: Literal[1, 2, 3, 4, 5] = Field(..., description="Anzahl Personen")
    annual_consumption_kwh: float = Field(..., description="Jahresverbrauch in kWh")
    heating_type: Literal["heatpump", "gas", "oil", "electric"] = Field("heatpump")
    has_heatpump: bool = Field(True, description="Wärmepumpe vorhanden?")

class SystemConfig(BaseModel):
    pv_system: PVSystem
    wallbox: Wallbox
    home_battery: Optional[HomeBattery] = None
    ev: EVehicle
    household: HouseholdConfig
    location: str = Field("Germany", description="Standort")
    timezone: str = Field("Europe/Berlin")
