# LoopIQ (ehemals EnergyFlowHub EV)

LoopIQ ist eine modulare Energiemanagementplattform (EMS) für Elektrofahrzeuge, Heimspeicher, PV‑Anlagen und Smart‑Home‑Integration.

## Komponenten

- **Backend** (`backend/`): FastAPI‑Server mit KI‑Steuerung, MQTT‑Anbindung und zentralem Realtime‑State.
- **Frontend** (`frontend/`): React/Vite‑Dashboard mit Tabs für EV, Haushalt, PV, Speicher usw.
- **Device Adapters** (`device_adapters/`): Adapter für reale Geräte (Wallbox, Wechselrichter, Smart Meter usw.).
- **Deployment** (`deployment/`): Nginx, MQTT‑Broker, Prometheus & Co.

Weitere Architekturdetails findest du in `.github/copilot-instructions.md`.

## Smart Meter & Smart Home

Für die Anbindung beliebiger Smart Meter und Smart‑Home‑Systeme (z. B. Home Assistant) gibt es eine eigene Anleitung:

➡️ **Siehe:** `README_smartmeter_integration.md`

Dort beschrieben:

- wie Smart Meter über Modbus/Cloud/MQTT in das EMS integriert werden,
- welche MQTT‑Topics das EMS bereitstellt (z. B. `energy/house/load`, `energy/smartmeter/import_kwh`, `energy/smartmeter/export_kwh`),
- Beispiel‑Konfiguration für Home Assistant.

**Wichtige Voraussetzung:**

> Smart Home (z. B. Home Assistant) und Energiemanagementsystem müssen mit demselben MQTT‑Broker verbunden sein.
