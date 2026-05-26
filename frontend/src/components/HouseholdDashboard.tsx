import { useEffect, useState, useCallback } from 'react';
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


type WsStatus = 'connecting' | 'live' | 'offline';

const HouseholdDashboard = () => {
  const [state, setState] = useState<SysState>({});
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting');
  const [lastUpdate, setLastUpdate] = useState<string>('–');

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
            setLastUpdate(new Date().toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit', second:'2-digit' }));
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

      </div>
    </div>
  );
};

export default HouseholdDashboard;
