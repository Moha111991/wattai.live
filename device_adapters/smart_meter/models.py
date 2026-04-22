from pydantic import BaseModel

class SmartMeter(BaseModel):
    id: str
    name: str
    type: str = "Smart Meter"
    status: str
    soc: float = 0
    power_kw: float = 0
    manufacturer: str
    model: str
    ip: str

smart_meters = [
    SmartMeter(id="sm-001", name="Hauptzähler Haus", status="connected", power_kw=3.42, manufacturer="Eastron", model="SDM630-MCT", ip="192.168.178.20"),
    SmartMeter(id="sm-002", name="PV-Einspeisezähler", status="connected", power_kw=-2.85, manufacturer="Janitza", model="UMG103", ip="192.168.178.21"),
    SmartMeter(id="sm-003", name="Wärmepumpe Verbrauchszähler", status="connected", power_kw=1.12, manufacturer="Schneider Electric", model="iEM3155", ip="192.168.178.22"),
    SmartMeter(id="sm-004", name="Industrie Hauptzähler", status="disconnected", power_kw=0, manufacturer="Carlo Gavazzi", model="EM340", ip="192.168.178.23"),
    SmartMeter(id="sm-005", name="Smart Meter Gateway (HAN-Port)", status="connected", power_kw=0.56, manufacturer="EMH", model="eHZ-iMSys", ip="192.168.178.24")
]
