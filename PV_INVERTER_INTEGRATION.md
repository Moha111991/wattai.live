# PV Inverter Integration Guide

## Übersicht

Dieses Dokument beschreibt die Integration von PV-Wechselrichtern in das Energy Management System (EMS) für automatische Edge-AI-gesteuerte Ladeentscheidungen.

## Architektur

```
PV-Wechselrichter
    ↓
Edge Gateway (Raspberry Pi / IPC)
    ↓ Modbus RTU/TCP oder SunSpec
MQTT Broker (TLS 1.3)
    ↓ Topics: ems/pv/power, ems/pv/yield
EMS Backend (FastAPI)
    ↓
Edge-AI Decision Engine (TensorFlow Lite)
```

## Unterstützte Protokolle

### 1. Modbus RTU/TCP
Viele PV-Wechselrichter (z.B. SMA, Fronius, SolarEdge) unterstützen Modbus:

**Typische Modbus Register:**
- Power Output (W): Register 40083-40084 (SunSpec)
- Daily Yield (Wh): Register 40092-40093 (SunSpec)
- Status: Register 40107 (0=offline, 1=standby, 2=online)
- Temperature (°C): Register 40103
- Efficiency (%): Register 40097

**Python Beispiel (pymodbus):**
```python
from pymodbus.client import ModbusTcpClient
import paho.mqtt.publish as publish

client = ModbusTcpClient('192.168.1.100', port=502)
result = client.read_holding_registers(40083, 2)  # Power
power_w = int.from_bytes(result.registers, 'big')

publish.single(
    "ems/pv/power",
    json.dumps({"power": power_w, "data_type": "power"}),
    hostname="mqtt.example.com",
    port=8883,
    tls={'ca_certs': '/etc/ssl/certs/ca-certificates.crt'}
)
```

### 2. SunSpec Protocol
SunSpec ist ein standardisiertes Modbus-Protokoll für Solaranlagen:

**SunSpec Model 101-103 (Inverter Models):**
- Model 101: Single Phase Inverter
- Model 102: Split Phase Inverter  
- Model 103: Three Phase Inverter

**Register-Map (SunSpec):**
```
40001-40002: SunSpec ID ("SunS" = 0x53756e53)
40003: Model ID (101/102/103)
40004-40052: Inverter Data
  - AC_Current, AC_Voltage, AC_Power
  - DC_Current, DC_Voltage
  - Temperature, Status, Events
```

### 3. REST APIs
Moderne Wechselrichter bieten oft REST APIs:

**Beispiel: SolarEdge API**
```bash
curl -X GET "https://monitoringapi.solaredge.com/site/{siteId}/currentPowerFlow?api_key={API_KEY}"
```

**Beispiel: Fronius Solar API**
```bash
curl "http://192.168.1.100/solar_api/v1/GetInverterRealtimeData.cgi?Scope=Device&DeviceId=1&DataCollection=CommonInverterData"
```

## MQTT Topic Schema

### Topic: `ems/pv/power`
```json
{
  "power": 5000,
  "data_type": "power"
}
```
- `power`: Aktuelle PV-Leistung in Watt (W)
- `data_type`: "power"
- Sendefrequenz: Alle 5-10 Sekunden

### Topic: `ems/pv/yield`
```json
{
  "yield_today": 25.5,
  "data_type": "yield"
}
```
- `yield_today`: Tagesertrag in Kilowattstunden (kWh)
- `data_type`: "yield"
- Sendefrequenz: Alle 30-60 Sekunden

### Topic: `ems/grid/import`
```json
{
  "power": 1500,
  "data_type": "import"
}
```
- `power`: Netzbezug in Watt (W)
- Positiver Wert = Bezug aus dem Netz

### Topic: `ems/grid/export`
```json
{
  "power": 3000,
  "data_type": "export"
}
```
- `power`: Netzeinspeisung in Watt (W)
- Positiver Wert = Einspeisung ins Netz

### Topic: `ems/inverter/status`
```json
{
  "status": "online",
  "temperature": 45.2,
  "efficiency": 0.974
}
```
- `status`: "online", "standby", "offline", "fault"
- `temperature`: Wechselrichter-Temperatur in °C
- `efficiency`: Wirkungsgrad (0.0 - 1.0)

## Hardware-Setup

### Option 1: Raspberry Pi als Edge Gateway

**Benötigte Hardware:**
- Raspberry Pi 4 (2 GB RAM minimum)
- RS485 USB Adapter (für Modbus RTU)
- SD-Karte (16 GB minimum)
- Ethernet-Kabel oder WiFi

**Installation:**
```bash
# 1. Modbus-Bibliothek installieren
pip install pymodbus paho-mqtt

# 2. Gateway-Script erstellen
nano /home/pi/pv_gateway.py

# 3. Systemd Service einrichten
sudo systemctl enable pv-gateway.service
sudo systemctl start pv-gateway.service
```

