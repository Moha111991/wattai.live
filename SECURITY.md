# 🔒 Security Report - EMS Mobile App & Backend

**Status:** 🟢 **PRODUCTION READY mit optionaler Authentifizierung**  
**Datum:** 9. November 2025  
**Letztes Update:** 9. November 2025

---

## ✅ IMPLEMENTIERTE SECURITY-FEATURES

### 1. **Input Validation mit Pydantic Validators** (Status: ✅ IMPLEMENTED)

**Implementierung:**  
Alle API-Endpunkte verwenden umfassende Input-Validierung:

```python
class SOCData(BaseModel):
    device: str
    soc: float
    
    @validator('device')
    def validate_device(cls, v):
        allowed = ['ev', 'home_battery']
        if v not in allowed:
            raise ValueError(f'Device must be one of {allowed}')
        return v
    
    @validator('soc')
    def validate_soc(cls, v):
        if not 0 <= v <= 100:
            raise ValueError('SOC must be between 0 and 100')
        return v
```

**Geschützte Werte:**
- ✅ SOC: 0-100% (Bounds-Check)
- ✅ Device: Whitelist ['ev', 'home_battery']
- ✅ Commands: Whitelist ['start_charging', 'stop_charging', etc.]
- ✅ Power: Non-negative
- ✅ Hour: 0-23

**Test:**
```bash
curl -X POST http://localhost:8001/update_soc \
  -H "Content-Type: application/json" \
  -d '{"device": "ev", "soc": 150}'
# Response: 422 Unprocessable Entity
# {"detail":[{"msg":"Value error, SOC must be between 0 and 100"}]}
```

---

### 2. **Rate Limiting** (Status: ✅ IMPLEMENTED)

**Implementierung:**  
Slowapi-basiertes Rate Limiting für alle kritischen Endpunkte:

```python
@app.post("/control")
@limiter.limit("10/minute")
async def send_control_command(request: Request, command: ControlCommand):
    ...
```

**Limits:**
- `/update_soc`: 60 Requests/Minute
- `/ai/decision`: 20 Requests/Minute
- `/control`: **10 Requests/Minute** (KRITISCH)
- `/ai/optimize`: 5 Requests/Minute

**Test:**
```bash
# Nach 10 Requests innerhalb 1 Minute:
# Response: 429 Too Many Requests
```

---

### 3. **CORS-Einschränkung** (Status: ✅ IMPLEMENTED)

**Implementierung:**
```python
origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "capacitor://localhost",
    os.getenv("ALLOWED_ORIGIN", "http://localhost:*"),
]

# Development-Modus (optional):
if os.getenv("DEV_MODE", "true").lower() == "true":
    origins.append("*")
```

**Production:** Nur bekannte Origins erlaubt  
**Development:** `DEV_MODE=true` erlaubt alle Origins (`*`)

---

### 4. **Optionale API-Key-Authentifizierung** (Status: ✅ IMPLEMENTED)

**Implementierung:**
```python
API_KEY_ENABLED = os.getenv("API_KEY_ENABLED", "false").lower() == "true"
API_KEY = os.getenv("EMS_API_KEY", "")

# Fail-Fast: Fehler wenn API_KEY_ENABLED=true aber kein Key gesetzt
if API_KEY_ENABLED and not API_KEY:
    raise RuntimeError(
        "⚠️ SECURITY ERROR: API_KEY_ENABLED=true but EMS_API_KEY is not set!"
    )

async def verify_api_key(x_api_key: str = Header(None)):
    if not API_KEY_ENABLED:
        return True  # Auth disabled
    
    if not x_api_key or x_api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API Key")
    return True
```

**Geschützte Endpunkte:**
- ✅ `/update_soc` (SOC-Manipulation)
- ✅ `/control` (Steuerungsbefehle)
- ✅ WebSocket `/ws` (Echtzeit-Daten)

**Nutzung:**
```bash
# Mit API-Key:
export API_KEY_ENABLED=true
export EMS_API_KEY=your-secret-key-here

# Request mit API-Key:
curl -X POST http://localhost:8001/control \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secret-key-here" \
  -d '{"device_type": "ev", "command": "start_charging"}'
```

---

### 5. **WebSocket-Authentifizierung** (Status: ✅ IMPLEMENTED)

**Implementierung:**
```python
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    if API_KEY_ENABLED:
        api_key = ws.query_params.get("x_api_key")
        if not api_key or api_key != API_KEY:
            await ws.close(code=1008, reason="Unauthorized")
            return
    
    await ws.accept()
    ...
```

**Mobile App Integration:**
```javascript
// WebSocket mit API-Key
const apiKey = await SecureStore.getItemAsync('ems_api_key');
const ws = new WebSocket(`ws://backend-url/ws?x_api_key=${apiKey}`);
```

---

## 🔐 SICHERHEITSZUSTAND

### ✅ SICHER (mit empfohlener Konfiguration)

**Development-Modus (Standard):**
- ✅ Input Validation aktiv
- ✅ Rate Limiting aktiv
- ⚠️ CORS: `*` (alle Origins)
- ⚠️ Keine API-Key-Auth
- **Geeignet für:** Lokale Entwicklung, Testing

**Production-Modus (empfohlen):**
```bash
export DEV_MODE=false
export API_KEY_ENABLED=true
export EMS_API_KEY=<strong-random-key>
export ALLOWED_ORIGIN=https://your-domain.com
```
- ✅ Input Validation aktiv
- ✅ Rate Limiting aktiv
- ✅ CORS: Nur bekannte Origins
- ✅ API-Key-Auth aktiv
- **Geeignet für:** Production-Deployment

---

## 🚀 PRODUCTION DEPLOYMENT CHECKLISTE

### 1. Environment Variables setzen

```bash
# ERFORDERLICH für Production:
export DEV_MODE=false
export API_KEY_ENABLED=true
export EMS_API_KEY=$(openssl rand -hex 32)  # Starker zufälliger Key
export ALLOWED_ORIGIN=https://your-domain.com

