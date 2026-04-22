"""
Wallbe Wallbox Adapter
=======================

Verbindet sich mit Wallbe Wallboxen via Modbus TCP.

Benötigt:
- Wallbe Wallbox mit aktiviertem Modbus
- pymodbus Library

Installation:
    pip install pymodbus

Umgebungsvariablen:
    WALLBE_IP=192.168.1.100
    WALLBE_PORT=502
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class WallbeAdapter(BaseDeviceAdapter):
    """
    Adapter für Wallbe Wallboxen
    
    Nutzt Modbus TCP
    """
    
    def __init__(
        self,
        ip_address: Optional[str] = None,
        port: int = 502,
        slave_id: int = 255,
        **kwargs
    ):
        super().__init__(
            device_id="wallbe",
            device_type="wallbox",
            **kwargs
        )
        
        self.ip_address = ip_address or os.getenv("WALLBE_IP")
        self.port = port
        self.slave_id = slave_id
        self.client = None
    
    async def authenticate(self) -> bool:
        """Verbindung zur Wallbox aufbauen"""
        try:
            try:
                from pymodbus.client import AsyncModbusTcpClient
            except ImportError:
                self.logger.error(
                    "pymodbus nicht installiert! Installiere mit: pip install pymodbus"
                )
                return False
            
            # Modbus Client erstellen
            self.client = AsyncModbusTcpClient(
                host=self.ip_address,
                port=self.port
            )
            
            # Verbindung testen
            connected = await self.client.connect()
            if not connected:
                self.logger.error("Modbus-Verbindung fehlgeschlagen")
                return False
            
            self._is_authenticated = True
            self.logger.info(f"✅ Verbunden mit Wallbe: {self.ip_address}:{self.port}")
            return True
            
        except Exception as e:
            self.logger.error(f"Wallbe Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Wallbox-Daten via Modbus ab"""
        if not self._is_authenticated or not self.client:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            # Modbus Register lesen
            # Register-Adressen können je nach Wallbe-Modell variieren
            result = await self.client.read_holding_registers(
                address=0,
                count=20,
                slave=self.slave_id
            )
            
            if result.isError():
                self.logger.error(f"Modbus-Fehler: {result}")
                return None
            
            registers = result.registers
            
            # DeviceData erstellen
            # Hinweis: Diese Werte sind beispielhaft und müssen an Ihr Wallbe-Modell angepasst werden
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="wallbox",
                timestamp=datetime.now(),
                
                # Elektrische Daten (Beispiel-Mapping)
                power=registers[5] / 100 if len(registers) > 5 else 0,  # kW
                voltage=registers[2] if len(registers) > 2 else 0,
                current=registers[3] / 10 if len(registers) > 3 else 0,
                
                # Status (Beispiel)
                is_charging=registers[0] == 2 if len(registers) > 0 else False,
                is_connected=registers[0] in [2, 3] if len(registers) > 0 else False,
                
                # Metadaten
                metadata={
                    'ip': self.ip_address,
                    'registers': registers[:10]  # Erste 10 Register für Debugging
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der Wallbe-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an die Wallbox
        
        Hinweis: Befehle müssen an Ihr Wallbe-Modell angepasst werden
        """
        if not self._is_authenticated or not self.client:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            # Beispiel-Implementierung
            # Die Register-Adressen müssen an Ihr Modell angepasst werden
            
            if command == "set_current":
                current = params.get('current', 16)
                # Schreibe Strom in Register (Beispiel)
                result = await self.client.write_register(
                    address=10,
                    value=int(current * 10),
                    slave=self.slave_id
                )
                success = not result.isError()
                if success:
                    self.logger.info(f"✅ Ladestrom auf {current}A gesetzt")
                return success
            
            else:
                self.logger.warning(f"Befehl '{command}' für Wallbe noch nicht implementiert")
                return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
