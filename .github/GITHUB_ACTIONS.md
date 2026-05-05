# GitHub Actions CI/CD

## Playwright Tests Workflow

Diese Workflow-Datei führt automatisch Playwright Tests aus bei jedem Push oder Pull Request.

### 🚀 Wann läuft der Workflow?

- **Push zu `main` Branch** mit Änderungen in `frontend/`
- **Pull Requests** zu `main` mit Änderungen in `frontend/`

### 📋 Was macht der Workflow?

1. **Checkout** - Holt den Code von GitHub
2. **Setup Node.js 20** - Installiert Node.js mit npm cache
3. **Install Dependencies** - `npm ci` für saubere Installation
4. **Install Playwright Browsers** - Chromium, Firefox, WebKit
5. **Run Tests** - Führt alle Playwright Tests aus
6. **Upload Reports** - Speichert Test-Reports als Artifacts

### 📊 Test Reports ansehen

Nach jedem Test-Lauf:

1. Gehe zu: https://github.com/Moha111991/wattai.live/actions
2. Klicke auf den neuesten Workflow-Run
3. Scrolle zu **Artifacts** am Ende der Seite
4. Download:
   - `playwright-report` - HTML Report (30 Tage gespeichert)
   - `test-results` - Detaillierte Ergebnisse (7 Tage)

### ✅ Status Badge (Optional)

Füge dies in deine `README.md` ein um den Status anzuzeigen:

```markdown
![Playwright Tests](https://github.com/Moha111991/wattai.live/actions/workflows/playwright.yml/badge.svg)
```

### 🔧 Workflow manuell starten

Im GitHub UI:
1. Actions → Playwright Tests
2. "Run workflow" Button → Run workflow

### 💡 Tipps

**Tests lokal ausführen (wie in CI):**
```bash
cd frontend
npm ci
npx playwright install --with-deps
npx playwright test
```

**Nur bestimmte Browser testen:**
```bash
npx playwright test --project=chromium
```

**Mit UI Mode entwickeln:**
```bash
npx playwright test --ui
```

### 🚨 Bei Test-Fehlern

Der Workflow schlägt fehl wenn Tests nicht bestehen. Du kannst dann:
- Test-Reports downloaden (Artifacts)
- Lokal reproduzieren
- Tests fixen und neu pushen

### ⚙️ Konfiguration anpassen

Die Workflow-Datei liegt in: `.github/workflows/playwright.yml`

**Häufige Anpassungen:**
- `timeout-minutes`: Maximale Laufzeit ändern
- `continue-on-error: true`: Workflow trotz Fehler als Erfolg markieren
- Browser-Auswahl: `chromium firefox webkit` → nur gewünschte Browser

---

## CI/CD Pipeline Übersicht

```
┌─────────────┐
│  Git Push   │
└──────┬──────┘
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼                                  ▼
┌─────────────────┐              ┌──────────────┐
│ GitHub Actions  │              │   Railway    │
│ Playwright Tests│              │   Deploy     │
│                 │              │              │
│ ✓ Unit Tests    │              │ ✓ Build App  │
│ ✓ E2E Tests     │              │ ✓ Deploy     │
│ ✓ Visual Tests  │              │ ✓ Go Live    │
└────────┬────────┘              └──────┬───────┘
         │                              │
         ▼                              ▼
   📊 Test Report              🌐 wattai.live
```

**Beide laufen parallel bei jedem Push!** 🚀
