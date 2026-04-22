# Smart Meter & Smart Home Integration

Dieses Dokument beschreibt, wie ein beliebiger Smart Meter über das Energiemanagementsystem (EMS) an MQTT und ein Smart Home (z. B. Home Assistant) angebunden wird.

## 1. Architekturüberblick

```text
Smart Meter  →  Adapter (Modbus/Cloud/MQTT)  →  MQTT-Broker  →  EMS (FastAPI + KI)  →  MQTT/HTTP/WebSocket  →  Smart Home
```

- **Smart Meter**: beliebiger Zähler (z. B. Siemens, Easymeter, ISKRA, Cloud-Zähler).
- **Adapter**: kleines Script oder Device Adapter, der
  - die Herstellerschnittstelle spricht (Modbus, REST, Cloud-API, proprietäres MQTT),
  - die Werte in ein einheitliches Topic-Schema `energy/...` schreibt.
- **EMS** (Dieses Projekt): FastAPI-Backend mit MQTT-Loop und zentralem State.
- **MQTT-Broker**: zentrale Daten-Drehscheibe.
- **Smart Home**: z. B. Home Assistant, ioBroker, openHAB – liest dieselben MQTT-Topics.

**Wichtige Voraussetzung:**

> Das Smart Home (z. B. Home Assistant) muss mit **demselben MQTT-Broker** verbunden sein wie das EMS.

Nur dann sehen EMS und Smart Home die gleichen Messwerte.

## 2. Standard-MQTT-Topics des EMS

Der aktuelle Referenzadapter für Smart Meter (`device_adapters/smart_meter/mqtt_smartmeter_modbus_adapter.py`) publiziert u. a. folgende Topics:

- `energy/house/load` – aktuelle Hauslast in Watt (W)
- `energy/smartmeter/import_kwh` – bezogene Energie (Zählerstand, kWh)
- `energy/smartmeter/export_kwh` – eingespeiste Energie (Zählerstand, kWh)
- `energy/smartmeter/state` – JSON mit allen Rohwerten (Debug/Analyse)

Das Backend (`backend/mqtt_service.py`) übernimmt diese Werte in den zentralen State, und `/smartmeter/energy` stellt sie per HTTP dem Frontend zur Verfügung.

## 2.1 Beliebige Smart-Home-Geräte (Waschmaschine, Lichtgruppen, ...)

Für die **IoT & Smarthome-Orchestrierung** können beliebige Geräte angebunden werden.
Das Backend akzeptiert dafür generische Payloads über `POST /api/ingest` und stellt den aggregierten Zustand unter `GET /smarthome/devices` bereit.

### Empfohlenes Topic-Schema (Adapter → EMS)

```text
energy/home/<device_id>/power_w
energy/home/<device_id>/status
energy/home/<device_id>/flexibility
```

Beispiele:

- `energy/home/washing_machine/power_w` → `620`
- `energy/home/washing_machine/status` → `running`
- `energy/home/light_groups/power_w` → `140`
- `energy/home/light_groups/status` → `on`

### Alternativ: Direkter Ingest-JSON Payload

```json
{
  "device_id": "washing_machine",
  "device_type": "appliance",
  "category": "smarthome",
  "name": "Waschmaschine",
  "power_w": 620,
  "status": "running",
  "flexibility": "hoch",
  "timestamp": "2026-04-20T12:00:00Z"
}
```

Damit erscheinen Geräte automatisch im Smart-Home-Bereich des Frontends. `washing_machine` und `light_groups` sind zusätzlich als stabile Standard-Karten vorbelegt.

## 3. Home Assistant: Sensoren & Entitäten

Damit Home Assistant diese Werte nutzen kann, legst du in der `configuration.yaml` MQTT-Sensoren an.

### 3.1 MQTT-Sensoren für reale Smart-Meter-Daten

