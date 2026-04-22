# 🔐 Nginx HTTPS/TLS Setup für EMS Backend

**Purpose:** Production-ready HTTPS/TLS Reverse Proxy für FastAPI Backend

**Features:**
- ✅ TLS 1.3 Only (höchste Sicherheit)
- ✅ Let's Encrypt Zertifikate
- ✅ HSTS (HTTP Strict Transport Security)
- ✅ Security Headers (CSP, X-Frame-Options, etc.)
- ✅ WebSocket over TLS Support
- ✅ Automatisches HTTP → HTTPS Redirect
- ✅ OCSP Stapling
- ✅ Rate Limiting
- ✅ Gzip Compression

---

## 🚀 QUICK START (Production Deployment)

### Schritt 1: Domain & DNS konfigurieren

Erstelle einen DNS A-Record für deine Domain:

```bash
ems.yourdomain.com → 123.456.789.100 (deine Server-IP)
```

**Test DNS:**
```bash
nslookup ems.yourdomain.com
# Sollte deine Server-IP zurückgeben
```

---

### Schritt 2: Nginx installieren

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

### Schritt 3: Certbot (Let's Encrypt) installieren

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

---

### Schritt 4: Nginx Config kopieren

```bash
# Config kopieren
sudo cp deployment/nginx/ems-backend.conf /etc/nginx/sites-available/

# Domain anpassen (WICHTIG!)
sudo nano /etc/nginx/sites-available/ems-backend.conf
# Ersetze "ems.yourdomain.com" mit deiner Domain

# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/ems-backend.conf /etc/nginx/sites-enabled/

# Test Config
sudo nginx -t
```

---

### Schritt 5: Let's Encrypt Zertifikate generieren

```bash
# Certbot ausführen (interaktiv)
sudo certbot --nginx -d ems.yourdomain.com

# Folge den Anweisungen:
# 1. E-Mail-Adresse eingeben
# 2. Terms of Service akzeptieren
# 3. Zertifikat wird automatisch konfiguriert
```

**Certbot übernimmt automatisch:**
- ✅ Zertifikat-Generierung
- ✅ Nginx-Config-Anpassung
- ✅ Automatisches Renewal (Cron-Job)

---

### Schritt 6: Nginx starten

```bash
# Nginx neu laden
sudo systemctl reload nginx

# Status prüfen
sudo systemctl status nginx

# Logs checken
sudo tail -f /var/log/nginx/ems-backend-access.log
sudo tail -f /var/log/nginx/ems-backend-error.log
```

---

### Schritt 7: Backend starten

```bash
# FastAPI Backend muss auf Port 8001 laufen
uvicorn backend.main:app --host 0.0.0.0 --port 8001

# In Production: Systemd Service verwenden
sudo cp deployment/systemd/ems-backend.service /etc/systemd/system/
sudo systemctl enable ems-backend
sudo systemctl start ems-backend
```

---

## 🧪 TESTING

### Test 1: HTTP → HTTPS Redirect

```bash
curl -I http://ems.yourdomain.com
# Sollte 301 Redirect zu https:// zeigen
```

### Test 2: HTTPS/TLS

```bash
curl https://ems.yourdomain.com
# Sollte JSON-Response zurückgeben
```

### Test 3: SSL/TLS Details

```bash
openssl s_client -connect ems.yourdomain.com:443 -tls1_3
# Sollte TLS 1.3 Connection zeigen
```

### Test 4: SSL Labs Test

Öffne: https://www.ssllabs.com/ssltest/analyze.html?d=ems.yourdomain.com

**Erwartete Bewertung:** A+ (mit TLS 1.3, HSTS, OCSP Stapling)

### Test 5: WebSocket

```bash
# Browser Console:
const ws = new WebSocket('wss://ems.yourdomain.com/ws');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

---

## 🔄 AUTOMATIC CERTIFICATE RENEWAL

Certbot erstellt automatisch einen Cron-Job für Renewal:

```bash
# Test Renewal (Dry-Run)
sudo certbot renew --dry-run

