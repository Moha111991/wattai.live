"""
VW/Audi API Adapter (We Connect / myAudi)
==========================================

Verbindet sich mit VW We Connect oder Audi myAudi API.

Benötigt:
- VW/Audi Account
- Third-party Library: weconnect

Installation:
    pip install weconnect

Umgebungsvariablen:
    VW_USERNAME=ihre@email.com
    VW_PASSWORD=IhrPasswort
    VW_TYPE=vw  # oder 'audi', 'seat', 'skoda'
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class VWAdapter(BaseDeviceAdapter):
    """
    Adapter für VW/Audi/Seat/Skoda Fahrzeuge
    
    Nutzt die weconnect Library
    """
    
    def __init__(
        self,
        vehicle_vin: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        brand: str = "vw",  # vw, audi, seat, skoda
        **kwargs
    ):
        super().__init__(
            device_id=vehicle_vin or "vw_ev",
            device_type="ev",
            **kwargs
        )
        
        self.username = username or os.getenv("VW_USERNAME")
        self.password = password or os.getenv("VW_PASSWORD")
        self.brand = brand.lower()
        self.vehicle_vin = vehicle_vin
        self.weconnect = None
        self.vehicle = None
    
    async def authenticate(self) -> bool:
        """Authentifizierung mit VW We Connect API"""
        try:
            # weconnect importieren
            try:
                from weconnect import weconnect
            except ImportError:
                self.logger.error(
                    "weconnect nicht installiert! Installiere mit: pip install weconnect"
                )
                return False
            
            # We Connect Client erstellen
            if self.brand == "audi":
                from weconnect import WeConnectAudi
                self.weconnect = WeConnectAudi(
                    username=self.username,
                    password=self.password
                )
            else:
                from weconnect import WeConnect
                self.weconnect = WeConnect(
                    username=self.username,
                    password=self.password
                )
            
            # Einloggen
            self.weconnect.update()
            
            # Fahrzeuge abrufen
            if not self.weconnect.vehicles:
                self.logger.error("Keine Fahrzeuge im Account gefunden")
                return False
            
            # Spezifisches Fahrzeug oder erstes auswählen
            if self.vehicle_vin:
                self.vehicle = self.weconnect.vehicles.get(self.vehicle_vin)
                if not self.vehicle:
                    self.logger.error(f"Fahrzeug mit VIN {self.vehicle_vin} nicht gefunden")
                    return False
            else:
                # Erstes Fahrzeug wählen
                self.vehicle_vin = list(self.weconnect.vehicles.keys())[0]
                self.vehicle = self.weconnect.vehicles[self.vehicle_vin]
                self.device_id = f"vw_{self.vehicle_vin[-6:]}"
            
            self._is_authenticated = True
            self.logger.info(
                f"✅ Verbunden mit: {self.vehicle.nickname.value if hasattr(self.vehicle, 'nickname') else self.vehicle_vin}"
            )
            return True
            
        except Exception as e:
            self.logger.error(f"VW-Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Fahrzeugdaten ab"""
        if not self._is_authenticated or not self.vehicle:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            # Daten aktualisieren
            self.weconnect.update()
            
            # Batteriezustand
            battery_status = self.vehicle.domains.get('batteryStatus', {})
            charging = self.vehicle.domains.get('charging', {})
            
            # Aktuelle SOC
            soc = None
            if hasattr(battery_status, 'currentSOC_pct'):
                soc = battery_status.currentSOC_pct.value
            
            # Reichweite
            range_km = None
            if hasattr(battery_status, 'cruisingRangeElectric_km'):
                range_km = battery_status.cruisingRangeElectric_km.value
            
            # Ladezustand
            is_charging = False
            charging_power = None
            if hasattr(charging, 'chargingState'):
                is_charging = charging.chargingState.value == 'charging'
            if hasattr(charging, 'chargePower_kW'):
                charging_power = charging.chargePower_kW.value
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="ev",
                timestamp=datetime.now(),
                
                # Ladezustand
                soc=soc,
                range_km=range_km,
                
                # Leistung
                power=charging_power,
                
                # Status
                is_charging=is_charging,
                is_plugged_in=hasattr(charging, 'plugConnectionState') and
                               charging.plugConnectionState.value == 'connected',
                
                # Metadaten
                metadata={
                    'vin': self.vehicle_vin,
                    'brand': self.brand,
                    'charging_state': charging.chargingState.value if hasattr(charging, 'chargingState') else None,
                    'remaining_time_min': charging.remainingChargingTimeToComplete_min.value if
                                         hasattr(charging, 'remainingChargingTimeToComplete_min') else None,
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der VW-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an das VW-Fahrzeug
        
        Unterstützte Befehle:
            - start_charging: Laden starten
            - stop_charging: Laden stoppen
            - set_charge_limit: Ladeziel setzen (params: {'limit': 80})
        """
        if not self._is_authenticated or not self.vehicle:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            charging = self.vehicle.domains.get('charging')
            
            if command == "start_charging":
                charging.start()
                self.logger.info("✅ Laden gestartet")
                return True
            
            elif command == "stop_charging":
                charging.stop()
                self.logger.info("✅ Laden gestoppt")
                return True
            
            elif command == "set_charge_limit":
                limit = params.get('limit', 80)
                charging.targetSOC_pct = limit
                self.logger.info(f"✅ Ladeziel auf {limit}% gesetzt")
                return True
            
            else:
                self.logger.error(f"Unbekannter Befehl: {command}")
                return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