```yaml
mqtt:
  sensor:
    # Aktuelle Hauslast (aus realem Smart Meter)
    - name: "Hauslast"
      unique_id: "efh_house_load"
      state_topic: "energy/house/load"
      unit_of_measurement: "W"
      device_class: power
      state_class: measurement

    # Bezogene Energie (Zählerstand)
    - name: "Smart Meter Bezogene Energie"
      unique_id: "efh_import_energy"
      state_topic: "energy/smartmeter/import_kwh"
      unit_of_measurement: "kWh"
      device_class: energy
      state_class: total_increasing

    # Eingespeiste Energie (Zählerstand)
    - name: "Smart Meter Eingespeiste Energie"
      unique_id: "efh_export_energy"
      state_topic: "energy/smartmeter/export_kwh"
      unit_of_measurement: "kWh"
      device_class: energy
      state_class: total_increasing
```

Sobald reale Geräte über den Adapter Werte auf diese Topics senden, siehst du in Home Assistant live die Sensorstände – damit ist klar erkennbar, dass die Verbindung zu den echten Geräten funktioniert.

### 3.2 Abgeleitete Entitäten (z. B. PV-Überschuss)

Auf Basis der MQTT-Sensoren kannst du in Home Assistant zusätzliche Template-Sensoren definieren, die z. B. PV-Überschuss anzeigen:

```yaml
template:
  - sensor:
      - name: "PV Überschuss"
        unique_id: "efh_pv_surplus"
        unit_of_measurement: "W"
        device_class: power
        state_class: measurement
        state: >-
          {% set load = states('sensor.hauslast') | float(0) %}
          {% set pv   = states('sensor.pv_leistung') | float(0) %}
          {{ max(pv - load, 0) }}
```

`sensor.pv_leistung` kann dabei aus einem weiteren MQTT-Sensor stammen, der aus `energy/pv/power` des EMS gespeist wird.

### 3.3 Automationen: Reaktion auf reale Geräte

Beispiele für einfache Automationen, die sich **nur** aktivieren, wenn reale Daten fließen:

```yaml
automation:
  # 1) Benachrichtigung bei sehr hoher Hauslast
  - id: notify_high_house_load
    alias: "EFH: Hohe Hauslast melden"
    trigger:
      - platform: numeric_state
        entity_id: sensor.hauslast
        above: 8000   # 8 kW
    condition: []
    action:
      - service: notify.mobile_app_dein_handy
        data:
          title: "Hohe Hauslast"
          message: >-
            Aktuelle Hauslast: {{ states('sensor.hauslast') }} W.

  # 2) Schaltsteckdose für Verbraucher bei PV-Überschuss aktivieren
  - id: switch_on_load_when_pv_surplus
    alias: "EFH: Verbraucher bei PV-Überschuss einschalten"
    trigger:
      - platform: numeric_state
        entity_id: sensor.pv_uberschuss
        above: 1500   # > 1,5 kW PV-Überschuss
        for: "00:05:00"
    action:
      - service: switch.turn_on
        target:
          entity_id: switch.grosse_last

  # 3) Abschalten, wenn kein Überschuss mehr
  - id: switch_off_load_when_no_surplus
    alias: "EFH: Verbraucher bei fehlendem Überschuss ausschalten"
    trigger:
      - platform: numeric_state
        entity_id: sensor.pv_uberschuss
        below: 200
        for: "00:05:00"
    action:
      - service: switch.turn_off
        target:
          entity_id: switch.grosse_last
```

Wenn echte Geräte verbunden sind und der Adapter Daten liefert, siehst du:

- in Home Assistant: sich ändernde Werte bei `sensor.hauslast` und den Energiezählern,
- im EMS-Frontend (Tab "Haushalt"): die gleichen aktuellen Werte im Smart-Meter-Widget.

Damit ist sofort sichtbar, dass die End-to-End-Verbindung **Smart Meter → EMS → MQTT → Home Assistant** funktioniert.

## 4. Adapter für beliebige Smart Meter

Damit **jede** Smart-Meter-Marke genutzt werden kann, brauchst du nur einen dünnen Adapter pro Typ:

1. Werte lesen (z. B. Modbus/TCP, REST, Cloud-API).
2. In die standardisierten Topics des EMS schreiben:
   - `energy/house/load`
   - `energy/smartmeter/import_kwh`
   - `energy/smartmeter/export_kwh`
