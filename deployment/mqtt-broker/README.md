# 🔒 Sicherer MQTT-Broker für EMS (Energiemanagementsystem)

Produktionsreifer MQTT-Broker mit **Authentifizierung**, **TLS-Verschlüsselung** und **Zugriffsrechten** für Ihr Energiemanagementsystem.

## 📋 Inhaltsverzeichnis

- [Features](#features)
- [Schnellstart](#schnellstart)
- [Detaillierte Einrichtung](#detaillierte-einrichtung)
- [Sicherheit](#sicherheit)
- [Verwendung](#verwendung)
- [Fehlerbehebung](#fehlerbehebung)

---

## ✨ Features

- **🔐 Passwort-Authentifizierung**: Keine anonymen Verbindungen
- **🔒 TLS-Verschlüsselung**: Sichere Kommunikation über Port 8883 und 9002
- **🎯 Zugriffsrechte (ACL)**: Feinkörnige Berechtigungen pro Benutzer
- **🌐 WebSocket-Support**: Für Browser und Mobile Apps (Ports 9001/9002)
- **💾 Persistenz**: Nachrichten bleiben bei Neustart erhalten
- **🐳 Docker**: Einfaches Deployment mit Docker Compose
- **📊 Health Checks**: Automatische Überwachung

---

## 🚀 Schnellstart

### Voraussetzungen

- Docker & Docker Compose
- OpenSSL (für Zertifikate)
- mosquitto-clients (optional, für Tests)

### 3-Schritte Installation

```bash
# 1. Benutzerkonten erstellen
chmod +x setup-passwords.sh
./setup-passwords.sh

# 2. TLS-Zertifikate generieren
chmod +x generate-certs.sh
./generate-certs.sh

# 3. MQTT-Broker starten
docker-compose up -d
```

**Fertig!** 🎉 Ihr MQTT-Broker läuft jetzt.

---

## 📖 Detaillierte Einrichtung

### Schritt 1: Passwörter einrichten

```bash
./setup-passwords.sh
```

Das Skript erstellt folgende Standard-Benutzer:

| Benutzer | Beschreibung | Berechtigungen |
|----------|--------------|----------------|
| `admin` | Administrator | Voller Zugriff auf alle Topics |
| `ems_backend` | EMS Backend-System | Lesen/Schreiben auf `ems/#` und `control/#` |
| `ev_device` | E-Auto | Schreiben: `ems/ev/*`, Lesen: `control/ev/#` |
| `battery_device` | Heimspeicher | Schreiben: `ems/home_battery/*`, Lesen: `control/battery/#` |
| `wallbox_device` | Wallbox | Schreiben: `ems/wallbox/*`, Lesen: `control/wallbox/#` |
| `pv_device` | PV-Anlage | Schreiben: `ems/pv/*` |
| `heatpump_device` | Wärmepumpe | Schreiben: `ems/heatpump/*`, Lesen: `control/heatpump/#` |
| `mobile_app` | Mobile App | Lesen: `ems/#`, Schreiben: `control/#` |

**Zugangsdaten werden gespeichert in:** `config/.env.mqtt`

### Schritt 2: TLS-Zertifikate generieren

```bash
./generate-certs.sh
```

Folgen Sie den Anweisungen:
- **Hostname**: IP oder Domain Ihres Servers (z.B. `192.168.1.100` oder `mqtt.ihredomain.de`)
- **Organisation**: Name Ihrer Firma/Projekts
- **Land**: DE (Deutschland)

**Hinweis für Produktion**: Verwenden Sie Let's Encrypt statt selbstsignierter Zertifikate:

```bash
# Let's Encrypt mit Certbot
sudo certbot certonly --standalone -d mqtt.ihredomain.de

# Zertifikate nach ./certs kopieren
sudo cp /etc/letsencrypt/live/mqtt.ihredomain.de/fullchain.pem ./certs/server.crt
sudo cp /etc/letsencrypt/live/mqtt.ihredomain.de/privkey.pem ./certs/server.key
sudo cp /etc/letsencrypt/live/mqtt.ihredomain.de/chain.pem ./certs/ca.crt
```

### Schritt 3: Broker starten

```bash
# Broker starten
docker-compose up -d

# Logs anschauen
docker-compose logs -f mosquitto

# Status prüfen
docker-compose ps
```

---

## 🔒 Sicherheit

### Ports

| Port | Protokoll | Verschlüsselt | Verwendung |
|------|-----------|---------------|------------|
| 1883 | MQTT | ❌ Nein | **Nur für lokale Tests!** |
| 8883 | MQTT | ✅ TLS | **Produktion** - IoT-Geräte |
| 9001 | WebSocket | ❌ Nein | **Nur für lokale Tests!** |
| 9002 | WebSocket | ✅ TLS | **Produktion** - Browser/Apps |

### Firewall-Regeln (Empfohlen)

```bash
# Erlaube nur sichere Ports von außen
sudo ufw allow 8883/tcp comment 'MQTT TLS'
sudo ufw allow 9002/tcp comment 'MQTT WebSocket TLS'

# Blockiere unsichere Ports (nur lokal verfügbar)
sudo ufw deny 1883/tcp comment 'MQTT Plain - nur lokal'
sudo ufw deny 9001/tcp comment 'MQTT WS - nur lokal'
```

### Best Practices

✅ **Verwenden Sie starke Passwörter**: Mindestens 16 Zeichen  
✅ **TLS aktivieren**: Nur Ports 8883 und 9002 für externe Verbindungen  
✅ **ACL konfigurieren**: Minimale Berechtigungen pro Benutzer  
✅ **Regelmäßige Updates**: `docker-compose pull && docker-compose up -d`  
✅ **Backup**: Sichern Sie `config/` und `certs/` Verzeichnisse  

---

## 💻 Verwendung

### Verbindung testen

#### 1. Mit mosquitto_sub (Unverschlüsselt - nur lokal)

```bash
# Laden Sie die Zugangsdaten
source config/.env.mqtt

# Nachrichten empfangen
mosquitto_sub -h localhost -p 1883 \
  -u $MQTT_ADMIN_USER -P "$MQTT_ADMIN_PASSWORD" \
  -t "ems/#" -v
```

#### 2. Mit TLS (Produktion)

```bash
mosquitto_sub -h IHRE_IP_ODER_DOMAIN -p 8883 \
  --cafile certs/ca.crt \
  -u admin -P "IHR_PASSWORT" \
  -t "ems/#" -v
```

#### 3. Nachricht senden

```bash
mosquitto_pub -h localhost -p 8883 \
  --cafile certs/ca.crt \
  -u ev_device -P "EV_PASSWORT" \
  -t "ems/ev/soc" \
  -m '{"device": "ev", "soc": 75.5}'
```

### Python-Integration

```python
import paho.mqtt.client as mqtt
import json
import ssl

# MQTT-Verbindung mit TLS
client = mqtt.Client()

# Zugangsdaten
client.username_pw_set("ev_device", "IHR_PASSWORT")

# TLS konfigurieren
client.tls_set(
    ca_certs="certs/ca.crt",
    tls_version=ssl.PROTOCOL_TLSv1_2
)

# Verbinden
client.connect("IHRE_IP", 8883, 60)

# SOC senden
payload = {"device": "ev", "soc": 65.0}
client.publish("ems/ev/soc", json.dumps(payload))

client.disconnect()
```

### JavaScript/Node.js Integration

```javascript
const mqtt = require('mqtt');
const fs = require('fs');

const options = {
  host: 'IHRE_IP',
  port: 8883,
  protocol: 'mqtts',
  username: 'mobile_app',
  password: 'IHR_PASSWORT',
  ca: fs.readFileSync('certs/ca.crt'),
  rejectUnauthorized: true
};

const client = mqtt.connect(options);

client.on('connect', () => {
  console.log('✅ Verbunden mit MQTT-Broker');
  
  // Alle EMS-Daten abonnieren
  client.subscribe('ems/#', (err) => {
    if (!err) {
      console.log('📡 Subscribed zu ems/#');
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`📨 ${topic}: ${message.toString()}`);
});
```

---

## 🛠️ Fehlerbehebung

### Problem: "Connection refused"

**Lösung**: Prüfen Sie ob der Broker läuft:

```bash
docker-compose ps
docker-compose logs mosquitto
```

### Problem: "Authentication failed"

**Lösung**: Prüfen Sie Benutzername und Passwort:

```bash
# Passwörter anzeigen
cat config/.env.mqtt

# Neues Passwort setzen
docker-compose exec mosquitto mosquitto_passwd /mosquitto/config/passwords.txt admin
```

### Problem: "Certificate verify failed"

**Lösung**: Verwenden Sie das korrekte CA-Zertifikat:

```bash
# Zertifikat-Details prüfen
openssl x509 -in certs/server.crt -text -noout

# Für selbstsignierte Zertifikate: Hostname muss übereinstimmen!
```

### Problem: "Access denied"

**Lösung**: Prüfen Sie die ACL-Berechtigungen:

```bash
# ACL-Datei bearbeiten
nano config/acl.conf

# Broker neu starten
docker-compose restart mosquitto
```

### Logs anzeigen

```bash
# Alle Logs
docker-compose logs -f

# Nur Fehler
docker-compose logs mosquitto | grep -i error
```

---

## 📊 Topic-Struktur

### Daten-Topics (Geräte → Backend)

```
ems/
├── ev/
│   ├── soc              (State of Charge %)
│   ├── charging_power   (kW)
│   └── range            (km)
├── home_battery/
│   ├── soc              (%)
│   ├── power            (kW, negativ = Laden)
│   └── voltage          (V)
├── wallbox/
│   ├── power            (kW)
│   ├── current          (A)
│   └── status           (charging/idle/error)
├── pv/
│   ├── power            (kW)
│   ├── voltage          (V)
│   └── current          (A)
└── heatpump/
    ├── power            (kW)
    ├── cop              (Coefficient of Performance)
    └── status           (on/off)
```

### Steuerungs-Topics (Backend → Geräte)

```
control/
├── ev/
│   ├── charge_enable    (true/false)
│   └── charge_rate      (kW)
├── battery/
│   ├── charge_enable    (true/false)
│   └── discharge_enable (true/false)
├── wallbox/
│   ├── enable           (true/false)
│   └── current_limit    (A)
└── heatpump/
    └── enable           (true/false)
```

---

## 🚀 Deployment-Optionen

### Option 1: Raspberry Pi (Edge Computing)

```bash
# 1. Raspberry Pi OS installieren
# 2. Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Dieses Verzeichnis kopieren
scp -r deployment/mqtt-broker pi@192.168.1.100:~/

# 4. Auf dem Pi starten
ssh pi@192.168.1.100
cd mqtt-broker
./setup-passwords.sh
./generate-certs.sh
docker-compose up -d
```

### Option 2: VPS/Cloud-Server

```bash
# 1. Server mieten (z.B. Hetzner, DigitalOcean)
# 2. Docker installieren
# 3. Firewall konfigurieren
ufw allow 8883/tcp
ufw allow 9002/tcp
ufw enable

# 4. Let's Encrypt Zertifikate
certbot certonly --standalone -d mqtt.ihredomain.de

# 5. Broker starten
docker-compose up -d
```

### Option 3: Home-Server

Lokaler Server im Heimnetzwerk mit Port-Forwarding:

```bash
# Router-Einstellungen:
# Port 8883 → <SERVER-IP>:8883
# Port 9002 → <SERVER-IP>:9002

# DynDNS einrichten (z.B. No-IP, DuckDNS)
# Dann Zertifikate mit Let's Encrypt
```

---

## 📚 Weitere Ressourcen

- [MQTT Dokumentation](https://mqtt.org/documentation)
- [Eclipse Mosquitto](https://mosquitto.org/)
- [Paho MQTT Client](https://www.eclipse.org/paho/)
- [Let's Encrypt](https://letsencrypt.org/)

---

## 📞 Support

Bei Fragen oder Problemen:
- Prüfen Sie die [Fehlerbehebung](#fehlerbehebung)
- Schauen Sie in die Logs: `docker-compose logs -f`
- Testen Sie die Verbindung: `mosquitto_sub -h localhost -p 1883 -t test -v`

---

**Entwickelt für das AI-basierte Energiemanagementsystem (EMS)** 🌱⚡