### Option 2: IPC (Industrial PC) mit Docker

**Docker Compose:**
```yaml
version: '3.8'
services:
  pv-gateway:
    image: python:3.11-slim
    volumes:
      - ./pv_gateway.py:/app/pv_gateway.py
    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0  # RS485 Adapter
    environment:
      - MQTT_BROKER=mqtt.example.com
      - MQTT_PORT=8883
      - INVERTER_IP=192.168.1.100
    command: python /app/pv_gateway.py
    restart: always
```

## Sicherheit

### 1. MQTT TLS 1.3
```python
import ssl
import paho.mqtt.client as mqtt

client = mqtt.Client()
client.tls_set(
    ca_certs="/etc/ssl/certs/ca-certificates.crt",
    certfile="/etc/ssl/client.crt",
    keyfile="/etc/ssl/client.key",
    tls_version=ssl.PROTOCOL_TLSv1_3
)
client.connect("mqtt.example.com", 8883)
```

### 2. API Key Authentication (FastAPI)
```bash
curl -X POST http://localhost:8001/pv/realtime \
  -H "X-API-Key: your-secret-api-key" \
  -H "Content-Type: application/json" \
  -d '{"power": 5000, "yield_today": 12.5}'
```

## Testing ohne Hardware: Device Simulator

Für Tests ohne echten Wechselrichter nutzen Sie den integrierten Device Simulator:

```bash
# Simulator starten
python simulator/device_simulator.py
```

**Features:**
- Realistische zeitabhängige PV-Kurve (0-10 kW)
- Nacht (22-6 Uhr): 0 kW
- Morgen (6-12 Uhr): Sinus-Anstieg auf Maximum
- Mittag (12-14 Uhr): Maximum mit Wolkenschwankungen
- Nachmittag (14-20 Uhr): Sinus-Abfall
- Abend (20-22 Uhr): Schneller Abfall auf 0 kW

## Edge-AI Automatische Entscheidungen

Sobald PV-Daten empfangen werden, triggert das System automatisch Edge-AI-Entscheidungen:

```bash
# Automatische Entscheidung basierend auf PV-Daten
curl -X POST http://localhost:8001/edge_ai/auto_decision
```

**Beispiel-Response bei PV-Überschuss:**
```json
{
  "decision": {
    "action": "charge_solar",
    "power_kw": 5.0,
    "confidence": 0.991,
    "reasoning": "PV surplus detected, smart solar charging recommended"
  },
  "ev_soc": 45.2,
  "battery_soc": 78.5,
  "pv_power_kw": 7.5,
  "timestamp": "2025-11-10T12:00:00"
}
```

## Troubleshooting

### Problem: Keine PV-Daten empfangen
```bash
# 1. MQTT Broker testen
mosquitto_sub -h mqtt.example.com -p 8883 -t "ems/pv/#" -v

# 2. Modbus-Verbindung testen
mbpoll -a 1 -r 40083 -c 2 -t 4 192.168.1.100

# 3. Backend-Logs prüfen
curl http://localhost:8001/pv/realtime
```

### Problem: Safety Layer blockiert Entscheidungen
```bash
# Safety Status prüfen
curl http://localhost:8001/safety/status

# Watchdog zurücksetzen (nur für Tests!)
curl -X POST http://localhost:8001/safety/reset_watchdog
```

## Monitoring

### Echtzeit-Daten abrufen
```bash
# PV-Daten
curl http://localhost:8001/pv/realtime

# Grid-Daten
curl http://localhost:8001/grid/realtime

# Inverter Status
curl http://localhost:8001/inverter/status

# Edge-AI Status
curl http://localhost:8001/edge_ai/status
```

### WebSocket für Live-Updates
```javascript
const ws = new WebSocket('ws://localhost:8001/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('PV Power:', data.pv_power_kw, 'kW');
};
```

## Unterstützte Wechselrichter (getestet)

| Hersteller | Modell | Protokoll | Status |
|------------|--------|-----------|--------|
| SMA | Sunny Boy | Modbus TCP | ✅ Tested |
| Fronius | Symo | SunSpec | ✅ Tested |
| SolarEdge | SE7600H | REST API | ✅ Tested |
| Huawei | SUN2000 | Modbus TCP | ⚠️ Partial |
| Kostal | PLENTICORE | REST API | 🔄 In Progress |

## Weitere Informationen

- **SunSpec Alliance**: https://sunspec.org/
- **Modbus Protocol**: https://modbus.org/
- **ISO 21434 Security**: Siehe `ISO21434_COMPLIANCE.md`
- **ISO 26262 Safety**: Siehe `backend/safety_layer.py`

## Support

Bei Fragen zur PV-Inverter Integration:
- GitHub Issues: [Repository Link]
- Email: support@example.com
