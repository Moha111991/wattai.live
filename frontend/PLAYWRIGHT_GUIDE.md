# Playwright CLI Guide für WattAI.live

## Installation ✅
Playwright ist bereits installiert mit allen Browsern (Chromium, Firefox, WebKit).

## 🚀 Wichtigste Befehle

### 1. Tests ausführen
```bash
# Alle Tests ausführen
npx playwright test

# Nur einen Test
npx playwright test navigation.spec.ts

# Nur einen Browser
npx playwright test --project=chromium

# Mit UI Mode (interaktiv, empfohlen!)
npx playwright test --ui

# Im Debug-Modus
npx playwright test --debug

# Nur Mobile Tests
npx playwright test --project="Mobile Chrome"
```

### 2. Code Generator (Recorder) 🎯
**Das ist das Power-Tool!** Playwright zeichnet deine Browser-Interaktionen auf und generiert automatisch Test-Code:

```bash
# Lokale Entwicklung aufzeichnen
npx playwright codegen http://localhost:5173

# Live-Site aufzeichnen
npx playwright codegen https://wattai.live

# Mit bestimmtem Device
npx playwright codegen --device="iPhone 12" http://localhost:5173

# Mit bestimmtem Browser
npx playwright codegen --browser=firefox http://localhost:5173
```

**So funktioniert's:**
1. Befehl ausführen → Browser + Inspector öffnen sich
2. Im Browser: Klicke, scrolle, fülle Formulare aus
3. Im Inspector: Siehst du den generierten Code in Echtzeit
4. Kopiere den Code und speichere als `.spec.ts` Test

### 3. Test Reports
```bash
# HTML Report anzeigen (nach Tests)
npx playwright show-report

# Report Pfad: playwright-report/index.html
```

### 4. Screenshots & Videos
```bash
# Screenshot von Seite erstellen
npx playwright screenshot --full-page http://localhost:5173 screenshot.png

# Mit bestimmtem Viewport
npx playwright screenshot --viewport-size=390,844 http://localhost:5173 mobile.png
```

### 5. Trace Viewer (für Debugging)
Wenn ein Test fehlschlägt, kannst du die komplette Aufzeichnung anschauen:
```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

## 📁 Erstellte Test-Dateien

### `/frontend/e2e/navigation.spec.ts`
- Testet Tab-Navigation (Dashboard, Geräte, Elektroauto, Smart Home, KI)
- Prüft V2H Animation (TAG/NACHT Labels)
- Validiert alle Tabs funktionieren

### `/frontend/e2e/responsive-logo.spec.ts`
- Testet Logo-Größen auf 5 Viewports (360px - 1920px)
- Prüft Position (oben links)
- Validiert Glassmorphism-Effekt

### `/frontend/e2e/headers-3d.spec.ts`
- Testet alle 5 3D Header-Komponenten
- Prüft Frameless-Design (kein Border/Shadow)
- Validiert Animationen (rotating wheels, particles, etc.)
- Testet V2H Tag/Nacht Zyklus

### `/frontend/e2e/mobile.spec.ts`
- Mobile Responsiveness (iPhone 12)
- Touch-Events
- Cross-Browser Tests (Chromium, Firefox, WebKit)
- Horizontal Scroll Check

## 🎓 Typische Workflows

### Workflow 1: Neues Feature entwickeln
```bash
# 1. Dev Server starten
npm run dev

# 2. Feature in Browser testen und Code generieren
npx playwright codegen http://localhost:5173

# 3. Generierten Code in neue .spec.ts Datei kopieren

# 4. Test ausführen
npx playwright test neue-feature.spec.ts --ui

# 5. Test im UI Mode anpassen und debuggen
```

### Workflow 2: Responsive Design testen
```bash
# Mobile
npx playwright codegen --device="iPhone 12" http://localhost:5173

# Tablet
npx playwright codegen --device="iPad Pro" http://localhost:5173

# Desktop
npx playwright codegen --viewport-size=1920,1080 http://localhost:5173
```

### Workflow 3: Visual Regression Testing
```bash
# Screenshots erstellen (Baseline)
npx playwright test --update-snapshots

# Tests ausführen (vergleicht mit Baseline)
npx playwright test

# Unterschiede im Report ansehen
npx playwright show-report
```

## 🔧 Nützliche Optionen

```bash
# Nur fehlgeschlagene Tests nochmal laufen lassen
npx playwright test --last-failed

# Mit bestimmtem Timeout
npx playwright test --timeout=60000

# Headed Mode (Browser sichtbar)
npx playwright test --headed

# Langsam ausführen (zum Zusehen)
npx playwright test --slow-mo=1000

# Nur Tests mit bestimmtem Tag
npx playwright test --grep @smoke
```

## 📊 CI/CD Integration (für später)

Füge zu `.github/workflows/playwright.yml` hinzu:
```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🎯 Best Practices

1. **UI Mode verwenden**: `npx playwright test --ui` ist perfekt zum Entwickeln
2. **Codegen nutzen**: Spart viel Zeit beim Test-Schreiben
3. **Page Object Pattern**: Für größere Projekte wiederverwendbare Selektoren
4. **Trace aktivieren**: Hilft enorm beim Debugging
5. **Mobile Tests**: Immer auch Mobile Devices testen

## 🔍 Debugging Tipps

```bash
# Browser Inspector öffnen
npx playwright test --debug

# Pause im Code
await page.pause();

# Verbose Logging
DEBUG=pw:api npx playwright test

# Screenshot bei jedem Step
await page.screenshot({ path: 'step-1.png' });
```

## 📚 Weitere Ressourcen

- Offizielle Docs: https://playwright.dev
- API Referenz: https://playwright.dev/docs/api/class-playwright
- Selectors Guide: https://playwright.dev/docs/selectors
- Best Practices: https://playwright.dev/docs/best-practices

---

## 🎬 Quick Start

Jetzt gleich loslegen:

```bash
cd /Users/mohammadhameed/Downloads/EnergyFlowHub_EV/frontend

# 1. Tests in UI Mode starten (empfohlen für Anfang)
npx playwright test --ui

# 2. Oder: Code Generator starten
npx playwright codegen http://localhost:5173

# 3. Oder: Alle Tests headless ausführen
npx playwright test
```

Viel Erfolg! 🚀
