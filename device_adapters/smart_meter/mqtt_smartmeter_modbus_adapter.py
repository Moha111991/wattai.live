import time
import json
import paho.mqtt.client as mqtt
from pymodbus.client.sync import ModbusTcpClient

"""Einfacher Modbus→MQTT Adapter für ein Smart Meter.

Dieser Adapter wird als Teil des Energiemanagementsystems (EMS) betrachtet und
überführt Messwerte aus Modbus/TCP in MQTT-Topics, die vom Backend und vom
Smart Home genutzt werden können.

MQTT-Topics:
  - energy/smartmeter/state          → JSON mit allen Rohwerten
  - energy/house/load                → aktuelle Wirkleistung Haus (W)
  - energy/smartmeter/import_kwh     → bezogene Energie (kWh, kumulativ)
  - energy/smartmeter/export_kwh     → eingespeiste Energie (kWh, kumulativ)

Hinweis: Die verwendeten Modbus-Register sind beispielhaft. Passe die Adressen
und Skalierungsfaktoren an dein konkretes Smart Meter an (Datenblatt).
"""

MQTT_BROKER = "localhost"
MQTT_PORT = 1883

# Aggregierte JSON-Nachricht mit allen Werten
MQTT_TOPIC_STATE = "energy/smartmeter/state"

# Topics, die das EMS-Backend und Smart Home direkt verwenden
MQTT_TOPIC_HOUSE_LOAD = "energy/house/load"               # W
MQTT_TOPIC_IMPORT_KWH = "energy/smartmeter/import_kwh"    # kWh
MQTT_TOPIC_EXPORT_KWH = "energy/smartmeter/export_kwh"    # kWh


MODBUS_HOST = "192.168.1.50"  # IP deines Smart Meters
MODBUS_PORT = 502

# Beispiel-Registeradressen (ANPASSEN!):
#   POWER_REGISTER_ADDR       → aktuelle Wirkleistung in W
#   VOLTAGE_REGISTER_ADDR     → Spannung in 0.1 V
#   CURRENT_REGISTER_ADDR     → Strom in 0.01 A
#   IMPORT_KWH_REGISTER_ADDR  → bezogene Energie in 0.01 kWh
#   EXPORT_KWH_REGISTER_ADDR  → eingespeiste Energie in 0.01 kWh
POWER_REGISTER_ADDR = 0
VOLTAGE_REGISTER_ADDR = 2
CURRENT_REGISTER_ADDR = 4
IMPORT_KWH_REGISTER_ADDR = 6
EXPORT_KWH_REGISTER_ADDR = 8

UNIT_ID = 1  # Modbus-Unit-ID / Slave-ID


def read_smartmeter_modbus():
    """Liest Messwerte vom Smart Meter via Modbus.

    Passe Adressen & Skalierung an dein Gerät an.
    """
    client = ModbusTcpClient(MODBUS_HOST, port=MODBUS_PORT)
    client.connect()
    try:
        # Wir lesen hier einen Block, der groß genug für alle Register ist.
        start_addr = min(POWER_REGISTER_ADDR,
                         VOLTAGE_REGISTER_ADDR,
                         CURRENT_REGISTER_ADDR,
                         IMPORT_KWH_REGISTER_ADDR,
                         EXPORT_KWH_REGISTER_ADDR)
        last_addr = max(POWER_REGISTER_ADDR,
                        VOLTAGE_REGISTER_ADDR,
                        CURRENT_REGISTER_ADDR,
                        IMPORT_KWH_REGISTER_ADDR,
                        EXPORT_KWH_REGISTER_ADDR)
        count = (last_addr - start_addr) + 1

        rr = client.read_input_registers(start_addr, count, unit=UNIT_ID)
        if rr.isError():
            print("[SmartMeter-Modbus] Modbus-Fehler:", rr)
            return None

        regs = rr.registers

        def reg(addr: int) -> int:
            return regs[addr - start_addr]

        # Skalierung ggf. im Datenblatt prüfen/anpassen
        power = float(reg(POWER_REGISTER_ADDR))  # W
        voltage = float(reg(VOLTAGE_REGISTER_ADDR)) / 10.0  # V
        current = float(reg(CURRENT_REGISTER_ADDR)) / 100.0  # A

        # Kumulative Energiezähler (hier Beispiel: 0.01 kWh pro Count)
        import_kwh_raw = reg(IMPORT_KWH_REGISTER_ADDR)
        export_kwh_raw = reg(EXPORT_KWH_REGISTER_ADDR)
        import_kwh = float(import_kwh_raw) / 100.0
        export_kwh = float(export_kwh_raw) / 100.0

        return {
            "power_w": power,
            "voltage_v": voltage,
            "current_a": current,
            "import_kwh": import_kwh,
            "export_kwh": export_kwh,
            "timestamp": time.time(),
        }
    finally:
        client.close()


def main():
    mqtt_client = mqtt.Client()
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
    try:
        while True:
            data = read_smartmeter_modbus()
            if data:
                # 1) Vollständiger JSON-State für Debugging & Analyse
                state_payload = json.dumps(data)
                mqtt_client.publish(MQTT_TOPIC_STATE, state_payload)
                # 2) Einzelwerte für EMS und Smart Home
                mqtt_client.publish(MQTT_TOPIC_HOUSE_LOAD, str(data["power_w"]))
                mqtt_client.publish(MQTT_TOPIC_IMPORT_KWH, str(data["import_kwh"]))
                mqtt_client.publish(MQTT_TOPIC_EXPORT_KWH, str(data["export_kwh"]))

                print(
                    f"[SmartMeter-Modbus] power={data['power_w']} W, "
                    f"import={data['import_kwh']} kWh, export={data['export_kwh']} kWh"
                )

            time.sleep(5)
    except KeyboardInterrupt:
        print("Beende Smart Meter Modbus Adapter...")
    finally:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()


if __name__ == "__main__":
    main()
