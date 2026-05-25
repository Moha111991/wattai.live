import { useEffect, useState, useCallback } from 'react';
import BatteryWidget from './BatteryWidget';
import SmartMeterEnergyWidget from './SmartMeterEnergyWidget';

const WS_URL = import.meta.env.VITE_WS_URL || '';

const WAI = `
  @keyframes wai-breathe{0%,100%{opacity:.5;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
  @keyframes wai-shimmer{0%{background-position:-300% center}100%{background-position:300% center}}
  @keyframes wai-drift{0%,100%{transform:translateY(0) translateX(0)}40%{transform:translateY(-22px) translateX(12px)}70%{transform:translateY(10px) translateX(-8px)}}
  @keyframes wai-scan{0%{top:-2px}100%{top:100%}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 30px rgba(255,107,53,.25)}50%{box-shadow:0 0 70px rgba(255,107,53,.55)}}
  @keyframes wai-spin-slow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes wai-pulse-green{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)}70%{box-shadow:0 0 0 8px rgba(34,197,94,0)}}
  @keyframes wai-pulse-red{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.5)}70%{box-shadow:0 0 0 8px rgba(239,68,68,0)}}
  @keyframes wai-progress{0%{width:0%}100%{width:100%}}
  @keyframes wai-scan-h{0%{left:-20%}100%{left:120%}}
  @keyframes wai-fade-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
  .wai-btn-o{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-o:hover{filter:brightness(1.18)!important;transform:translateY(-3px) scale(1.02)!important}
  .wai-btn-g{transition:all .6s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-g:hover{background:rgba(255,107,53,.08)!important;border-color:rgba(255,107,53,.45)!important;transform:translateY(-2px)!important}
  .wai-card{transition:border-color .8s ease,box-shadow .8s ease!important}
  .wai-card:hover{border-color:rgba(255,107,53,.3)!important;box-shadow:0 16px 48px rgba(255,107,53,.07)!important}
  .hap-device-row{transition:all 0.3s ease!important}
  .hap-device-row:hover{background:rgba(255,149,0,0.06)!important;border-color:rgba(255,149,0,0.25)!important}
`;

interface SysState { grid_power?: number; pv_power?: number; battery_soc?: number; home_power?: number; battery_power_kw?: number; battery_capacity_kwh?: number; }

// ── IoT Hausautomation Types ─────────────────────────────────────────────────
const DEVICES = [
  { id:'wp',  icon:'🔥', label:'Wärmepumpe',  watt:2200, proto:'KNX', color:'#ff6b35' },
  { id:'wm',  icon:'🫧', label:'Waschmaschine',watt:1800, proto:'Zigbee', color:'#3b82f6' },
  { id:'tr',  icon:'💨', label:'Trockner',     watt:2000, proto:'Z-Wave', color:'#a855f7' },
  { id:'sp',  icon:'🍽️', label:'Spülmaschine', watt:1200, proto:'Home Assistant', color:'#22c55e' },
  { id:'ac',  icon:'❄️', label:'Klimaanlage',  watt:1500, proto:'openHAB', color:'#22d3ee' },
  { id:'lx',  icon:'💡', label:'Smart Licht',  watt:80,   proto:'Loxone', color:'#fbbf24' },
];
const PROTOCOLS = ['KNX','Zigbee','Z-Wave','Home Assistant','openHAB','Loxone'];
const AUTOMATIONS = [
  { id:'pv',   label:'PV-Überschuss',  desc:'Startet automatisch bei Solarüberschuss' },
  { id:'tarif',label:'Günstigster Tarif',desc:'Nutzt den günstigsten Netztarif (Tibber/aWATTar)' },
  { id:'zeit', label:'Zeitfenster',     desc:'Startet in definiertem Zeitfenster' },
  { id:'sg',   label:'SG-Ready',        desc:'Steuersignal vom Netzbetreiber' },
];

type ConnStatus = 'disconnected' | 'scanning' | 'pairing' | 'connected' | 'error';
type DeviceState = {
  coupled: boolean; automation: string; active: boolean; kwh: number; schedule: string;
  connStatus: ConnStatus; pairingCode: string; ip: string; signal: number; lastSeen: string;
};

const rndIP = () => `192.168.1.${Math.floor(Math.random()*200+10)}`;
const rndCode = () => Math.random().toString(36).substring(2,8).toUpperCase();
const rndSignal = () => Math.floor(Math.random()*40+60);

// ── Realistic connection steps per protocol ──────────────────────────────────
const CONN_STEPS: Record<string, string[]> = {
  'KNX':            ['KNX-Bus wird gescannt…','Gerät auf IP-Adresse gefunden','ETS-Gruppenadresse wird geprüft…','Tunnel-Verbindung aufgebaut'],
  'Zigbee':         ['Zigbee-Coordinator initialisiert…','IEEE 802.15.4 Scan läuft…','Gerät antwortet auf Beacon','Sicherheitsschlüssel ausgetauscht'],
  'Z-Wave':         ['Z-Wave Controller aktiv…','900 MHz Band wird gescannt…','Node-ID zugewiesen','S2-Sicherheitsprofil aktiviert'],
  'Home Assistant': ['Home Assistant API verbinden…','Token wird validiert…','Entity-ID wird ermittelt','Webhook registriert'],
  'openHAB':        ['openHAB REST-API erreichbar…','Thing-Discovery läuft…','Channel wird gemappt','Rule erstellt'],
  'Loxone':         ['Loxone Miniserver gefunden…','Websocket öffnen…','Authentifizierung mit Token','Virtueller Eingang aktiv'],
};

