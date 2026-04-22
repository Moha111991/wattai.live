# Telemetrie & Datenschutz (DSGVO-Compliance)

## Übersicht

Dieses Dokument beschreibt die **Datenschutz-Maßnahmen** für das Telemetrie-System des AI-basierten Energiemanagementsystems. Das System implementiert **Federated Learning** zur kontinuierlichen Verbesserung der Edge-AI Modelle unter strikter Einhaltung der **DSGVO (Datenschutz-Grundverordnung)** und **Privacy by Design** Prinzipien.

## Federated Learning - Was ist das?

**Federated Learning** ist eine Machine-Learning-Technik, bei der ein Modell über viele dezentrale Geräte (z.B. Fahrzeuge) trainiert wird, **ohne dass die rohen Daten diese Geräte verlassen**.

### Wie funktioniert es?

```
1. Fahrzeug A lernt lokal (Edge-AI Modell)
   └─> Sendet nur aggregierte Statistiken (z.B. "60% Solar Charging")
   
2. Fahrzeug B lernt lokal
   └─> Sendet nur aggregierte Statistiken

3. Zentrales System
   └─> Kombiniert Statistiken von vielen Fahrzeugen
   └─> Trainiert verbesserte Modellversion
   └─> Sendet Update an alle Fahrzeuge (OTA)

4. Fahrzeug A & B
   └─> Erhalten verbessertes Modell
   └─> Keine rohen Daten wurden geteilt!
```

## DSGVO-Konformität

### Art. 5 DSGVO: Grundsätze der Datenverarbeitung

#### 1. Rechtmäßigkeit, Verarbeitung nach Treu und Glauben, Transparenz

✅ **Implementiert:**
- Explizite Nutzer-Einwilligung (Opt-in) erforderlich
- Klare Information über gesammelte Daten
- Transparente Darstellung in der UI
- Jederzeit widerrufbar (Opt-out)

**Code-Implementierung:**

```python
# backend/telemetry.py
def enable(self):
    """Aktiviert Telemetrie (Nutzer-Opt-in)"""
    self.enabled = True
    logger.info("📊 Telemetrie aktiviert (Opt-in)")

def disable(self):
    """Deaktiviert Telemetrie (Nutzer-Opt-out)"""
    self.enabled = False
    self._clear_data()  # Löscht ALLE gesammelten Daten
    logger.info("🚫 Telemetrie deaktiviert (Opt-out)")
```

#### 2. Zweckbindung

✅ **Implementiert:**
- Daten werden **ausschließlich** zur Verbesserung der Edge-AI Modelle verwendet
- Keine Weitergabe an Dritte
- Kein Verkauf von Daten
- Keine Profilbildung

**Zweck:** Verbesserung der AI-Modelle für alle Nutzer (Collective Intelligence)

#### 3. Datenminimierung

✅ **Implementiert:**
- Nur aggregierte Statistiken
- Keine persönlichen Daten
- Kategorisierung statt Absolutwerte
- Kurze Speicherdauer (max. 30 Tage bis Retraining)

**Gesammelte Daten:**

| Datentyp | Beispiel | Anonymisiert? |
|----------|----------|---------------|
| Entscheidungsverteilung | "60% Solar Charging, 30% V2G" | ✅ Ja |
| State-Kategorie | "medium_soc_high_pv_low_price" | ✅ Ja |
| Reward-Statistiken | "Avg Reward: 0.85 ± 0.12" | ✅ Ja |
| Performance-Metriken | "Avg Cost: 0.28 €, CO₂: 150g" | ✅ Ja |
| Stündliche Muster | "Stunde 14: Avg Cost 0.25 €" | ✅ Ja |

**NICHT gesammelte Daten:**

