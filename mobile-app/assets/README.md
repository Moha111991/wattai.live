# Assets Platzhalter

Für eine vollständige App benötigen Sie folgende Assets:

## Icons & Splash Screens

1. **icon.png** (1024x1024)
   - App-Icon für App Stores
   
2. **splash.png** (1284x2778)
   - Splash Screen beim App-Start

3. **adaptive-icon.png** (1024x1024)
   - Android Adaptive Icon (Vordergrund)

4. **notification-icon.png** (96x96)
   - Icon für Push-Benachrichtigungen

5. **favicon.png** (48x48)
   - Web-Version Favicon

## Generierung

Sie können Icons automatisch generieren mit:
```bash
npm install -g @expo/image-utils
expo-optimize
```

Oder online-Tools verwenden:
- https://icon.kitchen/
- https://www.appicon.co/

## Temporäre Lösung

Für Development können Sie einfache Platzhalter verwenden.
Erstellen Sie einfarbige PNGs in den oben genannten Größen.
