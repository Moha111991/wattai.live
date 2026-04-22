"""
Basis-Klasse für alle Geräte-Adapter
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class DeviceData:
    """Standardisiertes Datenformat für alle Geräte"""
    
    device_id: str
    device_type: str  # 'ev', 'wallbox', 'battery', 'pv', 'heatpump'
    timestamp: datetime
    
    # Elektrische Parameter
    soc: Optional[float] = None  # State of Charge (%)
    power: Optional[float] = None  # Leistung (kW, positiv = Entladung, negativ = Ladung)
    voltage: Optional[float] = None  # Spannung (V)
    current: Optional[float] = None  # Strom (A)
    
    # Kapazität
    capacity: Optional[float] = None  # Kapazität (kWh)
    usable_capacity: Optional[float] = None  # Nutzbare Kapazität (kWh)
    
    # Reichweite (nur E-Autos)
    range_km: Optional[float] = None  # Reichweite (km)
    
    # Status
    is_charging: Optional[bool] = None
    is_connected: Optional[bool] = None
    is_plugged_in: Optional[bool] = None
    
    # Temperatur
    temperature: Optional[float] = None  # Batterietemperatur (°C)
    
    # Fehler/Warnungen
    error_code: Optional[str] = None
    warning: Optional[str] = None
    
    # Zusätzliche Daten
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Konvertiert zu Dictionary"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data
    
    def to_mqtt_payload(self) -> Dict[str, Any]:
        """Optimiertes Payload für MQTT (nur relevante Werte)"""
        payload = {
            "device_id": self.device_id,
            "device_type": self.device_type,
            "timestamp": self.timestamp.isoformat()
        }
        
        # Nur nicht-None Werte hinzufügen
        if self.soc is not None:
            payload["soc"] = round(self.soc, 2)
        if self.power is not None:
            payload["power"] = round(self.power, 3)
        if self.voltage is not None:
            payload["voltage"] = round(self.voltage, 1)
        if self.current is not None:
            payload["current"] = round(self.current, 2)
        if self.range_km is not None:
            payload["range_km"] = round(self.range_km, 1)
        if self.is_charging is not None:
            payload["is_charging"] = self.is_charging
        if self.is_connected is not None:
            payload["is_connected"] = self.is_connected
        if self.temperature is not None:
            payload["temperature"] = round(self.temperature, 1)
        
        return payload


class BaseDeviceAdapter(ABC):
    """
    Abstrakte Basis-Klasse für alle Geräte-Adapter
    
    Implementiert gemeinsame Funktionalität:
    - Authentifizierung
    - Rate Limiting
    - Fehlerbehandlung
    - MQTT Publishing
    """
    
    def __init__(
        self,
        device_id: str,
        device_type: str,
        api_credentials: Optional[Dict[str, str]] = None,
        mqtt_client=None,
        mqtt_topic_prefix: str = "ems"
    ):
        self.device_id = device_id
        self.device_type = device_type
        self.api_credentials = api_credentials or {}
        self.mqtt_client = mqtt_client
        self.mqtt_topic_prefix = mqtt_topic_prefix
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
        self._is_authenticated = False
        self._last_data: Optional[DeviceData] = None
    
    @abstractmethod
    async def authenticate(self) -> bool:
        """
        Authentifizierung mit der Geräte-API
        
        Returns:
            bool: True wenn erfolgreich
        """
        pass
    
    @abstractmethod
    async def fetch_data(self) -> Optional[DeviceData]:
        """
        Ruft aktuelle Daten vom Gerät ab
        
        Returns:
            DeviceData: Aktuelle Gerätedaten oder None bei Fehler
        """
        pass
    
    @abstractmethod
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an das Gerät
        
        Args:
            command: Befehlsname (z.B. 'start_charging', 'stop_charging')
            params: Befehlsparameter
        
        Returns:
            bool: True wenn erfolgreich
        """
        pass
    
    async def get_status(self) -> Dict[str, Any]:
        """
        Gibt aktuellen Status des Adapters zurück
        
        Returns:
            dict: Status-Informationen
        """
        return {
            "device_id": self.device_id,
            "device_type": self.device_type,
            "is_authenticated": self._is_authenticated,
            "last_update": self._last_data.timestamp.isoformat() if self._last_data else None,
            "mqtt_connected": self.mqtt_client.is_connected() if self.mqtt_client else False
        }
    
    async def publish_to_mqtt(self, data: DeviceData) -> bool:
        """
        Publiziert Daten zum MQTT-Broker
        
        Args:
            data: Zu publizierende Daten
        
        Returns:
            bool: True wenn erfolgreich
        """
        if not self.mqtt_client:
            self.logger.warning("MQTT-Client nicht konfiguriert")
            return False
        
        try:
            # Topic-Struktur: ems/{device_type}/{metric}
            base_topic = f"{self.mqtt_topic_prefix}/{self.device_type}"
            payload = data.to_mqtt_payload()
            
            # SOC publishen
            if data.soc is not None:
                topic = f"{base_topic}/soc"
                self.mqtt_client.publish(topic, payload["soc"])
            
            # Leistung publishen
            if data.power is not None:
                topic = f"{base_topic}/power"
                self.mqtt_client.publish(topic, payload["power"])
            
            # Komplette Daten als JSON
            topic = f"{base_topic}/data"
            import json
            self.mqtt_client.publish(topic, json.dumps(payload))
            
            self.logger.debug(f"Daten publiziert: {topic}")
            return True
            
        except Exception as e:
            self.logger.error(f"Fehler beim MQTT-Publish: {e}")
            return False
    
    async def update_and_publish(self) -> Optional[DeviceData]:
        """
        Convenience-Methode: Daten abrufen und direkt publishen
        
        Returns:
            DeviceData: Abgerufene Daten oder None bei Fehler
        """
        try:
            # Authentifizierung prüfen
            if not self._is_authenticated:
                success = await self.authenticate()
                if not success:
                    self.logger.error("Authentifizierung fehlgeschlagen")
                    return None
            
            # Daten abrufen
            data = await self.fetch_data()
            if not data:
                self.logger.warning("Keine Daten empfangen")
                return None
            
            # Daten speichern
            self._last_data = data
            
            # MQTT publishen
            if self.mqtt_client:
                await self.publish_to_mqtt(data)
            
            return data
            
        except Exception as e:
            self.logger.error(f"Fehler bei update_and_publish: {e}")
            return None
