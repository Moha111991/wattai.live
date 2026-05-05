import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

interface Alarm {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
  timestamp: string;
  recommendation?: string;
}

export default function ErrorAlarmMonitor() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showToasts, setShowToasts] = useState(true);

  useEffect(() => {
    async function fetchAlarms() {
      try {
  const res = await fetch(`${API_URL}/api/alarms`, {
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
          }
        });
        const json = await res.json();
        setAlarms(json.alarms || []);
      } catch {
        setAlarms([
          {
            id: "1",
            type: "error",
            message: "PV-Wechselrichter offline!",
            timestamp: new Date().toISOString(),
            recommendation: "Bitte Verbindung prüfen oder Support kontaktieren."
          },
          {
            id: "2",
            type: "warning",
            message: "Batterie-Ladezustand niedrig (<20%)",
            timestamp: new Date().toISOString(),
            recommendation: "Ladevorgang starten oder Verbrauch reduzieren."
          }
        ]);
      }
    }
    fetchAlarms();
    const interval = setInterval(fetchAlarms, 30000);
    return () => clearInterval(interval);
  }, []);

  // Toasts separat rendern, damit sie wirklich entfernt werden
  const Toasts = showToasts && alarms.length > 0 ? (
    <div style={{position:"fixed",bottom:24,right:16,left:16,maxWidth:420,marginLeft:"auto",zIndex:9999}}>
      {alarms.map(alarm => (
        <div key={alarm.id} style={{background:alarm.type==="error"?"#F44336":"#FF9800",color:"#fff",padding:"16px 24px",borderRadius:12,boxShadow:"0 2px 8px rgba(33,150,243,0.15)",marginBottom:8}}>
          <b>{alarm.type === "error" ? "Fehler" : "Warnung"}:</b> {alarm.message}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div className="error-alarm-monitor" style={{width:'100%',maxWidth:'100%',margin:"32px 0",boxSizing:'border-box',background:'rgba(15,23,42,0.8)',border:'1px solid rgba(248,113,113,0.28)',borderRadius:16,padding:18,boxShadow:'0 12px 30px rgba(2,6,23,0.34)'}}>
        <h2 style={{color:"#fecaca",fontSize:24,fontWeight:800,marginBottom:10}}>Fehler- & Alarmmonitor</h2>
        {alarms.length === 0 && <div style={{color:"#cbd5e1"}}>Keine aktuellen Fehler oder Warnungen.</div>}
        <ul style={{listStyle:"none",padding:0}}>
          {alarms.map(alarm => (
            <li key={alarm.id} style={{marginBottom:18,padding:16,borderRadius:12,background:alarm.type==="error"?"#2d1a1a":alarm.type==="warning"?"#23272F":"#23272F",color:"#F5F7FA",boxShadow:"0 2px 8px rgba(244,67,54,0.08)"}}>
              <div style={{fontWeight:"bold",fontSize:18}}>
                {alarm.type === "error" ? "❌ Fehler" : alarm.type === "warning" ? "⚠️ Warnung" : "ℹ️ Info"}
              </div>
              <div style={{marginTop:4,fontSize:16}}>{alarm.message}</div>
              <div style={{marginTop:4,fontSize:14,opacity:0.8}}>Zeit: {new Date(alarm.timestamp).toLocaleString()}</div>
              {alarm.recommendation && <div style={{marginTop:8,color:"#FF9800"}}><b>Empfehlung:</b> {alarm.recommendation}</div>}
            </li>
          ))}
        </ul>
        <button
          className="btn"
          style={{marginTop:16}}
          onClick={() => setShowToasts(prev => !prev)}
        >
          {showToasts ? "Toasts ausblenden" : "Toasts anzeigen"}
        </button>
      </div>
      {Toasts}
    </>
  );
}
