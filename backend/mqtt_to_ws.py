import paho.mqtt.client as mqtt
import requests
import json
import os
import time

FASTAPI_BASE_URL = os.getenv("FASTAPI_BASE_URL", "")
BROKER = os.getenv("MQTT_BROKER", "test.mosquitto.org")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

# MQTT Topics für alle Geräte und Sensoren
TOPICS = {
    "ems/ev/soc": "soc",                    # E-Auto Ladezustand
    "ems/home_battery/soc": "soc",          # Batteriespeicher Ladezustand
    "ems/pv/power": "pv_realtime",          # PV-Echtzeitleistung (W)
    "ems/pv/yield": "pv_realtime",          # PV-Tagesertrag (kWh)
    "ems/grid/import": "grid_realtime",     # Netzbezug (W)
    "ems/grid/export": "grid_realtime",     # Netzeinspeisung (W)
    "ems/inverter/status": "inverter",      # Wechselrichter-Status
}

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Verbunden mit MQTT-Broker: {BROKER}:{MQTT_PORT}")
        for topic in TOPICS.keys():
            client.subscribe(topic)
            print(f"📡 Subscribed: {topic}")
    else:
        print(f"❌ Verbindung fehlgeschlagen mit Code {rc}")

def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        print(f"📨 MQTT empfangen: {msg.topic} -> {data}")
        
        # Route zu korrektem FastAPI Endpoint basierend auf Topic
        endpoint_type = TOPICS.get(msg.topic, "unknown")
        
        if endpoint_type == "soc":
            url = f"{FASTAPI_BASE_URL}/update_soc"
        elif endpoint_type == "pv_realtime":
            url = f"{FASTAPI_BASE_URL}/pv/realtime"
            # Erweitere Daten um Topic-Info
            data['data_type'] = 'power' if 'power' in msg.topic else 'yield'
        elif endpoint_type == "grid_realtime":
            url = f"{FASTAPI_BASE_URL}/grid/realtime"
            data['data_type'] = 'import' if 'import' in msg.topic else 'export'
        elif endpoint_type == "inverter":
            url = f"{FASTAPI_BASE_URL}/inverter/status"
        else:
            print(f"⚠️ Unbekanntes Topic: {msg.topic}")
            return
        
        response = requests.post(url, json=data, timeout=5)
        if response.status_code == 200:
            print(f"✅ An FastAPI weitergeleitet: {endpoint_type} -> {url}")
            
            # Trigger automatische Edge-AI Entscheidung bei PV-Daten
            if endpoint_type == "pv_realtime":
                try:
                    trigger_ai_decision(data)
                except Exception as e:
                    print(f"⚠️ Edge-AI Trigger fehlgeschlagen: {e}")
        else:
            print(f"⚠️ FastAPI Fehler: {response.status_code}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON-Fehler: {e}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Verbindungsfehler zu FastAPI: {e}")
    except Exception as e:
        print(f"❌ Fehler: {e}")

def trigger_ai_decision(pv_data):
    """
    Triggert automatische Edge-AI Entscheidung basierend auf PV-Daten
    
    Wird aufgerufen wenn neue PV-Daten empfangen werden, um intelligent
    zu entscheiden ob geladen/entladen werden soll
    """
    try:
        # Hole aktuellen EV SOC
        soc_response = requests.get(f"{FASTAPI_BASE_URL}/soc", timeout=2)
        if soc_response.status_code != 200:
            return
        
        soc_data = soc_response.json()
        ev_soc = soc_data.get("ev_soc", 50.0)
        
        # Extrahiere PV-Leistung
        pv_power_w = pv_data.get("power", 0.0) if pv_data.get("data_type") == "power" else 0.0
        pv_power_kw = pv_power_w / 1000.0  # W -> kW
        
        # Nur triggern wenn signifikante PV-Leistung vorhanden
        if pv_power_kw < 1.0:
            return
        
        # Systemzustand für Edge-AI vorbereiten
        system_state = {
            "ev_soc": ev_soc,
            "battery_temp": 20.0,  # Default
            "pv_power": pv_power_kw,
            "grid_price": 0.30,    # Default, könnte aus Tarif-API kommen
            "co2_intensity": 300.0 # Default
        }
        
        # Edge-AI Entscheidung anfordern
        decision_response = requests.post(
            f"{FASTAPI_BASE_URL}/edge_ai/auto_decision",
            json=system_state,
            timeout=3
        )
        
        if decision_response.status_code == 200:
            decision = decision_response.json()
            action = decision.get("decision", {}).get("action", "idle")
            power = decision.get("decision", {}).get("power_kw", 0.0)
            print(f"🤖 Auto-Entscheidung: {action} ({power:.1f} kW) | PV: {pv_power_kw:.1f} kW, SOC: {ev_soc:.0f}%")
        
    except Exception:
        # Silent fail - nicht kritisch
        pass

def main():
    print("🚀 MQTT-zu-WebSocket Bridge startet...")
    print(f"📡 MQTT-Broker: {BROKER}:{MQTT_PORT}")
    print(f"🔗 FastAPI Base URL: {FASTAPI_BASE_URL}")
    print("🤖 Automatische Edge-AI Triggering: AKTIV")
    
    retry_count = 0
    max_retries = 10
    base_delay = 5
    
    while True:
        try:
            client = mqtt.Client()
            client.on_connect = on_connect
            client.on_message = on_message
            
            print(f"🔄 Verbindungsversuch {retry_count + 1}...")
            client.connect(BROKER, MQTT_PORT, 60)
            retry_count = 0
            client.loop_forever()
            
        except KeyboardInterrupt:
            print("\n👋 MQTT-Bridge beendet")
            try:
                client.disconnect()
            except Exception:
                pass
            break
            
        except Exception as e:
            retry_count += 1
            delay = min(base_delay * (2 ** min(retry_count - 1, 5)), 300)
            print(f"❌ Verbindungsfehler (Versuch {retry_count}): {e}")
            
            if retry_count >= max_retries:
                print(f"⚠️ Maximale Versuche ({max_retries}) erreicht, warte {delay}s...")
                retry_count = 0
            
            print(f"⏳ Warte {delay}s vor erneutem Verbindungsversuch...")
            time.sleep(delay)

if __name__ == "__main__":
    main()
