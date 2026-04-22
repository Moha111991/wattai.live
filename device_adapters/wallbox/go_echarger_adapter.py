"""
go-eCharger API Adapter
========================

Verbindet sich mit go-eCharger Wallboxen (HTTP API v2).

Dokumentation: https://github.com/goecharger/go-eCharger-API-v2

Benötigt:
- go-eCharger im lokalen Netzwerk
- IP-Adresse der Wallbox

Umgebungsvariablen:
    GOECHARGER_IP=192.168.1.100
    GOECHARGER_TOKEN=<optional für Cloud-API>
"""

import os
import aiohttp
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class GoEChargerAdapter(BaseDeviceAdapter):
    """
    Adapter für go-eCharger Wallboxen
    
    Nutzt die HTTP API v2
    """
    
    def __init__(
        self,
        ip_address: Optional[str] = None,
        serial: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            device_id=serial or "goecharger",
            device_type="wallbox",
            **kwargs
        )
        
        self.ip_address = ip_address or os.getenv("GOECHARGER_IP")
        self.serial = serial
        self.base_url = f"http://{self.ip_address}/api"
        self.session = None
    
    async def authenticate(self) -> bool:
        """Verbindung zur Wallbox testen"""
        try:
            self.session = aiohttp.ClientSession()
            
            # Status abrufen um Verbindung zu testen
            async with self.session.get(f"{self.base_url}/status") as response:
                if response.status != 200:
                    self.logger.error(f"Verbindung fehlgeschlagen: HTTP {response.status}")
                    return False
                
                data = await response.json()
                self.serial = data.get('sse', 'unknown')
                self.device_id = f"goecharger_{self.serial[-6:]}"
                
                self._is_authenticated = True
                self.logger.info(f"✅ Verbunden mit go-eCharger: {self.serial}")
                return True
                
        except Exception as e:
            self.logger.error(f"go-eCharger Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Wallbox-Daten ab"""
        if not self._is_authenticated or not self.session:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            async with self.session.get(f"{self.base_url}/status") as response:
                if response.status != 200:
                    self.logger.error(f"Fehler beim Abrufen: HTTP {response.status}")
                    return None
                
                data = await response.json()
                
                # go-eCharger API Felder:
                # nrg: [U1, U2, U3, I1, I2, I3, P1, P2, P3, N, P_total, pf]
                # car: Auto-Status (1=bereit, 2=lädt, 3=wartet, 4=fertig)
                # amp: Eingestellter Ladestrom (A)
                # amx: Max. Ladestrom Hardware (A)
                # err: Fehlerstatus
                
                nrg = data.get('nrg', [0]*12)
                car_status = data.get('car', 1)
                
                # DeviceData erstellen
                device_data = DeviceData(
                    device_id=self.device_id,
                    device_type="wallbox",
                    timestamp=datetime.now(),
                    
                    # Elektrische Daten
                    power=nrg[10] / 1000 if nrg[10] else 0,  # W → kW
                    voltage=nrg[0],  # Spannung Phase 1
                    current=nrg[3],  # Strom Phase 1
                    
                    # Status
                    is_charging=car_status == 2,
                    is_connected=car_status in [2, 3, 4],  # Lädt, wartet oder fertig
                    is_plugged_in=car_status != 1,  # Nicht im Bereitschaftsmodus
                    
                    # Metadaten
                    metadata={
                        'serial': self.serial,
                        'car_status': car_status,
                        'car_status_text': {
                            1: 'Bereit',
                            2: 'Lädt',
                            3: 'Wartet auf Auto',
                            4: 'Fertig'
                        }.get(car_status, 'Unbekannt'),
                        'set_current': data.get('amp'),
                        'max_current': data.get('amx'),
                        'energy_total_kwh': data.get('eto', 0) / 10,  # deka-Wh → kWh
                        'error': data.get('err'),
                        'phases': sum(1 for i in [nrg[3], nrg[4], nrg[5]] if i > 0),
                    }
                )
                
                return device_data
                
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der go-eCharger-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an die Wallbox
        
        Unterstützte Befehle:
            - start_charging: Laden starten
            - stop_charging: Laden stoppen (auf 0A setzen)
            - set_current: Ladestrom setzen (params: {'current': 16})
            - enable: Wallbox aktivieren
            - disable: Wallbox deaktivieren
        """
        if not self._is_authenticated or not self.session:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            if command == "start_charging":
                # Auf gespeicherten Strom setzen (Standard: 16A)
                payload = {"amp": 16}
                async with self.session.post(f"{self.base_url}/set", json=payload) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info("✅ Laden gestartet (16A)")
                    return success
            
            elif command == "stop_charging":
                # Auf 0A setzen = Laden stoppen
                payload = {"amp": 0}
                async with self.session.post(f"{self.base_url}/set", json=payload) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info("✅ Laden gestoppt")
                    return success
            
            elif command == "set_current":
                current = params.get('current', 16)
                current = max(6, min(current, 32))  # Begrenzung 6-32A
                payload = {"amp": current}
                async with self.session.post(f"{self.base_url}/set", json=payload) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info(f"✅ Ladestrom auf {current}A gesetzt")
                    return success
            
            elif command in ["enable", "disable"]:
                # alw: 0=disabled, 1=enabled
                payload = {"alw": 1 if command == "enable" else 0}
                async with self.session.post(f"{self.base_url}/set", json=payload) as response:
                    success = response.status == 200
                    if success:
                        self.logger.info(f"✅ Wallbox {'aktiviert' if command == 'enable' else 'deaktiviert'}")
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
