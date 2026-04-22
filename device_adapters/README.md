# 🔌 Device Adapters für EMS (Energiemanagementsystem)

Vollständige Sammlung von Adaptern für **E-Autos**, **Wallboxen** und **Batterie-Speicher**, die echte Geräte-APIs anbinden und Daten via MQTT publizieren.

---

## 📋 Übersicht

Diese Adapter ermöglichen es Ihrem EMS, mit **realen Geräten** zu kommunizieren:

### 🚗 E-Auto Adapter
- **Tesla** - Alle Tesla-Modelle (Model 3, Y, S, X)
- **VW/Audi** - ID.3, ID.4, ID.5, e-tron, e-Golf
- **BMW/Mini** - iX, i4, iX3, i3, Mini Electric

### ⚡ Wallbox Adapter
- **go-eCharger** - Alle Modelle (Home, Gemini, Gemini flex)
- **Wallbe** - Alle Modelle mit Modbus TCP
- **openWB** - Open-Source Wallbox-Steuerung

### 🔋 Batterie-Speicher Adapter
- **Tesla Powerwall** - Powerwall 2, Powerwall+
- **sonnenBatterie** - Alle sonnenBatterie Modelle
- **BYD Battery-Box** - Battery-Box Premium HVS/HVM

### 🌐 Universal Adapter
- **Generic MQTT** - Für beliebige IoT-Geräte mit MQTT

---

## 🚀 Schnellstart

### Installation

```bash
# Basis-Dependencies (bereits installiert)
pip install paho-mqtt requests

# E-Auto APIs
pip install teslapy                # Tesla
pip install weconnect               # VW/Audi
pip install bimmer_connected        # BMW

# Wallbox/Battery APIs
pip install pymodbus                # Modbus (Wallbe, BYD)
pip install aiohttp                 # HTTP APIs
```

### Beispiel: Tesla verbinden

```python
import asyncio
from device_adapters import TeslaAdapter

async def main():
    # Adapter erstellen
    tesla = TeslaAdapter(
        email="ihre@email.com",
        cache_file="tesla_cache.json"
    )
    
    # Authentifizierung
    await tesla.authenticate()
    
    # Daten abrufen
    data = await tesla.fetch_data()
    print(f"🔋 SOC: {data.soc}%")
    print(f"🚗 Reichweite: {data.range_km} km")
    print(f"⚡ Lädt: {data.is_charging}")
    
    # Laden starten
    await tesla.send_command("start_charging", {})

asyncio.run(main())
```

### Beispiel: go-eCharger Wallbox

```python
from device_adapters import GoEChargerAdapter

async def main():
    async with GoEChargerAdapter(ip_address="192.168.1.100") as wallbox:
        # Daten abrufen
        data = await wallbox.fetch_data()
        print(f"⚡ Leistung: {data.power} kW")
        print(f"🔌 Status: {data.metadata['car_status_text']}")
        
        # Ladestrom auf 16A setzen
        await wallbox.send_command("set_current", {"current": 16})

asyncio.run(main())
```

### Beispiel: Tesla Powerwall

```python
from device_adapters import PowerwallAdapter

async def main():
    async with PowerwallAdapter(
        ip_address="192.168.1.100",
        password="IhrPasswort"
    ) as powerwall:
        # Daten abrufen
        data = await powerwall.fetch_data()
        print(f"🔋 SOC: {data.soc}%")
        print(f"⚡ Leistung: {data.power} kW")
        
        # Backup-Reserve auf 20% setzen
        await powerwall.send_command("set_reserve", {"percent": 20})

asyncio.run(main())
```

---

## 📚 Detaillierte Adapter-Dokumentation

### 🚗 Tesla Adapter

**Benötigt:**
- Tesla Account (Email/Passwort)
- `teslapy` Library

**Umgebungsvariablen:**
```bash
TESLA_EMAIL=ihre@email.com
```

**Unterstützte Befehle:**
```python
await tesla.send_command("start_charging", {})
await tesla.send_command("stop_charging", {})
await tesla.send_command("set_charge_limit", {"limit": 80})
await tesla.send_command("set_charging_amps", {"amps": 16})
await tesla.send_command("wake_up", {})
```

**Wichtig:** Beim ersten Start öffnet sich ein Browser für OAuth-Login. Das Token wird in `tesla_cache.json` gespeichert.

---

### 🚗 VW/Audi Adapter

**Benötigt:**
- VW We Connect / Audi myAudi Account
- `weconnect` Library

**Umgebungsvariablen:**
```bash
VW_USERNAME=ihre@email.com
VW_PASSWORD=IhrPasswort
VW_TYPE=vw  # oder 'audi', 'seat', 'skoda'
```