3. Optional zusätzlich ein JSON auf `energy/smartmeter/state` publizieren.

Das EMS selbst (KI-Logik, V2H, Lademanagement) arbeitet nur mit dem zentralen State und ist damit unabhängig vom Hersteller des Smart Meters.

## 5. Frontend: Haushalt-Tab

Im Tab **"Haushalt"** des Frontends zeigt das Widget **"⚡ Smart Meter Energie"** u. a. an:

- Bezogene Energie / Eingespeiste Energie (kWh)
- Aktuelle Leistung (W)
- Spannung (V)
- Strom (A)
- Energie heute / gesamt (kWh)

Die Daten stammen aus `/smartmeter/energy`, das wiederum aus den MQTT-Topics gespeist wird.

Für Benutzer wird zusätzlich ein Hinweis eingeblendet, dass das Smart Home (z. B. Home Assistant) mit demselben MQTT-Broker wie das EMS verbunden sein muss.

## 6. Beispiel: PV-Überschuss-basiertes EV-/V2H-Laden mit Home Assistant

Neben den reinen Messwerten kannst du Home Assistant nutzen, um das EMS aktiv zu steuern – z. B. EV-/V2H-Laden nur bei PV-Überschuss zu aktivieren.

> Hinweis: Die folgenden Beispiele gehen davon aus, dass dein EMS-Backend unter
> `http://ems-host:8000` erreichbar ist und die V2H-Endpunkte `/v2h/enable`
> und `/v2h/disable` implementiert sind.

### 6.1 REST-Commands zum Steuern des EMS

In der `configuration.yaml` von Home Assistant kannst du REST-Kommandos definieren, die das EMS aufrufen:

```yaml
rest_command:
  efh_v2h_enable:
    url: "http://ems-host:8000/v2h/enable"
    method: POST
    headers:
      Content-Type: application/json
    payload: >-
      {"wallbox_id": "wallbox_goe"}

  efh_v2h_disable:
    url: "http://ems-host:8000/v2h/disable"
    method: POST
    headers:
      Content-Type: application/json
```

Passe `ems-host` und `wallbox_id` an deine Umgebung an.

### 6.2 Automation: V2H/EV-Laden bei PV-Überschuss aktivieren

Basierend auf dem zuvor definierten Sensor `sensor.pv_uberschuss` kannst du das EMS automatisch ansteuern:

```yaml
automation:
  - id: efh_enable_v2h_on_pv_surplus
    alias: "EFH: V2H/EV-Laden bei PV-Überschuss aktivieren"
    trigger:
      - platform: numeric_state
        entity_id: sensor.pv_uberschuss
        above: 2500   # z. B. > 2,5 kW PV-Überschuss
        for: "00:05:00"
    condition: []
    action:
      - service: rest_command.efh_v2h_enable

  - id: efh_disable_v2h_when_no_surplus
    alias: "EFH: V2H/EV-Laden bei fehlendem Überschuss deaktivieren"
    trigger:
      - platform: numeric_state
        entity_id: sensor.pv_uberschuss
        below: 500   # fast kein Überschuss mehr
        for: "00:05:00"
    condition: []
    action:
      - service: rest_command.efh_v2h_disable
```

Damit entsteht eine End-to-End-Kette mit echten Geräten:

1. PV und Smart Meter liefern reale Leistungswerte → Adapter publiziert `energy/...`.
2. EMS berechnet und stellt Werte für das Frontend und MQTT bereit.
3. Home Assistant bildet daraus `sensor.pv_uberschuss`.
4. Bei ausreichend Überschuss ruft Home Assistant das EMS auf (`/v2h/enable`), um V2H/EV-Laden zu aktivieren.
5. Bei fehlendem Überschuss wird `/v2h/disable` aufgerufen.

So ist für Nutzer im Home Assistant **und** im EMS-Frontend sichtbar, wie reale Geräte (PV, Smart Meter, EV/Wallbox) gemeinsam im Energiemanagementsystem arbeiten.
