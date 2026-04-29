import React, { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

const RECOMMENDATION_URL = `${API_URL}/airecommendation`;

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
  const res = await fetch(RECOMMENDATION_URL, {
        headers: {
          'X-API-Key': 'mein_geheimer_schulkey123'
        }
      });
      if (!res.ok) throw new Error('Fehler beim Laden der KI-Empfehlung');

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const body = await res.text();
        throw new Error(`Ungültige API-Antwort (kein JSON): ${body.slice(0, 80)}`);
      }

      const data = await res.json();

      if (Array.isArray(data?.actions)) {
        const firstAction = data.actions[0] || 'Keine Aktion erforderlich';
        const reasonFromNotes = Array.isArray(data?.notes) && data.notes.length > 0
          ? data.notes.join(' · ')
          : 'Automatisch aus dem aktuellen Betriebszustand abgeleitet';

        setRec({
          action: firstAction,
          reason: reasonFromNotes,
          confidence: typeof data?.confidence === 'number' ? data.confidence : 0.8,
        });
      } else {
        setRec(data as KIRecommendation);
      }
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