**Unterstützte Befehle:**
```python
await vw.send_command("start_charging", {})
await vw.send_command("stop_charging", {})
await vw.send_command("set_charge_limit", {"limit": 80})
```

---

### 🚗 BMW Adapter

**Benötigt:**
- BMW ConnectedDrive Account
- `bimmer_connected` Library

**Umgebungsvariablen:**
```bash
BMW_USERNAME=ihre@email.com
BMW_PASSWORD=IhrPasswort
BMW_REGION=rest_of_world  # oder 'north_america', 'china'
```

**Unterstützte Befehle:**
```python
await bmw.send_command("start_charging", {})
await bmw.send_command("stop_charging", {})
```

---

### ⚡ go-eCharger Adapter

**Benötigt:**
- go-eCharger im lokalen Netzwerk
- IP-Adresse

**Umgebungsvariablen:**
```bash
GOECHARGER_IP=192.168.1.100
```

**Unterstützte Befehle:**
```python
await goe.send_command("start_charging", {})
await goe.send_command("stop_charging", {})
await goe.send_command("set_current", {"current": 16})  # 6-32A
await goe.send_command("enable", {})
await goe.send_command("disable", {})
```

**API-Dokumentation:** https://github.com/goecharger/go-eCharger-API-v2

---

### ⚡ Wallbe Adapter

**Benötigt:**
- Wallbe mit Modbus TCP aktiviert
- `pymodbus` Library

**Umgebungsvariablen:**
```bash
WALLBE_IP=192.168.1.100
WALLBE_PORT=502
```

**Hinweis:** Register-Adressen müssen an Ihr Wallbe-Modell angepasst werden!

---

### ⚡ openWB Adapter

**Benötigt:**
- openWB mit MQTT aktiviert
- MQTT-Broker Zugang

**Umgebungsvariablen:**
```bash
OPENWB_MQTT_HOST=192.168.1.100
OPENWB_MQTT_PORT=1883
```

**Unterstützte Befehle:**
```python
await openwb.send_command("set_current", {"current": 16})
await openwb.send_command("enable", {})
await openwb.send_command("disable", {})
```

---

### 🔋 Tesla Powerwall Adapter

**Benötigt:**
- Tesla Powerwall 2/+ im lokalen Netzwerk
- Powerwall-Passwort (steht auf Gateway oder Email)

**Umgebungsvariablen:**
```bash
POWERWALL_IP=192.168.1.100
POWERWALL_PASSWORD=<Passwort>
```

**Unterstützte Befehle:**
```python
await powerwall.send_command("set_mode", {"mode": "self_consumption"})
# Modes: self_consumption, backup, autonomous
await powerwall.send_command("set_reserve", {"percent": 20})
```

**Hinweis:** Verwendet selbstsignierte SSL-Zertifikate!

---

### 🔋 sonnenBatterie Adapter

**Benötigt:**
- sonnenBatterie im lokalen Netzwerk
- API-Token (von sonnen Support)

**Umgebungsvariablen:**
```bash
SONNEN_IP=192.168.1.100
SONNEN_TOKEN=<API-Token>
```

**Unterstützte Befehle:**
```python
await sonnen.send_command("set_mode", {"mode": "automatic"})
# Modes: automatic, manual
```

---

### 🔋 BYD Battery-Box Adapter

**Benötigt:**
- BYD Battery-Box mit Modbus TCP
- `pymodbus` Library

**Umgebungsvariablen:**
```bash
BYD_IP=192.168.1.100
BYD_PORT=502
```

**Hinweis:** Register-Adressen müssen an Ihr BYD-Modell angepasst werden!

---

### 🌐 Generic MQTT Adapter

**Universeller Adapter für beliebige MQTT-Geräte**

```python
from device_adapters import MQTTDeviceAdapter

async def main():
    adapter = MQTTDeviceAdapter(
        device_id="my_custom_device",
        device_type="battery",
        mqtt_broker="test.mosquitto.org",
        subscribe_topics=["my/device/data"]
    )
    
    await adapter.authenticate()
    data = await adapter.fetch_data()

asyncio.run(main())
```

**Erwartet JSON-Payloads:**
```json
{
  "soc": 75.5,
  "power": 2.3,
  "voltage": 400,
  "current": 5.75,
  "is_charging": true
}
```

---

## 🔄 Integration mit EMS Backend

### MQTT Publishing aktivieren

Alle Adapter können Daten automatisch zum MQTT-Broker publishen:

