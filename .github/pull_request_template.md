## 📝 Summary
<!-- One-liner: what changed and why -->


## 🔗 Related Issues / Tasks
<!-- e.g. Closes #42, Fixes #17 -->


---

## 🧪 QA Checklist

### General
- [ ] Build passes locally (`npm run build` → exit 0)
- [ ] No new TypeScript / ESLint errors introduced
- [ ] No console errors or warnings in the browser
- [ ] Deployment pipeline triggered on Railway (check deploy log)

### Theme – Dark Mode 🌙
- [ ] All text in **Fehler- & Alarmmonitor** is readable (light/white text on dark bg)
- [ ] All text in **Hausautomation / Smart Home** tab is readable
- [ ] All text in **Geräte** (DeviceGrid) cards is readable
- [ ] Accent colors (orange, green, blue, red) are unchanged
- [ ] Toggle-Schalter visible and functional
- [ ] Input placeholders readable
- [ ] Monospace / code output (Diagnose, Logfile) readable

### Theme – Light Mode ☀️
- [ ] All text in **Fehler- & Alarmmonitor** is dark / readable
- [ ] Device labels (Waschmaschine, Wärmepumpe …) are dark, not white
- [ ] Card backgrounds are light (white/off-white)
- [ ] Borders visible (not invisible on white bg)
- [ ] Accent colors (orange, green, blue, red) are unchanged
- [ ] Toggle-Schalter visible and functional
- [ ] Input placeholders readable

### Responsive
- [ ] Mobile (375 px) — no overflow, no clipped text
- [ ] Tablet (768 px) — layout correct
- [ ] Desktop (1440 px) — layout correct

### Accessibility
- [ ] Sufficient contrast ratio for body text (≥ 4.5 : 1 WCAG AA)
- [ ] Sufficient contrast ratio for muted/secondary text (≥ 3 : 1 WCAG AA Large)
- [ ] Focus outlines visible in both themes

---

## 📸 Screenshots

> **Instructions**: paste browser screenshots here.  
> Recommended tool: browser DevTools → toggle `data-theme` attribute on `<html>`.

| View | Dark Mode 🌙 | Light Mode ☀️ |
|---|---|---|
| Fehler- & Alarmmonitor | _paste screenshot_ | _paste screenshot_ |
| Smart Home – Hausautomation | _paste screenshot_ | _paste screenshot_ |
| Geräte (DeviceGrid) | _paste screenshot_ | _paste screenshot_ |
| Mobile (375 px) | _paste screenshot_ | _paste screenshot_ |

---

## 🚀 Deployment
- [ ] Railway auto-deploy triggered from `main`
- [ ] Verified live at [https://www.wattai.live](https://www.wattai.live)
- [ ] No errors in Railway deploy log

---

## 📋 Notes for Reviewers
<!-- Anything the reviewer should know: edge cases, known limitations, follow-up tasks -->