| Datentyp | Grund |
|----------|-------|
| Fahrzeug-ID (VIN) | Personenbezogen |
| GPS-Koordinaten | Standortverfolgung |
| IP-Adressen | Netzwerk-Identifikation |
| Nutzername / E-Mail | Personenbezogen |
| Zeitstempel (exakt) | Nur Stunde (0-23), kein Datum |
| Fahrmuster | Zu detailliert, nicht erforderlich |

#### 4. Richtigkeit

✅ **Implementiert:**
- Nur validierte Daten (Pydantic Input Validation)
- Plausibility Checks (z.B. SOC 0-100%)
- Fehlerhafte Daten werden abgelehnt

```python
class TelemetryData(BaseModel):
    """Telemetrie-Daten von Fahrzeug"""
    ev_soc: float  # 0-100%
    battery_soc: float  # 0-100%
    pv_power: float  # >= 0 kW
    grid_price: float  # 0.10-1.00 €/kWh
    action_taken: str
    reward: float
    cost: float
    co2: float
    autarky: float
```

#### 5. Speicherbegrenzung

✅ **Implementiert:**
- Daten werden nach 30 Tagen automatisch gelöscht
- Nach Retraining werden Rohdaten entfernt
- Nur aggregierte Modell-Verbesserungen bleiben

```python
class FederatedRetrainer:
    def __init__(self, agent_type: str = "dqn"):
        self.retrain_interval = timedelta(days=30)  # Monatlich
    
    async def retrain_agent(self):
        # Training durchführen
        results = await self._train_with_telemetry()
        
        # Rohdaten löschen nach Training
        self.telemetry_data.clear()
        
        return results
```

#### 6. Integrität und Vertraulichkeit

✅ **Implementiert:**
- TLS 1.3 verschlüsselte Übertragung
- Rate Limiting gegen Tracking (60 Requests/Stunde)
- API-Key-Authentifizierung für Admin-Endpoints
- Session-ID ändert sich bei Neustart (keine persistente Verfolgung)

```python
@app.post("/telemetry/submit")
@limiter.limit("60/hour")  # Rate Limiting
async def submit_telemetry(request: Request, data: TelemetryData):
    # TLS 1.3 wird vom Reverse Proxy erzwungen
    # Siehe: ISO21434_COMPLIANCE.md
    pass
```

### Art. 7 DSGVO: Bedingungen für die Einwilligung

✅ **Implementiert:**

1. **Eindeutige bestätigende Handlung:** 
   - Button "✅ Telemetrie aktivieren" muss geklickt werden
   - Keine Pre-Checked Checkboxen
   
2. **Widerrufbarkeit:**
   - Button "🚫 Telemetrie deaktivieren" jederzeit verfügbar
   - Alle Daten werden sofort gelöscht

3. **Informierte Einwilligung:**
   - Klare Beschreibung was gesammelt wird
   - Datenschutz-Garantien werden angezeigt
   - Beispiele für gesammelte Daten

### Art. 15 DSGVO: Auskunftsrecht der betroffenen Person

✅ **Implementiert:**

Der Nutzer kann jederzeit einsehen:
- Telemetrie-Status (aktiviert/deaktiviert)
- Anzahl gesammelter Samples
- Session-ID (anonymisiert)
- Letzte Submission

**UI-Implementierung:**

```python
# app.py - Streamlit UI
st.metric("Gesammelte Samples", samples_collected)
st.metric("Session-ID", session_id[:8] + "...")
st.caption("Ändert sich bei jedem Neustart")
```

### Art. 17 DSGVO: Recht auf Löschung ("Recht auf Vergessenwerden")

✅ **Implementiert:**

```python
def disable(self):
    """Deaktiviert Telemetrie (Nutzer-Opt-out)"""
    self.enabled = False
    self._clear_data()  # Löscht ALLE gesammelten Daten
    logger.info("🚫 Telemetrie deaktiviert (Opt-out)")

def _clear_data(self):
    """Löscht alle gesammelten Daten"""
    self.decision_counts.clear()
    self.state_distribution.clear()
    self.reward_stats.clear()
    self.performance_metrics.clear()
```

