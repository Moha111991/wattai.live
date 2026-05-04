import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';

const RECOMMENDATION_URL = `${API_URL}/airecommendation`;

interface KIRecommendation {
  action: string;
  reason: string;
  confidence: number;
}

const KIDashboard = () => {
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
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unbekannter Fehler';
      setError(message);
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
  <div className="ki-dashboard tab-content-full" style={{ width: '100%', maxWidth: '100%', margin: 0 }}>
      <div className="animate-fade-in">
        <h2 className="tab-page-title" style={{ margin: '0 0 16px 0' }}>KI-Empfehlung</h2>
        <p className="tab-page-subtitle">Intelligente Handlungsempfehlungen aus Live-Daten, Lastprofilen und aktuellen Systemzuständen.</p>
      </div>
      
      {loading && (
        <div className="animate-fade-in flex items-center gap-3" style={{ color: '#cbd5e1', margin: '20px 0' }}>
          <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></div>
          <p style={{ margin: 0 }}>Lade Empfehlung...</p>
        </div>
      )}
      
      {error && (
        <div className="tab-modern-card animate-fade-in glass-effect" style={{ color: '#f87171', margin: '20px 0', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <p style={{ margin: 0 }}>⚠️ Fehler: {error}</p>
        </div>
      )}
      
      {rec && (
        <div className="tab-modern-card glass-effect animate-page-enter energy-pulse" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0, marginTop: 20 }}>
          <div className="animate-stagger-1 animate-page-enter">
            <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.45, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <strong className="neon-glow" style={{ color: '#67e8f9' }}>Aktion:</strong> {rec.action}
            </p>
          </div>
          
          <div className="animate-stagger-2 animate-page-enter">
            <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.45, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <strong className="neon-glow" style={{ color: '#67e8f9' }}>Begründung:</strong> {rec.reason}
            </p>
          </div>
          
          <div className="animate-stagger-3 animate-page-enter">
            <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.45, overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
              <strong className="neon-glow" style={{ color: '#67e8f9' }}>Vertrauen:</strong>
            </p>
            <div style={{ 
              width: '100%', 
              height: '32px', 
              background: 'rgba(15, 23, 42, 0.5)', 
              borderRadius: '8px', 
              overflow: 'hidden',
              marginTop: '8px',
              border: '1px solid rgba(103, 232, 249, 0.2)'
            }}>
              <div 
                className="animate-slide-in-left"
                style={{ 
                  height: '100%', 
                  width: `${Math.round(rec.confidence * 100)}%`,
                  background: `linear-gradient(90deg, ${
                    rec.confidence > 0.8 ? '#22c55e' : rec.confidence > 0.5 ? '#f59e0b' : '#ef4444'
                  }, ${
                    rec.confidence > 0.8 ? '#16a34a' : rec.confidence > 0.5 ? '#d97706' : '#dc2626'
                  })`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: rec.confidence > 0.8 ? '0 0 20px rgba(34, 197, 94, 0.5)' : 'none'
                }}
              >
                {Math.round(rec.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KIDashboard;