```python
import paho.mqtt.client as mqtt
from device_adapters import TeslaAdapter

# MQTT-Client erstellen
mqtt_client = mqtt.Client()
mqtt_client.connect("localhost", 1883)

# Adapter mit MQTT-Client
tesla = TeslaAdapter(
    email="ihre@email.com",
    mqtt_client=mqtt_client,
    mqtt_topic_prefix="ems"
)

await tesla.authenticate()

# Daten abrufen UND via MQTT publishen
await tesla.update_and_publish()
# → Publiziert zu: ems/ev/soc, ems/ev/power, ems/ev/data
```

### Automatischer Polling-Service

Erstellen Sie einen Service, der regelmäßig Daten abruft:

```python
import asyncio
from device_adapters import TeslaAdapter, GoEChargerAdapter

async def polling_service():
    # Adapter erstellen
    tesla = TeslaAdapter(email="ihre@email.com")
    wallbox = GoEChargerAdapter(ip_address="192.168.1.100")
    
    await tesla.authenticate()
    await wallbox.authenticate()
    
    while True:
        # Daten alle 30 Sekunden abrufen
        tesla_data = await tesla.update_and_publish()
        wallbox_data = await wallbox.update_and_publish()
        
        print(f"Tesla SOC: {tesla_data.soc}%")
        print(f"Wallbox Power: {wallbox_data.power} kW")
        
        await asyncio.sleep(30)

asyncio.run(polling_service())
```

---

## 🛠️ Eigene Adapter erstellen

Erweitern Sie die `BaseDeviceAdapter` Klasse:

```python
from device_adapters.base import BaseDeviceAdapter, DeviceData
from datetime import datetime

class MyCustomAdapter(BaseDeviceAdapter):
    def __init__(self, **kwargs):
        super().__init__(
            device_id="my_device",
            device_type="battery",
            **kwargs
        )
    
    async def authenticate(self) -> bool:
        # Ihre Authentifizierungslogik
        self._is_authenticated = True
        return True
    
    async def fetch_data(self) -> DeviceData:
        # Ihre Daten-Abruf-Logik
        return DeviceData(
            device_id=self.device_id,
            device_type=self.device_type,
            timestamp=datetime.now(),
            soc=75.5,
            power=2.3
        )
    
    async def send_command(self, command: str, params: dict) -> bool:
        # Ihre Steuerungslogik
        return True
```

---

## 📊 Datenformat

Alle Adapter liefern standardisierte `DeviceData`:

```python
@dataclass
class DeviceData:
    device_id: str
    device_type: str  # 'ev', 'wallbox', 'battery'
    timestamp: datetime
    
    soc: Optional[float] = None              # State of Charge (%)
    power: Optional[float] = None            # Leistung (kW)
    voltage: Optional[float] = None          # Spannung (V)
    current: Optional[float] = None          # Strom (A)
    capacity: Optional[float] = None         # Kapazität (kWh)
    range_km: Optional[float] = None         # Reichweite (km)
    
    is_charging: Optional[bool] = None
    is_connected: Optional[bool] = None
    temperature: Optional[float] = None
    
    metadata: Optional[Dict[str, Any]] = None
```

---

## ⚠️ Wichtige Hinweise

### Rate Limiting

Viele APIs haben Rate Limits:
- **Tesla**: Max. 200 Requests/Tag
- **VW/Audi**: Max. 1 Request/30 Sekunden
- **BMW**: Max. 1 Request/60 Sekunden

**Empfehlung:** Polling-Intervall **≥ 60 Sekunden**

### Sicherheit

- **Niemals API-Keys/Passwörter im Code hardcoden!**
- Verwenden Sie Umgebungsvariablen oder `.env`-Dateien
- Für Produktion: Nutzen Sie Secrets Manager (z.B. Replit Secrets)

### Fehlerbehandlung

Alle Adapter implementieren automatisches Retry:

```python
try:
    data = await adapter.fetch_data()
except Exception as e:
    logger.error(f"Fehler: {e}")
    # Adapter versucht automatisch erneute Authentifizierung
```

---

## 🔗 Integration mit Backend

### FastAPI Endpoint erstellen

```python
from fastapi import FastAPI
from device_adapters import TeslaAdapter

app = FastAPI()
tesla = TeslaAdapter(email="ihre@email.com")

@app.on_event("startup")
async def startup():
    await tesla.authenticate()

@app.get("/ev/data")
async def get_ev_data():
    data = await tesla.fetch_data()
    return data.to_dict()

@app.post("/ev/charge/start")
async def start_charging():
    success = await tesla.send_command("start_charging", {})
    return {"success": success}
```

---

## 📞 Support

Bei Problemen:
1. Prüfen Sie die Logs: `logger.setLevel(logging.DEBUG)`
2. Testen Sie die Verbindung: `await adapter.get_status()`
3. Überprüfen Sie Firewall/Netzwerk-Einstellungen

---

**Entwickelt für das AI-basierte Energiemanagementsystem (EMS)** 🌱⚡
