# LoopIQ (EnergyFlowHub_EV) – Developer Quickstart

Dieses Projekt liegt (bei dir lokal) im Ordner:

- `/Users/mohammadhameed/Downloads/EnergyFlowHub_EV`

## 1. Projekt in VS Code öffnen

Es gibt zwei Möglichkeiten:

### Variante A: Nur den Ordner öffnen (empfohlen)

1. In VS Code im Menü: **File → Open Folder…**
2. Den Ordner `EnergyFlowHub_EV` auswählen (Projektname: LoopIQ).
3. Links im Explorer solltest du u. a. sehen:
   - `backend/`
   - `frontend/`
   - `config/`
   - `tests/`

Alle Änderungen, die du speicherst (`⌘ + S`), landen direkt in diesem Ordner.

### Variante B: Über eine Workspace-Datei

Falls eine Datei wie `EnergyFlowHub_EV.code-workspace` existiert:

1. In VS Code: **File → Open Workspace from File…**
2. Die `.code-workspace`-Datei auswählen.

Das ist nur eine VS-Code-Konfiguration. Dein echter Projektordner bleibt trotzdem `EnergyFlowHub_EV`.

## 2. Backend (FastAPI) starten

Voraussetzung: Python-Umgebung mit den benötigten Packages (siehe `pyproject.toml` / `requirements.freeze.txt`).

Im Terminal:

```bash
cd /Users/mohammadhameed/Downloads/EnergyFlowHub_EV
uvicorn backend.main:app --reload
```

Danach sollte im Browser unter `http://127.0.0.1:8000/` eine JSON-Antwort wie

```json
{"message": "EnergyFlowHub_EV backend is running."}
```

erscheinen.

In VS Code gibt es außerdem eine vorbereitete Task:

- **Terminal → Run Task… → "Start FastAPI backend (dev mode)"**
  - Startet: `uvicorn backend.main:app --reload`

## 3. Frontend (Web-App) starten

Voraussetzung: Node.js und npm installiert.

Im zweiten Terminal:

```bash
cd /Users/mohammadhameed/Downloads/EnergyFlowHub_EV/frontend
npm install    # nur beim ersten Mal nötig
npm run dev
```

Anschließend im Browser:

- `http://localhost:5173` öffnen → hier läuft das LoopIQ-Dashboard mit Tabs wie „Übersicht“, „Elektroauto“, „Haushalt“, „KI-Empfehlung“.

## 4. Typischer Dev-Workflow

1. VS Code öffnen mit Ordner `EnergyFlowHub_EV`.
2. Backend starten (Task oder `uvicorn backend.main:app --reload`).
3. Frontend starten (`npm run dev` im `frontend/`-Ordner).
4. Im Browser die Web-App unter `http://localhost:5173` benutzen.

## 5. Wo dein Code gespeichert ist

- Der komplette Quellcode liegt im Ordner:
  - `/Users/mohammadhameed/Downloads/EnergyFlowHub_EV`
- Dateien speicherst du in VS Code mit `⌘ + S`.
- Wenn du eine Sicherung machen willst:
  - Im Finder den Ordner `EnergyFlowHub_EV` kopieren (z. B. nach `Dokumente/Projects`)
  - oder per Rechtsklick „Komprimieren“ und die ZIP-Datei archivieren.
