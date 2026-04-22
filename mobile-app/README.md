# 📱 EMS Mobile App

**React Native / Expo Mobile App** für das AI-basierte Energiemanagementsystem (EMS).

Ermöglicht Echtzeit-Monitoring und Steuerung Ihres Energiesystems von überall!

---

## 🌟 Features

### 🚀 Intelligentes Onboarding (NEU!)
- **Automatische Backend-Erkennung** via Netzwerk-Scan
- **Subnet-basierte Priorisierung** (FritzBox, Heimnetzwerke)
- **QR-Code Scanner** für schnelles Setup
- **Manuelle Eingabe** als Fallback
- **Keine Code-Änderungen** erforderlich!

### ⚡ Dashboard
- **Echtzeit-SOC Anzeige** für E-Auto und Heim-Batterie
- **Kreisförmige Gauges** mit farbcodiertem Status (grün/gelb/orange/rot)
- **Live-Datenaktualisierung** via WebSocket (alle 3 Sekunden)
- **Geschätzte Reichweite** und Kapazität
- **Verbindungsstatus-Anzeige**

### 🎮 Steuerung
- **Auto-Modus** mit AI-Empfehlungen (DQN/PPO Agent)
- **Manueller Modus:**
  - Laden starten/stoppen
  - Ladegrenze einstellen (20-100%)
  - Ladeleistung anpassen (3.7-11 kW)
- **Schnellaktionen:**
  - 🌿 Eco-Modus (3.7 kW, 80%)
  - 🚀 Schnell-Modus (11 kW, 100%)
  - ☀️ Solar-Modus (nur PV, 90%)

### 📊 Verlauf
- **Live-Graphen** für EV und Batterie SOC
- **Statistiken:** Durchschnitt, Minimum, Maximum
- **Letzte 50 Messwerte** in Echtzeit

### ⚙️ Einstellungen
- **Backend-URL konfigurieren**
- **WebSocket-URL anpassen**
- **Verbindung testen**
- **Push-Benachrichtigungen aktivieren/deaktivieren**
- **System-Info** (App-Version, Verbindungsstatus)

### 🔔 Push-Benachrichtigungen
- 🔋 Laden abgeschlossen
- ⚠️ Batterie niedrig (EV/Heim)
- ☀️ PV-Überschuss verfügbar
- 💰 Günstige Strompreise
- 🤖 AI-Empfehlungen

---

## 🚀 Installation & Setup

### Voraussetzungen

- **Node.js** (v18+)
- **npm** oder **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **Expo Go App** auf Ihrem Smartphone (iOS/Android)

### 1. Dependencies installieren

```bash
cd mobile-app
npm install
```

### 2. App starten

**Keine Code-Änderungen nötig!** Die App konfiguriert sich automatisch beim ersten Start.

```bash
npm start
```

Dies öffnet Expo DevTools im Browser. Sie sehen einen QR-Code.

### 3. Backend konfigurieren (beim ersten Start)

Die App zeigt beim ersten Start einen **Onboarding-Screen** mit 3 Optionen:

**Option A: Automatische Erkennung (empfohlen)**
1. "🔍 Automatisch finden (Vollscan)" tippen
2. App scannt Ihr lokales Netzwerk (~5-10 Sekunden)
3. Backend wird automatisch gefunden und gespeichert
4. ✅ Fertig!

**Option B: Manuelle Eingabe**
1. Backend-IP eingeben (z.B. `192.168.178.100:8001`)
2. "🔌 Verbinden" tippen
3. App testet Verbindung und speichert

**Option C: QR-Code scannen**
1. QR-Code mit Backend-URL scannen
2. App verbindet automatisch

**So finden Sie Ihre Backend-IP (nur für Option B):**
```bash
# Auf dem Backend-Server ausführen:
hostname -I  # Linux
ipconfig     # Windows
ifconfig     # macOS
```

### 4. App auf Smartphone öffnen

```bash
npm start
```

Dies öffnet Expo DevTools im Browser. Sie sehen einen QR-Code.

**iOS:**
1. **Expo Go** aus dem App Store installieren
2. Kamera-App öffnen
3. Expo QR-Code scannen
4. Link öffnet Expo Go automatisch

**Android:**
1. **Expo Go** aus dem Play Store installieren
2. Expo Go öffnen
3. "Scan QR Code" tippen
4. Expo QR-Code scannen

**Alternative (ohne QR-Code):**
```bash
npm run android  # Android-Emulator
npm run ios      # iOS-Simulator (nur macOS)
```

---

## 📂 Projektstruktur

```
mobile-app/
├── App.js                      # Haupt-App mit Navigation
├── app.json                    # Expo-Konfiguration
├── package.json                # Dependencies
│
├── src/
│   ├── screens/                # Haupt-Bildschirme
│   │   ├── DashboardScreen.js  # ⚡ Echtzeit-SOC
│   │   ├── ControlScreen.js    # 🎮 Steuerung
│   │   ├── HistoryScreen.js    # 📊 Verlauf
│   │   └── SettingsScreen.js   # ⚙️ Einstellungen
│   │
│   ├── components/             # Wiederverwendbare Komponenten
│   │   ├── SOCGauge.js         # Kreisförmige Gauge
│   │   └── LiveChart.js        # Live-Verlaufsdiagramm
│   │
│   └── services/               # Backend-Integration
│       ├── websocket.js        # WebSocket-Client
│       ├── api.js              # REST API
│       └── notifications.js    # Push-Benachrichtigungen
│
└── assets/                     # Bilder, Icons, Splash
```

