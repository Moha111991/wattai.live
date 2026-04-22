import httpx
from .base import DeviceAdapter

class GoEWallboxAdapter(DeviceAdapter):
    """
    go-eCharger API v2 (HTTP)
    Dokumentation: https://github.com/goecharger/go-eCharger-API-v2/blob/main/apikeys-de.md
    """
    async def poll(self):
        if not self.host:
            raise ValueError("Host nicht konfiguriert")
        
        async with httpx.AsyncClient(timeout=5) as client:
            # API v2: /api/status
            r = await client.get(f"http://{self.host}/api/status")
            r.raise_for_status()
            data = r.json()
            
            # car: 1=ready, 2=charging, 3=waiting, 4=done
            car_state = data.get("car", 1)
            
            # nrg: [U_L1, U_L2, U_L3, I_L1, I_L2, I_L3, P_L1, P_L2, P_L3, P_N, P_total, ...]
            nrg = data.get("nrg", [0]*16)
            power_w = nrg[11] if len(nrg) > 11 else 0  # P_total in W
            
            # dws: Geladene Energie in Deka-Watt-Sekunden (0.01 kWh)
            energy_kwh = data.get("dws", 0) / 360000
            
            # Simulate SOC (go-e hat kein echtes SOC, nur wenn EV es meldet)
            soc = data.get("soc", 0)  # Falls via OCPP verfügbar
            
            # MQTT Topics publishen
            await self.publish("energy/ev/power", str(power_w))
            await self.publish("energy/ev/charging", str(car_state == 2).lower())
            
            if soc > 0:
                await self.publish("energy/ev/soc", str(soc))
            
            # Optional: Gesamtenergie
            await self.publish("energy/ev/total_kwh", f"{energy_kwh:.2f}")