function ConnectionAnimation({ proto, onDone }: { proto: string; onDone: () => void }) {
  const steps = CONN_STEPS[proto] ?? ['Verbindung wird hergestellt…','Authentifizierung…','Gerät registriert','Bereit'];
  const [cur, setCur] = useState(0);
  const [prog, setProg] = useState(0);

  useEffect(() => {
    const total = 2400;
    const t = setInterval(() => {
      setProg(p => {
        const next = p + 100 / (total / 40);
        if (next >= 100) { clearInterval(t); setTimeout(onDone, 200); return 100; }
        setCur(Math.floor((next / 100) * steps.length));
        return next;
      });
    }, 40);
    return () => clearInterval(t);
  }, [steps.length, onDone]);

  return (
    <div style={{ animation:'wai-fade-in 0.3s ease' }}>
      {/* Progress bar */}
      <div style={{ position:'relative', height:6, borderRadius:3, background:'rgba(255,255,255,0.06)', overflow:'hidden', marginBottom:16 }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', borderRadius:3,
          background:'linear-gradient(90deg,#ff6b35,#ff9500)', transition:'width 0.1s linear', width:`${prog}%` }}/>
        <div style={{ position:'absolute', top:0, bottom:0, width:'30%', background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)',
          animation:'wai-scan-h 1.2s ease-in-out infinite' }}/>
      </div>
      {/* Step list */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:10, animation: i <= cur ? 'wai-fade-in 0.3s ease' : 'none', opacity: i > cur ? 0.25 : 1, transition:'opacity 0.3s' }}>
            <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
              background: i < cur ? 'rgba(34,197,94,0.2)' : i === cur ? 'rgba(255,149,0,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1.5px solid ${i < cur ? '#22c55e' : i === cur ? '#ff9500' : 'rgba(255,255,255,0.1)'}` }}>
              {i < cur ? (
                <span style={{ fontSize:9, color:'#22c55e', fontWeight:800 }}>✓</span>
              ) : i === cur ? (
                <span style={{ display:'block', width:7, height:7, borderRadius:'50%', border:'1.5px solid #ff9500', borderTopColor:'transparent', animation:'wai-spin-slow 0.6s linear infinite' }}/>
              ) : (
                <span style={{ width:5, height:5, borderRadius:'50%', background:'rgba(255,255,255,0.15)', display:'block' }}/>
              )}
            </div>
            <span style={{ fontSize:12, color: i < cur ? '#22c55e' : i === cur ? '#ff9500' : 'rgba(248,250,252,0.3)', fontFamily:'monospace' }}>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop:12, fontSize:11, color:'rgba(248,250,252,0.35)', fontFamily:'monospace' }}>
        {Math.round(prog)}% — {proto} Verbindungsaufbau…
      </div>
    </div>
  );
}

