import React, { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

type Rec = {
  timestamp: string;
  summary: { pv_w: number; load_w: number; battery_soc: number; ev_soc: number; surplus_w: number };
  actions: string[];
  notes: string[];
};

export default function RecommendationCard() {
  const [rec, setRec] = useState<Rec | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRec = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/airecommendation`, {
        headers: {
          'X-API-Key': 'mein_geheimer_schulkey123',
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!data.error) setRec(data);
    } catch (e) {
      console.error("recommendation fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRec();
    const id = setInterval(fetchRec, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 }}>
      <h3>Empfehlungen</h3>
      {loading && <div style={{ opacity: 0.6 }}>Lade…</div>}
      {!rec ? (
        <div>Keine Daten</div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: "#666" }}>{new Date(rec.timestamp).toLocaleString()}</div>
          <div style={{ marginTop: 8 }}>
            <strong>Status:</strong>{" "}
            PV {Math.round(rec.summary.pv_w)} W · Last {Math.round(rec.summary.load_w)} W ·
            Batterie {rec.summary.battery_soc}% · EV {rec.summary.ev_soc}% ·
            Überschuss {Math.round(rec.summary.surplus_w)} W
          </div>
          <div style={{ marginTop: 8 }}>
            <strong>Aktionen:</strong>
            <ul>
              {rec.actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
          {rec.notes?.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Hinweise:</strong>
              <ul>
                {rec.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}