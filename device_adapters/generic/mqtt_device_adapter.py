"""
Generic MQTT Device Adapter
============================

Universeller Adapter für beliebige MQTT-fähige Geräte.

Ideal für:
- Custom IoT-Geräte
- ESP32/Arduino mit MQTT
- Beliebige Geräte die JSON via MQTT senden

Benötigt:
- MQTT-Broker (local oder remote)
- paho-mqtt Library (bereits installiert)

Umgebungsvariablen:
    MQTT_BROKER_HOST=test.mosquitto.org
    MQTT_BROKER_PORT=1883
    MQTT_USERNAME=<optional>
    MQTT_PASSWORD=<optional>
"""

import os
import json
from typing import Optional, Dict, Any, Callable
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class MQTTDeviceAdapter(BaseDeviceAdapter):
    """
    Universeller MQTT-Geräte-Adapter
    
    Kann beliebige MQTT-Topics abonnieren und Daten in DeviceData konvertieren
    """
    
    def __init__(
        self,
        device_id: str,
        device_type: str,
        mqtt_broker: Optional[str] = None,
        mqtt_port: int = 1883,
        mqtt_username: Optional[str] = None,
        mqtt_password: Optional[str] = None,
        subscribe_topics: Optional[list] = None,
        data_parser: Optional[Callable] = None,
        **kwargs
    ):
        super().__init__(
            device_id=device_id,
            device_type=device_type,
            **kwargs
        )
        
        self.mqtt_broker = mqtt_broker or os.getenv("MQTT_BROKER_HOST", "localhost")
        self.mqtt_port = mqtt_port
        self.mqtt_username = mqtt_username or os.getenv("MQTT_USERNAME")
        self.mqtt_password = mqtt_password or os.getenv("MQTT_PASSWORD")
        self.subscribe_topics = subscribe_topics or [f"ems/{device_type}/{device_id}/#"]
        self.data_parser = data_parser or self._default_parser
        
        self.mqtt_client = None
        self._latest_messages = {}
    
    def _default_parser(self, topic: str, payload: Dict[str, Any]) -> Optional[DeviceData]:
        """
        Standard-Parser für MQTT-Nachrichten
        
        Erwartet JSON mit Feldern: soc, power, voltage, current, etc.
        """
        try:
            return DeviceData(
                device_id=self.device_id,
                device_type=self.device_type,
                timestamp=datetime.now(),
                
                soc=payload.get('soc'),
                power=payload.get('power'),
                voltage=payload.get('voltage'),
                current=payload.get('current'),
                capacity=payload.get('capacity'),
                range_km=payload.get('range_km'),
                is_charging=payload.get('is_charging'),
                is_connected=payload.get('is_connected'),
                temperature=payload.get('temperature'),
                
                metadata={
                    'topic': topic,
                    'raw_payload': payload
                }
            )
        except Exception as e:
            self.logger.error(f"Fehler beim Parsen der Daten: {e}")
            return None
    
    async def authenticate(self) -> bool:
        """Verbindung zum MQTT-Broker aufbauen"""
        try:
            import paho.mqtt.client as mqtt
            
            def on_connect(client, userdata, flags, rc):
                if rc == 0:
                    self.logger.info(f"✅ Verbunden mit MQTT: {self.mqtt_broker}")
                    # Topics subscriben
                    for topic in self.subscribe_topics:
                        client.subscribe(topic)
                        self.logger.info(f"📡 Subscribed: {topic}")
                    self._is_authenticated = True
                else:
                    self.logger.error(f"MQTT-Verbindung fehlgeschlagen: {rc}")
            
            def on_message(client, userdata, msg):
                try:
                    topic = msg.topic
                    payload_raw = msg.payload.decode('utf-8')
                    
                    # JSON parsen
                    try:
                        payload = json.loads(payload_raw)
                    except json.JSONDecodeError:
                        # Fallback: Numerische Werte direkt verarbeiten
                        try:
                            payload = {'value': float(payload_raw)}
                        except:
                            payload = {'raw': payload_raw}
                    
                    # Nachricht speichern
                    self._latest_messages[topic] = {
                        'payload': payload,
                        'timestamp': datetime.now()
                    }
                    
                except Exception as e:
                    self.logger.error(f"Fehler bei on_message: {e}")
            
            # MQTT-Client erstellen
            self.mqtt_client = mqtt.Client()
            self.mqtt_client.on_connect = on_connect
            self.mqtt_client.on_message = on_message
            
            # Authentifizierung falls konfiguriert
            if self.mqtt_username and self.mqtt_password:
                self.mqtt_client.username_pw_set(self.mqtt_username, self.mqtt_password)
            
            # Verbinden
            self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, 60)
            self.mqtt_client.loop_start()
            
            # Kurz warten auf Verbindung
            import asyncio
            await asyncio.sleep(2)
            
            return self._is_authenticated
            
        except Exception as e:
            self.logger.error(f"MQTT-Verbindung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft die neuesten MQTT-Daten ab"""
        if not self._is_authenticated:
            self.logger.error("Nicht authentifiziert")
            return None
        
        if not self._latest_messages:
            self.logger.warning("Noch keine MQTT-Nachrichten empfangen")
            return None
        
        try:
            # Alle Nachrichten zusammenführen
            combined_data = {}
            for topic, msg in self._latest_messages.items():
                combined_data.update(msg['payload'])
            
            # Parser aufrufen
            device_data = self.data_parser(
                topic=list(self._latest_messages.keys())[0],
                payload=combined_data
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Befehl via MQTT
        
        Publiziert zu: control/{device_type}/{device_id}/{command}
        """
        if not self._is_authenticated or not self.mqtt_client:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            topic = f"control/{self.device_type}/{self.device_id}/{command}"
            payload = json.dumps(params)
            
            self.mqtt_client.publish(topic, payload)
            self.logger.info(f"📤 Befehl gesendet: {topic} -> {payload}")
            return True
            
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
    
    def __del__(self):
        """Cleanup"""
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()


# Convenience-Funktion
async def create_mqtt_adapter(
    device_id: str,
    device_type: str,
    topics: list,
    mqtt_broker: Optional[str] = None,
    **kwargs
) -> MQTTDeviceAdapter:
    """
    Erstellt und verbindet einen MQTT-Adapter
    
    Args:
        device_id: Eindeutige Geräte-ID
        device_type: Typ (ev, battery, wallbox, etc.)
        topics: Liste der zu subscribenden Topics
        mqtt_broker: MQTT-Broker Adresse
    
    Returns:
        MQTTDeviceAdapter: Verbundener Adapter
    """
    adapter = MQTTDeviceAdapter(
        device_id=device_id,
        device_type=device_type,
        mqtt_broker=mqtt_broker,
        subscribe_topics=topics,
        **kwargs
    )
    
    success = await adapter.authenticate()
    if not success:
        raise Exception("MQTT-Verbindung fehlgeschlagen")
    
    return adapter
