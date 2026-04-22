import time
import json
import random
import paho.mqtt.client as mqtt

MQTT_BROKER = "localhost"
MQTT_PORT = 1883
MQTT_TOPIC = "energy/smartmeter/state"

# Simuliere Smart Meter Werte (ersetze dies durch echten Modbus-Read!)
def read_smartmeter():
    return {
        "power": round(random.uniform(500, 3500), 1),  # aktuelle Leistung in Watt
        "import_kwh": round(random.uniform(1000, 15000), 1),  # importierte kWh
        "export_kwh": round(random.uniform(1000, 5000), 1),  # exportierte kWh
        "timestamp": time.time()
    }

def main():
    client = mqtt.Client()
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.loop_start()
    try:
        while True:
            data = read_smartmeter()
            payload = json.dumps(data)
            client.publish(MQTT_TOPIC, payload)
            print(f"[SmartMeter] Published: {payload}")
            time.sleep(5)  # alle 5 Sekunden
    except KeyboardInterrupt:
        print("Beende Smart Meter Adapter...")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
