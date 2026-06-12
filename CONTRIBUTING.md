# Contributing to WattAI.live

## Git Workflow — Feature Branch + Pull Request

Ab sofort arbeiten wir **nicht mehr direkt auf `main`**.  
Jede Änderung kommt über einen Feature-Branch und einen Pull Request.

---

## Schritt-für-Schritt

### 1. Stelle sicher, dass `main` aktuell ist
```bash
git checkout main
git pull origin main
```

### 2. Erstelle einen Feature-Branch
```bash
git checkout -b feat/mein-feature
# Oder für Bugfixes:
git checkout -b fix/mein-bugfix
```

**Branch-Namenskonventionen:**
| Typ | Prefix | Beispiel |
|---|---|---|
| Neues Feature | `feat/` | `feat/ev-dashboard-chart` |
| Bugfix | `fix/` | `fix/translation-toggle` |
| Refactoring | `refactor/` | `refactor/language-context` |
| CI/Workflow | `ci/` | `ci/playwright-update` |
| Docs | `docs/` | `docs/api-readme` |

### 3. Änderungen machen und committen
```bash
git add frontend/src/components/MyComponent.tsx
git commit -m "feat: add EV chart component"
```

**Commit-Nachricht-Format:**
```
feat: kurze Beschreibung
fix: kurze Beschreibung
ci: kurze Beschreibung
docs: kurze Beschreibung
```

### 4. Branch pushen
```bash
git push origin feat/mein-feature
```

### 5. Pull Request erstellen
```bash
gh pr create \
  --title "feat: Mein Feature" \
  --body "## Was wurde geändert?\n\n- ..." \
  --base main
```

Oder auf GitHub.com: **"Compare & pull request"** klicken.

### 6. Playwright-Check abwarten
- GitHub Actions startet automatisch `playwright` Check
- Warte bis ✅ grün
- Dann: **Merge pull request** klicken

---

## Branch Protection Regeln

- ❌ Kein direkter Push auf `main`
- ✅ PR erforderlich
- ✅ Playwright-Check muss grün sein vor Merge
- ✅ Force-Push deaktiviert

---

## Schnelle Referenz

```bash
# Neuer Branch
git checkout main && git pull && git checkout -b feat/name

# Änderungen pushen
git add <files> && git commit -m "feat: ..." && git push origin feat/name

# PR erstellen
gh pr create --title "feat: ..." --base main

# PR mergen (nach grünem Check)
gh pr merge --squash

# Zurück zu main
git checkout main && git pull
```
