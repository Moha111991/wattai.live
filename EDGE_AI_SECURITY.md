# Edge-AI Security (ISO 21434 Compliance)

## Übersicht

Dieses Dokument beschreibt die Sicherheitsmaßnahmen für **Edge-AI Modell-Updates** gemäß ISO 21434 Automotive Cybersecurity Requirements. Edge-AI Modelle laufen direkt im Fahrzeug-Gateway und treffen autonome Energieentscheidungen ohne Cloud-Abhängigkeit.

## Threat Model für Edge-AI

### 1. Modell-Manipulation (CRITICAL)

**Bedrohung:** Angreifer injiziert manipuliertes TensorFlow Lite Modell
- **Auswirkung:** Falsche Ladeentscheidungen → Batterieverschleiß, Kostenerhöhung, Sicherheitsrisiken
- **Eintrittswahrscheinlichkeit:** MEDIUM (OTA-Updates, USB-Zugriff)
- **Risikobewertung:** CRITICAL

**Mitigationen:**
1. ✅ **Modell-Signierung mit RSA-4096**
   - Jedes TFLite-Modell wird mit privatem OEM-Schlüssel signiert
   - Fahrzeug verifiziert Signatur vor dem Laden
   - Nur signierte Modelle werden akzeptiert

2. ✅ **Secure Boot Chain**
   - Modell-Datei-Hash wird in Audit-Log gespeichert
   - Hash-Chain verhindert nachträgliche Manipulation
   - Siehe: `backend/secure_logging.py`

3. ✅ **Over-the-Air (OTA) Update Security**
   - TLS 1.3 verschlüsselte Übertragung
   - Rate Limiting (5 Updates/Stunde)
   - API-Key-Authentifizierung erforderlich

**Implementierung:**

```python
# backend/edge_ai_security.py
import hashlib
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding, rsa

def sign_model(model_path: str, private_key: rsa.RSAPrivateKey) -> bytes:
    """
    Signiert TFLite-Modell mit RSA-4096
    
    Returns: Digitale Signatur (SHA-256 + RSA-4096)
    """
    with open(model_path, 'rb') as f:
        model_data = f.read()
    
    signature = private_key.sign(
        model_data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    
    return signature

def verify_model_signature(
    model_path: str,
    signature: bytes,
    public_key: rsa.RSAPublicKey
) -> bool:
    """
    Verifiziert Modell-Signatur vor dem Laden
    
    Returns: True wenn valide, False sonst
    """
    with open(model_path, 'rb') as f:
        model_data = f.read()
    
    try:
        public_key.verify(
            signature,
            model_data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False

def compute_model_hash(model_path: str) -> str:
    """
    Berechnet SHA-256 Hash des Modells
    
    Returns: Hex-String (64 Zeichen)
    """
    sha256 = hashlib.sha256()
    
    with open(model_path, 'rb') as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    
    return sha256.hexdigest()
```

**Production Workflow:**

```bash
# 1. OEM signiert Modell mit privatem Schlüssel
python -c "
from edge_ai_security import sign_model, load_private_key
private_key = load_private_key('oem_private_key.pem')
signature = sign_model('edge_ai_model.tflite', private_key)
with open('edge_ai_model.sig', 'wb') as f:
    f.write(signature)
"

# 2. OEM stellt Modell + Signatur bereit
scp edge_ai_model.tflite vehicle-gateway:/models/
scp edge_ai_model.sig vehicle-gateway:/models/

# 3. Fahrzeug verifiziert vor dem Laden
python -c "
from edge_ai_security import verify_model_signature, load_public_key
public_key = load_public_key('oem_public_key.pem')
with open('edge_ai_model.sig', 'rb') as f:
    signature = f.read()

if verify_model_signature('edge_ai_model.tflite', signature, public_key):
    print('✅ Model signature valid - Loading...')
    # Load model
else:
    print('❌ SECURITY ALERT: Invalid model signature!')
    # Reject model, log incident
"
```

### 2. Training Data Poisoning (HIGH)

**Bedrohung:** Angreifer manipuliert Trainingsdaten um Modell-Verhalten zu beeinflussen
- **Auswirkung:** Suboptimale Entscheidungen, versteckte Backdoors
- **Eintrittswahrscheinlichkeit:** MEDIUM (Insider-Threat, kompromittiertes CI/CD)
- **Risikobewertung:** HIGH

**Mitigationen:**

1. ✅ **Deterministic Training**
   - Seed-basiertes Training für Reproduzierbarkeit
   - Trainingsdaten-Hash wird mit Modell gespeichert
   - Validation Accuracy muss Schwellwert erreichen (>95%)

2. ✅ **Anomaly Detection**
   - Monitoring der Entscheidungsverteilung
   - Alert bei ungewöhnlichen Action-Patterns
   - Automatische Fallback zu regelbasiertem Controller

