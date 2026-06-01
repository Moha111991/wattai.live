# QA Checklist – Light/Dark Mode Text-Color Fix

**PR / Commit:** `fix(theme): normalize inline colors for dark mode + rgb() serialization fix`  
**Date:** 2026-06-01  
**Affected files:**
- `frontend/src/index.css` — dark-mode text normalization rules added; rgb/rgba serialization variants for light mode

---

## 🎯 Goal
Ensure all text labels (e.g. "Waschmaschine", "Fehler- & Alarmmonitor" headings, muted subtexts, monospace output) are:
- **Dark mode** → light/white text on dark backgrounds (readable)
- **Light mode** → dark text on light backgrounds (readable, not white-on-white)

---

## 🔧 How to manually toggle themes for testing
1. Open [https://www.wattai.live](https://www.wattai.live) in Chrome / Firefox
2. Open DevTools → Console → run:
   ```js
   // Switch to light mode
   document.documentElement.setAttribute('data-theme', 'light')
   
   // Switch back to dark mode
   document.documentElement.setAttribute('data-theme', 'dark')
   ```
3. Or use the in-app theme toggle (sun/moon icon).

---

## ✅ Test Cases

### 1 — Fehler- & Alarmmonitor

| Check | Dark 🌙 | Light ☀️ |
|---|---|---|
| Panel heading readable | ☐ | ☐ |
| Error / warning labels readable | ☐ | ☐ |
| Timestamp text readable | ☐ | ☐ |
| Accent colors (red = error, orange = warn, green = ok) unchanged | ☐ | ☐ |

---

### 2 — Smart Home → Hausautomation

| Check | Dark 🌙 | Light ☀️ |
|---|---|---|
| Device category labels (Wärmepumpe, Waschmaschine …) readable | ☐ | ☐ |
| Protocol badge text readable | ☐ | ☐ |
| Connection status (Online / Getrennt) readable | ☐ | ☐ |
| Live Leistung (W / V / A) values readable | ☐ | ☐ |
| Automation rule labels readable | ☐ | ☐ |
| Toggle switch visible and functional | ☐ | ☐ |
| Diagnose output (monospace) readable | ☐ | ☐ |
| Logfile output (monospace) readable | ☐ | ☐ |
| Step indicator (Gerät wählen → Protokoll → …) readable | ☐ | ☐ |

---

### 3 — Geräte Tab (DeviceGrid)

| Check | Dark 🌙 | Light ☀️ |
|---|---|---|
| Card titles (Batterie, Wallbox, …) readable | ☐ | ☐ |
| Stat values (kWh, %, kW) readable | ☐ | ☐ |
| Muted sub-labels readable | ☐ | ☐ |
| Action button text readable | ☐ | ☐ |

---

### 4 — Responsive

| Breakpoint | Dark 🌙 | Light ☀️ |
|---|---|---|
| 375 px (iPhone SE) | ☐ | ☐ |
| 390 px (iPhone 14) | ☐ | ☐ |
| 768 px (iPad) | ☐ | ☐ |
| 1440 px (Desktop) | ☐ | ☐ |

---

## 📸 Screenshots

> Paste screenshots here after manual QA.  
> Use DevTools → toggle `data-theme` → screenshot.

### Fehler- & Alarmmonitor

| Dark Mode 🌙 | Light Mode ☀️ |
|---|---|
| _[paste]_ | _[paste]_ |

### Hausautomation – Geräteliste (Step 5)

| Dark Mode 🌙 | Light Mode ☀️ |
|---|---|
| _[paste]_ | _[paste]_ |

### DeviceGrid cards

| Dark Mode 🌙 | Light Mode ☀️ |
|---|---|
| _[paste]_ | _[paste]_ |

---

## 🐛 Known limitations / edge cases

| Issue | Workaround / Status |
|---|---|
| Accent colors hardcoded as hex (e.g. `#ff9500`) → not overridden by theme CSS | ✅ Intentional — kept as-is |
| `background` inline styles using semi-transparent dark overlays may not invert in light mode in every browser | Covered by `rgba(0,0,0,...)` → `rgba(15,23,42,...)` rules in index.css |
| Chrome serializes `#f8fafc` → `rgb(248, 250, 252)` in style attribute | ✅ Fixed — added `[style*="color: rgb(248, 250, 252)"]` selector |
| Inline `color: rgba(...)` with decimals e.g. `0.55` may not match if space-variant differs | Covered by dual selector (with and without spaces) |

---

## 🔄 Follow-up tasks (optional)

- [ ] Migrate hardcoded inline `color:` values in `.tsx` files to CSS variables (`--wai-text`, `--wai-text-muted`) for long-term maintainability
- [ ] Add Storybook visual regression snapshots for dark/light theme per component
- [ ] Add a Playwright test that toggles `data-theme` and checks computed text color on key selectors
