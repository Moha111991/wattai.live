# 🎨 UI/UX Design System & Best Practices
## EnergyFlowHub_EV Frontend Guidelines

---

## 📋 Inhaltsverzeichnis

1. [Design-Prinzipien](#design-prinzipien)
2. [Farbpalette](#farbpalette)
3. [Typographie](#typographie)
4. [Spacing & Layout](#spacing--layout)
5. [Komponenten-Bibliothek](#komponenten-bibliothek)
6. [Responsive Design](#responsive-design)
7. [Accessibility (A11Y)](#accessibility-a11y)
8. [Animation & Interaktion](#animation--interaktion)
9. [Best Practices](#best-practices)

---

## 🎯 Design-Prinzipien

### 1. **Klarheit vor Komplexität**
- Informationen hierarchisch präsentieren
- Wichtige Metriken sofort sichtbar
- Sekundäre Details auf Anforderung (Progressive Disclosure)

### 2. **Echtzeit-Feedback**
- Live-Updates mit visuellen Indikatoren (Pulse-Animationen)
- Sofortige Rückmeldung bei Benutzeraktionen
- Status-Badges für System-Zustände

### 3. **Datenvisualisierung**
- Kontext über reine Zahlen stellen
- Icons + Farben für schnelles Verständnis
- Trends und Vergleiche visualisieren

### 4. **Mobile-First**
- Alle Funktionen auf kleinen Bildschirmen nutzbar
- Touch-optimierte Interaktionen (min. 44x44px Touchpoints)
- Responsive Grids mit auto-fit/minmax

---

## 🎨 Farbpalette

### Primärfarben (Funktional)

```css
/* PV-Erzeugung / Solar */
--color-solar: #F59E0B;      /* amber-500 */
--color-solar-light: #FCD34D; /* amber-300 */
--color-solar-dark: #D97706;  /* amber-600 */

/* Batterie / Speicher */
--color-battery: #3B82F6;     /* blue-500 */
--color-battery-light: #93C5FD; /* blue-300 */
--color-battery-dark: #2563EB; /* blue-600 */

/* EV / Elektromobilität */
--color-ev: #6366F1;          /* indigo-500 */
--color-ev-light: #A5B4FC;    /* indigo-300 */
--color-ev-dark: #4F46E5;     /* indigo-600 */

/* Netz Import */
--color-grid-import: #EF4444; /* red-500 */

/* Netz Export */
--color-grid-export: #10B981; /* green-500 */

/* Hausverbrauch */
--color-house: #3B82F6;       /* blue-600 */
```

### Status-Farben

```css
/* Success */
--color-success: #10B981;     /* green-500 */
--color-success-bg: #D1FAE5;  /* green-100 */
--color-success-border: #86EFAC; /* green-300 */

/* Warning */
--color-warning: #F59E0B;     /* amber-500 */
--color-warning-bg: #FEF3C7;  /* amber-100 */
--color-warning-border: #FCD34D; /* amber-300 */

/* Error */
--color-error: #EF4444;       /* red-500 */
--color-error-bg: #FEE2E2;    /* red-100 */
--color-error-border: #FCA5A5; /* red-300 */

/* Info */
--color-info: #3B82F6;        /* blue-500 */
--color-info-bg: #DBEAFE;     /* blue-100 */
--color-info-border: #93C5FD; /* blue-300 */
```

### Neutralfarben

```css
--color-gray-50: #F9FAFB;
--color-gray-100: #F3F4F6;
--color-gray-200: #E5E7EB;
--color-gray-300: #D1D5DB;
--color-gray-400: #9CA3AF;
--color-gray-500: #6B7280;
--color-gray-600: #4B5563;
--color-gray-700: #374151;
--color-gray-800: #1F2937;
--color-gray-900: #111827;
```

---

## ✍️ Typographie

### Font Stack

```css
--font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 
             Roboto, 'Helvetica Neue', Arial, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', 
             Consolas, monospace;
```

### Font Sizes (Responsive mit Clamp)

```css
/* Headings */
--text-h1: clamp(2rem, 5vw, 3rem);      /* 32-48px */
--text-h2: clamp(1.5rem, 4vw, 2.25rem); /* 24-36px */
--text-h3: clamp(1.25rem, 3vw, 1.875rem); /* 20-30px */
--text-h4: clamp(1.125rem, 2.5vw, 1.5rem); /* 18-24px */

/* Body */
--text-base: 1rem;      /* 16px */
--text-sm: 0.875rem;    /* 14px */
--text-xs: 0.75rem;     /* 12px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */

/* Metrics / Numbers */
--text-metric: clamp(1.5rem, 4vw, 2.5rem); /* 24-40px */
```

### Font Weights

```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

---

## 📐 Spacing & Layout

### Spacing Scale

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Border Radius

```css
--radius-sm: 0.375rem;   /* 6px */
--radius-md: 0.5rem;     /* 8px */
--radius-lg: 0.75rem;    /* 12px */
--radius-xl: 1rem;       /* 16px */
--radius-2xl: 1.5rem;    /* 24px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

### Grid Patterns

```css
/* Responsive Auto-Fit Grid */
.grid-responsive {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: 1rem;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
  gap: 1.5rem;
}

/* Metric Cards Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
  gap: 1rem;
}
```

---

## 🧩 Komponenten-Bibliothek

### 1. **Metric Card**

**Verwendung:** Anzeige einzelner Metriken (SOC, Power, etc.)

```tsx
<div className="metric-card">
  <div className="metric-label">PV-Leistung</div>
  <div className="metric-value">3.42 <span>kW</span></div>
  <div className="metric-trend">+12% vs. gestern</div>
</div>
```

**CSS:**
```css
.metric-card {
  background: linear-gradient(135deg, #FEF3C7 0%, #FCD34D 100%);
  border-radius: var(--radius-xl);
  padding: var(--space-4);
  box-shadow: var(--shadow-md);
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}

.metric-value {
  font-size: var(--text-metric);
  font-weight: var(--font-bold);
  color: var(--color-gray-900);
}
```

### 2. **Status Badge**

**Verwendung:** Systemstatus, Gerätezustände

```tsx
<StatusBadge 
  status="success" 
  label="Online" 
  icon="🟢" 
  pulse={true} 
/>
```

### 3. **Energy Flow Arrow**

**Verwendung:** Visualisierung von Energieflüssen

```tsx
<EnergyFlowArrow 
  direction="right" 
  size={32} 
  color="#10B981" 
  animated={true} 
/>
```

### 4. **Charging Station Icon**

**Verwendung:** Ladestations-Status

```tsx
<ChargingStationIcon 
  size={40} 
  status="charging" 
  animated={true} 
/>
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile First */
/* Basis: 320px - 479px (Mobile) */

@media (min-width: 480px) {
  /* Large Mobile / Small Tablet */
}

@media (min-width: 768px) {
  /* Tablet */
  .dashboard-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  /* Desktop */
  .dashboard-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  /* Large Desktop */
  .dashboard-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Container Queries (Modern)

```css
.card-container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-content {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

### Touch Targets

```css
/* Minimum 44x44px für Touch */
.btn, .interactive {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-3) var(--space-4);
}
```

---

## ♿ Accessibility (A11Y)

### Kontrast-Verhältnisse

- **Normaler Text:** min. 4.5:1
- **Großer Text (18px+):** min. 3:1
- **Interaktive Elemente:** min. 3:1

### ARIA-Labels

```tsx
<button 
  aria-label="Ladevorgang starten"
  aria-pressed={isCharging}
>
  {isCharging ? '⏸️ Stoppen' : '▶️ Starten'}
</button>
```

### Tastaturnavigation

```css
/* Focus-sichtbar machen */
*:focus-visible {
  outline: 2px solid var(--color-info);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### Semantisches HTML

```tsx
<main>
  <h1>Dashboard</h1>
  <section aria-labelledby="metrics-heading">
    <h2 id="metrics-heading">Live-Metriken</h2>
    {/* Content */}
  </section>
</main>
```

---

## 🎭 Animation & Interaktion

### Transition Timing

```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;

--easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Hover-Effekte

```css
.card {
  transition: all var(--duration-normal) var(--easing-smooth);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}
```

### Pulse-Animation (Live-Daten)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-live {
  animation: pulse 2s var(--easing-smooth) infinite;
}
```

### Loading States

```tsx
<div className="skeleton">
  <div className="skeleton-line" />
  <div className="skeleton-line short" />
</div>
```

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton-line {
  height: 1rem;
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--radius-md);
}
```

---

## ✅ Best Practices

### 1. **Performance**

- Lazy-load Komponenten mit React.lazy()
- Bilder mit WebP + Fallback
- CSS-in-JS nur für dynamische Styles
- Tailwind für statische Utilities

### 2. **Code-Organisation**

```
components/
├── icons/
│   └── EnergyIcons.tsx
├── charts/
│   └── EnergyFlowDiagram.tsx
├── cards/
│   ├── MetricCard.tsx
│   └── StatusCard.tsx
└── widgets/
    ├── AIRecommendationsWidget.tsx
    └── ChargingStationStatus.tsx
```

### 3. **State Management**

- Lokaler State für UI-Zustand (useState)
- Context für globale Settings
- WebSocket für Real-time Updates

### 4. **Error Handling**

```tsx
{error && (
  <div className="error-banner" role="alert">
    <span className="error-icon">⚠️</span>
    <span>{error}</span>
  </div>
)}
```

### 5. **Loading States**

```tsx
{loading ? (
  <Skeleton />
) : data ? (
  <DataDisplay data={data} />
) : (
  <EmptyState />
)}
```

### 6. **Empty States**

```tsx
<div className="empty-state">
  <span className="empty-icon">📊</span>
  <h3>Noch keine Daten</h3>
  <p>Verbinden Sie ein Gerät, um Daten anzuzeigen</p>
  <button>Gerät hinzufügen</button>
</div>
```

---

## 🚀 Quick Reference

### Häufigste UI-Patterns

1. **Metric Card:** Einzelne Kennzahl mit Trend
2. **Status Badge:** Gerätezustand (Online/Offline)
3. **Energy Flow:** Animierte Pfeile zwischen Komponenten
4. **Progress Bar:** Ladezustand, SOC, etc.
5. **Time Series Chart:** Verlauf über 24h/7d
6. **Action Buttons:** CTA mit Icon + Label
7. **Notification Toast:** Temporäre Bestätigung

### Do's ✅

- Mobile-First entwickeln
- Icons für schnelles Verständnis
- Einheiten immer anzeigen (kW, %, €)
- Live-Updates visuell hervorheben
- Fehler-Zustände klar kommunizieren

### Don'ts ❌

- Keine rein numerischen Displays ohne Kontext
- Keine winzigen Touch-Targets (<44px)
- Keine Animationen ohne prefers-reduced-motion Check
- Keine wichtigen Infos nur über Farbe
- Keine unlabeled Icons

---

## 📚 Weiterführende Ressourcen

- **Tailwind CSS:** https://tailwindcss.com
- **React Icons:** https://react-icons.github.io
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Material Design:** https://m3.material.io
- **Recharts Documentation:** https://recharts.org

---

**Version:** 1.0  
**Letzte Aktualisierung:** 2026-05-04  
**Maintainer:** EnergyFlowHub_EV Team
