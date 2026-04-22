"""
openWB Wallbox Adapter
=======================

Verbindet sich mit openWB Wallboxen via MQTT.

Dokumentation: https://github.com/openWB/core

Benötigt:
- openWB mit MQTT aktiviert
- paho-mqtt Library (bereits installiert)

Umgebungsvariablen:
    OPENWB_MQTT_HOST=192.168.1.100
    OPENWB_MQTT_PORT=1883
"""

import os
import json
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from ..base import BaseDeviceAdapter, DeviceData

logger = logging.getLogger(__name__)


class OpenWBAdapter(BaseDeviceAdapter):
    """
    Adapter für openWB Wallboxen
    
    Nutzt MQTT für Daten und Steuerung
    """
    
    def __init__(
        self,
        mqtt_host: Optional[str] = None,
        mqtt_port: int = 1883,
        chargepoint: int = 1,
        **kwargs
    ):
        super().__init__(
            device_id=f"openwb_cp{chargepoint}",
            device_type="wallbox",
            **kwargs
        )
        
        self.mqtt_host = mqtt_host or os.getenv("OPENWB_MQTT_HOST", "localhost")
        self.mqtt_port = mqtt_port
        self.chargepoint = chargepoint
        self.mqtt_client = None
        self._current_data = {}
    
    async def authenticate(self) -> bool:
        """Verbindung zum openWB MQTT-Broker"""
        try:
            import paho.mqtt.client as mqtt
            
            def on_connect(client, userdata, flags, rc):
                if rc == 0:
                    self.logger.info(f"✅ Verbunden mit openWB MQTT: {self.mqtt_host}")
                    # Alle relevanten Topics subscriben
                    topics = [
                        f"openWB/chargepoint/{self.chargepoint}/#",
                        "openWB/system/#"
                    ]
                    for topic in topics:
                        client.subscribe(topic)
                    self._is_authenticated = True
                else:
                    self.logger.error(f"MQTT-Verbindung fehlgeschlagen: {rc}")
            
            def on_message(client, userdata, msg):
                # Daten zwischenspeichern
                try:
                    topic = msg.topic
                    payload = msg.payload.decode('utf-8')
                    
                    # JSON-Daten parsen falls möglich
                    try:
                        payload = json.loads(payload)
                    except:
                        pass
                    
                    self._current_data[topic] = payload
                except Exception as e:
                    self.logger.error(f"Fehler bei on_message: {e}")
            
            # MQTT-Client erstellen
            self.mqtt_client = mqtt.Client()
            self.mqtt_client.on_connect = on_connect
            self.mqtt_client.on_message = on_message
            
            # Verbinden
            self.mqtt_client.connect(self.mqtt_host, self.mqtt_port, 60)
            self.mqtt_client.loop_start()
            
            # Kurz warten auf Verbindung
            import asyncio
            await asyncio.sleep(2)
            
            return self._is_authenticated
            
        except Exception as e:
            self.logger.error(f"openWB MQTT-Verbindung fehlgeschlagen: {e}")
            return False
    
    async def fetch_data(self) -> Optional[DeviceData]:
        """Ruft aktuelle Wallbox-Daten ab"""
        if not self._is_authenticated:
            self.logger.error("Nicht authentifiziert")
            return None
        
        try:
            # Daten aus zwischengespeicherten MQTT-Messages extrahieren
            cp = self.chargepoint
            
            power_w = self._current_data.get(f"openWB/chargepoint/{cp}/get/power", 0)
            if isinstance(power_w, str):
                power_w = float(power_w)
            
            current_a = self._current_data.get(f"openWB/chargepoint/{cp}/get/currents", [0])[0]
            if isinstance(current_a, list):
                current_a = current_a[0] if len(current_a) > 0 else 0
            
            is_charging = self._current_data.get(f"openWB/chargepoint/{cp}/get/charging", False)
            if isinstance(is_charging, str):
                is_charging = is_charging.lower() == "true"
            
            # DeviceData erstellen
            device_data = DeviceData(
                device_id=self.device_id,
                device_type="wallbox",
                timestamp=datetime.now(),
                
                # Elektrische Daten
                power=power_w / 1000,  # W → kW
                current=current_a,
                voltage=self._current_data.get(f"openWB/chargepoint/{cp}/get/voltages", [230])[0],
                
                # Status
                is_charging=is_charging,
                is_plugged_in=self._current_data.get(f"openWB/chargepoint/{cp}/get/plug_state", False),
                
                # Metadaten
                metadata={
                    'chargepoint': cp,
                    'energy_charged_kwh': self._current_data.get(f"openWB/chargepoint/{cp}/get/imported", 0),
                    'phases': self._current_data.get(f"openWB/chargepoint/{cp}/get/phases_in_use", 1),
                }
            )
            
            return device_data
            
        except Exception as e:
            self.logger.error(f"Fehler beim Abrufen der openWB-Daten: {e}")
            return None
    
    async def send_command(self, command: str, params: Dict[str, Any]) -> bool:
        """
        Sendet Steuerungsbefehl an openWB
        
        Unterstützte Befehle:
            - set_current: Ladestrom setzen (params: {'current': 16})
            - enable: Laden aktivieren
            - disable: Laden deaktivieren
        """
        if not self._is_authenticated or not self.mqtt_client:
            self.logger.error("Nicht authentifiziert")
            return False
        
        try:
            cp = self.chargepoint
            
            if command == "set_current":
                current = params.get('current', 16)
                topic = f"openWB/set/chargepoint/{cp}/current"
                self.mqtt_client.publish(topic, str(current))
                self.logger.info(f"✅ Ladestrom auf {current}A gesetzt")
                return True
            
            elif command == "enable":
                topic = f"openWB/set/chargepoint/{cp}/enabled"
                self.mqtt_client.publish(topic, "true")
                self.logger.info("✅ Laden aktiviert")
                return True
            
            elif command == "disable":
                topic = f"openWB/set/chargepoint/{cp}/enabled"
                self.mqtt_client.publish(topic, "false")
                self.logger.info("✅ Laden deaktiviert")
                return True
            
            else:
                self.logger.error(f"Unbekannter Befehl: {command}")
                return False
                
        except Exception as e:
            self.logger.error(f"Fehler beim Senden des Befehls '{command}': {e}")
            return False
