# 🚀 Production Deployment Guide

Vollständige Anleitung zum Deployment des **AI-basierten Energiemanagementsystems (EMS)** mit echten Geräten.

---

## 📋 Systemarchitektur Übersicht

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  🚗 E-Autos          ⚡ Wallboxen       🔋 Batterien        │
│  ├─ Tesla            ├─ go-eCharger     ├─ Powerwall        │
│  ├─ VW/Audi          ├─ Wallbe          ├─ sonnenBatterie   │
│  └─ BMW              └─ openWB          └─ BYD Box          │
│                                                              │
│              ↓ MQTT (verschlüsselt) ↓                        │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │     🔒 MQTT Broker (Mosquitto)             │             │
│  │     - TLS Verschlüsselung                  │             │
│  │     - Passwort-Authentifizierung           │             │
│  │     - ACL-basierte Zugangskontrolle        │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│              ↓ Device Adapters ↓                             │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │  🤖 AI Controller (DQN/PPO)                │             │
│  │  ├─ Echtzeit-Energieoptimierung            │             │
│  │  ├─ Preis-basierte Ladesteuerung           │             │
│  │  └─ CO2-Minimierung                        │             │
│  └────────────────────────────────────────────┘             │
│                                                              │
│              ↓ REST API & WebSocket ↓                        │
│                                                              │
│  📱 Streamlit Dashboard    📲 Mobile App (React Native)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Deployment-Schritte

### Schritt 1: MQTT-Broker Setup

**Option A: Docker Deployment (empfohlen)**

```bash
cd deployment/mqtt-broker

# 1. TLS-Zertifikate generieren
chmod +x generate-certs.sh
./generate-certs.sh

# 2. Passwort-Datei erstellen
docker run -it --rm -v $(pwd)/config:/mosquitto/config eclipse-mosquitto mosquitto_passwd -c /mosquitto/config/passwd admin
# Passwort eingeben: <Ihr sicheres Passwort>

# 3. Broker starten
docker-compose up -d

# 4. Status prüfen
docker-compose logs -f
```

**Option B: Native Installation**

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install mosquitto mosquitto-clients

# macOS
brew install mosquitto

# Konfiguration kopieren
sudo cp deployment/mqtt-broker/config/mosquitto.conf /etc/mosquitto/
sudo systemctl restart mosquitto
```

**Testen:**

```bash
# Subscriber (Terminal 1)
mosquitto_sub -h localhost -p 1883 -t "test/topic" -u admin -P <Passwort>

# Publisher (Terminal 2)
mosquitto_pub -h localhost -p 1883 -t "test/topic" -m "Hello EMS!" -u admin -P <Passwort>
```

---

### Schritt 2: Geräte-Adapter konfigurieren

**E-Auto verbinden (Beispiel: Tesla)**

```bash
# 1. Umgebungsvariablen setzen
export TESLA_EMAIL="ihre@email.com"

# 2. Tesla-Adapter testen
python -c "
import asyncio
from device_adapters import TeslaAdapter

async def test():
    async with TeslaAdapter() as tesla:
        data = await tesla.fetch_data()
        print(f'SOC: {data.soc}%')

asyncio.run(test())
"
```

**Wallbox verbinden (Beispiel: go-eCharger)**

```bash
# 1. IP-Adresse herausfinden (z.B. 192.168.1.100)
# 2. Umgebungsvariablen setzen
export GOECHARGER_IP="192.168.1.100"

# 3. go-eCharger testen
python -c "
import asyncio
from device_adapters import GoEChargerAdapter

async def test():
    async with GoEChargerAdapter() as wallbox:
        data = await wallbox.fetch_data()
        print(f'Leistung: {data.power} kW')

asyncio.run(test())
"
```

**Batterie-Speicher verbinden (Beispiel: Tesla Powerwall)**

```bash
# 1. IP-Adresse und Passwort
export POWERWALL_IP="192.168.1.100"
export POWERWALL_PASSWORD="<Ihr Passwort>"