# Optional:
export PORT=8001
```

---

### 2. HTTPS/TLS konfigurieren

**Option A: Reverse Proxy (empfohlen)**
```nginx
server {
    listen 443 ssl http2;
    server_name ems.your-domain.com;
    
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    
    location / {
    proxy_pass http://localhost:8001;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
    }
    
    location /ws {
    proxy_pass http://localhost:8001/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Option B: Uvicorn mit TLS**
```bash
uvicorn backend.main:app \
  --host 0.0.0.0 \
  --port 8001 \
  --ssl-keyfile=/path/to/privkey.pem \
  --ssl-certfile=/path/to/fullchain.pem
```

---

### 3. Firewall-Regeln

```bash
# Nur lokales Netzwerk erlauben (Heimnetzwerk):
sudo ufw allow from 192.168.0.0/16 to any port 8001
sudo ufw deny 8001

# Oder spezifische IP-Adressen:
sudo ufw allow from 192.168.1.100 to any port 8001
```

---

### 4. MQTT-Broker Sicherheit

```bash
# TLS-Zertifikate generieren:
cd deployment/mqtt-broker
./generate-certs.sh

# Broker starten mit TLS + Auth:
docker-compose up -d
```

**MQTT-Konfiguration:**
- ✅ TLS/SSL aktiviert
- ✅ Passwort-Authentifizierung
- ✅ ACL-basierte Zugriffskontrolle

---

### 5. Mobile App konfigurieren

**API-Key sicher speichern:**
```javascript
import * as SecureStore from 'expo-secure-store';

// API-Key speichern (einmalig beim Setup):
await SecureStore.setItemAsync('ems_api_key', apiKey);

// In api.js:
const apiKey = await SecureStore.getItemAsync('ems_api_key');
const headers = apiKey ? { 'X-API-Key': apiKey } : {};
```

---

## 📊 TEST-PROTOKOLL

### ✅ Input Validation Tests

| Test | Input | Expected | Result |
|------|-------|----------|--------|
| SOC > 100 | `{"device": "ev", "soc": 150}` | 422 Error | ✅ PASS |
| SOC < 0 | `{"device": "ev", "soc": -10}` | 422 Error | ✅ PASS |
| Invalid Device | `{"device": "invalid", "soc": 50}` | 422 Error | ✅ PASS |
| Invalid Command | `{"device_type": "ev", "command": "hack"}` | 422 Error | ✅ PASS |
| Valid SOC | `{"device": "ev", "soc": 75.5}` | 200 OK | ✅ PASS |

### ✅ Rate Limiting Tests

| Test | Requests | Expected | Result |
|------|----------|----------|--------|
| /control | 10 Requests | 200 OK | ✅ PASS |
| /control | 11. Request | 429 Too Many | ✅ PASS |

### ✅ Integration Tests

| Test | Status | Notes |
|------|--------|-------|
| MQTT-Bridge → FastAPI | ✅ PASS | SOC-Updates funktionieren |
| WebSocket /ws | ✅ PASS | Echtzeit-Updates funktionieren |
| Streamlit Dashboard | ✅ PASS | SOC-Anzeige aktualisiert |
| Device Simulator | ✅ PASS | Sendet SOC-Werte |

---

## ⚠️ BEKANNTE EINSCHRÄNKUNGEN

### 1. API-Key-Authentifizierung ist optional

**Aktuell:**  
- Standardmäßig `API_KEY_ENABLED=false` (keine Auth)
- Muss manuell für Production aktiviert werden

**Empfehlung:**  
- Für Production **IMMER** `API_KEY_ENABLED=true` setzen
- Für Heimnetzwerk: Firewall-Regeln ausreichend
- Für öffentliche Deployment: API-Key + HTTPS erforderlich

---

### 2. Keine JWT-basierte User-Auth

**Aktuell:**  
- Nur ein globaler API-Key
- Keine User-spezifischen Tokens
- Keine Rollen-basierte Zugriffskontrolle

**Zukünftige Erweiterung:**  
- JWT-Tokens für Mobile App
- Multi-User-Support
- Role-Based Access Control (RBAC)

---

### 3. WebSocket-API-Key über Query-Parameter

**Aktuell:**  
```javascript
ws://backend/ws?x_api_key=<key>
```

**Limitation:**  
- API-Key in URL sichtbar (Logs, Browser-History)

**Alternative (zukünftig):**  
- WebSocket-Header (nicht alle Clients unterstützen dies)
- Initial-Handshake mit Auth-Token

---

## 📚 WEITERE RESSOURCEN

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [FastAPI Security Best Practices](https://fastapi.tiangolo.com/tutorial/security/)
- [Expo SecureStore Docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Let's Encrypt (kostenlose TLS-Zertifikate)](https://letsencrypt.org/)

---

## 🔄 CHANGELOG

### 2025-11-09 - Initial Security Implementation
- ✅ Input Validation mit Pydantic Validators
- ✅ Rate Limiting mit slowapi
- ✅ CORS-Einschränkung (DEV_MODE toggle)
- ✅ Optionale API-Key-Authentifizierung
- ✅ WebSocket-Authentifizierung
- ✅ Fail-Fast für fehlende API-Keys
- ✅ Security-Tests durchgeführt