---

## 🔧 Konfiguration

### Backend-URL zur Laufzeit ändern

Die App erlaubt die Backend-URL in den **Einstellungen** zu ändern:

1. **Einstellungen**-Tab öffnen
2. **Backend URL** eingeben (z.B. `http://192.168.1.100:8001`)
3. **WebSocket URL** eingeben (z.B. `ws://192.168.1.100:8001/ws`)
4. **"URLs speichern"** tippen
5. **"WebSocket neu verbinden"** tippen
6. **"Verbindung testen"** tippen zur Überprüfung

### Push-Benachrichtigungen aktivieren

Die App fragt beim ersten Start nach Berechtigung für Push-Notifications. Falls Sie diese abgelehnt haben:

1. **Smartphone-Einstellungen** öffnen
2. **Apps → EMS Mobile** suchen
3. **Benachrichtigungen** aktivieren

---

## 🧪 Testing

### Mit echtem Backend

```bash
# Backend muss laufen (Terminal 1)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8001

# MQTT-Bridge muss laufen (Terminal 2)
python backend/mqtt_to_ws.py

# Mobile App starten (Terminal 3)
cd mobile-app
npm start
```

### Mit Simulator

```bash
# Device-Simulator für Test-Daten
python simulator/device_simulator.py
```

---

## 🎨 Customization

### Farben ändern

In den Screen-Dateien (`src/screens/*.js`) können Sie Farben anpassen:

```javascript
// Beispiel: DashboardScreen.js
const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',  // Hintergrundfarbe
  },
  // ...
});
```

### Themes

Die App unterstützt automatisch **Dark Mode** (basierend auf System-Einstellung). 

Um Light Mode zu erzwingen, ändern Sie in `app.json`:
```json
{
  "expo": {
    "userInterfaceStyle": "light"  // oder "dark" oder "automatic"
  }
}
```

---

## 📱 Build für Production

### Android APK

```bash
expo build:android
```

### iOS IPA (nur macOS)

```bash
expo build:ios
```

### Expo EAS Build (empfohlen)

```bash
# EAS CLI installieren
npm install -g eas-cli

# Login
eas login

# Build konfigurieren
eas build:configure

# Android Build
eas build --platform android

# iOS Build
eas build --platform ios
```

---

## 🐛 Troubleshooting

### Problem: "Unable to connect to backend"

**Lösung:**
1. Überprüfen Sie, ob Backend läuft: `http://YOUR_IP:8001`
2. Stellen Sie sicher, dass Smartphone im **gleichen WLAN** ist
3. Firewall-Regel für Port 8001 hinzufügen
4. Backend-URL in Einstellungen korrigieren

### Problem: WebSocket verbindet nicht

**Lösung:**
1. WebSocket-URL prüfen: `ws://YOUR_IP:8001/ws` (nicht `wss://`)
2. Backend-Logs prüfen: `journalctl -u ems-backend -f`
3. In Einstellungen "WebSocket neu verbinden" tippen

### Problem: Push-Notifications funktionieren nicht

**Lösung:**
1. Berechtigungen prüfen (Smartphone-Einstellungen → Apps → EMS Mobile)
2. In App-Einstellungen Push-Benachrichtigungen aktivieren
3. App neu starten

### Problem: Gauges zeigen 0%

**Lösung:**
1. Prüfen Sie, ob MQTT-Bridge läuft: `systemctl status ems-mqtt-bridge`
2. Prüfen Sie, ob Device-Simulator Daten sendet
3. In Dashboard "Pull-to-Refresh" durchführen

---

## 🔒 Sicherheit

### Produktion-Tipps

1. **HTTPS verwenden** statt HTTP:
   ```javascript
   const BASE_URL = 'https://your-domain.com';
   ```

2. **WebSocket Secure (WSS):**
   ```javascript
   websocketService.connect('wss://your-domain.com/ws');
   ```

3. **Authentifizierung hinzufügen:**
   - JWT-Tokens im Header senden
   - OAuth2 für Login implementieren

4. **SSL-Zertifikat** auf Backend installieren (Let's Encrypt)

---

## 📚 Weitere Dokumentation

- **Expo Docs:** https://docs.expo.dev/
- **React Native:** https://reactnative.dev/
- **EMS Backend API:** http://YOUR_IP:8001/docs

---

## 🤝 Support

Bei Problemen:
1. Logs prüfen: `expo logs`
2. Backend-Status prüfen: `http://YOUR_IP:8001/ai/status`
3. WebSocket-Verbindung testen (Browser Dev Tools)

---

**Entwickelt für iOS & Android** | **Powered by Expo & React Native** 📱⚡
