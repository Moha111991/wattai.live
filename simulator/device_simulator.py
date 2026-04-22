import paho.mqtt.publish as publish
import json, time, random, math
import threading
import os
from datetime import datetime

BROKER = os.getenv("MQTT_BROKER", "test.mosquitto.org")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))

def simulate(device, soc_start=50):
    soc = soc_start
    print(f"🚀 Starte Simulation für {device} (Start-SOC: {soc_start}%)")
    
    while True:
        soc += random.uniform(-0.5, 0.5)
        soc = max(0, min(100, soc))
        
        msg = json.dumps({"device": device, "soc": round(soc, 2)})
        
        try:
            publish.single(
                f"ems/{device}/soc", 
                msg, 
                hostname=BROKER,
                port=MQTT_PORT
            )
            print(f"📊 {device.upper():15s} SOC: {soc:6.2f}%")
        except Exception as e:
            print(f"❌ MQTT Publish-Fehler für {device}: {e}")
        
        time.sleep(5)

def simulate_pv_power(max_power_kw=10.0):
    """
    Simuliert PV-Leistung mit realistischem Tag/Nacht-Zyklus
    
    - Nacht (22-6 Uhr): 0 kW
    - Morgen (6-12 Uhr): Anstieg auf Maximum
    - Mittag (12-14 Uhr): Maximum
    - Nachmittag (14-20 Uhr): Abfall
    - Abend (20-22 Uhr): Schneller Abfall auf 0
    """
    print(f"☀️ Starte PV-Simulation (Max: {max_power_kw} kW)")
    daily_yield = 0.0
    last_reset_day = datetime.now().day
    
    while True:
        now = datetime.now()
        hour = now.hour
        minute = now.minute
        
        # Reset yield bei neuem Tag (Mitternacht)
        if now.day != last_reset_day:
            daily_yield = 0.0
            last_reset_day = now.day
            print(f"🌅 Neuer Tag - Yield zurückgesetzt")
        
        # Berechne PV-Leistung basierend auf Tageszeit
        time_fraction = hour + minute / 60.0
        
        if 6 <= time_fraction < 12:
            # Morgen: Sinus-Anstieg
            phase = (time_fraction - 6) / 6 * (math.pi / 2)
            power_kw = max_power_kw * math.sin(phase) * random.uniform(0.85, 1.0)
        elif 12 <= time_fraction < 14:
            # Mittag: Maximum mit kleinen Schwankungen (Wolken)
            power_kw = max_power_kw * random.uniform(0.90, 1.0)
        elif 14 <= time_fraction < 20:
            # Nachmittag: Sinus-Abfall
            phase = (time_fraction - 14) / 6 * (math.pi / 2)
            power_kw = max_power_kw * math.cos(phase) * random.uniform(0.85, 1.0)
        elif 20 <= time_fraction < 22:
            # Abend: Schneller Abfall
            phase = (time_fraction - 20) / 2
            power_kw = max_power_kw * 0.3 * (1 - phase) * random.uniform(0.7, 1.0)
        else:
            # Nacht: 0 kW
            power_kw = 0.0
        
        power_kw = max(0, power_kw)
        power_w = int(power_kw * 1000)
        
        # Akkumuliere Tagesertrag (kWh = kW * Stunden)
        daily_yield += power_kw * (5 / 3600)  # 5 Sekunden in Stunden
        
        # Send PV Power
        try:
            publish.single(
                "ems/pv/power",
                json.dumps({"power": power_w, "data_type": "power"}),
                hostname=BROKER,
                port=MQTT_PORT
            )
            print(f"☀️  PV-POWER        {power_kw:6.2f} kW  |  Yield: {daily_yield:5.2f} kWh  |  {hour:02d}:{minute:02d}")
        except Exception as e:
            print(f"❌ MQTT PV Power Error: {e}")
        
        # Send PV Yield (weniger häufig - nur alle 30 Sekunden)
        if minute % 1 == 0 and now.second < 5:
            try:
                publish.single(
                    "ems/pv/yield",
                    json.dumps({"yield_today": round(daily_yield, 2), "data_type": "yield"}),
                    hostname=BROKER,
                    port=MQTT_PORT
                )
            except Exception as e:
                print(f"❌ MQTT PV Yield Error: {e}")
        
        time.sleep(5)

