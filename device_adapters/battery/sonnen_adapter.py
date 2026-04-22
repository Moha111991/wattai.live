"""
sonnenBatterie API Adapter
===========================

Verbindet sich mit sonnenBatterie via lokale API.

Dokumentation: https://documentation.sonnen.de/

Benötigt:
- sonnenBatterie im lokalen Netzwerk
- API-Token (von sonnen Support oder App)

Umgebungsvariablen:
    SONNEN_IP=192.168.1.100
    SONNEN_TOKEN=<Ihr API-Token>
"""

import os
import aiohttp
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class SonnenAdapter(BaseDeviceAdapter):
    """
    Adapter für sonnenBatterie Speichersysteme
    
    Nutzt die lokale HTTP API
    """
    
    def __init__(
        self,
        ip_address: Optional[str] = None,
        token: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            device_id="sonnenbatterie",
            device_type="battery",
            **kwargs
        )
        
        self.ip_address = ip_address or os.getenv("SONNEN_IP")
        self.token = token or os.getenv("SONNEN_TOKEN")
        self.base_url = f"http://{self.ip_address}:8080/api/v2"
        self.session = None
    
    async def authenticate(self) -> bool:
        """Verbindung zur sonnenBatterie testen"""
        try:
            self.session = aiohttp.ClientSession()
            
            headers = {"Auth-Token": self.token} if self.token else {}
            
            # Status abrufen um Verbindung zu testen
            async with self.session.get(f"{self.base_url}/status", headers=headers) as response:
                if response.status != 200:
                    self.logger.error(f"Verbindung fehlgeschlagen: HTTP {response.status}")
                    return False
                
                self._is_authenticated = True
                self.logger.info(f"✅ Verbunden mit sonnenBatterie: {self.ip_address}")
                return True
                
        except Exception as e:
            self.logger.error(f"sonnenBatterie Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Batterie-Daten ab"""
        if not self._is_authenticated or not self.session:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            headers = {"Auth-Token": self.token} if self.token else {}
            
            # Status abrufen
            async with self.session.get(f"{self.base_url}/status", headers=headers) as response:
                if response.status != 200:
                    self.logger.error(f"Fehler beim Abrufen: HTTP {response.status}")
                    return None
                
                data = await response.json()
            
            # Lade-/Entladeleistung (negativ = Laden, positiv = Entladen)
            pac_total = data.get('Pac_total_W', 0)  # W
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="battery",
                timestamp=datetime.now(),
                
                # Ladezustand
                soc=data.get('USOC'),  # User State of Charge (%)
                
                # Leistung
                power=pac_total / 1000,  # W → kW
                
                # Kapazität
                capacity=data.get('Battery_Installed_Capacity_Wh', 0) / 1000,  # Wh → kWh
                usable_capacity=data.get('Battery_Installed_Capacity_Wh', 0) * 0.9 / 1000,
                
                # Status
                is_charging=pac_total < 0,
                is_connected=data.get('GridFeedIn_W', 0) != 0 or data.get('Consumption_W', 0) != 0,
                
                # Metadaten
                metadata={
                    'system_status': data.get('SystemStatus'),
                    'grid_feedin_w': data.get('GridFeedIn_W'),
                    'consumption_w': data.get('Consumption_W'),
                    'production_w': data.get('Production_W'),
                    'operating_mode': data.get('OperatingMode'),
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der sonnenBatterie-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an sonnenBatterie
        
        Unterstützte Befehle:
            - set_mode: Betriebsmodus setzen (params: {'mode': 'automatic'})
                Modes: automatic, manual
        """
        if not self._is_authenticated or not self.session:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            headers = {"Auth-Token": self.token} if self.token else {}
            
            if command == "set_mode":
                mode = params.get('mode', 'automatic')
                # Hinweis: Die genaue API hängt von der sonnen-Firmware ab
                payload = {"EM_OperatingMode": mode}
                async with self.session.put(
                    f"{self.base_url}/configurations",
                    json=payload,
                    headers=headers
                ) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info(f"✅ Modus auf '{mode}' gesetzt")
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
