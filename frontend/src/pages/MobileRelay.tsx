import React, { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = `${import.meta.env.VITE_API_URL.replace('https://', 'wss://')}/ws`;

export default function MobileRelay() {
  const [paired, setPaired] = useState(false);
  const [evData, setEvData] = useState({
    soc: 0,
    range_km: 0,
    charging: false,
    power_kw: 0,
    voltage: 0,
    temperature: 0
  });
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const log = (msg: string) => {
    setLogs(prev => [...prev.slice(-20), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // WebSocket Connection
  useEffect(() => {
    if (!paired) return;
    
    const socket = new WebSocket(WS_URL);
    
    socket.onopen = () => {
      log("✅ Verbunden mit Backend");
      socket.send(JSON.stringify({ type: "register", device: "mobile_relay" }));
    };
    
    socket.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
      }
    };
    
    socket.onerror = () => log("❌ Verbindungsfehler");
    socket.onclose = () => log("🔌 Verbindung getrennt");
    
    setWs(socket);
    return () => socket.close();
  }, [paired]);

  // Send EV data every 5s
  useEffect(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    
    const interval = setInterval(() => {
      ws.send(JSON.stringify({
        type: "ev_data",
        ...evData,
        timestamp: Date.now()
      }));
      log(`📤 Gesendet: SOC ${evData.soc}%, ${evData.power_kw} kW`);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [ws, evData]);

  // Simulate OBD/BLE data (Demo)
  const simulateData = () => {
    setEvData({
      soc: Math.min(100, evData.soc + Math.random() * 2),
      range_km: 200 + Math.random() * 50,
      charging: Math.random() > 0.5,
      power_kw: Math.random() > 0.5 ? 7 + Math.random() * 4 : 0,
      voltage: 380 + Math.random() * 20,
      temperature: 20 + Math.random() * 10
    });
  };

  // Request Bluetooth (Platzhalter)
  const connectBluetooth = async () => {
    try {
      if (!('bluetooth' in navigator)) {
        alert("❌ Bluetooth nicht verfügbar");
        return;
      }
      
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['battery_service'] }],
        optionalServices: ['device_information']
      });
      
      log(`📱 Verbunden mit: ${device.name}`);
      setPaired(true);
    } catch (err: any) {
      log(`❌ BLE Fehler: ${err.message}`);
    }
  };

  // Manual pair (ohne BLE)
  const pairManual = () => {
    setPaired(true);
    log("✅ Manuell gekoppelt (Demo-Modus)");
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>📱 EV Mobile Relay</h1>
        <div style={styles.status}>
          {paired ? "🟢 Gekoppelt" : "🔴 Nicht verbunden"}
        </div>
      </header>

      {!paired ? (
        <div style={styles.pairing}>
          <h2>Fahrzeug koppeln</h2>
          <p style={styles.hint}>
            Verbinde dein Handy mit dem E-Auto über Bluetooth (OBD-II) oder 
            Hersteller-App und sende Live-Daten an das Dashboard.
          </p>
          
          <button style={styles.btnPrimary} onClick={connectBluetooth}>
            🔵 Bluetooth (OBD-II)
          </button>
          
          <button style={styles.btnSecondary} onClick={pairManual}>
            📊 Demo-Modus (Simulation)
          </button>
          
          <div style={styles.supported}>
            <h3>Unterstützte Schnittstellen:</h3>
            <ul>
              <li>🔵 Bluetooth OBD-II (ELM327)</li>
              <li>☁️ Tesla API</li>
              <li>☁️ VW We Connect</li>
              <li>☁️ BMW Connected Drive</li>
              <li>☁️ Hyundai Bluelink</li>
            </ul>
          </div>
        </div>
      ) : (
        <div style={styles.dashboard}>
          <h2>🚗 Fahrzeugdaten</h2>
          
          <div style={styles.metrics}>
            <div style={styles.metric}>
              <div style={styles.metricLabel}>Ladestand</div>
              <div style={styles.metricValue}>{evData.soc.toFixed(1)}%</div>
            </div>
            
            <div style={styles.metric}>
              <div style={styles.metricLabel}>Reichweite</div>
              <div style={styles.metricValue}>{evData.range_km.toFixed(0)} km</div>
            </div>
            
            <div style={styles.metric}>
              <div style={styles.metricLabel}>Ladeleistung</div>
              <div style={styles.metricValue}>
                {evData.power_kw.toFixed(2)} kW
              </div>
            </div>
            
            <div style={styles.metric}>
              <div style={styles.metricLabel}>Status</div>
              <div style={styles.metricValue}>
                {evData.charging ? "🔌 Lädt" : "⏸️ Inaktiv"}
              </div>
            </div>
          </div>

          <div style={styles.technical}>
            <h3>Technische Daten</h3>
            <div>Spannung: {evData.voltage.toFixed(0)} V</div>
            <div>Temperatur: {evData.temperature.toFixed(1)} °C</div>
          </div>

          <button style={styles.btnDemo} onClick={simulateData}>
            🎲 Daten simulieren
          </button>

          <button 
            style={styles.btnDanger} 
            onClick={() => {
              setPaired(false);
              ws?.close();
              log("🔌 Gekopplung beendet");
            }}
          >
            ❌ Trennen
          </button>

          <div style={styles.logs}>
            <h3>📋 Log</h3>
            <div style={styles.logContent}>
              {logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
          </div>
        </div>
      )}

      <footer style={styles.footer}>
        <a href="/" style={styles.link}>← Zurück zum Dashboard</a>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 600,
    margin: "0 auto",
    padding: 20,
    fontFamily: "system-ui, -apple-system, sans-serif"
  },
  header: {
    textAlign: "center" as const,
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2px solid #eee"
  },
  status: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: 600
  },
  pairing: {
    textAlign: "center" as const
  },
  hint: {
    color: "#666",
    lineHeight: 1.6,
    marginBottom: 30
  },
  btnPrimary: {
    width: "100%",
    padding: 16,
    marginBottom: 12,
    fontSize: 18,
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600
  },
  btnSecondary: {
    width: "100%",
    padding: 16,
    marginBottom: 20,
    fontSize: 18,
    background: "#f0f0f0",
    color: "#333",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  btnDemo: {
    width: "100%",
    padding: 14,
    marginTop: 20,
    background: "#FF9800",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600
  },
  btnDanger: {
    width: "100%",
    padding: 14,
    marginTop: 12,
    background: "#F44336",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer"
  },
  supported: {
    marginTop: 40,
    textAlign: "left" as const,
    padding: 20,
    background: "#f9f9f9",
    borderRadius: 8
  },
  dashboard: {
    marginTop: 20
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 16,
    marginBottom: 20
  },
  metric: {
    padding: 20,
    background: "#f9f9f9",
    borderRadius: 8,
    textAlign: "center" as const
  },
  metricLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 700,
    color: "#2196F3"
  },
  technical: {
    padding: 16,
    background: "#f9f9f9",
    borderRadius: 8,
    marginTop: 20
  },
  logs: {
    marginTop: 30,
    padding: 16,
    background: "#fafafa",
    borderRadius: 8,
    maxHeight: 200,
    overflow: "auto"
  },
  logContent: {
    fontSize: 12,
    fontFamily: "monospace",
    color: "#666"
  },
  footer: {
    marginTop: 40,
    textAlign: "center" as const,
    paddingTop: 20,
    borderTop: "1px solid #eee"
  },
  link: {
    color: "#2196F3",
    textDecoration: "none"
  }
};