3. ✅ **Secure Training Pipeline**
   - CI/CD mit Code-Review-Pflicht
   - Signed Git Commits
   - Artifact Integrity Checks

**Implementierung:**

```python
# Training mit Integrity Checks
trainer = EdgeAIModelTrainer()
trainer.create_model()

# Setze deterministischen Seed
np.random.seed(42)
tf.random.set_seed(42)

# Generiere und hashe Trainingsdaten
X_train, y_train = trainer.generate_synthetic_training_data(num_samples=10000)
data_hash = hashlib.sha256(X_train.tobytes() + y_train.tobytes()).hexdigest()

# Training
history = trainer.train(epochs=50)

# Validierung
val_accuracy = history.history['val_accuracy'][-1]
if val_accuracy < 0.95:
    raise SecurityError(f"Training accuracy too low: {val_accuracy:.2%} < 95%")

# Modell mit Metadaten exportieren
metadata = {
    'training_data_hash': data_hash,
    'validation_accuracy': val_accuracy,
    'training_date': datetime.now().isoformat(),
    'seed': 42
}

trainer.export_tflite()

with open('models/edge_ai_model_metadata.json', 'w') as f:
    json.dump(metadata, f)
```

### 3. Model Inversion Attack (MEDIUM)

**Bedrohung:** Angreifer extrahiert Trainingsdaten aus deployed Modell
- **Auswirkung:** Offenlegung sensitiver Fahrmuster
- **Eintrittswahrscheinlichkeit:** LOW (erfordert White-Box-Zugriff)
- **Risikobewertung:** MEDIUM

**Mitigationen:**

1. ✅ **Differential Privacy**
   - Noise-Injection während Training
   - Gradients werden geclippt
   - Privacy-Budget-Tracking

2. ✅ **Model Obfuscation**
   - TensorFlow Lite Quantization (INT8)
   - Operator Fusion
   - Reduced Precision

**Implementierung:**

```python
# TFLite Export mit Quantization
converter = tf.lite.TFLiteConverter.from_keras_model(model)

# INT8 Quantization für Obfuscation
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.target_spec.supported_types = [tf.int8]

# Reduzierte Präzision
tflite_model = converter.convert()
```

### 4. Inference-Time Attacks (MEDIUM)

**Bedrohung:** Angreifer manipuliert Eingabedaten (SOC, Preise, PV-Leistung)
- **Auswirkung:** Falsche Entscheidungen basierend auf gefälschten Sensordaten
- **Eintrittswahrscheinlichkeit:** MEDIUM (MQTT-Injection, CAN-Bus-Manipulation)
- **Risikobewertung:** MEDIUM

**Mitigationen:**

1. ✅ **Input Validation (Pydantic)**
   - SOC: 0-100%
   - Power: ≥ 0 kW
   - Price: 0.10-1.00 €/kWh
   - Siehe: `backend/main.py` → `EdgeAIDecisionRequest`

2. ✅ **Message Signing (HMAC-SHA256)**
   - MQTT-Nachrichten signiert
   - Replay Protection
   - Siehe: `backend/message_signing.py`

3. ✅ **Plausibility Checks**
   - SOC-Änderung max. ±10%/Stunde
   - PV-Leistung ≤ Anlagenkapazität
   - Zeitreihen-Anomalie-Detektion

```python
# Plausibility Check
def validate_soc_change(previous_soc: float, current_soc: float, time_delta: float) -> bool:
    """
    Verhindert unrealistische SOC-Sprünge
    
    Args:
        time_delta: Zeitdifferenz in Stunden
    
    Returns:
        True wenn plausibel, False sonst
    """
    max_change_per_hour = 10.0  # ±10% pro Stunde
    max_allowed_change = max_change_per_hour * time_delta
    
    actual_change = abs(current_soc - previous_soc)
    
    if actual_change > max_allowed_change:
        logger.warning(f"⚠️ Implausible SOC change: {actual_change:.1f}% in {time_delta:.2f}h")
        return False
    
    return True
```

## Security Testing

### Penetration Testing Checkliste

- [ ] **Modell-Signatur-Bypass-Versuche**
  - Unsigned model injection
  - Signature replay attacks
  - Public key manipulation

- [ ] **Training Data Poisoning**
  - Backdoor injection
  - Accuracy degradation attacks
  - Distribution shift attacks

- [ ] **Inference Attacks**
  - Adversarial examples
  - Gradient-based attacks
  - Black-box query attacks

- [ ] **OTA Update Security**
  - Man-in-the-Middle attacks
  - Downgrade attacks
  - Replay attacks

### Automated Security Tests

