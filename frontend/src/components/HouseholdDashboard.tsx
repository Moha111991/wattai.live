import { useEffect, useRef, useState, useCallback } from 'react';
import TabHeader from './TabHeader';
import TabBar from './TabBar';
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
  { id:'wp', icon:'🔥', label:'Wärmepumpe',   color:'#ff6b35' },
  { id:'wm', icon:'🫧', label:'Waschmaschine', color:'#3b82f6' },
  { id:'tr', icon:'💨', label:'Trockner',      color:'#a855f7' },
  { id:'sp', icon:'🍽️', label:'Spülmaschine',  color:'#22c55e' },
  { id:'ac', icon:'❄️', label:'Klimaanlage',   color:'#22d3ee' },
  { id:'lx', icon:'💡', label:'Smart Licht',   color:'#fbbf24' },
];
const PROTOCOLS = ['KNX','Zigbee','Z-Wave','Home Assistant','openHAB','Loxone'];
const AUTOMATIONS = [
  { id:'pv',   label:'PV-Überschuss',   desc:'Startet automatisch bei Solarüberschuss' },
  { id:'tarif',label:'Günstigster Tarif',desc:'Nutzt den günstigsten Netztarif (Tibber/aWATTar)' },
  { id:'zeit', label:'Zeitfenster',      desc:'Startet in definiertem Zeitfenster' },
  { id:'sg',   label:'SG-Ready',         desc:'Steuersignal vom Netzbetreiber' },
];

