"""
BMW ConnectedDrive API Adapter
================================

Verbindet sich mit BMW ConnectedDrive API.

Benötigt:
- BMW ConnectedDrive Account
- Third-party Library: bimmer_connected

Installation:
    pip install bimmer_connected

Umgebungsvariablen:
    BMW_USERNAME=ihre@email.com
    BMW_PASSWORD=IhrPasswort
    BMW_REGION=rest_of_world  # oder 'north_america', 'china'
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class BMWAdapter(BaseDeviceAdapter):
    """
    Adapter für BMW/Mini Fahrzeuge
    
    Nutzt die bimmer_connected Library
    """
    
    def __init__(
        self,
        vehicle_vin: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        region: str = "rest_of_world",
        **kwargs
    ):
        super().__init__(
            device_id=vehicle_vin or "bmw_ev",
            device_type="ev",
            **kwargs
        )
        
        self.username = username or os.getenv("BMW_USERNAME")
        self.password = password or os.getenv("BMW_PASSWORD")
        self.region = region
        self.vehicle_vin = vehicle_vin
        self.account = None
        self.vehicle = None
    
    async def authenticate(self) -> bool:
        """Authentifizierung mit BMW ConnectedDrive API"""
        try:
            # bimmer_connected importieren
            try:
                from bimmer_connected.account import MyBMWAccount
                from bimmer_connected.api.regions import Regions
            except ImportError:
                self.logger.error(
                    "bimmer_connected nicht installiert! Installiere mit: pip install bimmer_connected"
                )
                return False
            
            # Region bestimmen
            region_map = {
                'rest_of_world': Regions.REST_OF_WORLD,
                'north_america': Regions.NORTH_AMERICA,
                'china': Regions.CHINA
            }
            region = region_map.get(self.region, Regions.REST_OF_WORLD)
            
            # BMW Account erstellen
            self.account = MyBMWAccount(
                username=self.username,
                password=self.password,
                region=region
            )
            
            # Fahrzeuge abrufen
            await self.account.get_vehicles()
            
            if not self.account.vehicles:
                self.logger.error("Keine Fahrzeuge im Account gefunden")
                return False
            
            # Spezifisches Fahrzeug oder erstes auswählen
            if self.vehicle_vin:
                self.vehicle = next(
                    (v for v in self.account.vehicles if v.vin == self.vehicle_vin),
                    None
                )
                if not self.vehicle:
                    self.logger.error(f"Fahrzeug mit VIN {self.vehicle_vin} nicht gefunden")
                    return False
            else:
                self.vehicle = self.account.vehicles[0]
                self.vehicle_vin = self.vehicle.vin
                self.device_id = f"bmw_{self.vehicle_vin[-6:]}"
            
            self._is_authenticated = True
            self.logger.info(
                f"✅ Verbunden mit: {self.vehicle.name} ({self.vehicle.vin})"
            )
            return True
            
        except Exception as e:
            self.logger.error(f"BMW-Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Fahrzeugdaten ab"""
        if not self._is_authenticated or not self.vehicle:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            # Fahrzeugstatus aktualisieren
            await self.vehicle.remote_services.trigger_remote_status_update()
            
            # Fuel and Battery Status
            fuel_and_battery = self.vehicle.fuel_and_battery
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="ev",
                timestamp=datetime.now(),
                
                # Ladezustand
                soc=fuel_and_battery.remaining_battery_percent,
                range_km=fuel_and_battery.remaining_range_electric,
                
                # Kapazität
                capacity=fuel_and_battery.total_battery_capacity,
                
                # Status
                is_charging=self.vehicle.is_charging,
                is_plugged_in=self.vehicle.charging_status == 'CONNECTED',
                
                # Metadaten
                metadata={
                    'name': self.vehicle.name,
                    'vin': self.vehicle.vin,
                    'model': self.vehicle.model,
                    'charging_status': str(self.vehicle.charging_status),
                    'mileage': self.vehicle.mileage,
                    'charging_time_remaining': self.vehicle.charging_time_remaining,
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der BMW-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an das BMW-Fahrzeug
        
        Unterstützte Befehle:
            - start_charging: Laden starten
            - stop_charging: Laden stoppen
        """
        if not self._is_authenticated or not self.vehicle:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            remote_services = self.vehicle.remote_services
            
            if command == "start_charging":
                await remote_services.trigger_charge_start()
                self.logger.info("✅ Laden gestartet")
                return True
            
            elif command == "stop_charging":
                await remote_services.trigger_charge_stop()
                self.logger.info("✅ Laden gestoppt")
                return True
            
            else:
                self.logger.error(f"Unbekannter Befehl: {command}")
                return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