# Renewal Status prüfen
sudo systemctl status certbot.timer

# Manuelles Renewal (falls nötig)
sudo certbot renew
```

**Certbot erneuert automatisch alle Zertifikate 30 Tage vor Ablauf!**

---

## 🛡️ SECURITY HARDENING

### Firewall (UFW)

```bash
# Nur HTTPS erlauben (Port 443)
sudo ufw allow 443/tcp

# HTTP für Let's Encrypt Challenge
sudo ufw allow 80/tcp

# SSH
sudo ufw allow 22/tcp

# Enable Firewall
sudo ufw enable
```

### Fail2Ban (Brute-Force Protection)

```bash
# Install
sudo apt install fail2ban

# Config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Add Nginx protection:
[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/ems-backend-error.log

sudo systemctl restart fail2ban
```

---

## 📊 MONITORING

### Nginx Access Logs

```bash
# Realtime Log
sudo tail -f /var/log/nginx/ems-backend-access.log

# Anzahl Requests pro IP
sudo awk '{print $1}' /var/log/nginx/ems-backend-access.log | sort | uniq -c | sort -rn | head -20

# Anzahl HTTP Status Codes
sudo awk '{print $9}' /var/log/nginx/ems-backend-access.log | sort | uniq -c | sort -rn
```

### SSL Certificate Expiry

```bash
# Check Expiry Date
echo | openssl s_client -connect ems.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Certbot Status
sudo certbot certificates
```

---

## 🔧 TROUBLESHOOTING

### Problem: 502 Bad Gateway

**Ursache:** FastAPI Backend läuft nicht

```bash
# Backend Status prüfen
sudo systemctl status ems-backend

# Backend manuell starten
cd /path/to/project
uvicorn backend.main:app --host 0.0.0.0 --port 8001
```

### Problem: Certificate Error

**Ursache:** Certbot nicht korrekt ausgeführt

```bash
# Certbot neu ausführen
sudo certbot --nginx -d ems.yourdomain.com --force-renewal
```

### Problem: WebSocket Connection Failed

**Ursache:** Firewall oder Nginx Config

```bash
# Check Nginx Config
sudo nginx -t

# Check WebSocket Logs
sudo tail -f /var/log/nginx/ems-backend-error.log | grep -i websocket
```

---

## 📚 ALTERNATIVE: Uvicorn mit TLS (ohne Nginx)

Falls du keinen Reverse Proxy verwenden möchtest:

```bash
# Uvicorn mit TLS
uvicorn backend.main:app \
  --host 0.0.0.0 \
  --port 8443 \
  --ssl-keyfile=/etc/letsencrypt/live/ems.yourdomain.com/privkey.pem \
  --ssl-certfile=/etc/letsencrypt/live/ems.yourdomain.com/fullchain.pem \
  --ssl-version=3
```

**Nachteil:** Keine Nginx-Features (Rate Limiting, Caching, Load Balancing)

---

## ✅ PRODUCTION CHECKLIST

- [ ] Domain & DNS konfiguriert
- [ ] Nginx installiert
- [ ] Let's Encrypt Zertifikate generiert
- [ ] HTTPS funktioniert (SSL Labs A+)
- [ ] HTTP → HTTPS Redirect aktiv
- [ ] WebSocket over TLS funktioniert
- [ ] Certbot Auto-Renewal aktiviert
- [ ] Firewall konfiguriert (nur 80, 443, 22)
- [ ] Fail2Ban installiert
- [ ] Monitoring & Logging konfiguriert
- [ ] Backend als Systemd Service
- [ ] Security Headers aktiv (HSTS, CSP)

---

## 🔗 WEITERFÜHRENDE LINKS

- [Let's Encrypt Docs](https://letsencrypt.org/docs/)
- [Nginx Security Best Practices](https://www.nginx.com/blog/nginx-security-best-practices/)
- [SSL Labs Test](https://www.ssllabs.com/ssltest/)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