def simulate_grid_flow(pv_power_kw=0, household_load_kw=1.5):
    """
    Simuliert Grid Import/Export basierend auf PV und Verbrauch
    
    Negativ = Einspeisung (Export)
    Positiv = Bezug (Import)
    """
    print(f"⚡ Starte Grid-Simulation (Haushaltslast: {household_load_kw} kW)")
    
    while True:
        # Simuliere variable Haushaltslast (1-3 kW)
        load_kw = random.uniform(1.0, 3.0)
        
        # Hole aktuelle PV-Leistung (vereinfacht - nutze Tageszeit)
        hour = datetime.now().hour
        if 8 <= hour < 18:
            pv_kw = random.uniform(0, 10)
        else:
            pv_kw = 0
        
        # Grid Flow = Load - PV (positiv = Import, negativ = Export)
        grid_flow_kw = load_kw - pv_kw
        grid_flow_w = int(grid_flow_kw * 1000)
        
        if grid_flow_kw > 0:
            # Import from Grid
            data_type = "import"
            power_w = abs(grid_flow_w)
        else:
            # Export to Grid
            data_type = "export"
            power_w = abs(grid_flow_w)
        
        try:
            publish.single(
                f"ems/grid/{data_type}",
                json.dumps({"power": power_w, "data_type": data_type}),
                hostname=BROKER,
                port=MQTT_PORT
            )
            symbol = "⬇️ " if data_type == "import" else "⬆️ "
            print(f"⚡  GRID-{data_type.upper():6s}    {symbol}{abs(grid_flow_kw):5.2f} kW  |  PV: {pv_kw:.2f} kW, Load: {load_kw:.2f} kW")
        except Exception as e:
            print(f"❌ MQTT Grid Error: {e}")
        
        time.sleep(10)

def simulate_inverter_status():
    """Simuliert Wechselrichter-Status"""
    print(f"🔌 Starte Inverter-Simulation")
    
    while True:
        hour = datetime.now().hour
        
        # Status basierend auf Tageszeit
        if 6 <= hour < 20:
            status = "online"
            temp = random.uniform(35, 55)  # Betriebstemperatur
            efficiency = random.uniform(0.95, 0.98)  # 95-98% Wirkungsgrad
        else:
            status = "standby"
            temp = random.uniform(20, 30)  # Umgebungstemperatur
            efficiency = 0.0
        
        try:
            publish.single(
                "ems/inverter/status",
                json.dumps({
                    "status": status,
                    "temperature": round(temp, 1),
                    "efficiency": round(efficiency, 3)
                }),
                hostname=BROKER,
                port=MQTT_PORT
            )
            print(f"🔌 INVERTER         {status:8s}  |  Temp: {temp:.1f}°C, Eff: {efficiency*100:.1f}%")
        except Exception as e:
            print(f"❌ MQTT Inverter Error: {e}")
        
        time.sleep(30)  # Weniger häufig updaten

if __name__ == "__main__":
    print(f"🔌 MQTT-Broker: {BROKER}:{MQTT_PORT}")
    print("=" * 80)
    
    # SOC Simulationen (EV, Batterie)
    threading.Thread(target=simulate, args=("ev", 65), daemon=True).start()
    threading.Thread(target=simulate, args=("home_battery", 75), daemon=True).start()
    
    # PV & Grid Simulationen (NEU!)
    threading.Thread(target=simulate_pv_power, args=(10.0,), daemon=True).start()
    threading.Thread(target=simulate_grid_flow, daemon=True).start()
    threading.Thread(target=simulate_inverter_status, daemon=True).start()
    
    print("=" * 80)
    print("✅ Alle Simulationen gestartet:")
    print("   • EV SOC")
    print("   • Home Battery SOC")
    print("   • PV Power (0-10 kW, tageszeitabhängig)")
    print("   • Grid Import/Export")
    print("   • Inverter Status")
    print("=" * 80)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n👋 Simulator beendet")