# 2. Powerwall testen
python -c "
import asyncio
from device_adapters import PowerwallAdapter

async def test():
    async with PowerwallAdapter() as pw:
        data = await pw.fetch_data()
        print(f'Batterie SOC: {data.soc}%')

asyncio.run(test())
"
```

---

### Schritt 3: Backend Services starten

**3.1. FastAPI Backend**

```bash
# Terminal 1: Backend starten
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# API-Dokumentation öffnen:
# http://localhost:8001/docs
```

**3.2. MQTT-zu-WebSocket Bridge**

```bash
# Terminal 2: Bridge starten
python backend/mqtt_to_ws.py
```

**3.3. Device Polling Service erstellen**

```python
# device_poller.py
import asyncio
import paho.mqtt.client as mqtt
from device_adapters import TeslaAdapter, GoEChargerAdapter, PowerwallAdapter

async def poll_devices():
    mqtt_client = mqtt.Client()
    mqtt_client.username_pw_set("admin", "<Passwort>")
    mqtt_client.connect("localhost", 1883)
    
    # Adapter erstellen
    tesla = TeslaAdapter(mqtt_client=mqtt_client)
    wallbox = GoEChargerAdapter(mqtt_client=mqtt_client)
    powerwall = PowerwallAdapter(mqtt_client=mqtt_client)
    
    await tesla.authenticate()
    await wallbox.authenticate()
    await powerwall.authenticate()
    
    while True:
        # Alle 60 Sekunden Daten abrufen
        await tesla.update_and_publish()
        await wallbox.update_and_publish()
        await powerwall.update_and_publish()
        
        await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(poll_devices())
```

**Starten:**

```bash
# Terminal 3: Device Poller
python device_poller.py
```

---

### Schritt 4: Streamlit Dashboard starten

```bash
# Terminal 4: Dashboard
streamlit run app.py --server.port 5000
```

**Öffnen:** http://localhost:5000

---

## 🔐 Sicherheit & Produktion

### 1. Umgebungsvariablen sicher verwalten

**`.env` Datei erstellen:**

```bash
# MQTT Broker
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=8883  # TLS Port
MQTT_USERNAME=admin
MQTT_PASSWORD=<Sicheres Passwort>

# Tesla
TESLA_EMAIL=ihre@email.com

# go-eCharger
GOECHARGER_IP=192.168.1.100

# Powerwall
POWERWALL_IP=192.168.1.100
POWERWALL_PASSWORD=<Powerwall Passwort>

# AI Controller
AI_AGENT_TYPE=dqn
AI_MODEL_PATH=/path/to/trained_model.pth
PV_CAPACITY_KW=10.0
BATTERY_CAPACITY_KWH=13.5
EV_CAPACITY_KWH=75.0

# Database
DATABASE_URL=postgresql://user:password@localhost/ems_db
```

**In Python laden:**

```python
from dotenv import load_dotenv
load_dotenv()
```

### 2. TLS aktivieren

```bash
# In mosquitto.conf aktivieren:
listener 8883
cafile /mosquitto/certs/ca.crt
certfile /mosquitto/certs/server.crt
keyfile /mosquitto/certs/server.key
```

### 3. Firewall konfigurieren

```bash
# Nur MQTT-Port von lokalem Netzwerk erlauben
sudo ufw allow from 192.168.1.0/24 to any port 8883
sudo ufw allow 8001  # FastAPI
sudo ufw allow 5000  # Streamlit
```

---

## 📊 Production Monitoring

### 1. Systemd Services erstellen

**FastAPI Backend:**

```ini
# /etc/systemd/system/ems-backend.service
[Unit]
Description=EMS FastAPI Backend
After=network.target

[Service]
Type=simple
User=ems
WorkingDirectory=/opt/ems
Environment="PATH=/opt/ems/venv/bin"
ExecStart=/opt/ems/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

