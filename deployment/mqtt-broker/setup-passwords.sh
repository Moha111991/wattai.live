#!/bin/bash

# =============================================================================
# MQTT Mosquitto Passwort-Setup Skript
# =============================================================================
# Dieses Skript erstellt die Passwort-Datei für Mosquitto
# mit vordefinierten Benutzern oder interaktiven Eingaben
# =============================================================================

set -e

CONFIG_DIR="./config"
PASSWORD_FILE="$CONFIG_DIR/passwords.txt"

echo "🔐 MQTT Mosquitto Passwort-Setup"
echo "================================="
echo ""

# Überprüfe ob mosquitto_passwd verfügbar ist
if ! command -v mosquitto_passwd &> /dev/null; then
    echo "❌ mosquitto_passwd nicht gefunden!"
    echo "   Installiere mosquitto-clients:"
    echo "   Ubuntu/Debian: sudo apt-get install mosquitto-clients"
    echo "   macOS:         brew install mosquitto"
    echo "   Docker:        docker run -it --rm -v \$(pwd)/config:/config eclipse-mosquitto:2.0 mosquitto_passwd ..."
    exit 1
fi

# Erstelle config-Verzeichnis falls nicht vorhanden
mkdir -p "$CONFIG_DIR"

# Lösche alte Passwort-Datei falls vorhanden
if [ -f "$PASSWORD_FILE" ]; then
    echo "⚠️  Existierende Passwort-Datei gefunden."
    read -p "   Möchten Sie diese überschreiben? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Abgebrochen."
        exit 1
    fi
    rm "$PASSWORD_FILE"
fi

echo ""
echo "📝 Benutzerkonten einrichten"
echo "----------------------------"
echo ""

# Funktion zum Hinzufügen eines Benutzers
add_user() {
    local username=$1
    local description=$2
    
    echo "🔹 Benutzer: $username ($description)"
    
    if [ -z "$3" ]; then
        # Interaktive Passworteingabe
        mosquitto_passwd -b "$PASSWORD_FILE" "$username" "$(openssl rand -base64 16)"
    else
        # Passwort aus Parameter
        mosquitto_passwd -b "$PASSWORD_FILE" "$username" "$3"
    fi
    
    echo "   ✅ Benutzer '$username' erstellt"
    echo ""
}

# Standard-Benutzer erstellen
echo "Wählen Sie eine Option:"
echo "1) Standard-Benutzer mit automatischen Passwörtern erstellen"
echo "2) Interaktive Eingabe für jeden Benutzer"
echo ""
read -p "Ihre Wahl (1-2): " -n 1 -r choice
echo ""
echo ""

if [[ $choice == "1" ]]; then
    # Automatische Passwörter generieren
    ADMIN_PW=$(openssl rand -base64 16)
    EMS_PW=$(openssl rand -base64 16)
    EV_PW=$(openssl rand -base64 16)
    BATTERY_PW=$(openssl rand -base64 16)
    WALLBOX_PW=$(openssl rand -base64 16)
    PV_PW=$(openssl rand -base64 16)
    HEATPUMP_PW=$(openssl rand -base64 16)
    MOBILE_PW=$(openssl rand -base64 16)
    
    add_user "admin" "Administrator (voller Zugriff)" "$ADMIN_PW"
    add_user "ems_backend" "EMS Backend-System" "$EMS_PW"
    add_user "ev_device" "E-Auto" "$EV_PW"
    add_user "battery_device" "Heimspeicher" "$BATTERY_PW"
    add_user "wallbox_device" "Wallbox" "$WALLBOX_PW"
    add_user "pv_device" "PV-Anlage" "$PV_PW"
    add_user "heatpump_device" "Wärmepumpe" "$HEATPUMP_PW"
    add_user "mobile_app" "Mobile App / Dashboard" "$MOBILE_PW"
    
    echo ""
    echo "🔑 Generierte Zugangsdaten:"
    echo "=============================="
    echo "admin:          $ADMIN_PW"
    echo "ems_backend:    $EMS_PW"
    echo "ev_device:      $EV_PW"
    echo "battery_device: $BATTERY_PW"
    echo "wallbox_device: $WALLBOX_PW"
    echo "pv_device:      $PV_PW"
    echo "heatpump_device: $HEATPUMP_PW"
    echo "mobile_app:     $MOBILE_PW"
    echo ""
    echo "⚠️  WICHTIG: Speichern Sie diese Passwörter sicher!"
    echo "    Sie werden nicht erneut angezeigt."
    echo ""
    
    # Passwörter in .env-Datei speichern
    cat > "$CONFIG_DIR/.env.mqtt" << EOF
# MQTT Broker Zugangsdaten
# Generiert am: $(date)

MQTT_ADMIN_USER=admin
MQTT_ADMIN_PASSWORD=$ADMIN_PW

MQTT_EMS_USER=ems_backend
MQTT_EMS_PASSWORD=$EMS_PW

MQTT_EV_USER=ev_device
MQTT_EV_PASSWORD=$EV_PW

MQTT_BATTERY_USER=battery_device
MQTT_BATTERY_PASSWORD=$BATTERY_PW

MQTT_WALLBOX_USER=wallbox_device
MQTT_WALLBOX_PASSWORD=$WALLBOX_PW

MQTT_PV_USER=pv_device
MQTT_PV_PASSWORD=$PV_PW

MQTT_HEATPUMP_USER=heatpump_device
MQTT_HEATPUMP_PASSWORD=$HEATPUMP_PW

MQTT_MOBILE_USER=mobile_app
MQTT_MOBILE_PASSWORD=$MOBILE_PW

# Broker-Einstellungen
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT_PLAIN=1883
MQTT_BROKER_PORT_TLS=8883
MQTT_BROKER_PORT_WS=9001
MQTT_BROKER_PORT_WSS=9002
EOF
    
    echo "📄 Zugangsdaten gespeichert in: $CONFIG_DIR/.env.mqtt"
    
else
    # Interaktive Eingabe
    mosquitto_passwd -c "$PASSWORD_FILE" admin
    echo "   ✅ Admin-Benutzer erstellt"
    echo ""
    
    mosquitto_passwd "$PASSWORD_FILE" ems_backend
    echo "   ✅ EMS Backend erstellt"
    echo ""
    
    mosquitto_passwd "$PASSWORD_FILE" ev_device
    echo "   ✅ E-Auto Benutzer erstellt"
    echo ""
    
    mosquitto_passwd "$PASSWORD_FILE" mobile_app
    echo "   ✅ Mobile App Benutzer erstellt"
    echo ""
fi

echo "✅ Passwort-Datei erfolgreich erstellt: $PASSWORD_FILE"
echo ""
echo "🚀 Nächste Schritte:"
echo "   1. TLS-Zertifikate generieren: ./generate-certs.sh"
echo "   2. MQTT-Broker starten: docker-compose up -d"
echo "   3. Verbindung testen: mosquitto_sub -h localhost -p 1883 -u admin -P <password> -t test/#"
echo ""