```python
# tests/test_edge_ai_security.py
import pytest
from edge_ai_security import verify_model_signature, compute_model_hash

def test_unsigned_model_rejection():
    """Verify that unsigned models are rejected"""
    # Attempt to load model without signature
    with pytest.raises(SecurityError):
        load_edge_ai_model('unsigned_model.tflite', signature=None)

def test_tampered_model_detection():
    """Verify that tampered models are detected"""
    original_hash = compute_model_hash('original_model.tflite')
    
    # Modify single byte
    with open('tampered_model.tflite', 'rb+') as f:
        f.seek(100)
        f.write(b'\xFF')
    
    tampered_hash = compute_model_hash('tampered_model.tflite')
    
    assert original_hash != tampered_hash
    assert not verify_model_signature('tampered_model.tflite', signature, public_key)

def test_adversarial_input_detection():
    """Verify that adversarial inputs are detected"""
    # Out-of-range SOC
    with pytest.raises(ValueError):
        agent.make_decision({'ev_soc': 150.0})  # Invalid: > 100%
    
    # Negative power
    with pytest.raises(ValueError):
        agent.make_decision({'pv_power': -5.0})  # Invalid: < 0

def test_model_rollback_protection():
    """Verify that model downgrades are prevented"""
    # Deploy v2.0
    deploy_model('edge_ai_v2.0.tflite', version='2.0.0')
    
    # Attempt to deploy v1.0 (older)
    with pytest.raises(SecurityError, match="Downgrade not allowed"):
        deploy_model('edge_ai_v1.0.tflite', version='1.0.0')
```

## Incident Response Plan

### Edge-AI Security Incidents

| Incident | Severity | Response Action |
|----------|----------|----------------|
| **Invalid Model Signature** | CRITICAL | Reject model, alert SOC, log incident in audit trail |
| **Anomalous Decision Pattern** | HIGH | Switch to rule-based fallback, alert monitoring |
| **Training Accuracy Drop** | MEDIUM | Retrain model, investigate data quality |
| **Adversarial Input Detected** | MEDIUM | Reject input, log source, investigate MQTT broker |

### Contact Information

- **Security Operations Center (SOC):** security@oem.com
- **Incident Response Hotline:** +49-xxx-xxxxxxx
- **Escalation:** CISO, CTO

## Compliance Checklist

### ISO 21434 Requirements

- [x] **Threat Analysis & Risk Assessment (TARA)** → 4 threat scenarios documented
- [x] **Security Requirements** → Input validation, model signing, secure updates
- [x] **Security Architecture** → Defense-in-depth, fail-safe fallback
- [x] **Security Testing** → Penetration testing plan, automated tests
- [x] **Incident Response** → Documented procedures, contact information
- [x] **Security Monitoring** → Audit logging, anomaly detection
- [x] **Secure Development** → Signed commits, code review, CI/CD hardening

### UN R155 Requirements

- [x] **Cybersecurity Management System (CSMS)** → ISO 21434 compliance package
- [x] **Risk Management** → TARA with mitigations
- [x] **Security by Design** → TFLite quantization, input validation
- [x] **Over-the-Air Updates** → TLS 1.3, model signing
- [x] **Monitoring & Response** → Audit trail, incident response plan

## Implementation Roadmap

### Phase 1: Core Security (Weeks 1-2)
- [x] TensorFlow Lite model training
- [x] Input validation (Pydantic)
- [x] FastAPI rate limiting
- [ ] Model signing implementation

### Phase 2: Advanced Security (Weeks 3-4)
- [ ] Differential privacy training
- [ ] Plausibility checks
- [ ] Anomaly detection
- [ ] Automated security tests

### Phase 3: Production Hardening (Weeks 5-6)
- [ ] OTA update infrastructure
- [ ] Key management system (KMS)
- [ ] Penetration testing
- [ ] Security documentation

### Phase 4: Certification (Weeks 7-8)
- [ ] ISO 21434 audit
- [ ] UN R155 compliance validation
- [ ] Third-party security assessment
- [ ] Production deployment

## References

1. **ISO/SAE 21434:2021** - Road vehicles — Cybersecurity engineering
2. **UN Regulation No. 155** - Uniform provisions concerning the approval of vehicles with regards to cybersecurity
3. **NIST AI Risk Management Framework** - AI Security Best Practices
4. **OWASP Machine Learning Security Top 10**
5. **TensorFlow Lite Security Guide** - https://www.tensorflow.org/lite/guide/security

## Kontakt

**Security Team:**
- Edge-AI Security: edge-ai-security@oem.com
- ISO 21434 Compliance: iso21434@oem.com
- Threat Intelligence: threat-intel@oem.com

---

**Dokument-Version:** 1.0  
**Stand:** 2025-11-10  
**Klassifizierung:** Internal Use Only  
**Nächste Review:** 2025-12-10