**MQTT Bridge:**

```ini
# /etc/systemd/system/ems-mqtt-bridge.service
[Unit]
Description=EMS MQTT Bridge
After=network.target ems-backend.service

[Service]
Type=simple
User=ems
WorkingDirectory=/opt/ems
Environment="PATH=/opt/ems/venv/bin"
ExecStart=/opt/ems/venv/bin/python backend/mqtt_to_ws.py
Restart=always

[Install]
WantedBy=multi-user.target
```

**Aktivieren:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable ems-backend ems-mqtt-bridge
sudo systemctl start ems-backend ems-mqtt-bridge
```

### 2. Logging

```python
# logging_config.py
import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    handler = RotatingFileHandler(
        '/var/log/ems/app.log',
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    
    logging.basicConfig(
        handlers=[handler],
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
```

### 3. Health Checks

```bash
# health_check.sh
#!/bin/bash

# Backend prüfen
curl -f http://localhost:8001/ || systemctl restart ems-backend

# MQTT prüfen
mosquitto_sub -h localhost -p 8883 -t '$SYS/broker/uptime' -C 1 -u admin -P <Passwort> || systemctl restart mosquitto
```

---

## 🧪 Testing

### API testen

```bash
# AI-Entscheidung testen
curl -X POST "http://localhost:8001/ai/decision" \
  -H "Content-Type: application/json" \
  -d '{
    "pv_power": 5.2,
    "battery_soc": 65.0,
    "ev_soc": 45.0,
    "household_load": 1.5,
    "grid_price": 0.28,
    "hour": 14,
    "temperature": 22.0
  }'

# AI-Status abrufen
curl http://localhost:8001/ai/status
```

### Device Adapter testen

```python
import asyncio
from device_adapters import TeslaAdapter, GoEChargerAdapter

async def test_all():
    # Tesla testen
    async with TeslaAdapter() as tesla:
        data = await tesla.fetch_data()
        print(f"Tesla SOC: {data.soc}%")
        
        # Laden starten
        await tesla.send_command("start_charging", {})
    
    # Wallbox testen
    async with GoEChargerAdapter() as wallbox:
        data = await wallbox.fetch_data()
        print(f"Wallbox Leistung: {data.power} kW")

asyncio.run(test_all())
```

---

## 🚨 Troubleshooting

### Problem: MQTT-Verbindung schlägt fehl

```bash
# Logs prüfen
docker-compose logs mosquitto

# Verbindung testen
mosquitto_sub -h localhost -p 8883 -t "test" -u admin -P <Passwort> -d
```

### Problem: API gibt Fehler zurück

```bash
# Backend-Logs prüfen
journalctl -u ems-backend -f

# oder
tail -f /var/log/ems/app.log
```

### Problem: Geräte-Adapter verbindet nicht

```python
# Debug-Logging aktivieren
import logging
logging.basicConfig(level=logging.DEBUG)

# Adapter testen
async with TeslaAdapter() as tesla:
    status = await tesla.get_status()
    print(status)
```

---

## 📱 Mobile App (Schritt 4)

Die Mobile App ist in React Native/Expo geplant mit:
- Echtzeit-SOC Anzeige
- WebSocket-Verbindung zum Backend
- Manuelle Steuerung
- Push-Benachrichtigungen

**Nächste Schritte:**
1. React Native Projekt initialisieren
2. WebSocket-Client implementieren
3. UI-Komponenten erstellen
4. Push-Notifications konfigurieren

---

## 📚 Weitere Dokumentation

- **Geräte-Adapter:** `device_adapters/README.md`
- **API-Dokumentation:** http://localhost:8001/docs
- **MQTT Topics:** Siehe `deployment/mqtt-broker/TOPICS.md`

---

**Entwickelt für Produktions-Einsatz** | **AI-basierte Energieoptimierung** 🌱⚡