function HausautomationPanel() {
  const [step, setStep] = useState<1|2|3|4|5>(1);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedProto, setSelectedProto] = useState<string>('');
  const [selectedAuto, setSelectedAuto] = useState<string>('pv');
  const [schedule, setSchedule] = useState<string>('11:00');
  const [connecting, setConnecting] = useState(false);
  const [managingId, setManagingId] = useState<string|null>(null);
  const [deviceStates, setDeviceStates] = useState<Record<string, DeviceState>>(() =>
    Object.fromEntries(DEVICES.map(d => [d.id, {
      coupled: false, automation:'pv', active: false,
      kwh: +(Math.random()*3).toFixed(2), schedule:'11:00',
      connStatus: 'disconnected' as ConnStatus,
      pairingCode: rndCode(), ip: rndIP(), signal: rndSignal(), lastSeen: '–'
    }]))
  );

  const dev = DEVICES.find(d => d.id === selectedDevice);
  const ds = selectedDevice ? deviceStates[selectedDevice] : null;

  const handleConnect = useCallback(() => {
    if (!selectedDevice || !selectedProto) return;
    setConnecting(true);
    setDeviceStates(prev => ({ ...prev, [selectedDevice]: { ...prev[selectedDevice], connStatus: 'scanning' } }));
  }, [selectedDevice, selectedProto]);

  const handleConnectDone = useCallback(() => {
    setConnecting(false);
    const now = new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
    setDeviceStates(prev => ({ ...prev, [selectedDevice]: {
      ...prev[selectedDevice], coupled: true, connStatus: 'connected',
      ip: rndIP(), signal: rndSignal(), lastSeen: now
    }}));
    setStep(4);
  }, [selectedDevice]);

  const handleDisconnect = useCallback((id: string) => {
    setDeviceStates(prev => ({ ...prev, [id]: { ...prev[id], coupled: false, active: false, connStatus: 'disconnected' } }));
  }, []);

  const handleReconnect = useCallback((id: string) => {
    setDeviceStates(prev => ({ ...prev, [id]: { ...prev[id], connStatus: 'scanning' } }));
    setTimeout(() => {
      const now = new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
      setDeviceStates(prev => ({ ...prev, [id]: { ...prev[id], coupled: true, active: true, connStatus: 'connected', lastSeen: now, signal: rndSignal() } }));
    }, 2200);
  }, []);

  const handleActivate = useCallback(() => {
    if (!selectedDevice) return;
    setDeviceStates(prev => ({ ...prev, [selectedDevice]: { ...prev[selectedDevice], automation: selectedAuto, active: true, schedule } }));
    setStep(5);
  }, [selectedDevice, selectedAuto, schedule]);

  const handleReset = useCallback(() => {
    setStep(1); setSelectedDevice(''); setSelectedProto(''); setConnecting(false); setManagingId(null);
  }, []);

  const STEPS = ['Gerät wählen','Protokoll','Verbinden','Automatisierung','Live-Status'];
  const connectedDevices = DEVICES.filter(d => deviceStates[d.id].coupled);

  return (
    <div style={{ fontFamily:'monospace' }}>
      {/* Step indicator */}
      <div style={{ display:'flex', gap:0, marginBottom:20, borderRadius:12, overflow:'hidden', border:'1px solid rgba(255,149,0,0.12)' }}>
        {STEPS.map((s, i) => {
          const n = (i + 1) as 1|2|3|4|5;
          const done = step > n;
          const active = step === n;
          return (
            <div key={s} onClick={() => { if (done) setStep(n); }}
              style={{ flex:1, padding:'9px 4px', textAlign:'center', fontSize:10, fontWeight:700,
                background: done ? 'rgba(34,197,94,0.1)' : active ? 'rgba(255,149,0,0.13)' : 'rgba(255,255,255,0.02)',
                color: done ? '#22c55e' : active ? '#ff9500' : 'rgba(248,250,252,0.25)',
                borderRight: i < 4 ? '1px solid rgba(255,149,0,0.08)' : undefined,
                letterSpacing:'0.05em', transition:'all 0.4s', cursor: done ? 'pointer' : 'default' }}>
              {done ? '✓ ' : `${n}. `}{s}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Gerät wählen ─────────────────────────────────────────── */}
      {step === 1 && (
        <div style={{ animation:'wai-fade-in 0.3s ease' }}>
          <div style={{ fontSize:12, color:'rgba(248,250,252,0.45)', marginBottom:14, letterSpacing:'0.04em' }}>
            Wählen Sie ein Gerät, das Sie mit WattAI verbinden möchten:
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:10 }}>
            {DEVICES.map(d => {
              const st = deviceStates[d.id];
              return (
                <button key={d.id} type="button" onClick={() => { setSelectedDevice(d.id); setSelectedProto(d.proto); setStep(2); }}
                  style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 14px', borderRadius:13, textAlign:'left',
                    background: st.coupled ? `${d.color}12` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${st.coupled ? d.color+'55' : 'rgba(255,255,255,0.07)'}`,
                    color:'#f8fafc', cursor:'pointer', transition:'all 0.3s', position:'relative' }}>
                  <span style={{ fontSize:22 }}>{d.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.label}</div>
                    <div style={{ fontSize:10, color:'rgba(248,250,252,0.35)', marginTop:1 }}>{d.watt} W · {d.proto}</div>
                  </div>
                  {st.coupled && (
                    <div style={{ position:'absolute', top:8, right:8, width:7, height:7, borderRadius:'50%',
                      background:'#22c55e', animation:'wai-pulse-green 2s ease-in-out infinite' }}/>
                  )}
                </button>
              );
            })}
          </div>
          {connectedDevices.length > 0 && (
            <div style={{ marginTop:18, padding:'12px 16px', borderRadius:12, background:'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.14)' }}>
              <div style={{ fontSize:10, color:'rgba(34,197,94,0.7)', letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>
                Verbundene Geräte ({connectedDevices.length})
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {connectedDevices.map(d => (
                  <span key={d.id} style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${d.color}10`,
                    border:`1px solid ${d.color}35`, borderRadius:8, padding:'3px 10px', fontSize:11, color:d.color }}>
                    {d.icon} {d.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Protokoll wählen ─────────────────────────────────────── */}
      {step === 2 && dev && (
        <div style={{ animation:'wai-fade-in 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'12px 16px',
            background:`${dev.color}08`, border:`1px solid ${dev.color}25`, borderRadius:12 }}>
            <span style={{ fontSize:28 }}>{dev.icon}</span>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:'#f8fafc' }}>{dev.label}</div>
              <div style={{ fontSize:11, color:'rgba(248,250,252,0.4)', marginTop:2 }}>{dev.watt} W Nennleistung</div>
            </div>
          </div>
          <div style={{ fontSize:12, color:'rgba(248,250,252,0.5)', marginBottom:6 }}>Kommunikationsprotokoll wählen:</div>
          <div style={{ fontSize:11, color:'rgba(255,149,0,0.6)', marginBottom:12 }}>
            ⭐ Empfohlen für {dev.label}: <b style={{ color:'#ff9500' }}>{dev.proto}</b>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:18 }}>
            {PROTOCOLS.map(p => (
              <button key={p} type="button" onClick={() => setSelectedProto(p)}
                style={{ padding:'9px 18px', borderRadius:10,
                  background: selectedProto === p ? 'rgba(255,149,0,0.16)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${selectedProto === p ? '#ff9500' : 'rgba(255,255,255,0.09)'}`,
                  color: selectedProto === p ? '#ff9500' : 'rgba(248,250,252,0.55)',
                  fontWeight: selectedProto === p ? 700 : 500, fontSize:12, cursor:'pointer', transition:'all 0.25s',
                  boxShadow: selectedProto === p ? '0 0 14px rgba(255,149,0,0.12)' : 'none' }}>
                {p === dev.proto ? `⭐ ${p}` : p}
              </button>
            ))}
          </div>
          {selectedProto && (
            <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', fontSize:11, color:'rgba(248,250,252,0.4)', lineHeight:1.7 }}>
              <b style={{ color:'#ff9500' }}>{selectedProto}</b> benötigt:{' '}
              {selectedProto === 'KNX' && 'KNX IP-Interface oder USB-Adapter, ETS-Projektdatei'}
              {selectedProto === 'Zigbee' && 'Zigbee-Coordinator (USB-Stick, z.B. ConBee II), freie USB-Schnittstelle'}
              {selectedProto === 'Z-Wave' && 'Z-Wave Controller (USB), S2-Sicherheitscode vom Gerät'}
              {selectedProto === 'Home Assistant' && 'Home Assistant aktiv im Netzwerk, Long-Lived Access Token'}
              {selectedProto === 'openHAB' && 'openHAB Server erreichbar, API-Token in Einstellungen'}
              {selectedProto === 'Loxone' && 'Loxone Miniserver im LAN, Benutzername + Passwort'}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={() => setStep(1)} style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(248,250,252,0.45)', fontSize:12, cursor:'pointer' }}>← Zurück</button>
            <button type="button" onClick={() => selectedProto && setStep(3)}
              style={{ padding:'10px 26px', borderRadius:10, background: selectedProto ? 'rgba(255,149,0,0.16)' : 'rgba(255,255,255,0.04)',
                border:`1.5px solid ${selectedProto ? '#ff9500' : 'rgba(255,255,255,0.09)'}`,
                color: selectedProto ? '#ff9500' : 'rgba(248,250,252,0.35)', fontWeight:700, fontSize:12, cursor: selectedProto ? 'pointer' : 'default', transition:'all 0.25s' }}>
              Weiter →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Verbindung aufbauen ──────────────────────────────────── */}
      {step === 3 && dev && (
        <div style={{ animation:'wai-fade-in 0.3s ease' }}>
          {/* Device + Protocol header */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', borderRadius:10, background:`${dev.color}0c`, border:`1px solid ${dev.color}30` }}>
              <span style={{ fontSize:18 }}>{dev.icon}</span>
              <span style={{ fontWeight:700, fontSize:13, color:'#f8fafc' }}>{dev.label}</span>
            </div>
            <div style={{ color:'rgba(248,250,252,0.3)', fontSize:14 }}>↔</div>
            <div style={{ padding:'8px 14px', borderRadius:10, background:'rgba(255,149,0,0.1)', border:'1px solid rgba(255,149,0,0.25)', fontSize:12, color:'#ff9500', fontWeight:700 }}>{selectedProto}</div>
          </div>

          {/* Pre-connection checklist */}
          {!connecting && ds?.connStatus !== 'connected' && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:'rgba(248,250,252,0.5)', marginBottom:10 }}>Vor dem Verbinden sicherstellen:</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[
                  'Gerät ist eingeschaltet und betriebsbereit',
                  selectedProto === 'KNX' ? 'KNX IP-Interface mit Netzwerk verbunden' : selectedProto === 'Zigbee' ? 'Zigbee-Coordinator am Server angeschlossen' : selectedProto === 'Z-Wave' ? 'Z-Wave Stick eingesteckt, Gerät in Reichweite' : `${selectedProto} Server/Hub ist erreichbar`,
                  'Gerät befindet sich im Kopplungsmodus (ggf. Taste 3 Sek. halten)',
                ].map((hint, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 12px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ color:'#ff9500', marginTop:1, flexShrink:0 }}>○</span>
                    <span style={{ fontSize:11, color:'rgba(248,250,252,0.5)', lineHeight:1.5 }}>{hint}</span>
                  </div>
                ))}
              </div>
              {/* Pairing code */}
              <div style={{ marginTop:14, padding:'12px 16px', borderRadius:10, background:'rgba(255,149,0,0.06)', border:'1px solid rgba(255,149,0,0.2)' }}>
                <div style={{ fontSize:10, color:'rgba(255,149,0,0.6)', letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Kopplungscode (falls gefordert)</div>
                <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:900, color:'#ff9500', letterSpacing:'0.25em' }}>{ds?.pairingCode}</div>
                <div style={{ fontSize:10, color:'rgba(248,250,252,0.35)', marginTop:4 }}>Am Gerätedisplay oder App eingeben</div>
              </div>
            </div>
          )}

          {/* Connecting animation */}
          {connecting && (
            <div style={{ marginBottom:16, padding:'16px', borderRadius:12, background:'rgba(255,149,0,0.04)', border:'1px solid rgba(255,149,0,0.18)' }}>
              <ConnectionAnimation proto={selectedProto} onDone={handleConnectDone} />
            </div>
          )}

          {/* Already connected state */}
          {ds?.connStatus === 'connected' && !connecting && (
            <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:12, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)', animation:'wai-fade-in 0.3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e', animation:'wai-pulse-green 2s ease-in-out infinite' }}/>
                <span style={{ color:'#22c55e', fontWeight:700, fontSize:13 }}>Verbunden · {selectedProto}</span>
              </div>
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>IP: <b style={{ color:'#f8fafc' }}>{ds.ip}</b></span>
                <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Signal: <b style={{ color:'#22c55e' }}>{ds.signal}%</b></span>
                <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Zuletzt gesehen: <b style={{ color:'#f8fafc' }}>{ds.lastSeen}</b></span>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button type="button" onClick={() => setStep(2)} disabled={connecting}
              style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(248,250,252,0.45)', fontSize:12, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.5 : 1 }}>
              ← Zurück
            </button>
            {ds?.connStatus !== 'connected' && (
              <button type="button" onClick={handleConnect} disabled={connecting}
                style={{ padding:'10px 26px', borderRadius:10,
                  background: connecting ? 'rgba(255,149,0,0.06)' : 'linear-gradient(90deg,#ff6b35,#ff9500)',
                  border:'none', color: connecting ? '#ff9500' : '#0a0305', fontWeight:800, fontSize:12,
                  cursor: connecting ? 'wait' : 'pointer', display:'flex', alignItems:'center', gap:8 }}>
                {connecting ? (
                  <><span style={{ display:'inline-block', width:12, height:12, borderRadius:'50%', border:'2px solid #ff9500', borderTopColor:'transparent', animation:'wai-spin-slow 0.6s linear infinite' }}/>Verbinde…</>
                ) : '⚡ Verbindung aufbauen'}
              </button>
            )}
            {ds?.connStatus === 'connected' && (
              <button type="button" onClick={() => setStep(4)}
                style={{ padding:'10px 26px', borderRadius:10, background:'linear-gradient(90deg,#22c55e,#3b82f6)', border:'none', color:'#fff', fontWeight:800, fontSize:12, cursor:'pointer' }}>
                Weiter → Automatisierung
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Step 4: Automatisierung ──────────────────────────────────────── */}
      {step === 4 && dev && (
        <div style={{ animation:'wai-fade-in 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, padding:'10px 14px', borderRadius:10, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.2)' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', animation:'wai-pulse-green 2s ease-in-out infinite' }}/>
            <span style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>{dev.icon} {dev.label} verbunden via {selectedProto}</span>
          </div>
          <div style={{ fontSize:12, color:'rgba(248,250,252,0.5)', marginBottom:12 }}>Automatisierungsregel festlegen:</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {AUTOMATIONS.map(a => (
              <button key={a.id} type="button" onClick={() => setSelectedAuto(a.id)}
                style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 16px', borderRadius:12, textAlign:'left',
                  background: selectedAuto === a.id ? 'rgba(255,149,0,0.1)' : 'rgba(255,255,255,0.03)',
                  border:`1.5px solid ${selectedAuto === a.id ? '#ff9500' : 'rgba(255,255,255,0.07)'}`,
                  color:'#f8fafc', cursor:'pointer', transition:'all 0.25s',
                  boxShadow: selectedAuto === a.id ? '0 0 16px rgba(255,149,0,0.08)' : 'none' }}>
                <div style={{ width:17, height:17, borderRadius:'50%', marginTop:1, flexShrink:0,
                  background: selectedAuto === a.id ? '#ff9500' : 'rgba(255,255,255,0.08)',
                  border:`2px solid ${selectedAuto === a.id ? '#ff9500' : 'rgba(255,255,255,0.18)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {selectedAuto === a.id && <span style={{ width:6, height:6, borderRadius:'50%', background:'#0a0305', display:'block' }}/>}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{a.label}</div>
                  <div style={{ fontSize:11, color:'rgba(248,250,252,0.4)', marginTop:2 }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
          {selectedAuto === 'zeit' && (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, padding:'10px 14px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,149,0,0.2)' }}>
              <span style={{ fontSize:12, color:'rgba(248,250,252,0.5)' }}>Startuhrzeit:</span>
              <input type="time" value={schedule} onChange={e => setSchedule(e.target.value)}
                style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,149,0,0.3)', borderRadius:8, padding:'6px 12px', color:'#ff9500', fontSize:14, fontFamily:'monospace', outline:'none' }}/>
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            <button type="button" onClick={() => setStep(3)} style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(248,250,252,0.45)', fontSize:12, cursor:'pointer' }}>← Zurück</button>
            <button type="button" onClick={handleActivate} style={{ padding:'10px 26px', borderRadius:10, background:'linear-gradient(90deg,#22c55e,#3b82f6)', border:'none', color:'#fff', fontWeight:800, fontSize:12, cursor:'pointer' }}>
              ✓ Automatisierung aktivieren
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Live-Status & Geräteverwaltung ───────────────────────── */}
      {step === 5 && (
        <div style={{ animation:'wai-fade-in 0.3s ease' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
            <div>
              <div style={{ fontSize:13, color:'#22c55e', fontWeight:800 }}>✓ Alle aktiven Automationen – Live-Status</div>
              <div style={{ fontSize:11, color:'rgba(248,250,252,0.35)', marginTop:2 }}>{connectedDevices.length} Gerät{connectedDevices.length !== 1 ? 'e' : ''} verbunden</div>
            </div>
            <button type="button" onClick={handleReset}
              style={{ padding:'8px 18px', borderRadius:10, background:'rgba(255,149,0,0.1)', border:'1px solid rgba(255,149,0,0.25)', color:'#ff9500', fontWeight:700, fontSize:12, cursor:'pointer' }}>
              + Gerät hinzufügen
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {DEVICES.filter(d => deviceStates[d.id].active || deviceStates[d.id].coupled).map(d => {
              const dstate = deviceStates[d.id];
              const autoLabel = AUTOMATIONS.find(a => a.id === dstate.automation)?.label ?? '–';
              const isManaging = managingId === d.id;
              const isReconnecting = dstate.connStatus === 'scanning';

              return (
                <div key={d.id} className="hap-device-row" style={{ borderRadius:14, background:`${d.color}07`, border:`1px solid ${dstate.coupled ? d.color+'30' : 'rgba(239,68,68,0.2)'}`, overflow:'hidden', transition:'all 0.3s' }}>
                  {/* Main row */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                    <span style={{ fontSize:24 }}>{d.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                        <span style={{ fontWeight:800, fontSize:14, color:'#f8fafc' }}>{d.label}</span>
                        <span style={{ fontSize:10, color:d.color, background:`${d.color}15`, borderRadius:6, padding:'1px 8px', fontWeight:700 }}>{d.proto}</span>
                        {dstate.active && <span style={{ fontSize:10, color:'#ff9500', background:'rgba(255,149,0,0.1)', borderRadius:6, padding:'1px 8px', fontWeight:700 }}>{autoLabel}</span>}
                        {/* Connection status badge */}
                        {dstate.coupled && !isReconnecting && (
                          <span style={{ fontSize:9, color:'#22c55e', background:'rgba(34,197,94,0.1)', borderRadius:6, padding:'1px 8px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>● Online</span>
                        )}
                        {!dstate.coupled && !isReconnecting && (
                          <span style={{ fontSize:9, color:'#ef4444', background:'rgba(239,68,68,0.1)', borderRadius:6, padding:'1px 8px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>○ Getrennt</span>
                        )}
                        {isReconnecting && (
                          <span style={{ fontSize:9, color:'#ff9500', background:'rgba(255,149,0,0.1)', borderRadius:6, padding:'1px 8px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:4 }}>
                            <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', border:'1.5px solid #ff9500', borderTopColor:'transparent', animation:'wai-spin-slow 0.6s linear infinite' }}/>
                            Verbinde…
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Verbrauch: <b style={{ color:d.color }}>{dstate.kwh} kWh</b></span>
                        {dstate.coupled && <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Signal: <b style={{ color:'#22c55e' }}>{dstate.signal}%</b></span>}
                        {dstate.coupled && <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>IP: <b style={{ color:'rgba(248,250,252,0.7)' }}>{dstate.ip}</b></span>}
                        {dstate.lastSeen !== '–' && <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Gesehen: <b style={{ color:'rgba(248,250,252,0.6)' }}>{dstate.lastSeen}</b></span>}
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                      <button type="button" onClick={() => setManagingId(isManaging ? null : d.id)}
                        style={{ padding:'6px 13px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${isManaging ? 'rgba(255,149,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: isManaging ? '#ff9500' : 'rgba(248,250,252,0.5)', fontSize:11, cursor:'pointer', fontWeight:600, transition:'all 0.25s' }}>
                        {isManaging ? '✕ Schließen' : '⚙ Verwalten'}
                      </button>
                      {dstate.coupled && !isReconnecting && (
                        <button type="button" onClick={() => handleDisconnect(d.id)}
                          style={{ padding:'6px 13px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
                            color:'#ef4444', fontSize:11, cursor:'pointer', fontWeight:700, transition:'all 0.25s' }}>
                          ✕ Trennen
                        </button>
                      )}
                      {!dstate.coupled && !isReconnecting && (
                        <button type="button" onClick={() => handleReconnect(d.id)}
                          style={{ padding:'6px 13px', borderRadius:8, background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.3)',
                            color:'#22c55e', fontSize:11, cursor:'pointer', fontWeight:700, transition:'all 0.25s' }}>
                          ↻ Verbinden
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expand: Gerät verwalten panel */}
                  {isManaging && (
                    <div style={{ borderTop:`1px solid ${d.color}18`, padding:'14px 16px', background:'rgba(0,0,0,0.12)', animation:'wai-fade-in 0.2s ease' }}>
                      <div style={{ fontSize:10, color:'rgba(255,149,0,0.6)', letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:10 }}>Geräteeinstellungen</div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:8, marginBottom:12 }}>
                        {[
                          { label:'Protokoll', value:d.proto, c:d.color },
                          { label:'IP-Adresse', value:dstate.coupled ? dstate.ip : '–', c:'rgba(248,250,252,0.7)' },
                          { label:'Signalstärke', value:dstate.coupled ? `${dstate.signal}%` : '–', c:'#22c55e' },
                          { label:'Nennleistung', value:`${d.watt} W`, c:'#ff9500' },
                          { label:'Automatisierung', value: dstate.active ? autoLabel : 'Inaktiv', c: dstate.active ? '#ff9500' : 'rgba(248,250,252,0.35)' },
                          { label:'Kopplungscode', value:dstate.pairingCode, c:'rgba(248,250,252,0.5)' },
                        ].map(({ label, value, c }) => (
                          <div key={label} style={{ padding:'8px 12px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize:9, color:'rgba(248,250,252,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                            <div style={{ fontSize:12, fontWeight:700, color:c, fontFamily:'monospace' }}>{value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <button type="button" style={{ padding:'7px 14px', borderRadius:8, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                          🔧 Diagnose starten
                        </button>
                        <button type="button" style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(248,250,252,0.5)', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                          📋 Logfile anzeigen
                        </button>
                        <button type="button" onClick={() => {
                          setDeviceStates(prev => ({ ...prev, [d.id]: { ...prev[d.id], pairingCode: rndCode() } }));
                        }} style={{ padding:'7px 14px', borderRadius:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(248,250,252,0.5)', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                          🔑 Code erneuern
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {connectedDevices.length === 0 && (
            <div style={{ textAlign:'center', padding:'32px 20px', color:'rgba(248,250,252,0.3)', fontSize:13 }}>
              Noch keine Geräte verbunden.<br/>
              <button type="button" onClick={handleReset} style={{ marginTop:12, padding:'10px 22px', borderRadius:10, background:'rgba(255,149,0,0.1)', border:'1px solid rgba(255,149,0,0.25)', color:'#ff9500', fontWeight:700, fontSize:13, cursor:'pointer' }}>
                + Erstes Gerät verbinden
              </button>
            </div>
          )}
        </div>
      )}

      {/* Protocols + Legal */}
      <div style={{ marginTop:24, borderTop:'1px solid rgba(255,149,0,0.07)', paddingTop:16 }}>
        <div style={{ fontSize:10, color:'rgba(255,149,0,0.55)', marginBottom:8, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase' }}>Unterstützte Protokolle</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
          {['KNX','Zigbee','Z-Wave','Home Assistant','openHAB','Loxone','SG-Ready','MQTT','REST'].map(p => (
            <span key={p} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:7, padding:'3px 10px', fontSize:10, color:'rgba(248,250,252,0.6)', fontFamily:'monospace', fontWeight:600 }}>{p}</span>
          ))}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,149,0,0.5)', lineHeight:1.7 }}>
          🇩🇪 <b>Rechtlicher Hinweis:</b> DSGVO-konform · IT-Sicherheitsgesetz · EN 50631-1 · Ende-zu-Ende-verschlüsselt
        </div>
      </div>
    </div>
  );
}

const HouseholdDashboard = () => {
  const [state, setState] = useState<SysState>({});

  useEffect(() => {
    // Try both /ws and bare WS_URL
    let ws: WebSocket;
    try {
      const url = WS_URL ? (WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`) : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
      ws = new WebSocket(url);
      ws.onmessage = e => { try { setState(JSON.parse(e.data)); } catch {} };
      ws.onerror = () => { /* silent */ };
    } catch { return; }
    return () => { try { ws.close(); } catch {} };
  }, []);

  const iotNodes = [
    { label:'Heizung',   x:48,  y:82,  c:'#ff6b35' },
    { label:'Licht',     x:152, y:82,  c:'#ff9500' },
    { label:'Waschm.',   x:48,  y:130, c:'#3b82f6' },
    { label:'Kühl.',     x:152, y:130, c:'#22c55e' },
    { label:'Steckd.',   x:100, y:155, c:'#a78bfa' },
  ];

  return (
    <div style={{ background:'transparent', paddingBottom:48, width:'100%' }}>
      <style>{WAI}</style>

      {/* ── 4K CINEMATIC HEADER ─────────────────────────────────────────── */}
      <div style={{ position:'relative', width:'100%', minHeight:'clamp(260px,30vw,360px)', overflow:'hidden', background:'linear-gradient(160deg,#020617 0%,#04060e 100%)', borderBottom:'1px solid rgba(255,107,53,0.1)', marginBottom:32 }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)', zIndex:3 }}/>
        <div style={{ position:'absolute', top:'-30%', left:'-5%', width:'55%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,107,53,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'-30%', right:'-5%', width:'45%', height:'170%', borderRadius:'50%', background:'radial-gradient(circle,rgba(30,64,175,0.1),transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,107,53,0.18),transparent)', animation:'wai-scan 22s linear infinite', pointerEvents:'none', zIndex:2 }}/>
        {[0,1,2,3,4].map(i=>(
          <div key={i} style={{ position:'absolute', width:1.5, height:1.5, borderRadius:'50%', left:`${(i*43+9)%100}%`, top:`${(i*71+13)%100}%`, background:i%2===0?'#ff6b35':'#3b82f6', animation:`wai-drift ${32+(i%5)*4}s ease-in-out ${i*2.2}s infinite`, opacity:0.16, pointerEvents:'none' }}/>
        ))}

        {/* Smart home SVG (SmartHomeVisual port) */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'60%', opacity:0.88 }}>
          <svg viewBox="0 0 200 180" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <filter id="hh-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
              <linearGradient id="hh-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b35" stopOpacity="0.7"/><stop offset="100%" stopColor="#1e40af" stopOpacity="0.5"/></linearGradient>
            </defs>
            {/* House walls */}
            <rect x="55" y="70" width="90" height="75" fill="rgba(22,30,65,0.82)" stroke="rgba(255,107,53,0.4)" strokeWidth="1.2"/>
            {/* Roof */}
            <polygon points="45,70 100,28 155,70" fill="url(#hh-roof)" stroke="rgba(255,107,53,0.5)" strokeWidth="1"/>
            {/* Central hub (inside house) */}
            <circle cx="100" cy="107" r="11" fill="rgba(22,30,65,0.88)" stroke="rgba(255,107,53,0.8)" strokeWidth="1.5" filter="url(#hh-glow)">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite"/>
            </circle>
            <text x="100" y="110" textAnchor="middle" fill="#ff9500" fontSize="6" fontFamily="monospace" fontWeight="bold">HUB</text>
            {/* Windows */}
            <rect x="66" y="80" width="20" height="16" rx="2" fill="rgba(255,149,0,0.08)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.8">
              <animate attributeName="fill" values="rgba(255,149,0,0.08);rgba(255,149,0,0.18);rgba(255,149,0,0.08)" dur="5s" repeatCount="indefinite"/>
            </rect>
            <rect x="114" y="80" width="20" height="16" rx="2" fill="rgba(255,149,0,0.08)" stroke="rgba(255,149,0,0.35)" strokeWidth="0.8">
              <animate attributeName="fill" values="rgba(255,149,0,0.08);rgba(255,149,0,0.18);rgba(255,149,0,0.08)" dur="5s" begin="1.2s" repeatCount="indefinite"/>
            </rect>
            {/* Door */}
            <rect x="87" y="115" width="26" height="30" rx="2" fill="rgba(30,64,175,0.15)" stroke="rgba(59,130,246,0.3)" strokeWidth="0.8"/>
            {/* IoT nodes outside */}
            {iotNodes.map(({label,x,y,c})=>(
              <g key={label}>
                <line x1="100" y1="107" x2={x} y2={y} stroke={`${c}25`} strokeWidth="1" strokeDasharray="3 3"/>
                <circle cx={x} cy={y} r="11" fill="rgba(22,30,65,0.88)" stroke={c} strokeWidth="1.2" filter="url(#hh-glow)"/>
                <text x={x} y={y+3} textAnchor="middle" fill={c} fontSize="5.5" fontFamily="monospace">{label.slice(0,5)}</text>
                <circle r="2" fill={c} opacity="0.9">
                  <animateMotion dur="3.5s" repeatCount="indefinite" path={`M100,107 L${x},${y}`}/>
                  <animate attributeName="opacity" values="0;1;0" dur="3.5s" repeatCount="indefinite"/>
                </circle>
              </g>
            ))}
            <text x="100" y="175" textAnchor="middle" fill="rgba(255,149,0,0.4)" fontSize="6.5" fontFamily="monospace">SmartHome · {(state.home_power??0).toFixed(1)} kW Verbrauch</text>
          </svg>
        </div>

        {/* Left content */}
        <div style={{ position:'relative', zIndex:2, padding:'clamp(28px,4vw,52px) clamp(20px,3vw,48px)', display:'flex', flexDirection:'column', gap:16, maxWidth:'clamp(260px,46%,520px)' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,107,53,0.08)', border:'1px solid rgba(255,107,53,0.28)', borderRadius:999, padding:'6px 16px', width:'fit-content', backdropFilter:'blur(12px)' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#ff6b35', boxShadow:'0 0 8px rgba(255,107,53,0.7)', display:'inline-block', animation:'wai-breathe 4s ease-in-out infinite' }}/>
            <span style={{ fontSize:10, color:'rgba(255,149,0,0.9)', letterSpacing:'0.15em', textTransform:'uppercase', fontWeight:700 }}>Haushalt · Heimspeicher · IoT</span>
          </div>
          <h1 style={{ fontSize:'clamp(26px,3.8vw,52px)', fontWeight:900, lineHeight:1.06, letterSpacing:'-0.03em', margin:0, background:'linear-gradient(135deg,#fff5f0 0%,#ff9500 40%,#ff6b35 65%,#3b82f6 100%)', backgroundSize:'300% auto', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'wai-shimmer 9s linear infinite' }}>
            Haushalt &<br/>Heimspeicher
          </h1>
          <p style={{ margin:0, fontSize:'clamp(13px,1.4vw,15px)', color:'rgba(248,250,252,0.5)', lineHeight:1.8 }}>Intelligente Hausautomation, Verbrauchsoptimierung und Heimspeicher-Management in Echtzeit.</p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginTop:4 }}>
            <button type="button" className="wai-btn-o" style={{ background:'linear-gradient(90deg,#ff6b35,#ff9500)', color:'#0a0305', border:'none', borderRadius:999, padding:'12px 28px', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 0 32px rgba(255,107,53,0.32)', animation:'wai-glow-o 5s ease-in-out infinite' }}>Automationen</button>
            <button type="button" className="wai-btn-g" style={{ background:'transparent', color:'rgba(255,149,0,0.9)', border:'1px solid rgba(255,107,53,0.32)', borderRadius:999, padding:'12px 28px', fontWeight:700, fontSize:14, cursor:'pointer', backdropFilter:'blur(12px)' }}>Geräte verwalten</button>
          </div>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', marginTop:4 }}>
            {[
              { label:'PV', value:`${(state.pv_power??0).toFixed(1)} kW`, c:'#ff9500' },
              { label:'Netz', value:`${(state.grid_power??0).toFixed(1)} kW`, c:'#3b82f6' },
              { label:'Speicher', value:`${state.battery_soc??0} %`, c:'#22c55e' },
            ].map(({label,value,c})=>(
              <div key={label} style={{ background:`${c}08`, border:`1px solid ${c}20`, borderRadius:10, padding:'8px 14px', minWidth:80 }}>
                <div style={{ fontSize:9, color:`${c}80`, letterSpacing:'0.15em', textTransform:'uppercase' }}>{label}</div>
                <div style={{ fontSize:16, fontWeight:800, color:c, fontFamily:'monospace' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div aria-hidden="true" style={{ position:'absolute', zIndex:1, top:'50%', left:'50%', width:460, height:460, marginTop:-230, marginLeft:-230, borderRadius:'50%', border:'1px solid rgba(59,130,246,0.05)', animation:'wai-spin-slow 70s linear infinite', pointerEvents:'none' }}/>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:16 }}>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.7)', marginBottom:18 }}>Smart Meter & Verbrauch</div>
            <SmartMeterEnergyWidget/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(34,197,94,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#22c55e,#ff9500)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(34,197,94,0.7)', marginBottom:18 }}>Heimspeicher</div>
            <BatteryWidget data={{ soc: state.battery_soc ?? 0, power_kw: state.battery_power_kw ?? 0, capacity_kwh: state.battery_capacity_kwh ?? 10 }}/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500)' }}/>
          <div style={{ padding:'24px' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.7)', marginBottom:18 }}>Hausautomation <span style={{ fontSize:10, background:'rgba(255,149,0,0.12)', color:'#ff9500', borderRadius:8, padding:'2px 10px', marginLeft:8, letterSpacing:'0.08em' }}>PRO</span></div>
            <HausautomationPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdDashboard;
