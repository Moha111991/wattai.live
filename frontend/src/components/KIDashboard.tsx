import { useEffect, useState } from 'react';
import { API_URL } from '../lib/api';
import PlanGate from './PlanGate';

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
    <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '0 0 40px', background: 'transparent' }}>
      <style>{`
        @keyframes ki-node { 0%,100%{opacity:.4;r:4}50%{opacity:1;r:6} }
        @keyframes ki-stream { to{stroke-dashoffset:-24} }
        @keyframes ki-spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Cinematic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
        {/* Neural Network SVG */}
        <div style={{ flexShrink: 0 }}>
          <svg width="160" height="100" viewBox="0 0 160 100" fill="none">
            {/* Layer 1 */}
            {[20,40,60,80].map((cy,i) => (
              <g key={i}>
                <circle cx="20" cy={cy} r="5" fill="rgba(255,107,53,0.2)" stroke="#ff6b35" strokeWidth="1.2">
                  <animate attributeName="r" values="4;6;4" dur={`${1.5+i*0.3}s`} repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            {/* Layer 2 */}
            {[30,55,80].map((cy,i) => (
              <circle key={i} cx="65" cy={cy} r="5" fill="rgba(255,149,0,0.2)" stroke="#ff9500" strokeWidth="1.2">
                <animate attributeName="r" values="4;6;4" dur={`${1.8+i*0.3}s`} repeatCount="indefinite"/>
              </circle>
            ))}
            {/* Layer 3 */}
            {[30,55,80].map((cy,i) => (
              <circle key={i} cx="110" cy={cy} r="5" fill="rgba(59,130,246,0.2)" stroke="#3b82f6" strokeWidth="1.2">
                <animate attributeName="r" values="4;6;4" dur={`${2+i*0.3}s`} repeatCount="indefinite"/>
              </circle>
            ))}
            {/* Output */}
            <circle cx="148" cy="50" r="7" fill="rgba(255,107,53,0.2)" stroke="#ff6b35" strokeWidth="1.5">
              <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/>
            </circle>
            {/* Connections L1→L2 */}
            {[20,40,60,80].map((y1,i) => [30,55,80].map((y2,j) => (
              <line key={`${i}-${j}`} x1="25" y1={y1} x2="60" y2={y2} stroke="rgba(255,107,53,0.12)" strokeWidth="0.8">
                <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur={`${2+i*0.4}s`} repeatCount="indefinite"/>
              </line>
            )))}
            {/* Connections L2→L3 */}
            {[30,55,80].map((y1,i) => [30,55,80].map((y2,j) => (
              <line key={`${i}-${j}`} x1="70" y1={y1} x2="105" y2={y2} stroke="rgba(255,149,0,0.12)" strokeWidth="0.8">
                <animate attributeName="stroke-opacity" values="0.1;0.35;0.1" dur={`${2.2+j*0.3}s`} repeatCount="indefinite"/>
              </line>
            )))}
            {/* Connections L3→Out */}
            {[30,55,80].map((y1,i) => (
              <line key={i} x1="115" y1={y1} x2="141" y2="50" stroke="rgba(59,130,246,0.2)" strokeWidth="0.8" strokeDasharray="4 3">
                <animate attributeName="stroke-dashoffset" values="0;-24" dur={`${1.2+i*0.2}s`} repeatCount="indefinite"/>
              </line>
            ))}
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, color: '#ff9500', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>KI-System</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: '#f8fafc', lineHeight: 1.2 }}>
            KI-Empfehlung
          </h2>
          <p style={{ margin: 0, color: 'rgba(248,250,252,0.52)', fontSize: 14, lineHeight: 1.5 }}>
            Intelligente Handlungsempfehlungen aus Live-Daten, Lastprofilen und aktuellen Systemzuständen.
          </p>
        </div>
      </div>

      <PlanGate feature="insights.advanced" featureName="KI-Empfehlung & Prognosen" requiredPlan="pro">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(248,250,252,0.6)', margin: '20px 0' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,107,53,0.2)" strokeWidth="2.5"/>
              <circle cx="12" cy="12" r="10" stroke="#ff6b35" strokeWidth="2.5" strokeDasharray="20 43" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
              </circle>
            </svg>
            <span style={{ fontSize: 14 }}>Lade Empfehlung...</span>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, padding: '16px 20px', marginBottom: 16, color: '#f87171' }}>
            ⚠️ Fehler: {error}
          </div>
        )}

        {rec && (
          <div style={{
            background: 'rgba(4,6,20,0.65)', border: '1px solid rgba(255,107,53,0.1)',
            borderRadius: 20, backdropFilter: 'blur(12px)', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ height: 2, background: 'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', borderRadius: 2 }}/>

            {/* Action */}
            <div style={{ background: 'rgba(255,107,53,0.04)', border: '1px solid rgba(255,107,53,0.12)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#ff9500', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Aktion</div>
              <p style={{ margin: 0, color: '#f8fafc', lineHeight: 1.6, fontSize: 15, overflowWrap: 'anywhere' }}>{rec.action}</p>
            </div>

            {/* Reason */}
            <div style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#3b82f6', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Begründung</div>
              <p style={{ margin: 0, color: 'rgba(248,250,252,0.75)', lineHeight: 1.6, fontSize: 14, overflowWrap: 'anywhere' }}>{rec.reason}</p>
            </div>

            {/* Confidence bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, letterSpacing: 2, color: rec.confidence > 0.8 ? '#22c55e' : rec.confidence > 0.5 ? '#f59e0b' : '#ef4444', textTransform: 'uppercase', fontWeight: 600 }}>Vertrauen</div>
                <span style={{ fontSize: 18, fontWeight: 800, color: rec.confidence > 0.8 ? '#22c55e' : rec.confidence > 0.5 ? '#f59e0b' : '#ef4444' }}>
                  {Math.round(rec.confidence * 100)}%
                </span>
              </div>
              <div style={{ height: 10, background: 'rgba(4,6,20,0.8)', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(rec.confidence * 100)}%`,
                  background: rec.confidence > 0.8 ? 'linear-gradient(90deg,#22c55e,#16a34a)' : rec.confidence > 0.5 ? 'linear-gradient(90deg,#f59e0b,#d97706)' : 'linear-gradient(90deg,#ef4444,#dc2626)',
                  borderRadius: 8,
                  boxShadow: rec.confidence > 0.8 ? '0 0 16px rgba(34,197,94,0.5)' : 'none',
                  transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                }}/>
              </div>
            </div>
          </div>
        )}
      </PlanGate>
    </div>
  );
};

export default KIDashboard;