**Garantie:** Bei Opt-out werden **ALLE** gesammelten Daten sofort gelöscht.

### Art. 25 DSGVO: Datenschutz durch Technikgestaltung und datenschutzfreundliche Voreinstellungen

✅ **Privacy by Design implementiert:**

1. **Standardmäßig deaktiviert:** Telemetrie ist per Default **AUS**
2. **Anonymisierung:** Daten werden automatisch anonymisiert
3. **Session-ID:** Ändert sich bei jedem Neustart (keine persistente User-Verfolgung)
4. **Kategorisierung:** Nur Kategorien statt Absolutwerte
5. **Aggregation:** Nur Statistiken, keine Rohdaten
6. **Rate Limiting:** Schutz vor Tracking durch Submission-Limits

**Beispiel - Automatische Anonymisierung:**

```python
def _categorize_state(self, state: Dict[str, Any]) -> str:
    """
    Konvertiert State in anonymisierte Kategorie
    
    Beispiel:
    {soc: 45%, pv: 8kW, price: 0.28} → "medium_soc_high_pv_low_price"
    """
    soc = state.get('ev_soc', 50)
    pv = state.get('pv_power', 0)
    price = state.get('grid_price', 0.28)
    
    soc_cat = "low" if soc < 30 else "medium" if soc < 70 else "high"
    pv_cat = "none" if pv < 1 else "low" if pv < 5 else "high"
    price_cat = "low" if price < 0.25 else "medium" if price < 0.35 else "high"
    
    return f"{soc_cat}_soc_{pv_cat}_pv_{price_cat}_price"
```

**Rohdaten:** `{soc: 45%, pv: 8kW, price: 0.28}`  
**Anonymisiert:** `"medium_soc_high_pv_low_price"`

→ Keine Rückschlüsse auf individuelle Fahrmuster möglich!

### Art. 32 DSGVO: Sicherheit der Verarbeitung

✅ **Technische Maßnahmen:**

1. **Verschlüsselung in transit:** TLS 1.3 (siehe ISO21434_COMPLIANCE.md)
2. **Rate Limiting:** Schutz vor Missbrauch
3. **API-Key-Authentifizierung:** Admin-Endpoints geschützt
4. **Input Validation:** Pydantic Validators
5. **Audit Logging:** Tamper-proof audit trail (siehe backend/secure_logging.py)

## Datenschutz-Erklärung (Nutzer-sichtbar)

### Was wird gesammelt?

Wir sammeln **anonymisierte, aggregierte Statistiken** über Energieentscheidungen:

- ✅ Prozentsatz verschiedener Ladestrategien (z.B. "60% Solar Charging")
- ✅ Durchschnittliche Kosten und CO₂-Emissionen
- ✅ Häufigkeit verschiedener Systemzustände (z.B. "hohes PV + niedriger Preis")
- ✅ Stündliche Nutzungsmuster (nur Stunde 0-23, kein Datum)

### Was wird NICHT gesammelt?

- ❌ Fahrzeug-IDs (VIN, Seriennummern)
- ❌ GPS-Koordinaten oder Standorte
- ❌ IP-Adressen
- ❌ Persönliche Nutzerdaten (Name, E-Mail, Telefon)
- ❌ Exakte Zeitstempel (nur Stunde des Tages)
- ❌ Individuelle Fahrmuster

### Warum sammeln wir Daten?

Um die **Edge-AI Modelle für alle Nutzer zu verbessern**:

1. Fahrzeug lernt lokal (keine Cloud nötig)
2. Sendet anonymisierte Statistiken (Opt-in erforderlich)
3. Zentrale KI lernt aus aggregierten Daten vieler Nutzer
4. Alle erhalten verbesserte Modellversion (OTA-Update)

