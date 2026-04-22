"""
Tesla API Adapter
==================

Verbindet sich mit der Tesla API und ruft Fahrzeugdaten ab.

Benötigt:
- Tesla Account (Email/Passwort)
- Optionale third-party Library: teslapy

Installation:
    pip install teslapy

Umgebungsvariablen:
    TESLA_EMAIL=ihre@email.com
    TESLA_PASSWORD=<cache-datei wird automatisch erstellt>
"""

import os
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class TeslaAdapter(BaseDeviceAdapter):
    """
    Adapter für Tesla Fahrzeuge
    
    Nutzt die teslapy Library für einfachen API-Zugriff
    """
    
    def __init__(
        self,
        vehicle_id: Optional[str] = None,
        email: Optional[str] = None,
        cache_file: str = "tesla_cache.json",
        **kwargs
    ):
        super().__init__(
            device_id=vehicle_id or "tesla_ev",
            device_type="ev",
            **kwargs
        )
        
        self.email = email or os.getenv("TESLA_EMAIL")
        self.cache_file = cache_file
        self.vehicle_id = vehicle_id
        self.tesla = None
        self.vehicle = None
    
    async def authenticate(self) -> bool:
        """Authentifizierung mit Tesla API"""
        try:
            # TeslaPy importieren
            try:
                import teslapy
            except ImportError:
                self.logger.error(
                    "teslapy nicht installiert! Installiere mit: pip install teslapy"
                )
                return False
            
            # Tesla-Client erstellen
            self.tesla = teslapy.Tesla(self.email, cache_file=self.cache_file)
            
            # Prüfen ob Token vorhanden
            if not self.tesla.authorized:
                self.logger.info("Erste Anmeldung - Browser-Login erforderlich")
                self.tesla.fetch_token()
            
            # Fahrzeuge abrufen
            vehicles = self.tesla.vehicle_list()
            
            if not vehicles:
                self.logger.error("Keine Fahrzeuge im Account gefunden")
                return False
            
            # Spezifisches Fahrzeug oder erstes auswählen
            if self.vehicle_id:
                self.vehicle = next(
                    (v for v in vehicles if v['id_s'] == self.vehicle_id),
                    None
                )
                if not self.vehicle:
                    self.logger.error(f"Fahrzeug {self.vehicle_id} nicht gefunden")
                    return False
            else:
                self.vehicle = vehicles[0]
                self.vehicle_id = self.vehicle['id_s']
                self.device_id = f"tesla_{self.vehicle_id[-6:]}"
            
            self._is_authenticated = True
            self.logger.info(
                f"✅ Verbunden mit: {self.vehicle['display_name']} "
                f"({self.vehicle['vin']})"
            )
            return True
            
        except Exception as e:
            self.logger.error(f"Tesla-Authentifizierung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Fahrzeugdaten ab"""
        if not self._is_authenticated or not self.vehicle:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            # Fahrzeug aufwecken falls nötig
            if self.vehicle['state'] == 'asleep':
                self.logger.info("Fahrzeug schläft - wecke auf...")
                self.vehicle.sync_wake_up()
            
            # Fahrzeugdaten abrufen
            data = self.vehicle.get_vehicle_data()
            charge_state = data.get('charge_state', {})
            drive_state = data.get('drive_state', {})
            climate_state = data.get('climate_state', {})
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="ev",
                timestamp=datetime.now(),
                
                # Ladezustand
                soc=charge_state.get('battery_level'),  # %
                range_km=charge_state.get('battery_range') * 1.60934,  # Meilen → km
                
                # Elektrische Daten
                voltage=charge_state.get('charger_voltage'),
                current=charge_state.get('charger_actual_current'),
                power=(
                    charge_state.get('charger_power') if charge_state.get('charger_power')
                    else None
                ),  # kW
                
                # Kapazität
                usable_capacity=charge_state.get('battery_level') / 100 * 75,  # Geschätzt
                
                # Status
                is_charging=charge_state.get('charging_state') == 'Charging',
                is_connected=charge_state.get('charge_port_door_open', False),
                is_plugged_in=charge_state.get('charging_state') != 'Disconnected',
                
                # Temperatur
                temperature=climate_state.get('battery_heater_no_power'),
                
                # Metadaten
                metadata={
                    'display_name': self.vehicle.get('display_name'),
                    'vin': self.vehicle.get('vin'),
                    'odometer': drive_state.get('odometer'),
                    'charging_state': charge_state.get('charging_state'),
                    'charge_rate': charge_state.get('charge_rate'),  # km/h
                    'time_to_full_charge': charge_state.get('time_to_full_charge'),  # Stunden
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der Tesla-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an das Tesla-Fahrzeug
        
        Unterstützte Befehle:
            - start_charging: Laden starten
            - stop_charging: Laden stoppen
            - set_charge_limit: Ladeziel setzen (params: {'limit': 80})
            - set_charging_amps: Ladestrom setzen (params: {'amps': 16})
            - wake_up: Fahrzeug aufwecken
        """
        if not self._is_authenticated or not self.vehicle:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            if command == "start_charging":
                self.vehicle.command('START_CHARGE')
                self.logger.info("✅ Laden gestartet")
                return True
            
            elif command == "stop_charging":
                self.vehicle.command('STOP_CHARGE')
                self.logger.info("✅ Laden gestoppt")
                return True
            
            elif command == "set_charge_limit":
                limit = params.get('limit', 80)
                self.vehicle.command('CHANGE_CHARGE_LIMIT', percent=limit)
                self.logger.info(f"✅ Ladeziel auf {limit}% gesetzt")
                return True
            
            elif command == "set_charging_amps":
                amps = params.get('amps', 16)
                self.vehicle.command('CHARGING_AMPS', charging_amps=amps)
                self.logger.info(f"✅ Ladestrom auf {amps}A gesetzt")
                return True
            
            elif command == "wake_up":
                self.vehicle.sync_wake_up()
                self.logger.info("✅ Fahrzeug aufgeweckt")
                return True
            
            else:
                self.logger.error(f"Unbekannter Befehl: {command}")
                return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False


# Convenience-Funktion für einfache Nutzung
async def create_tesla_adapter(
    email: Optional[str] = None,
    vehicle_id: Optional[str] = None,
    mqtt_client=None
) -> TeslaAdapter:
    """
    Erstellt und authentifiziert einen Tesla-Adapter
    
    Args:
        email: Tesla Account Email
        vehicle_id: Spezifische Fahrzeug-ID (optional)
        mqtt_client: MQTT-Client für Publishing (optional)
    
    Returns:
        TeslaAdapter: Authentifizierter Adapter
    """
    adapter = TeslaAdapter(
        vehicle_id=vehicle_id,
        email=email,
        mqtt_client=mqtt_client
    )
    
    success = await adapter.authenticate()
    if not success:
        raise Exception("Tesla-Authentifizierung fehlgeschlagen")
    
    return adapter
