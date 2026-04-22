import React, { useState } from "react";
import { API_URL } from "../lib/api";

type Step = "welcome" | "device-type" | "wallbox" | "inverter" | "battery" | "meter" | "heatpump" | "complete";

export default function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("welcome");
  const [devices, setDevices] = useState<any[]>([]);
  const [currentDevice, setCurrentDevice] = useState({
    type: "",
    brand: "",
    ip: "",
    poll_interval: 10
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true");
    onComplete();
  };

  const handleAddDevice = () => {
    setDevices([...devices, currentDevice]);
    setCurrentDevice({ type: "", brand: "", ip: "", poll_interval: 10 });
    setTestResult(null);
    setStep("device-type");
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const res = await fetch(`http://${currentDevice.ip}/status`, {
        method: "GET",
        signal: AbortSignal.timeout(3000)
      });
      
      if (res.ok) {
        setTestResult({ success: true, message: "✅ Verbindung erfolgreich!" });
      } else {
        setTestResult({ success: false, message: `❌ HTTP ${res.status}` });
      }
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: `❌ Verbindung fehlgeschlagen: ${err.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  const handleFinish = async () => {
    for (const device of devices) {
      await fetch(`${API_URL}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(device)
      });
    }
    
    localStorage.setItem("onboarding_completed", "true");
    onComplete();
  };

  const styles = {
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999
    },
    wizard: {
      background: "white",
      borderRadius: 16,
      padding: 40,
      maxWidth: 600,
      width: "90%",
      maxHeight: "90vh",
      overflow: "auto",
      boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
      position: "relative" as const
    },
    closeButton: {
      position: "absolute" as const,
      top: 16,
      right: 16,
      background: "transparent",
      border: "none",
      fontSize: 28,
      cursor: "pointer",
      color: "#999",
      width: 40,
      height: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "50%",
      transition: "all 0.2s"
    },
    header: {
      textAlign: "center" as const,
      marginBottom: 30
    },
    title: {
      fontSize: 28,
      fontWeight: "bold" as const,
      color: "#2196F3",
      marginBottom: 10
    },
    subtitle: {
      fontSize: 16,
      color: "#666"
    },
    content: {
      marginBottom: 30
    },
    input: {
      width: "100%",
      padding: 12,
      marginTop: 8,
      marginBottom: 16,
      border: "2px solid #ddd",
      borderRadius: 8,
      fontSize: 16,
      boxSizing: "border-box" as const
    },
    buttonGroup: {
      display: "flex",
      gap: 12,
      justifyContent: "space-between"
    },
    button: {
      flex: 1,
      padding: 14,
      border: "none",
      borderRadius: 8,
      fontSize: 16,
      cursor: "pointer",
      fontWeight: "bold" as const,
      transition: "all 0.3s"
    },
    primaryButton: {
      background: "#4CAF50",
      color: "white"
    },
    secondaryButton: {
      background: "#f0f0f0",
      color: "#333"
    },
    skipButton: {
      background: "transparent",
      color: "#999",
      textDecoration: "underline"
    },
    deviceCard: {
      background: "#f9f9f9",
      padding: 16,
      borderRadius: 8,
      marginBottom: 12,
      border: "2px solid #4CAF50"
    },
    testResult: (success: boolean) => ({
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      background: success ? "#e8f5e9" : "#ffebee",
      color: success ? "#2e7d32" : "#c62828",
      textAlign: "center" as const
    }),
    deviceTypeButton: (color: string) => ({
      ...styles.button,
      background: color,
      color: "white",
      marginBottom: 12,
      fontSize: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8
    })
  };

  const getDeviceIcon = (type: string) => {
    switch(type) {
      case "wallbox": return "🔌";
      case "inverter": return "☀️";
      case "battery": return "🔋";
      case "meter": return "⚡";
      case "heatpump": return "🌡️";
      default: return "📱";
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.wizard}>
        
        {/* Close Button */}
        <button 
          style={styles.closeButton}
          onClick={handleSkip}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#f0f0f0";
            e.currentTarget.style.color = "#333";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#999";
          }}
          title="Überspringen"
        >
          ×
        </button>
        
        {/* Welcome */}
        {step === "welcome" && (
          <>
            <div style={styles.header}>
		      <div style={styles.title}>⚡ Willkommen bei LoopIQ</div>
              <div style={styles.subtitle}>
                Lass uns deine Geräte einrichten, damit du sofort loslegen kannst!
              </div>
            </div>
            <div style={styles.content}>
              <p>📱 Dieser Wizard hilft dir dabei:</p>
              <ul style={{ lineHeight: 2 }}>
                <li>🔌 Wallbox verbinden (z.B. go-eCharger)</li>
                <li>☀️ PV-Wechselrichter integrieren (z.B. Fronius)</li>
                <li>🔋 Batteriespeicher einbinden</li>
                <li>⚡ Smart Meter anbinden</li>
                <li>🌡️ Wärmepumpe / Warmwasser</li>
                <li>🧪 Verbindungen testen</li>
              </ul>
              <p style={{ color: "#666", fontSize: 14, marginTop: 20 }}>
                ⏱️ Dauer: ca. 3-5 Minuten
              </p>
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={() => setStep("device-type")}
              >
                🚀 Los geht's
              </button>
              <button 
                style={{...styles.button, ...styles.skipButton}}
                onClick={handleSkip}
              >
                Später
              </button>
            </div>
          </>
        )}

        {/* Device Type Selection */}
        {step === "device-type" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>Gerätetyp wählen</div>
              <div style={styles.subtitle}>Was möchtest du verbinden?</div>
            </div>
            <div style={styles.content}>
              <button
                style={styles.deviceTypeButton("#4CAF50")}
                onClick={() => {
                  setCurrentDevice({ ...currentDevice, type: "wallbox" });
                  setStep("wallbox");
                }}
              >
                <span>🔌</span>
                <span>Wallbox / Ladestation</span>
              </button>
              
              <button
                style={styles.deviceTypeButton("#FF9800")}
                onClick={() => {
                  setCurrentDevice({ ...currentDevice, type: "inverter" });
                  setStep("inverter");
                }}
              >
                <span>☀️</span>
                <span>PV-Wechselrichter</span>
              </button>

              <button
                style={styles.deviceTypeButton("#9C27B0")}
                onClick={() => {
                  setCurrentDevice({ ...currentDevice, type: "battery" });
                  setStep("battery");
                }}
              >
                <span>🔋</span>
                <span>Batteriespeicher</span>
              </button>

              <button
                style={styles.deviceTypeButton("#2196F3")}
                onClick={() => {
                  setCurrentDevice({ ...currentDevice, type: "meter" });
                  setStep("meter");
                }}
              >
                <span>⚡</span>
                <span>Smart Meter / Stromzähler</span>
              </button>

              <button
                style={styles.deviceTypeButton("#F44336")}
                onClick={() => {
                  setCurrentDevice({ ...currentDevice, type: "heatpump" });
                  setStep("heatpump");
                }}
              >
                <span>🌡️</span>
                <span>Wärmepumpe / Warmwasser</span>
              </button>
            </div>
            <div style={styles.buttonGroup}>
              {devices.length > 0 ? (
                <>
                  <button 
                    style={{...styles.button, ...styles.primaryButton}}
                    onClick={() => setStep("complete")}
                  >
                    ✅ Fertig ({devices.length} Gerät{devices.length > 1 ? "e" : ""})
                  </button>
                  <button 
                    style={{...styles.button, ...styles.secondaryButton}}
                    onClick={() => setStep("welcome")}
                  >
                    ← Zurück
                  </button>
                </>
              ) : (
                <>
                  <button 
                    style={{...styles.button, ...styles.secondaryButton}}
                    onClick={() => setStep("welcome")}
                  >
                    ← Zurück
                  </button>
                  <button 
                    style={{...styles.button, ...styles.skipButton}}
                    onClick={handleSkip}
                  >
                    Überspringen
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* Wallbox Setup */}
        {step === "wallbox" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>🔌 Wallbox einrichten</div>
            </div>
            <div style={styles.content}>
              <label>
                <strong>Hersteller:</strong>
                <select 
                  style={styles.input}
                  value={currentDevice.brand}
                  onChange={e => setCurrentDevice({...currentDevice, brand: e.target.value})}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="goe">go-eCharger (Home+/Gemini)</option>
                  <option value="easee">Easee Home/Charge</option>
                  <option value="keba">KEBA KeContact</option>
                  <option value="wallbe">Wallbe Eco/Pro</option>
                  <option value="webasto">Webasto Pure/Live</option>
                  <option value="alfen">Alfen Eve</option>
                </select>
              </label>

              <label>
                <strong>IP-Adresse:</strong>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="z.B. 192.168.1.100"
                  value={currentDevice.ip}
                  onChange={e => setCurrentDevice({...currentDevice, ip: e.target.value})}
                />
              </label>

              <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 8, fontSize: 14 }}>
                💡 <strong>Tipp:</strong> Die IP findest du meist in der Router-Oberfläche oder App deiner Wallbox.
              </div>

              {currentDevice.ip && (
                <button
                  style={{
                    ...styles.button,
                    background: "#2196F3",
                    color: "white",
                    marginTop: 16
                  }}
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? "⏳ Teste..." : "🧪 Verbindung testen"}
                </button>
              )}

              {testResult && (
                <div style={styles.testResult(testResult.success)}>
                  {testResult.message}
                </div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleAddDevice}
                disabled={!currentDevice.brand || !currentDevice.ip}
              >
                ➕ Hinzufügen
              </button>
              <button 
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setStep("device-type")}
              >
                ← Zurück
              </button>
            </div>
          </>
        )}

        {/* Inverter Setup */}
        {step === "inverter" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>☀️ Wechselrichter einrichten</div>
            </div>
            <div style={styles.content}>
              <label>
                <strong>Hersteller:</strong>
                <select 
                  style={styles.input}
                  value={currentDevice.brand}
                  onChange={e => setCurrentDevice({...currentDevice, brand: e.target.value})}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="fronius">Fronius (Symo/Primo)</option>
                  <option value="sma">SMA (Sunny Boy/Tripower)</option>
                  <option value="kostal">Kostal (Plenticore/Piko)</option>
                  <option value="huawei">Huawei (SUN2000)</option>
                  <option value="solaredge">SolarEdge</option>
                  <option value="sungrow">Sungrow</option>
                </select>
              </label>

              <label>
                <strong>IP-Adresse:</strong>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="z.B. 192.168.1.101"
                  value={currentDevice.ip}
                  onChange={e => setCurrentDevice({...currentDevice, ip: e.target.value})}
                />
              </label>

              <div style={{ background: "#fff3e0", padding: 16, borderRadius: 8, fontSize: 14 }}>
                ⚠️ <strong>Wichtig:</strong> Aktiviere die API/Modbus-Schnittstelle im Wechselrichter-Menü.
              </div>

              {currentDevice.ip && (
                <button
                  style={{
                    ...styles.button,
                    background: "#FF9800",
                    color: "white",
                    marginTop: 16
                  }}
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? "⏳ Teste..." : "🧪 Verbindung testen"}
                </button>
              )}

              {testResult && (
                <div style={styles.testResult(testResult.success)}>
                  {testResult.message}
                </div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleAddDevice}
                disabled={!currentDevice.brand || !currentDevice.ip}
              >
                ➕ Hinzufügen
              </button>
              <button 
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setStep("device-type")}
              >
                ← Zurück
              </button>
            </div>
          </>
        )}

        {/* Battery Setup */}
        {step === "battery" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>🔋 Batteriespeicher einrichten</div>
            </div>
            <div style={styles.content}>
              <label>
                <strong>Hersteller:</strong>
                <select 
                  style={styles.input}
                  value={currentDevice.brand}
                  onChange={e => setCurrentDevice({...currentDevice, brand: e.target.value})}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="byd">BYD Battery-Box</option>
                  <option value="tesla">Tesla Powerwall</option>
                  <option value="lg">LG Chem RESU</option>
                  <option value="sonnen">sonnenBatterie</option>
                  <option value="varta">VARTA pulse</option>
                  <option value="senec">SENEC Home</option>
                </select>
              </label>

              <label>
                <strong>IP-Adresse:</strong>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="z.B. 192.168.1.102"
                  value={currentDevice.ip}
                  onChange={e => setCurrentDevice({...currentDevice, ip: e.target.value})}
                />
              </label>

              <div style={{ background: "#f3e5f5", padding: 16, borderRadius: 8, fontSize: 14 }}>
                💡 <strong>Hinweis:</strong> Manche Speicher werden über den Wechselrichter ausgelesen.
              </div>

              {currentDevice.ip && (
                <button
                  style={{
                    ...styles.button,
                    background: "#9C27B0",
                    color: "white",
                    marginTop: 16
                  }}
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? "⏳ Teste..." : "🧪 Verbindung testen"}
                </button>
              )}

              {testResult && (
                <div style={styles.testResult(testResult.success)}>
                  {testResult.message}
                </div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleAddDevice}
                disabled={!currentDevice.brand || !currentDevice.ip}
              >
                ➕ Hinzufügen
              </button>
              <button 
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setStep("device-type")}
              >
                ← Zurück
              </button>
            </div>
          </>
        )}

        {/* Smart Meter Setup */}
        {step === "meter" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>⚡ Smart Meter einrichten</div>
            </div>
            <div style={styles.content}>
              <label>
                <strong>Typ:</strong>
                <select 
                  style={styles.input}
                  value={currentDevice.brand}
                  onChange={e => setCurrentDevice({...currentDevice, brand: e.target.value})}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="shelly">Shelly 3EM/Pro 3EM</option>
                  <option value="discovergy">Discovergy Meter</option>
                  <option value="emhd">EMH metering</option>
                  <option value="carlo_gavazzi">Carlo Gavazzi</option>
                  <option value="orno">ORNO Smart Meter</option>
                </select>
              </label>

              <label>
                <strong>IP-Adresse:</strong>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="z.B. 192.168.1.103"
                  value={currentDevice.ip}
                  onChange={e => setCurrentDevice({...currentDevice, ip: e.target.value})}
                />
              </label>

              <div style={{ background: "#e3f2fd", padding: 16, borderRadius: 8, fontSize: 14 }}>
                📊 <strong>Info:</strong> Liefert Echtzeit-Daten zu Bezug/Einspeisung aus dem Netz.
              </div>

              {currentDevice.ip && (
                <button
                  style={{
                    ...styles.button,
                    background: "#2196F3",
                    color: "white",
                    marginTop: 16
                  }}
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? "⏳ Teste..." : "🧪 Verbindung testen"}
                </button>
              )}

              {testResult && (
                <div style={styles.testResult(testResult.success)}>
                  {testResult.message}
                </div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleAddDevice}
                disabled={!currentDevice.brand || !currentDevice.ip}
              >
                ➕ Hinzufügen
              </button>
              <button 
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setStep("device-type")}
              >
                ← Zurück
              </button>
            </div>
          </>
        )}

        {/* Heatpump Setup */}
        {step === "heatpump" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>🌡️ Wärmepumpe / Warmwasser</div>
            </div>
            <div style={styles.content}>
              <label>
                <strong>Hersteller:</strong>
                <select 
                  style={styles.input}
                  value={currentDevice.brand}
                  onChange={e => setCurrentDevice({...currentDevice, brand: e.target.value})}
                >
                  <option value="">Bitte wählen...</option>
                  <option value="viessmann">Viessmann Vitocal</option>
                  <option value="stiebel">Stiebel Eltron</option>
                  <option value="daikin">Daikin Altherma</option>
                  <option value="vaillant">Vaillant aroTHERM</option>
                  <option value="nibe">NIBE</option>
                  <option value="bosch">Bosch Compress</option>
                </select>
              </label>

              <label>
                <strong>IP-Adresse:</strong>
                <input 
                  type="text"
                  style={styles.input}
                  placeholder="z.B. 192.168.1.104"
                  value={currentDevice.ip}
                  onChange={e => setCurrentDevice({...currentDevice, ip: e.target.value})}
                />
              </label>

              <div style={{ background: "#ffebee", padding: 16, borderRadius: 8, fontSize: 14 }}>
                🔥 <strong>Smart Grid Ready:</strong> Ermöglicht PV-Überschuss-Heizen für Warmwasser/Heizung.
              </div>

              {currentDevice.ip && (
                <button
                  style={{
                    ...styles.button,
                    background: "#F44336",
                    color: "white",
                    marginTop: 16
                  }}
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? "⏳ Teste..." : "🧪 Verbindung testen"}
                </button>
              )}

              {testResult && (
                <div style={styles.testResult(testResult.success)}>
                  {testResult.message}
                </div>
              )}
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleAddDevice}
                disabled={!currentDevice.brand || !currentDevice.ip}
              >
                ➕ Hinzufügen
              </button>
              <button 
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setStep("device-type")}
              >
                ← Zurück
              </button>
            </div>
          </>
        )}

        {/* Complete */}
        {step === "complete" && (
          <>
            <div style={styles.header}>
              <div style={styles.title}>🎉 Fast fertig!</div>
              <div style={styles.subtitle}>
                {devices.length} Gerät{devices.length > 1 ? "e" : ""} konfiguriert
              </div>
            </div>
            <div style={styles.content}>
              {devices.map((dev, i) => (
                <div key={i} style={styles.deviceCard}>
                  <div style={{ fontSize: 18, marginBottom: 8 }}>
                    {getDeviceIcon(dev.type)} <strong>{dev.brand.toUpperCase()}</strong>
                  </div>
                  <div style={{ fontSize: 14, color: "#666" }}>
                    Typ: {dev.type === "wallbox" ? "Wallbox" : 
                         dev.type === "inverter" ? "Wechselrichter" :
                         dev.type === "battery" ? "Batteriespeicher" :
                         dev.type === "meter" ? "Smart Meter" :
                         dev.type === "heatpump" ? "Wärmepumpe" : dev.type} · IP: {dev.ip}
                  </div>
                </div>
              ))}

              <div style={{ background: "#e8f5e9", padding: 20, borderRadius: 8, marginTop: 20 }}>
                <p style={{ marginBottom: 12, fontSize: 16 }}>
                  ✅ <strong>Alles bereit!</strong>
                </p>
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.6 }}>
                  Nach dem Speichern werden deine Geräte in die Konfiguration übernommen. 
                  Starte das Backend neu, damit die Adapter geladen werden und Live-Daten empfangen.
                </p>
              </div>
            </div>
            <div style={styles.buttonGroup}>
              <button 
                style={{...styles.button, ...styles.primaryButton}}
                onClick={handleFinish}
              >
                💾 Speichern & Starten
              </button>
              <button 
                style={{...styles.button, ...styles.secondaryButton}}
                onClick={() => setStep("device-type")}
              >
                ← Weitere Geräte
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}