**Beispiel:**
- 1000 Nutzer aktivieren Telemetrie
- System lernt: "Bei hohem PV-Überschuss ist Solar Charging optimal"
- Neue Modellversion wird trainiert
- Alle 1000 Nutzer (+ alle anderen) profitieren von besserer KI

### Wie kann ich mitmachen?

1. **Opt-in:** Klicken Sie "✅ Telemetrie aktivieren" im "Mein E-Auto" Tab
2. **Opt-out:** Jederzeit deaktivierbar mit "🚫 Telemetrie deaktivieren"
3. **Automatisch:** System sammelt anonymisierte Daten im Hintergrund
4. **Transparent:** Sie sehen jederzeit wie viele Samples gesammelt wurden

### Wie sind meine Daten geschützt?

1. **Verschlüsselung:** TLS 1.3 für alle Übertragungen
2. **Anonymisierung:** Session-ID ändert sich bei Neustart
3. **Kategorisierung:** Nur Bereiche, keine Absolutwerte
4. **Löschung:** Alle Daten werden bei Opt-out sofort gelöscht
5. **Speicherdauer:** Max. 30 Tage, dann automatisch gelöscht

## Rechtsgrundlage

**Art. 6 Abs. 1 lit. a DSGVO:** Einwilligung der betroffenen Person

- Nutzer muss explizit "Opt-in" klicken
- Einwilligung ist jederzeit widerrufbar
- Bei Widerruf werden alle Daten gelöscht

## Verantwortlicher

**Energiemanagementsystem Entwickler:**
- E-Mail: privacy@ems-system.local
- Datenschutzbeauftragter: dpo@ems-system.local

## Betroffenenrechte

Nutzer haben folgende Rechte:

1. **Auskunftsrecht** (Art. 15 DSGVO)
   - Einsicht in gesammelte Daten über Telemetrie-Status UI

2. **Berichtigungsrecht** (Art. 16 DSGVO)
   - Nicht anwendbar (keine personenbezogenen Daten)

3. **Löschungsrecht** (Art. 17 DSGVO)
   - Opt-out Button → Alle Daten werden gelöscht

4. **Widerspruchsrecht** (Art. 21 DSGVO)
   - Opt-out Button → Telemetrie wird deaktiviert

5. **Recht auf Datenübertragbarkeit** (Art. 20 DSGVO)
   - Nicht anwendbar (nur aggregierte Statistiken)

## Technische Umsetzung - Checkliste

- [x] Explizite Opt-in Einwilligung
- [x] Jederzeit widerrufbar (Opt-out)
- [x] Automatische Anonymisierung
- [x] Session-ID ändert sich bei Neustart
- [x] Keine persönlichen Daten
- [x] Kategorisierung statt Absolutwerte
- [x] Rate Limiting (60 Requests/Stunde)
- [x] TLS 1.3 Verschlüsselung
- [x] Speicherdauer max. 30 Tage
- [x] Automatische Löschung nach Retraining
- [x] Input Validation (Pydantic)
- [x] Audit Logging (Tamper-proof)
- [x] Transparente UI (Streamlit)
- [x] Nutzer-Auskunftsrecht (Status-Anzeige)

## Audit-Trail

Alle Telemetrie-Aktivitäten werden im Audit-Log protokolliert:

```python
# backend/secure_logging.py Integration
audit_logger.log_event(
    event_type="telemetry_opt_in",
    user_id="anonymous",  # Keine User-IDs
    session_id=collector.session_id,
    details={"samples_collected": collector.samples_collected}
)
```

## Kontakt

Bei Fragen zum Datenschutz:
- **E-Mail:** privacy@ems-system.local
- **Datenschutzbeauftragter:** dpo@ems-system.local
- **Issue Tracker:** https://github.com/ems-system/issues

---

**Dokument-Version:** 1.0  
**Stand:** 2025-11-10  
**Klassifizierung:** Public  
**Nächste Review:** 2026-01-10
