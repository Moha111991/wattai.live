import httpx
from .base import DeviceAdapter

class FroniusInverterAdapter(DeviceAdapter):
    """
    Fronius Solar API v1
    Dokumentation: https://www.fronius.com/en/solar-energy/installers-partners/technical-data/all-products/system-monitoring/open-interfaces/fronius-solar-api-json-
    """
    async def poll(self):
        if not self.host:
            raise ValueError("Host nicht konfiguriert")
        
        async with httpx.AsyncClient(timeout=5) as client:
            # PowerFlow Realtime Data
            url = f"https://{self.host}/solar_api/v1/GetPowerFlowRealtimeData.fcgi"
            r = await client.get(url)
            r.raise_for_status()
            data = r.json()
            
            body = data.get("Body", {}).get("Data", {})
            
            # Site: Gesamtsystem
            site = body.get("Site", {})
            pv_w = site.get("P_PV")  # PV-Leistung (None wenn Nacht)
            load_w = site.get("P_Load")  # Hausverbrauch (negativ!)
            grid_w = site.get("P_Grid")  # Netz (positiv=Bezug, negativ=Einspeisung)
            
            # Inverter Details (optional)
            inverters = body.get("Inverters", {})
            if inverters:
                inv_1 = inverters.get("1", {})
                pv_w = inv_1.get("P", pv_w)  # Falls Site-Daten fehlen
            
            # MQTT Topics publishen
            if pv_w is not None:
                await self.publish("energy/pv/power", str(int(abs(pv_w))))
            
            if load_w is not None:
                await self.publish("energy/house/load", str(int(abs(load_w))))
            
            if grid_w is not None:
                if grid_w > 0:
                    await self.publish("energy/grid/import", str(int(grid_w)))
                    await self.publish("energy/grid/export", "0")
                else:
                    await self.publish("energy/grid/import", "0")
                    await self.publish("energy/grid/export", str(int(abs(grid_w))))