type ConnStatus = 'disconnected' | 'scanning' | 'connected' | 'error';
type ConnectedDevice = {
  uid: string; slotId: string; proto: string;
  automation: string; active: boolean; kwh: number; schedule: string;
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
  const [managingUid, setManagingUid] = useState<string|null>(null);
  // slot id → array of connected devices
  const [slotDevices, setSlotDevices] = useState<Record<string, ConnectedDevice[]>>(() =>
    Object.fromEntries(DEVICES.map(d => [d.id, []]))
  );
  // wizard temp state for connection being built
  const [wizardConn, setWizardConn] = useState<{ pairingCode:string; ip:string; signal:number; lastSeen:string; connStatus:ConnStatus }>(() => ({
    pairingCode: rndCode(), ip: rndIP(), signal: rndSignal(), lastSeen:'–', connStatus:'disconnected'
  }));
  // Diagnose & Logfile state per device uid
  const [diagState, setDiagState] = useState<Record<string, 'idle'|'running'|'done'>>({});
  const [diagLines, setDiagLines] = useState<Record<string, string[]>>({});
  const [showLog, setShowLog] = useState<Record<string, boolean>>({});
  const [logLines, setLogLines] = useState<Record<string, string[]>>({});
  // track active intervals so we can clean up safely
  const diagIntervals = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // cleanup all intervals on unmount
  useEffect(() => {
    const ivs = diagIntervals.current;
    return () => { Object.values(ivs).forEach(clearInterval); };
  }, []);

  const dev = DEVICES.find(d => d.id === selectedDevice);
  // all connected devices across all slots (flat list)
  const allConnected = DEVICES.flatMap(d => slotDevices[d.id]);

  const handleConnect = useCallback(() => {
    if (!selectedDevice || !selectedProto) return;
    setConnecting(true);
    setWizardConn(prev => ({ ...prev, connStatus: 'scanning' }));
  }, [selectedDevice, selectedProto]);

  const handleConnectDone = useCallback(() => {
    setConnecting(false);
    const now = new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
    const newDev: ConnectedDevice = {
      uid: Math.random().toString(36).slice(2,10),
      slotId: selectedDevice,
      proto: selectedProto,
      automation: 'pv', active: false,
      kwh: +(Math.random()*3).toFixed(2), schedule: '11:00',
      connStatus: 'connected',
      pairingCode: rndCode(), ip: rndIP(), signal: rndSignal(), lastSeen: now,
    };
    setSlotDevices(prev => ({ ...prev, [selectedDevice]: [...prev[selectedDevice], newDev] }));
    setWizardConn({ pairingCode: rndCode(), ip: rndIP(), signal: rndSignal(), lastSeen: '–', connStatus: 'disconnected' });
    setStep(4);
  }, [selectedDevice, selectedProto]);

  // uid of the device just added (last in slot)
  const lastAddedUid = selectedDevice ? (slotDevices[selectedDevice].at(-1)?.uid ?? '') : '';

  const handleDisconnect = useCallback((slotId: string, uid: string) => {
    setSlotDevices(prev => ({ ...prev, [slotId]: prev[slotId].filter(d => d.uid !== uid) }));
  }, []);

  const handleReconnect = useCallback((slotId: string, uid: string) => {
    setSlotDevices(prev => ({
      ...prev, [slotId]: prev[slotId].map(d => d.uid === uid ? { ...d, connStatus: 'scanning' } : d)
    }));
    setTimeout(() => {
      const now = new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' });
      setSlotDevices(prev => ({
        ...prev, [slotId]: prev[slotId].map(d => d.uid === uid ? { ...d, active: true, connStatus: 'connected', lastSeen: now, signal: rndSignal() } : d)
      }));
    }, 2200);
  }, []);

  const handleActivate = useCallback(() => {
    if (!selectedDevice || !lastAddedUid) return;
    setSlotDevices(prev => ({
      ...prev, [selectedDevice]: prev[selectedDevice].map(d =>
        d.uid === lastAddedUid ? { ...d, automation: selectedAuto, active: true, schedule } : d
      )
    }));
    setStep(5);
  }, [selectedDevice, lastAddedUid, selectedAuto, schedule]);

  const handleReset = useCallback(() => {
    setStep(1); setSelectedDevice(''); setSelectedProto(''); setConnecting(false); setManagingUid(null);
    setWizardConn({ pairingCode: rndCode(), ip: rndIP(), signal: rndSignal(), lastSeen:'–', connStatus:'disconnected' });
  }, []);

  const handleDiagnose = useCallback((cd: ConnectedDevice) => {
    // clear any existing interval for this uid (prevent double-run)
    if (diagIntervals.current[cd.uid]) {
      clearInterval(diagIntervals.current[cd.uid]);
      delete diagIntervals.current[cd.uid];
    }
    setDiagState(prev => ({ ...prev, [cd.uid]: 'running' }));
    setDiagLines(prev => ({ ...prev, [cd.uid]: [] }));

    const slot = DEVICES.find(d => d.id === cd.slotId);
    const signalLabel = cd.signal > 75 ? 'Ausgezeichnet ✓' : cd.signal > 50 ? 'Gut ✓' : 'Schwach ⚠';
    const watt = Math.floor(Math.random() * 2000 + 200);
    const latency = Math.floor(Math.random() * 8 + 1);
    const steps: string[] = [
      `[PING]   ${cd.ip} → Antwort in ${latency}ms`,
      `[${cd.proto.padEnd(5)}] Protokoll-Handshake … OK`,
      `[AUTH]   Token-Validierung … OK`,
      `[ENTITY] ${slot?.label ?? cd.slotId} erkannt (ID: ${cd.pairingCode})`,
      `[SIGNAL] Stärke ${cd.signal}% — ${signalLabel}`,
      `[POWER]  Leistungsabruf … ${watt} W aktuell`,
      `[STATUS] Gerät online — Keine Fehler gefunden ✓`,
    ];

    let idx = 0;
    const iv = setInterval(() => {
      if (idx < steps.length) {
        const line = steps[idx];
        idx++;
        setDiagLines(prev => ({ ...prev, [cd.uid]: [...(prev[cd.uid] ?? []), line] }));
      } else {
        clearInterval(iv);
        delete diagIntervals.current[cd.uid];
        setDiagState(prev => ({ ...prev, [cd.uid]: 'done' }));
      }
    }, 350);
    diagIntervals.current[cd.uid] = iv;
  }, []);

  const handleShowLog = useCallback((cd: ConnectedDevice) => {
    const slot = DEVICES.find(d => d.id === cd.slotId);
    setShowLog(prev => {
      const next = !prev[cd.uid];
      return { ...prev, [cd.uid]: next };
    });
    setLogLines(prev => {
      if (prev[cd.uid]) return prev; // already generated
      const now = Date.now();
      const autoLabel = cd.active ? cd.automation.toUpperCase() : 'keine';
      const entries = [
        { t: now - 1000*60*2, lvl:'INFO',  msg:`Verbindung hergestellt via ${cd.proto}` },
        { t: now - 1000*60*1, lvl:'INFO',  msg:`${slot?.label ?? cd.slotId} registriert (IP: ${cd.ip})` },
        { t: now - 1000*55,   lvl:'INFO',  msg:`Automatisierungsregel aktiv: ${autoLabel}` },
        { t: now - 1000*40,   lvl:'DEBUG', msg:`Signalstärke ${cd.signal}%, Latenz ${Math.floor(Math.random()*10+1)}ms` },
        { t: now - 1000*30,   lvl:'INFO',  msg:`Leistungsdaten empfangen: ${Math.floor(Math.random()*2000+200)} W` },
        { t: now - 1000*20,   lvl:'DEBUG', msg:'Heartbeat OK' },
        { t: now - 1000*10,   lvl:'INFO',  msg:'Daten an WattAI-Backend übertragen' },
        { t: now,             lvl:'INFO',  msg:'Gerät aktiv — Kein Fehler' },
      ];
      const fmt = (ts: number) => new Date(ts).toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      return { ...prev, [cd.uid]: entries.map(e => `${fmt(e.t)}  [${e.lvl}]  ${e.msg}`) };
    });
  }, []);

  const STEPS = ['Gerät wählen','Protokoll','Verbinden','Automatisierung','Live-Status'];

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
            Wählen Sie eine Kategorie, um ein Gerät zu verbinden:
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(155px,1fr))', gap:10 }}>
            {DEVICES.map(d => {
              const devList = slotDevices[d.id];
              const hasDevices = devList.length > 0;
              return (
                <div key={d.id} style={{ borderRadius:13, background: hasDevices ? `${d.color}10` : 'rgba(255,255,255,0.03)',
                  border:`1.5px solid ${hasDevices ? d.color+'45' : 'rgba(255,255,255,0.07)'}`, overflow:'hidden', transition:'all 0.3s' }}>
                  {/* Category header */}
                  <button type="button" onClick={() => { setSelectedDevice(d.id); setSelectedProto(''); setStep(2); }}
                    style={{ display:'flex', alignItems:'center', gap:10, padding:'13px 14px', width:'100%', textAlign:'left',
                      background:'transparent', border:'none', color:'#f8fafc', cursor:'pointer' }}>
                    <span style={{ fontSize:22 }}>{d.icon}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{d.label}</div>
                      <div style={{ fontSize:10, color:'rgba(248,250,252,0.4)', marginTop:1 }}>
                        {hasDevices ? `${devList.length} verbunden` : 'Nicht verbunden'}
                      </div>
                    </div>
                    {hasDevices && (
                      <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', flexShrink:0, animation:'wai-pulse-green 2s ease-in-out infinite' }}/>
                    )}
                  </button>
                  {/* Connected device list */}
                  {hasDevices && (
                    <div style={{ borderTop:`1px solid ${d.color}20`, padding:'6px 12px 8px' }}>
                      {devList.map(cd => (
                        <div key={cd.uid} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                          <span style={{ width:5, height:5, borderRadius:'50%', background: cd.connStatus === 'connected' ? '#22c55e' : '#ef4444', flexShrink:0, display:'inline-block' }}/>
                          <span style={{ fontSize:10, color:'rgba(248,250,252,0.55)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cd.proto}</span>
                          {cd.active && <span style={{ fontSize:9, color:'#ff9500', fontWeight:700 }}>●</span>}
                        </div>
                      ))}
                      <button type="button" onClick={() => { setSelectedDevice(d.id); setSelectedProto(''); setStep(2); }}
                        style={{ marginTop:4, width:'100%', padding:'5px 0', borderRadius:8, background:'rgba(255,149,0,0.08)',
                          border:'1px solid rgba(255,149,0,0.2)', color:'#ff9500', fontSize:10, cursor:'pointer', fontWeight:700 }}>
                        + Weiteres Gerät
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {allConnected.length > 0 && (
            <div style={{ marginTop:18, padding:'12px 16px', borderRadius:12, background:'rgba(34,197,94,0.04)', border:'1px solid rgba(34,197,94,0.14)' }}>
              <div style={{ fontSize:10, color:'rgba(34,197,94,0.7)', letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:8 }}>
                Verbundene Geräte ({allConnected.length})
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {DEVICES.filter(d => slotDevices[d.id].length > 0).map(d => (
                  <span key={d.id} style={{ display:'inline-flex', alignItems:'center', gap:5, background:`${d.color}10`,
                    border:`1px solid ${d.color}35`, borderRadius:8, padding:'3px 10px', fontSize:11, color:d.color }}>
                    {d.icon} {d.label} <span style={{ opacity:.6 }}>×{slotDevices[d.id].length}</span>
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
              <div style={{ fontSize:11, color:'rgba(248,250,252,0.4)', marginTop:2 }}>Kommunikationsprotokoll wählen</div>
            </div>
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
                {p}
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
          {!connecting && wizardConn.connStatus !== 'connected' && (
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
                <div style={{ fontFamily:'monospace', fontSize:22, fontWeight:900, color:'#ff9500', letterSpacing:'0.25em' }}>{wizardConn.pairingCode}</div>
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

          {/* Already connected state (shouldn't normally show in wizard, but guard) */}
          {wizardConn.connStatus === 'connected' && !connecting && (
            <div style={{ marginBottom:16, padding:'14px 16px', borderRadius:12, background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.25)', animation:'wai-fade-in 0.3s ease' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e', animation:'wai-pulse-green 2s ease-in-out infinite' }}/>
                <span style={{ color:'#22c55e', fontWeight:700, fontSize:13 }}>Verbunden · {selectedProto}</span>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            <button type="button" onClick={() => setStep(2)} disabled={connecting}
              style={{ padding:'10px 22px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'rgba(248,250,252,0.45)', fontSize:12, cursor: connecting ? 'not-allowed' : 'pointer', opacity: connecting ? 0.5 : 1 }}>
              ← Zurück
            </button>
            {wizardConn.connStatus !== 'connected' && (
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
              <div style={{ fontSize:11, color:'rgba(248,250,252,0.35)', marginTop:2 }}>{allConnected.length} Gerät{allConnected.length !== 1 ? 'e' : ''} verbunden</div>
            </div>
            <button type="button" onClick={handleReset}
              style={{ padding:'8px 18px', borderRadius:10, background:'rgba(255,149,0,0.1)', border:'1px solid rgba(255,149,0,0.25)', color:'#ff9500', fontWeight:700, fontSize:12, cursor:'pointer' }}>
              + Gerät hinzufügen
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {DEVICES.map(d => {
              const devList = slotDevices[d.id].filter(cd => cd.active || cd.connStatus === 'connected');
              if (devList.length === 0) return null;
              return (
                <div key={d.id}>
                  <div style={{ fontSize:10, color:d.color, letterSpacing:'0.1em', fontWeight:700, textTransform:'uppercase', marginBottom:6, paddingLeft:4 }}>
                    {d.icon} {d.label} ({devList.length})
                  </div>
                  {devList.map(cd => {
                    const autoLabel = AUTOMATIONS.find(a => a.id === cd.automation)?.label ?? '–';
                    const isManaging = managingUid === cd.uid;
                    const isReconnecting = cd.connStatus === 'scanning';
                    return (
                      <div key={cd.uid} className="hap-device-row" style={{ borderRadius:14, background:`${d.color}07`, border:`1px solid ${cd.connStatus === 'connected' ? d.color+'30' : 'rgba(239,68,68,0.2)'}`, overflow:'hidden', marginBottom:8, transition:'all 0.3s' }}>
                        {/* Main row */}
                        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px' }}>
                          <span style={{ fontSize:24 }}>{d.icon}</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                              <span style={{ fontWeight:800, fontSize:14, color:'#f8fafc' }}>{d.label}</span>
                              <span style={{ fontSize:10, color:d.color, background:`${d.color}15`, borderRadius:6, padding:'1px 8px', fontWeight:700 }}>{cd.proto}</span>
                              {cd.active && <span style={{ fontSize:10, color:'#ff9500', background:'rgba(255,149,0,0.1)', borderRadius:6, padding:'1px 8px', fontWeight:700 }}>{autoLabel}</span>}
                              {cd.connStatus === 'connected' && !isReconnecting && (
                                <span style={{ fontSize:9, color:'#22c55e', background:'rgba(34,197,94,0.1)', borderRadius:6, padding:'1px 8px', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase' }}>● Online</span>
                              )}
                              {cd.connStatus !== 'connected' && !isReconnecting && (
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
                              <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Verbrauch: <b style={{ color:d.color }}>{cd.kwh} kWh</b></span>
                              {cd.connStatus === 'connected' && <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Signal: <b style={{ color:'#22c55e' }}>{cd.signal}%</b></span>}
                              {cd.connStatus === 'connected' && <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>IP: <b style={{ color:'rgba(248,250,252,0.7)' }}>{cd.ip}</b></span>}
                              {cd.lastSeen !== '–' && <span style={{ fontSize:11, color:'rgba(248,250,252,0.4)' }}>Gesehen: <b style={{ color:'rgba(248,250,252,0.6)' }}>{cd.lastSeen}</b></span>}
                            </div>
                          </div>
                          {/* Action buttons */}
                          <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                            <button type="button" onClick={() => setManagingUid(isManaging ? null : cd.uid)}
                              style={{ padding:'6px 13px', borderRadius:8, background:'rgba(255,255,255,0.05)', border:`1px solid ${isManaging ? 'rgba(255,149,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                color: isManaging ? '#ff9500' : 'rgba(248,250,252,0.5)', fontSize:11, cursor:'pointer', fontWeight:600, transition:'all 0.25s' }}>
                              {isManaging ? '✕ Schließen' : '⚙ Verwalten'}
                            </button>
                            {cd.connStatus === 'connected' && !isReconnecting && (
                              <button type="button" onClick={() => handleDisconnect(d.id, cd.uid)}
                                style={{ padding:'6px 13px', borderRadius:8, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
                                  color:'#ef4444', fontSize:11, cursor:'pointer', fontWeight:700, transition:'all 0.25s' }}>
                                ✕ Trennen
                              </button>
                            )}
                            {cd.connStatus !== 'connected' && !isReconnecting && (
                              <button type="button" onClick={() => handleReconnect(d.id, cd.uid)}
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
                                { label:'Protokoll', value:cd.proto, c:d.color },
                                { label:'IP-Adresse', value:cd.connStatus === 'connected' ? cd.ip : '–', c:'rgba(248,250,252,0.7)' },
                                { label:'Signalstärke', value:cd.connStatus === 'connected' ? `${cd.signal}%` : '–', c:'#22c55e' },
                                { label:'Automatisierung', value: cd.active ? autoLabel : 'Inaktiv', c: cd.active ? '#ff9500' : 'rgba(248,250,252,0.35)' },
                                { label:'Kopplungscode', value:cd.pairingCode, c:'rgba(248,250,252,0.5)' },
                              ].map(({ label, value, c }) => (
                                <div key={label} style={{ padding:'8px 12px', borderRadius:9, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                                  <div style={{ fontSize:9, color:'rgba(248,250,252,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:3 }}>{label}</div>
                                  <div style={{ fontSize:12, fontWeight:700, color:c, fontFamily:'monospace' }}>{value}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                              <button type="button" onClick={() => handleDiagnose(cd)}
                                disabled={diagState[cd.uid] === 'running'}
                                style={{ padding:'7px 14px', borderRadius:8, background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.25)', color:'#60a5fa', fontSize:11, cursor: diagState[cd.uid] === 'running' ? 'wait' : 'pointer', fontWeight:600, opacity: diagState[cd.uid] === 'running' ? 0.7 : 1 }}>
                                {diagState[cd.uid] === 'running' ? '⏳ Diagnose läuft…' : '🔧 Diagnose starten'}
                              </button>
                              <button type="button" onClick={() => handleShowLog(cd)}
                                style={{ padding:'7px 14px', borderRadius:8, background: showLog[cd.uid] ? 'rgba(168,85,247,0.12)' : 'rgba(255,255,255,0.04)', border:`1px solid ${showLog[cd.uid] ? 'rgba(168,85,247,0.35)' : 'rgba(255,255,255,0.1)'}`, color: showLog[cd.uid] ? '#c084fc' : 'rgba(248,250,252,0.5)', fontSize:11, cursor:'pointer', fontWeight:600 }}>
                                📋 {showLog[cd.uid] ? 'Logfile schließen' : 'Logfile anzeigen'}
                              </button>
                            </div>
                            {/* Diagnose output */}
                            {(diagState[cd.uid] === 'running' || diagState[cd.uid] === 'done') && (
                              <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(59,130,246,0.2)', fontFamily:'monospace', fontSize:11, lineHeight:1.9, animation:'wai-fade-in 0.3s ease' }}>
                                <div style={{ fontSize:9, color:'rgba(96,165,250,0.7)', letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Diagnosebericht</div>
                                {(diagLines[cd.uid] ?? []).map((line, i) => {
                                  const isOk = line.includes('OK') || line.includes('✓');
                                  const isWarn = line.includes('⚠');
                                  return (
                                    <div key={i} style={{ color: isOk ? '#22c55e' : isWarn ? '#ff9500' : 'rgba(248,250,252,0.65)', animation:'wai-fade-in 0.2s ease' }}>
                                      {line}
                                    </div>
                                  );
                                })}
                                {diagState[cd.uid] === 'running' && (
                                  <div style={{ color:'rgba(248,250,252,0.35)', display:'flex', alignItems:'center', gap:6 }}>
                                    <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', border:'1.5px solid #60a5fa', borderTopColor:'transparent', animation:'wai-spin-slow 0.6s linear infinite' }}/>
                                    Analysiere…
                                  </div>
                                )}
                                {diagState[cd.uid] === 'done' && (
                                  <div style={{ marginTop:6, paddingTop:6, borderTop:'1px solid rgba(34,197,94,0.15)', color:'#22c55e', fontWeight:700 }}>
                                    ✓ Diagnose abgeschlossen — Gerät fehlerfrei
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Logfile output */}
                            {showLog[cd.uid] && (logLines[cd.uid] ?? []).length > 0 && (
                              <div style={{ marginTop:10, padding:'10px 14px', borderRadius:10, background:'rgba(0,0,0,0.3)', border:'1px solid rgba(168,85,247,0.2)', fontFamily:'monospace', fontSize:10.5, lineHeight:2, animation:'wai-fade-in 0.3s ease', maxHeight:180, overflowY:'auto' }}>
                                <div style={{ fontSize:9, color:'rgba(192,132,252,0.7)', letterSpacing:'0.12em', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Systemlog</div>
                                {(logLines[cd.uid] ?? []).map((line, i) => {
                                  const isDebug = line.includes('[DEBUG]');
                                  return (
                                    <div key={i} style={{ color: isDebug ? 'rgba(248,250,252,0.35)' : 'rgba(248,250,252,0.65)' }}>
                                      {line}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {allConnected.length === 0 && (
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

type WsStatus = 'connecting' | 'live' | 'offline';

const HouseholdDashboard = () => {
  const [state, setState] = useState<SysState>({});
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      setWsStatus('connecting');
      try {
        const url = WS_URL ? (WS_URL.endsWith('/ws') ? WS_URL : `${WS_URL}/ws`) : `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`;
        ws = new WebSocket(url);
        ws.onopen = () => setWsStatus('live');
        ws.onmessage = e => {
          try {
            setState(JSON.parse(e.data));
          } catch {}
        };
        ws.onerror = () => setWsStatus('offline');
        ws.onclose = () => {
          setWsStatus('offline');
          reconnectTimer = setTimeout(connect, 5000);
        };
      } catch {
        setWsStatus('offline');
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      try { ws.close(); } catch {}
    };
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

      <TabHeader
        badge="Haushalt · Heimspeicher · IoT"
        title={['Haushalt &', 'Heimspeicher']}
        subtitle="Echtzeit-Energiefluss, Heimspeicher-Optimierung und intelligente IoT-Hausautomation."
        accentColor="#ff6b35"
        gradientFrom="#ff6b35"
        gradientTo="#22c55e"
        wsStatus={wsStatus}
        tags={[['Heimspeicher','#22c55e'],['PV-Kopplung','#ff9500'],['IoT','#3b82f6'],['V2H','#a855f7']]}
        stats={[
          { label:'PV', value:wsStatus !== 'live' ? '– –' : `${(state.pv_power??0).toFixed(1)}`, unit:'kW', color:'#ff9500', icon:'☀️' },
          { label:'Netz', value:wsStatus !== 'live' ? '– –' : `${(state.grid_power??0).toFixed(1)}`, unit:'kW', color:'#3b82f6', icon:'🔌' },
          { label:'Speicher', value:wsStatus !== 'live' ? '– –' : `${state.battery_soc??0}`, unit:'%', color:'#22c55e', icon:'🔋' },
        ]}
        ticker={[
          { label:'PV', value:wsStatus === 'live' ? `${(state.pv_power??0).toFixed(1)} kW` : '– –', color:'#ff9500' },
          { label:'Netz', value:wsStatus === 'live' ? `${(state.grid_power??0).toFixed(1)} kW` : '– –', color:'#3b82f6' },
          { label:'Speicher', value:wsStatus === 'live' ? `${state.battery_soc??0} %` : '– –', color:'#22c55e' },
          { label:'IoT', value:`${iotNodes.length} Geräte`, color:'#a855f7' },
          { label:'Status', value:wsStatus === 'live' ? 'Live' : wsStatus === 'connecting' ? 'Verbinde…' : 'Offline', color:wsStatus === 'live' ? '#22c55e' : '#ff6b35' },
        ]}
        visual={
          <svg viewBox="0 0 200 190" style={{ width:'100%', height:'100%' }} fill="none">
            <defs>
              <linearGradient id="hh-roof-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1a3020"/><stop offset="100%" stopColor="#0a1a10"/></linearGradient>
              <filter id="hh-glow"><feGaussianBlur stdDeviation="3" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/></filter>
            </defs>
            {[40,80,120,160].map(x=><line key={x} x1={x} y1="20" x2={x} y2="155" stroke="rgba(255,107,53,0.05)" strokeWidth="0.5"/>)}
            {[50,90,130].map(y=><line key={y} x1="10" y1={y} x2="190" y2={y} stroke="rgba(255,107,53,0.05)" strokeWidth="0.5"/>)}
            <path d="M 60 110 L 60 75 L 100 45 L 140 75 L 140 110 Z" fill="url(#hh-roof-grad)" stroke="rgba(34,197,94,0.4)" strokeWidth="1.5"/>
            <path d="M 56 77 L 100 44 L 144 77 Z" fill="rgba(20,50,30,0.9)" stroke="rgba(34,197,94,0.5)" strokeWidth="1"/>
            {[0,1,2].map(i=>(
              <rect key={i} x={65+i*23} y={82} width={18} height={10} rx="1" fill="rgba(255,149,0,0.18)" stroke="rgba(255,149,0,0.4)" strokeWidth="0.7">
                <animate attributeName="fill" values="rgba(255,149,0,0.18);rgba(255,149,0,0.35);rgba(255,149,0,0.18)" dur={`${3+i}s`} repeatCount="indefinite"/>
              </rect>
            ))}
            <rect x="78" y="95" width="14" height="15" rx="1" fill="rgba(100,200,255,0.18)" stroke="rgba(100,200,255,0.3)" strokeWidth="0.6"/>
            <rect x="84" y="95" width="2" height="15" fill="rgba(100,200,255,0.15)"/>
            <ellipse cx="100" cy="128" rx="44" ry="4" fill="rgba(34,197,94,0.12)"><animate attributeName="opacity" values="0.12;0.25;0.12" dur="5s" repeatCount="indefinite"/></ellipse>
            {iotNodes.map(({label,x,y,c})=>{
              return (
              <g key={label}>
                {/* Kreis mit kurzem Label zentriert drin — wie Geräte-Tab */}
                <circle cx={x} cy={y} r="11" fill="rgba(22,30,65,0.92)" stroke={c} strokeWidth="1.4"/>
                <text x={x} y={y+2.5} textAnchor="middle" dominantBaseline="middle" fill={c} fontSize="5" fontFamily="monospace" fontWeight="bold">{label.length > 5 ? label.slice(0,5) : label}</text>
                <circle r="2.5" fill={c} filter="url(#hh-glow)" opacity="0.8">
                  <animateMotion dur="3s" repeatCount="indefinite">
                    <mpath xlinkHref={"#hh-path-" + label}/>
                  </animateMotion>
                  <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/>
                </circle>
                <path id={"hh-path-" + label} d={`M 100 90 L ${x} ${y}`} fill="none"/>
                <line x1="100" y1="90" x2={x} y2={y} stroke={`${c}25`} strokeWidth="1"/>
              </g>
              );
            })}
            <circle cx="100" cy="90" r="6" fill="rgba(22,30,65,0.9)" stroke="rgba(255,107,53,0.5)" strokeWidth="1"/>
            <line x1="10" y1="168" x2="190" y2="168" stroke="rgba(255,107,53,0.08)" strokeWidth="0.5" strokeDasharray="4 3"/>
            <text x="100" y="182" textAnchor="middle" fill="rgba(255,149,0,0.5)" fontSize="7" fontFamily="monospace">Haushalt · Heimspeicher · IoT</text>
          </svg>
        }
      />
      <TabBar />


      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ padding:'0 clamp(12px,2vw,24px)', display:'flex', flexDirection:'column', gap:16 }}>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(255,107,53,0.1)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#ff6b35,#ff9500,#3b82f6)' }}/>
          <div style={{ padding:'clamp(14px,3vw,24px)' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(255,149,0,0.7)', marginBottom:18 }}>Smart Meter & Verbrauch</div>
            <SmartMeterEnergyWidget/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(34,197,94,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#22c55e,#ff9500)' }}/>
          <div style={{ padding:'clamp(14px,3vw,24px)' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(34,197,94,0.7)', marginBottom:18 }}>Heimspeicher</div>
            <BatteryWidget data={{ soc: state.battery_soc ?? 0, power_kw: state.battery_power_kw ?? 0, capacity_kwh: state.battery_capacity_kwh ?? 10 }}/>
          </div>
        </div>
        <div className="wai-card" style={{ background:'rgba(22,30,65,0.65)', border:'1px solid rgba(59,130,246,0.12)', borderRadius:20, backdropFilter:'blur(12px)', overflow:'hidden' }}>
          <div style={{ height:3, background:'linear-gradient(90deg,#3b82f6,#ff9500)' }}/>
          <div style={{ padding:'clamp(14px,3vw,24px)' }}>
            <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', fontWeight:700, color:'rgba(59,130,246,0.7)', marginBottom:18 }}>Hausautomation <span style={{ fontSize:10, background:'rgba(255,149,0,0.12)', color:'#ff9500', borderRadius:8, padding:'2px 10px', marginLeft:8, letterSpacing:'0.08em' }}>PRO</span></div>
            <HausautomationPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HouseholdDashboard;
