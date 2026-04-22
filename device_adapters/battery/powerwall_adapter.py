"""
Tesla Powerwall API Adapter
============================

Verbindet sich mit Tesla Powerwall 2/+ via lokale API.

Dokumentation: https://github.com/vloschiavo/powerwall2

Benötigt:
- Tesla Powerwall im lokalen Netzwerk
- Powerwall-Passwort (steht auf Gateway oder Email)

Umgebungsvariablen:
    POWERWALL_IP=192.168.1.100
    POWERWALL_PASSWORD=<Ihr Passwort>
"""

import os
import aiohttp
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class PowerwallAdapter(BaseDeviceAdapter):
    """
    Adapter für Tesla Powerwall 2/+
    
    Nutzt die lokale HTTP API
    """
    
    def __init__(
        self,
        ip_address: Optional[str] = None,
        password: Optional[str] = None,
        email: str = "customer",
        **kwargs
    ):
        super().__init__(
            device_id="powerwall",
            device_type="battery",
            **kwargs
        )
        
        self.ip_address = ip_address or os.getenv("POWERWALL_IP")
        self.password = password or os.getenv("POWERWALL_PASSWORD")
        self.email = email
        self.base_url = f"https://{self.ip_address}"
        self.session = None
        self.token = None
    
    async def authenticate(self) -> bool:
        """Authentifizierung mit Powerwall API"""
        try:
            # SSL-Zertifikatsvalidierung deaktivieren (Powerwall nutzt selbstsignierte Zertifikate)
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            connector = aiohttp.TCPConnector(ssl=ssl_context)
            self.session = aiohttp.ClientSession(connector=connector)
            
            # Login
            login_data = {
                "username": "customer",
                "password": self.password,
                "email": self.email,
                "force_sm_off": False
            }
            
            async with self.session.post(
                f"{self.base_url}/api/login/Basic",
                json=login_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    self.logger.error(f"Login fehlgeschlagen: HTTP {response.status}")
                    return False
                
                data = await response.json()
                self.token = data.get('token')
                
                if not self.token:
                    self.logger.error("Kein Token erhalten")
                    return False
            
            self._is_authenticated = True
            self.logger.info(f"✅ Verbunden mit Tesla Powerwall: {self.ip_address}")
            return True
            
        except Exception as e:
            self.logger.error(f"Powerwall Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Powerwall-Daten ab"""
        if not self._is_authenticated or not self.session or not self.token:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            
            # SOE (State of Energy) abrufen
            async with self.session.get(f"{self.base_url}/api/system_status/soe", headers=headers) as response:
                soe_data = await response.json() if response.status == 200 else {}
            
            # Battery Status abrufen
            async with self.session.get(f"{self.base_url}/api/system_status/grid_status", headers=headers) as response:
                grid_status = await response.json() if response.status == 200 else {}
            
            # Meters abrufen (Leistung)
            async with self.session.get(f"{self.base_url}/api/meters/aggregates", headers=headers) as response:
                meters = await response.json() if response.status == 200 else {}
            
            battery_meter = meters.get('battery', {})
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="battery",
                timestamp=datetime.now(),
                
                # Ladezustand
                soc=soe_data.get('percentage'),  # %
                
                # Leistung (negativ = Laden, positiv = Entladen)
                power=battery_meter.get('instant_power', 0) / 1000,  # W → kW
                
                # Kapazität (geschätzt, Tesla gibt keine Gesamtkapazität aus)
                capacity=13.5,  # kWh (Powerwall 2)
                usable_capacity=13.5 * 0.9,  # 90% nutzbar
                
                # Status
                is_charging=battery_meter.get('instant_power', 0) < 0,
                is_connected=grid_status.get('grid_status') == 'SystemGridConnected',
                
                # Metadaten
                metadata={
                    'grid_status': grid_status.get('grid_status'),
                    'energy_exported_kwh': battery_meter.get('energy_exported', 0) / 1000,
                    'energy_imported_kwh': battery_meter.get('energy_imported', 0) / 1000,
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der Powerwall-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an Powerwall
        
        Unterstützte Befehle:
            - set_mode: Betriebsmodus setzen (params: {'mode': 'self_consumption'})
                Modes: self_consumption, backup, autonomous
            - set_reserve: Backup-Reserve setzen (params: {'percent': 20})
        """
        if not self._is_authenticated or not self.session or not self.token:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            headers = {
                "Authorization": f"Bearer {self.token}",
                "Content-Type": "application/json"
            }
            
            if command == "set_mode":
                mode = params.get('mode', 'self_consumption')
                payload = {"default_real_mode": mode}
                async with self.session.post(
                    f"{self.base_url}/api/operation",
                    json=payload,
                    headers=headers
                ) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info(f"✅ Modus auf '{mode}' gesetzt")
                    return success
            
            elif command == "set_reserve":
                percent = params.get('percent', 20)
                payload = {"backup_reserve_percent": percent}
                async with self.session.post(
                    f"{self.base_url}/api/operation",
                    json=payload,
                    headers=headers
                ) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info(f"✅ Backup-Reserve auf {percent}% gesetzt")
                    return success
            
            else:
                self.logger.error(f"Unbekannter Befehl: {command}")
                return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
    
    async def __aenter__(self):
        """Context Manager Support"""
        await self.authenticate()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Cleanup"""
        if self.session:
            await self.session.close()
