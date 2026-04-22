import asyncio
from aiomqtt import Client
from datetime import datetime, timezone
from backend.services.state import RealtimeState
from backend.services.influx_service import InfluxWriter

mqtt_client_ref = None

async def run_mqtt_loop(state: RealtimeState, influx: InfluxWriter):
    global mqtt_client_ref
    
    async with Client("localhost", 1883) as client:
        mqtt_client_ref = client
        await client.subscribe("energy/#")
        print("[MQTT] Verbunden mit localhost:1883, subscribe: energy/#")
        
        async for message in client.messages:
            topic = str(message.topic)
            payload = message.payload.decode()
            timestamp = datetime.now(timezone.utc).isoformat()  # UTC mit TZ
            
            update = {"timestamp": timestamp}
            
            if topic == "energy/pv/power":
                update["pv_power_w"] = float(payload)
            elif topic == "energy/house/load":
                update["house_load_w"] = float(payload)
            elif topic == "energy/ev/power":
                update["ev_power_w"] = float(payload)
            elif topic == "energy/ev/soc":
                update["ev_soc"] = float(payload)
            elif topic == "energy/ev/charging":
                update["ev_charging"] = payload.lower() in ("true", "1")
            elif topic == "energy/grid/import":
                update["grid_import_w"] = float(payload)
            elif topic == "energy/grid/export":
                update["grid_export_w"] = float(payload)
            # Optionale kWh-Zählerstände direkt vom Smart-Meter-Adapter
            # Erwartete Topics (können vom Adapter publiziert werden):
            #  - energy/smartmeter/import_kwh
            #  - energy/smartmeter/export_kwh
            elif topic == "energy/smartmeter/import_kwh":
                update["smartmeter_import_kwh"] = float(payload)
            elif topic == "energy/smartmeter/export_kwh":
                update["smartmeter_export_kwh"] = float(payload)
            
            if len(update) > 1:
                await state.update(update)
                print(f"[MQTT] {topic} -> {update}")
                
                # InfluxDB schreiben
                print(f"[DEBUG] influx={influx}, type={type(influx)}")  # NEU
                if influx:
                    print(f"[DEBUG] Schreibe nach InfluxDB: {update}")  # NEU
                    try:
                        await influx.write(update)
                        print(f"[DEBUG] Write erfolgreich")  # NEU
                    except Exception as e:
                        print(f"[InfluxDB] Schreibfehler: {e}")
                        import traceback
                        traceback.print_exc()
                else:
                    print("[DEBUG] influx ist None!")  # NEU

async def mqtt_publish(topic: str, payload: str):
    """Helper to publish MQTT messages from adapters"""
    global mqtt_client_ref
    if mqtt_client_ref:
        try:
            await mqtt_client_ref.publish(topic, payload)
            print(f"[MQTT-Publish] {topic} = {payload}")
        except Exception as e:
            print(f"[MQTT-Publish] Fehler: {e}")
    else:
        print(f"[MQTT-Publish] Client nicht verfügbar")