# WattAI.live Logo

## Übersicht

Das WattAI.live Logo ist das zentrale grafische Erkennungszeichen der Marke. Es kombiniert moderne Energie-Symbolik mit KI-Design-Elementen.

## Design-Konzept

### Symbolik
- **⚡ Blitz**: Repräsentiert Energie, Schnelligkeit und Innovation
- **🧠 Neural Ring**: Symbolisiert KI, maschinelles Lernen und intelligente Vernetzung
- **🔗 Nodes**: Stehen für IoT, Smart Home und Konnektivität
- **🌈 Gradient**: Vermittelt Zukunft, Technologie und Dynamik

### Farbpalette
- **Primary Cyan**: `#67e8f9` - Hauptfarbe für Tech-Feeling
- **Primary Blue**: `#3b82f6` - Vertrauenswürdig und professionell
- **Deep Blue**: `#2563eb` - Tiefe und Stabilität
- **Accent Amber**: `#fbbf24` - Energie und Wärme
- **Accent Orange**: `#f59e0b` - Dynamik und Action

### Typografie
- **Schriftart**: Inter (ExtraBold 800 für "Watt", Black 900 für "AI", Medium 500 für ".live")
- **Schriftschnitte**: Variable Gewichtung für visuelle Hierarchie
- **Gradient**: "Watt" und "AI" nutzen Farbverläufe für Premium-Look

## Logo-Varianten

### 1. Vollständiges Logo (Full)
- **Verwendung**: Header, Landingpages, Marketing-Materialien
- **Dateien**: 
  - `logo-full.svg` (statisch)
  - `WattAILogo` Component mit `variant="full"`
- **Mindestgröße**: 120px Breite

### 2. Icon/Symbol
- **Verwendung**: App-Icons, Favicon, Social Media Profilbilder
- **Dateien**: 
  - `logo-icon.svg` (statisch)
  - `WattAILogo` Component mit `variant="icon"`
- **Mindestgröße**: 64px × 64px

### 3. Text-Only
- **Verwendung**: Footer, E-Mail-Signaturen, Wasserzeichen
- **Dateien**: 
  - `WattAILogo` Component mit `variant="text"`
- **Mindestgröße**: 100px Breite

## Verwendungsrichtlinien

### ✅ Empfohlen
- Animierte Version für digitale Medien (Web, App)
- Statische Version für Print-Materialien
- Dunkler oder transparenter Hintergrund
- Ausreichend Freiraum (mindestens 20px ringsum)
- Mindestgröße beachten

### ❌ Nicht erlaubt
- Farben ändern oder neu einfärben
- Proportionen verzerren oder strecken
- Zusätzliche Schatten oder Effekte
- Logo auf hellem Hintergrund ohne Anpassung
- Unter Mindestgröße skalieren
- Text ändern oder umformulieren

## Technische Spezifikationen

### SVG-Export
- **Format**: SVG (Scalable Vector Graphics)
- **Farbmodus**: RGB
- **Transparenz**: Ja (transparent background)
- **Viewbox**: Optimiert für verschiedene Größen

### React Component
```typescript
import WattAILogo from './components/WattAILogo';

// Vollständiges Logo, animiert
<WattAILogo size={120} animated={true} variant="full" />

// Icon only, statisch
<WattAILogo size={80} animated={false} variant="icon" />

// Text only, animiert
<WattAILogo size={100} animated={true} variant="text" />
```

### Props
- `size`: number (default: 120) - Größe in Pixeln
- `animated`: boolean (default: true) - Aktiviert Animationen
- `variant`: 'full' | 'icon' | 'text' (default: 'full')
- `className`: string - Custom CSS-Klasse
- `style`: CSSProperties - Inline-Styles

## Animationen

### Energie-Effekte
- Pulsierende Neural Nodes
- Fließende Energie-Partikel entlang des Blitzes
- Atmende Glow-Effekte
- Sanfte Gradient-Übergänge

### Performance
- CSS-basierte Animationen für beste Performance
- GPU-beschleunigt
- Respektiert `prefers-reduced-motion` für Barrierefreiheit

## Dateien

```
frontend/
├── public/
│   ├── logo-full.svg          # Vollständiges Logo (statisch)
│   └── logo-icon.svg          # Icon/Symbol (statisch)
├── src/
│   ├── components/
│   │   └── WattAILogo.tsx     # React Component
│   └── pages/
│       └── LogoShowcase.tsx   # Brand Guidelines & Showcase
```

## Brand Guidelines

### Tonalität
- Modern und technologisch
- Professionell aber zugänglich
- Innovativ und zukunftsorientiert
- Vertrauenswürdig und zuverlässig

### Markenversprechen
"KI-gestützte Energie- und Lademanagement-Plattform für eine nachhaltige Zukunft"

## Kontakt & Support

Für Fragen zur Logo-Verwendung oder Brand Guidelines:
- Web: https://wattai.live
- E-Mail: branding@wattai.live

---

© 2026 WattAI.live · Alle Rechte vorbehalten
