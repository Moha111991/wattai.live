# Generic Smart-Home MQTT Adapter (Template)

Dieser Template-Client erlaubt es, **beliebige IoT-Geräte ohne eigene Adapter-Implementierung** in das EMS einzuspeisen.

Datei: `device_adapters/smart_home/generic_mqtt_adapter.py`

---

## Was der Adapter macht

- abonniert frei konfigurierbare MQTT-Topics,
- normalisiert die Werte auf ein Smart-Home-Schema,
- sendet die Daten als JSON an `POST /api/ingest`,
- dadurch erscheinen Geräte live unter `GET /smarthome/devices` und im Smart-Home-Tab.

---

## Schnellstart

1. Vorlage kopieren und Werte setzen:

```bash
cp device_adapters/smart_home/.env.smart_home.example device_adapters/smart_home/.env.smart_home
```

2. Env laden und Adapter starten:

```bash
export BACKEND_URL="http://localhost:8000"
export BACKEND_API_KEY="mein_geheimer_schulkey123"
export MQTT_HOST="localhost"
export MQTT_PORT="1883"
export MQTT_SUBSCRIBE="energy/home/+/+,homeassistant/+/+/state,zigbee2mqtt/+"
python -m device_adapters.smart_home.generic_mqtt_adapter
```

Optional kannst du die Variablen auch direkt aus der Datei laden, z. B. mit:

```bash
set -a
source device_adapters/smart_home/.env.smart_home
set +a
python -m device_adapters.smart_home.generic_mqtt_adapter
```

---

## Empfohlenes Topic-Schema (native)

Wenn Geräte bereits so publizieren, ist kein extra Mapping nötig:

- `energy/home/<device_id>/power_w`
- `energy/home/<device_id>/status`
- `energy/home/<device_id>/flexibility`

Beispiele:

- `energy/home/washing_machine/power_w` → `620`
- `energy/home/washing_machine/status` → `running`
- `energy/home/light_groups/power_w` → `140`
- `energy/home/light_groups/status` → `on`

---

## Mapping für nicht-standardisierte Topics

Mit `TOPIC_RULES_JSON` kannst du Fremdtopics auf Geräte/Metric mappen.

```bash
export TOPIC_RULES_JSON='[
  {"pattern": "zigbee2mqtt/waschmaschine", "device_id": "washing_machine", "name": "Waschmaschine", "metric": "power_w", "flexibility": "hoch"},
  {"pattern": "zigbee2mqtt/lichtgruppe_wohnzimmer", "device_id": "light_groups", "name": "Lichtgruppen", "metric": "status", "flexibility": "niedrig"}
]'
```

Pattern unterstützt MQTT-Wildcards (`+`, `#`).

---

## Wichtige Umgebungsvariablen

- `BACKEND_URL` (default: `http://localhost:8000`)
- `BACKEND_API_KEY` (optional, aber empfohlen)
- `MQTT_HOST`, `MQTT_PORT`, `MQTT_USERNAME`, `MQTT_PASSWORD`
- `MQTT_SUBSCRIBE` (kommagetrennte Topic-Filter)
- `TOPIC_RULES_JSON` (optional)
- `DEFAULT_DEVICE_ID` (default: `smarthome_generic`)
- `DEFAULT_DEVICE_NAME` (default: `SmartHome Generic Device`)
- `DEFAULT_FLEXIBILITY` (default: `mittel`)

---

## Hinweise

- Falls InfluxDB nicht verfügbar ist, verarbeitet das Backend den Ingest trotzdem.
- Für Produktivbetrieb: MQTT über TLS + abgesicherte API-Keys verwenden.
