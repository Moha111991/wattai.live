import React, { useEffect, useState } from 'react';
import { API_URL, WS_URL } from '../lib/api';

interface EVState { ev_soc: number; ev_power_kw: number; ev_charging: boolean; }
interface WallboxInfo { id?: string; type?: string; status?: string; enabled?: boolean; brand?: string; model?: string; ip?: string; }
interface DevicesResponse { devices?: WallboxInfo[]; }
interface ChargingResponse { soc?: number; power_kw?: number; }

/* ── Nur wirklich verbundene Wallboxen zählen ── */
const isReallyConnected = (w: WallboxInfo) =>
  (w.status || '').toLowerCase() === 'connected' ||
  (w.status || '').toLowerCase() === 'online';

const WAI = `
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
  @keyframes wai-shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 30px rgba(255,107,53,.25)}50%{box-shadow:0 0 70px rgba(255,107,53,.55)}}
  .wai-btn-o{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-o:hover{filter:brightness(1.18)!important;transform:translateY(-3px) scale(1.02)!important}
  .wai-btn-g{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-g:hover{background:rgba(255,107,53,.08)!important;border-color:rgba(255,107,53,.45)!important;transform:translateY(-2px)!important}
  .wai-btn-r{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-r:hover{filter:brightness(1.15)!important;transform:translateY(-2px)!important}
  .wai-wb-select{transition:border-color .25s ease!important}
  .wai-wb-select:hover{border-color:rgba(59,130,246,0.5)!important}
`;

