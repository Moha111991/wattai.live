import React, { useEffect, useState } from 'react';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/airecommendation'; // Port angepasst

interface KIRecommendation {
  action: string;
  reason: string;
  confidence: number;
}

const KIDashboard: React.FC = () => {
  const [rec, setRec] = useState<KIRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        headers: {
          'X-API-Key': 'mein_geheimer_schulkey123'
        }
      });
      if (!res.ok) throw new Error('Fehler beim Laden der KI-Empfehlung');
      const data = await res.json();
      setRec(data);
    } catch (e: any) {
      setError(e.message || 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendation();
    const interval = setInterval(fetchRecommendation, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ki-dashboard">
      <h2>KI-Empfehlung</h2>
      {loading && <p>Lade Empfehlung...</p>}
      {error && <p style={{ color: '#d32f2f' }}>Fehler: {error}</p>}
      {rec && (
        <>
          <p><strong>Aktion:</strong> {rec.action}</p>
          <p><strong>Begründung:</strong> {rec.reason}</p>
          <p><strong>Vertrauen:</strong> {Math.round(rec.confidence * 100)}%</p>
        </>
      )}
    </div>
  );
};

export default KIDashboard;
