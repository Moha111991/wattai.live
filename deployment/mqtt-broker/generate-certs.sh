#!/bin/bash

# =============================================================================
# TLS Zertifikat Generator für MQTT Broker
# =============================================================================
# Erstellt selbstsignierte Zertifikate für verschlüsselte MQTT-Kommunikation
# Für Produktion sollten Sie Let's Encrypt verwenden!
# =============================================================================

set -e

CERT_DIR="./certs"
VALIDITY_DAYS=365

echo "🔒 TLS Zertifikat Generator für MQTT"
echo "====================================="
echo ""

# Erstelle certs-Verzeichnis
mkdir -p "$CERT_DIR"

# Überprüfe ob OpenSSL verfügbar ist
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL nicht gefunden!"
    echo "   Installieren Sie OpenSSL:"
    echo "   Ubuntu/Debian: sudo apt-get install openssl"
    echo "   macOS:         brew install openssl"
    exit 1
fi

echo "📋 Zertifikat-Informationen"
echo "---------------------------"

# Hostname/IP des MQTT-Brokers
read -p "Hostname oder IP des MQTT-Brokers [localhost]: " BROKER_HOST
BROKER_HOST=${BROKER_HOST:-localhost}

read -p "Organisation [Energy Management System]: " ORG
ORG=${ORG:-Energy Management System}

read -p "Land (2 Buchstaben) [DE]: " COUNTRY
COUNTRY=${COUNTRY:-DE}

read -p "Stadt [Berlin]: " CITY
CITY=${CITY:-Berlin}

echo ""
echo "🔑 Generiere Zertifikate..."
echo ""

# 1. Certificate Authority (CA) erstellen
echo "1️⃣  Erstelle Certificate Authority (CA)..."

openssl genrsa -out "$CERT_DIR/ca.key" 4096

openssl req -x509 -new -nodes \
    -key "$CERT_DIR/ca.key" \
    -sha256 \
    -days $VALIDITY_DAYS \
    -out "$CERT_DIR/ca.crt" \
    -subj "/C=$COUNTRY/ST=State/L=$CITY/O=$ORG/CN=MQTT-CA"

echo "   ✅ CA-Zertifikat erstellt"

# 2. Server-Zertifikat erstellen
echo "2️⃣  Erstelle Server-Zertifikat..."

openssl genrsa -out "$CERT_DIR/server.key" 4096

openssl req -new \
    -key "$CERT_DIR/server.key" \
    -out "$CERT_DIR/server.csr" \
    -subj "/C=$COUNTRY/ST=State/L=$CITY/O=$ORG/CN=$BROKER_HOST"

# Subject Alternative Names (SAN) für mehrere Hostnamen
cat > "$CERT_DIR/server.ext" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $BROKER_HOST
DNS.2 = localhost
DNS.3 = *.local
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Signiere Server-Zertifikat mit CA
openssl x509 -req \
    -in "$CERT_DIR/server.csr" \
    -CA "$CERT_DIR/ca.crt" \
    -CAkey "$CERT_DIR/ca.key" \
    -CAcreateserial \
    -out "$CERT_DIR/server.crt" \
    -days $VALIDITY_DAYS \
    -sha256 \
    -extfile "$CERT_DIR/server.ext"

echo "   ✅ Server-Zertifikat erstellt"

# 3. Client-Zertifikat erstellen (optional für mTLS)
echo "3️⃣  Erstelle Client-Zertifikat (optional für gegenseitige TLS-Authentifizierung)..."

openssl genrsa -out "$CERT_DIR/client.key" 4096

openssl req -new \
    -key "$CERT_DIR/client.key" \
    -out "$CERT_DIR/client.csr" \
    -subj "/C=$COUNTRY/ST=State/L=$CITY/O=$ORG/CN=mqtt-client"

openssl x509 -req \
    -in "$CERT_DIR/client.csr" \
    -CA "$CERT_DIR/ca.crt" \
    -CAkey "$CERT_DIR/ca.key" \
    -CAcreateserial \
    -out "$CERT_DIR/client.crt" \
    -days $VALIDITY_DAYS \
    -sha256

echo "   ✅ Client-Zertifikat erstellt"

# Aufräumen
rm -f "$CERT_DIR"/*.csr "$CERT_DIR"/*.ext "$CERT_DIR"/*.srl

# Berechtigungen setzen
chmod 600 "$CERT_DIR"/*.key
chmod 644 "$CERT_DIR"/*.crt

echo ""
echo "✅ TLS-Zertifikate erfolgreich erstellt!"
echo ""
echo "📂 Generierte Dateien:"
echo "   CA-Zertifikat:      $CERT_DIR/ca.crt"
echo "   CA-Schlüssel:       $CERT_DIR/ca.key"
echo "   Server-Zertifikat:  $CERT_DIR/server.crt"
echo "   Server-Schlüssel:   $CERT_DIR/server.key"
echo "   Client-Zertifikat:  $CERT_DIR/client.crt"
echo "   Client-Schlüssel:   $CERT_DIR/client.key"
echo ""
echo "🔍 Zertifikat-Details anzeigen:"
echo "   openssl x509 -in $CERT_DIR/server.crt -text -noout"
echo ""
echo "⚠️  WICHTIG für Produktion:"
echo "   - Diese Zertifikate sind selbstsigniert (nicht vertrauenswürdig)"
echo "   - Verwenden Sie für öffentliche Server Let's Encrypt: https://letsencrypt.org"
echo "   - Befehl: certbot certonly --standalone -d $BROKER_HOST"
echo ""
echo "🚀 Nächste Schritte:"
echo "   1. MQTT-Broker starten: docker-compose up -d"
echo "   2. Sichere Verbindung testen:"
echo "      mosquitto_sub -h $BROKER_HOST -p 8883 \\"
echo "        --cafile $CERT_DIR/ca.crt \\"
echo "        -u admin -P <password> -t test/#"
echo ""