const EVChargeControl: React.FC = () => {
  const [evState, setEvState] = useState<EVState>({ ev_soc: 0, ev_power_kw: 0, ev_charging: false });
  const [loading, setLoading] = useState(false);
  const [power, setPower] = useState<number>(11);
  const [error, setError] = useState<string | null>(null);
  /* ── Alle Wallboxen aus der API ── */
  const [allWallboxes, setAllWallboxes] = useState<WallboxInfo[]>([]);
  const [selectedWallboxId, setSelectedWallboxId] = useState<string | null>(null);
  const [wallboxError, setWallboxError] = useState<string | null>(null);
  const [cloudSoc, setCloudSoc] = useState<number | null>(null);
  const [cloudAvailable, setCloudAvailable] = useState<boolean | null>(null);
  const [cloudProvider, setCloudProvider] = useState<string | null>(null);

  // WebSocket Live-Daten
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if ('ev_soc' in data && 'ev_power_kw' in data && 'ev_charging' in data) {
          setEvState({ ev_soc: data.ev_soc, ev_power_kw: data.ev_power_kw, ev_charging: data.ev_charging });
        }
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, []);

  // Alle Wallboxen aus Geräteliste laden (nicht nur die erste)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/devices`, {
          headers: { 'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE' },
        });
        if (!res.ok) return;
        const data: DevicesResponse = await res.json();
        const wbs = (data.devices || []).filter(
          d => (d.type || '').toLowerCase().includes('wallbox') ||
               (d.type || '').toLowerCase().includes('evse') ||
               (d.type || '').toLowerCase().includes('charger'),
        );
        setAllWallboxes(wbs);
        // Vorauswahl: erste wirklich verbundene Wallbox
        const firstConnected = wbs.find(isReallyConnected);
        if (firstConnected?.id) setSelectedWallboxId(firstConnected.id);
      } catch (e: unknown) {
        setWallboxError(e instanceof Error ? e.message : 'Geräteübersicht konnte nicht geladen werden.');
      }
    };
    load();
    const id = setInterval(load, 15000); // alle 15s aktualisieren
    return () => clearInterval(id);
  }, []);

  // Cloud/BMS SOC
  useEffect(() => {
    let cancelled = false;
    const loadCloud = async () => {
      try {
        const res = await fetch(`${API_URL}/ev/cloud_status`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.available && typeof data.soc === 'number') {
          setCloudSoc(data.soc); setCloudAvailable(true); setCloudProvider(data.provider || null);
        } else setCloudAvailable(false);
      } catch { if (!cancelled) setCloudAvailable(false); }
    };
    loadCloud();
    const id = setInterval(loadCloud, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* ── Abgeleitete Werte ── */
  const connectedWallboxes = allWallboxes.filter(isReallyConnected);
  const selectedWallbox = connectedWallboxes.find(w => w.id === selectedWallboxId) ?? connectedWallboxes[0] ?? null;
  const wallboxConnected = selectedWallbox !== null;
  // Wallboxen, die in der API existieren aber nicht verbunden sind
  const disconnectedWallboxes = allWallboxes.filter(w => !isReallyConnected(w));

  const setCharging = async (charging: boolean) => {
    if (!wallboxConnected) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE' },
        body: JSON.stringify({ state: charging, power_kw: power }),
      });
      if (!res.ok) throw new Error('Fehler beim Senden der Anfrage');
      const result: ChargingResponse = await res.json();
      setEvState(prev => ({ ...prev, ev_soc: result.soc ?? prev.ev_soc, ev_power_kw: result.power_kw ?? prev.ev_power_kw, ev_charging: charging }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally { setLoading(false); }
  };

  const soc = evState.ev_soc;
  const socColor = soc > 60 ? '#22c55e' : soc > 25 ? '#f59e0b' : '#ef4444';
  const r = 44, cx = 52, cy = 56;
  const circ = 2 * Math.PI * r;
  const dash = (soc / 100) * circ;

  const POWER_OPTIONS = [
    { value: 3.7, label: '3.7 kW', desc: 'Eco' },
    { value: 7.4, label: '7.4 kW', desc: 'Standard' },
    { value: 11,  label: '11 kW',  desc: 'Schnell' },
    { value: 22,  label: '22 kW',  desc: 'Max' },
  ];

  return (
    <div>
      <style>{WAI}</style>

      {/* Subtitle */}
      <p style={{ margin:'0 0 20px', fontSize:13, color:'rgba(248,250,252,0.42)', lineHeight:1.75 }}>
        Steuerung des Ladevorgangs (Start/Stop, Ladeleistung). Wallbox-Verbindung unter
        Geräte verwalten. SOC aus Wallbox/Backend; während der Fahrt nur über Fahrzeug-BMS zugänglich.
      </p>

      {/* Status row */}
      <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'start', marginBottom:24 }}>
        {/* SOC gauge */}
        <svg width="104" height="112" viewBox="0 0 104 112" fill="none">
          <defs>
            <linearGradient id="ev-arc" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={socColor}/>
              <stop offset="100%" stopColor="#3b82f6"/>
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} stroke="rgba(255,255,255,0.05)" strokeWidth="9" fill="none"/>
          <circle cx={cx} cy={cy} r={r} stroke="url(#ev-arc)" strokeWidth="9" fill="none"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition:'stroke-dasharray 1s ease', filter:'drop-shadow(0 0 6px rgba(34,197,94,0.5))', transformOrigin:`${cx}px ${cy}px`, transform:'rotate(-90deg)' }}
          />
          <text x={cx} y={cy-8} textAnchor="middle" fontSize="18" fill="#f8fafc">⚡</text>
          <text x={cx} y={cy+12} textAnchor="middle" fontSize="20" fontWeight="800" fill={socColor} fontFamily="monospace">{soc}</text>
          <text x={cx} y={cy+24} textAnchor="middle" fontSize="9" fill="rgba(248,250,252,0.4)" fontFamily="monospace">% SOC</text>
          <text x={cx} y={cy+42} textAnchor="middle" fontSize="8" fill={evState.ev_charging ? '#22c55e' : 'rgba(248,250,252,0.3)'} fontFamily="monospace">
            {evState.ev_charging ? '▲ LÄDT' : '● BEREIT'}
          </text>
        </svg>

        {/* Stats */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { label:'SOC (Wallbox/Backend)', value:`${soc}%`, color:socColor },
            { label:'Ladeleistung', value:`${evState.ev_power_kw} kW`, color:'#3b82f6' },
            { label:'Status', value: evState.ev_charging ? 'Lädt gerade' : 'Nicht am Laden', color: evState.ev_charging ? '#22c55e' : 'rgba(248,250,252,0.4)' },
            ...(cloudAvailable && cloudSoc !== null ? [{ label:`SOC (BMS${cloudProvider ? ' · '+cloudProvider : ''})`, value:`${cloudSoc}%`, color:'#a78bfa' }] : []),
          ].map(({label,value,color})=>(
            <div key={label} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'10px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:12, color:'rgba(248,250,252,0.42)', letterSpacing:'0.05em' }}>{label}</span>
              <span style={{ fontSize:15, fontWeight:800, color, fontFamily:'monospace' }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Power selector */}
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,149,0,0.7)', fontWeight:700, marginBottom:10 }}>Ladeleistung wählen</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {POWER_OPTIONS.map(opt=>(
            <button key={opt.value} type="button"
              disabled={!wallboxConnected || evState.ev_charging || loading}
              onClick={()=>setPower(opt.value)}
              style={{
                background: power===opt.value ? 'linear-gradient(90deg,#ff6b35,#ff9500)' : 'rgba(255,255,255,0.04)',
                color: power===opt.value ? '#0a0305' : 'rgba(248,250,252,0.7)',
                border: power===opt.value ? 'none' : '1px solid rgba(255,107,53,0.2)',
                borderRadius:10, padding:'10px 16px', fontWeight:700, fontSize:13, cursor:'pointer',
                opacity: (!wallboxConnected || evState.ev_charging || loading) ? 0.45 : 1,
                transition:'all .3s ease',
              }}>
              <div>{opt.label}</div>
              <div style={{ fontSize:10, fontWeight:400, marginTop:2 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
        <button type="button" className="wai-btn-o"
          title="Startet den Ladevorgang mit der gewählten Ladeleistung."
          onClick={()=>setCharging(true)}
          disabled={!wallboxConnected || evState.ev_charging || loading}
          style={{
            flex:'1 1 140px', background:'linear-gradient(90deg,#22c55e,#16a34a)', color:'#fff',
            border:'none', borderRadius:999, padding:'13px 24px', fontWeight:800, fontSize:14, cursor:'pointer',
            opacity:(!wallboxConnected || evState.ev_charging || loading)?0.4:1,
            animation:(!wallboxConnected || evState.ev_charging || loading)?'none':'wai-glow-o 5s ease-in-out infinite',
          }}>
          {loading ? '…' : '▶ Laden starten'}
        </button>
        <button type="button" className="wai-btn-r"
          title="Beendet den aktuellen Ladevorgang."
          onClick={()=>setCharging(false)}
          disabled={!wallboxConnected || !evState.ev_charging || loading}
          style={{
            flex:'1 1 140px', background:'rgba(239,68,68,0.15)', color:'rgba(248,100,80,0.9)',
            border:'1px solid rgba(239,68,68,0.35)', borderRadius:999, padding:'13px 24px', fontWeight:700, fontSize:14, cursor:'pointer',
            opacity:(!wallboxConnected || !evState.ev_charging || loading)?0.4:1,
          }}>
          ■ Laden stoppen
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#f87171', marginBottom:12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Wallbox status */}
      <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 16px', fontSize:12, color:'rgba(248,250,252,0.4)', lineHeight:1.6 }}>

        {/* Keine Wallbox in API */}
        {allWallboxes.length === 0 && !wallboxError && (
          <div style={{ color:'#f59e0b', display:'flex', alignItems:'center', gap:8 }}>
            <span>⚠</span>
            <span>Keine Wallbox gefunden. Bitte unter <strong style={{ color:'rgba(248,250,252,0.6)' }}>„Geräte"</strong> eine Wallbox verbinden.</span>
          </div>
        )}

        {/* Wallboxen vorhanden aber keine verbunden */}
        {allWallboxes.length > 0 && connectedWallboxes.length === 0 && (
          <div>
            <div style={{ color:'#f59e0b', display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span>⚠</span>
              <span>
                {allWallboxes.length === 1
                  ? `Wallbox erkannt (${allWallboxes[0].brand ?? ''} ${allWallboxes[0].model ?? ''}) — Status: „${allWallboxes[0].status ?? 'unbekannt'}" (nicht verbunden).`
                  : `${allWallboxes.length} Wallboxen erkannt — keine davon ist verbunden.`}
              </span>
            </div>
            <div style={{ color:'rgba(248,250,252,0.25)', fontSize:11 }}>
              Bitte im Tab <strong style={{ color:'rgba(248,250,252,0.45)' }}>Geräte → Wallbox / EVSE</strong> auf „Jetzt verbinden" klicken.
            </div>
            {disconnectedWallboxes.map(w => (
              <div key={w.id ?? w.ip} style={{ marginTop:6, padding:'6px 10px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.18)', borderRadius:8, fontSize:11, fontFamily:'monospace', color:'rgba(248,250,252,0.4)' }}>
                🔌 {w.brand ?? 'Wallbox'} {w.model ?? ''} — Status: <span style={{ color:'#f87171' }}>{w.status ?? 'unbekannt'}</span>{w.ip ? ` · ${w.ip}` : ''}
              </div>
            ))}
          </div>
        )}

        {/* Mindestens eine verbundene Wallbox */}
        {connectedWallboxes.length > 0 && (
          <div>
            {/* Auswahl bei mehreren */}
            {connectedWallboxes.length > 1 && (
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'rgba(59,130,246,0.7)', fontWeight:700, marginBottom:6 }}>
                  Aktive Wallbox ({connectedWallboxes.length} verbunden)
                </div>
                <select
                  className="wai-wb-select"
                  value={selectedWallboxId ?? ''}
                  onChange={e => setSelectedWallboxId(e.target.value)}
                  style={{
                    width:'100%', padding:'8px 12px', borderRadius:9, fontSize:12, fontFamily:'monospace',
                    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(59,130,246,0.3)',
                    color:'#f8fafc', outline:'none', cursor:'pointer',
                  }}>
                  {connectedWallboxes.map(w => (
                    <option key={w.id ?? w.ip} value={w.id ?? ''} style={{ background:'#0f172a' }}>
                      🔌 {w.brand ?? 'Wallbox'} {w.model ?? ''}{w.ip ? ` · ${w.ip}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Aktive Wallbox Details */}
            {selectedWallbox && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0,
                  boxShadow:'0 0 8px rgba(34,197,94,0.6)', animation:'wai-breathe 3s ease-in-out infinite' }}/>
                <span style={{ color:'#22c55e', fontWeight:700 }}>
                  ✓ Verbunden: {selectedWallbox.brand ?? 'Wallbox'} {selectedWallbox.model ?? ''}
                </span>
                {selectedWallbox.ip && <span style={{ color:'rgba(248,250,252,0.25)', fontFamily:'monospace', fontSize:11 }}>· {selectedWallbox.ip}</span>}
              </div>
            )}

            {/* Alle verbundenen als Liste */}
            {connectedWallboxes.length > 1 && (
              <div style={{ marginTop:8, fontSize:11, color:'rgba(248,250,252,0.3)' }}>
                Alle verbundenen Wallboxen: {connectedWallboxes.map(w => `${w.brand ?? 'Wallbox'} ${w.model ?? ''}`.trim()).join(' · ')}
              </div>
            )}
          </div>
        )}

        {wallboxError && (
          <div style={{ color:'#f87171', marginTop:6, fontSize:11 }}>⚠ {wallboxError}</div>
        )}
      </div>
    </div>
  );
};

export default EVChargeControl;
