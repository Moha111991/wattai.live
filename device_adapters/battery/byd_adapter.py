"""
BYD Battery-Box API Adapter
============================

Verbindet sich mit BYD Battery-Box via Modbus TCP.

Benötigt:
- BYD Battery-Box mit aktiviertem Modbus
- pymodbus Library

Installation:
    pip install pymodbus

Umgebungsvariablen:
    BYD_IP=192.168.1.100
    BYD_PORT=502
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class BYDAdapter(BaseDeviceAdapter):
    """
    Adapter für BYD Battery-Box Speichersysteme
    
    Nutzt Modbus TCP
    """
    
    def __init__(
        self,
        ip_address: Optional[str] = None,
        port: int = 502,
        slave_id: int = 1,
        **kwargs
    ):
        super().__init__(
            device_id="byd_battery",
            device_type="battery",
            **kwargs
        )
        
        self.ip_address = ip_address or os.getenv("BYD_IP")
        self.port = port
        self.slave_id = slave_id
        self.client = None
    
    async def authenticate(self) -> bool:
        """Verbindung zur BYD Battery-Box aufbauen"""
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
            self.logger.info(f"✅ Verbunden mit BYD Battery-Box: {self.ip_address}:{self.port}")
            return True
            
        except Exception as e:
            self.logger.error(f"BYD Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Batterie-Daten via Modbus ab"""
        if not self._is_authenticated or not self.client:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            # BYD Register lesen (Beispiel-Register-Adressen)
            # Hinweis: Diese Adressen müssen an Ihr BYD-Modell angepasst werden
            
            # SOC lesen (Register 0)
            soc_result = await self.client.read_holding_registers(
                address=0,
                count=1,
                slave=self.slave_id
            )
            soc = soc_result.registers[0] / 10 if not soc_result.isError() else None
            
            # Spannung lesen (Register 10)
            voltage_result = await self.client.read_holding_registers(
                address=10,
                count=1,
                slave=self.slave_id
            )
            voltage = voltage_result.registers[0] / 10 if not voltage_result.isError() else None
            
            # Strom lesen (Register 11)
            current_result = await self.client.read_holding_registers(
                address=11,
                count=1,
                slave=self.slave_id
            )
            current = current_result.registers[0] / 10 if not current_result.isError() else None
            
            # Leistung berechnen
            power = (voltage * current / 1000) if (voltage and current) else None
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="battery",
                timestamp=datetime.now(),
                
                # Ladezustand
                soc=soc,
                
                # Elektrische Daten
                power=power,
                voltage=voltage,
                current=current,
                
                # Status
                is_charging=current < 0 if current else False,
                is_connected=True,  # Wenn Modbus verbunden ist
                
                # Metadaten
                metadata={
                    'ip': self.ip_address,
                    'model': 'BYD Battery-Box'
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der BYD-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an BYD Battery-Box
        
        Hinweis: Steuerungsbefehle sind modellabhängig und müssen angepasst werden
        """
        if not self._is_authenticated or not self.client:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            # Beispiel-Implementierung
            # Die Register-Adressen müssen an Ihr Modell angepasst werden
            
            self.logger.warning(f"Befehl '{command}' für BYD noch nicht implementiert")
            return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
