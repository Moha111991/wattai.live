import React, { useEffect, useRef, useState, useCallback } from "react";
import { API_URL } from "../lib/api";

/* ─── Types ────────────────────────────────────────────────────── */
export interface Device {
  id: string;
  type: string;
  brand: string;
  enabled: boolean;
  ip: string;
  status: string;
  manufacturer?: string;
  model?: string;
  soc?: number;
  power_kw?: number;
  port?: string | number;
}

interface DeviceGridProps {
  devices: Device[];
  onConnect?: (device: Device) => void;
}

type Proto = 'modbus' | 'cloud' | 'ocpp' | 'sunspec' | 'mqtt';
type ConnState = 'idle' | 'connecting' | 'connected' | 'partial' | 'failed';

/* ─── Animations / WAI CSS ─────────────────────────────────────── */
const WAI_CSS = `
  @keyframes wai-breathe{0%,100%{opacity:.45;transform:scale(1)}50%{opacity:1;transform:scale(1.18)}}
  @keyframes wai-scan{0%{top:0}100%{top:100%}}
  @keyframes wai-glow-o{0%,100%{box-shadow:0 0 16px rgba(255,107,53,.28)}50%{box-shadow:0 0 44px rgba(255,107,53,.65)}}
  @keyframes wai-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
  @keyframes wai-pulse{0%,100%{opacity:.6}50%{opacity:1}}
  @keyframes wai-ping{0%{transform:scale(1);opacity:.55}100%{transform:scale(2.4);opacity:0}}
  @keyframes wai-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  @keyframes wai-slide-in{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes wai-spin-bar{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}

  .wai-dcard{transition:border-color .45s,box-shadow .45s,transform .25s!important}
  .wai-dcard:hover{border-color:rgba(255,107,53,.3)!important;box-shadow:0 18px 52px rgba(0,0,0,.35)!important;transform:translateY(-2px)!important}
  .wai-btn-p{transition:all .35s cubic-bezier(.16,1,.3,1)!important}
  .wai-btn-p:hover:not(:disabled){filter:brightness(1.15)!important;transform:translateY(-2px) scale(1.03)!important;box-shadow:0 0 28px rgba(255,107,53,.5)!important}
  .wai-btn-s{transition:all .3s ease!important}
  .wai-btn-s:hover{background:rgba(255,255,255,0.09)!important;border-color:rgba(255,255,255,.22)!important}
  .wai-form-section{animation:wai-slide-in .3s ease!important}
  .wai-input:focus{border-color:rgba(255,107,53,.5)!important;background:rgba(255,255,255,.07)!important;box-shadow:0 0 0 3px rgba(255,107,53,.12)!important}

  /* ── Device card responsive layout ── */
  .wai-card-row{display:flex;align-items:center;gap:0;position:relative;z-index:1;flex-wrap:nowrap}
  .wai-card-specs{flex:1;min-width:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 6px;margin-right:8px}
  .wai-card-cta{flex-shrink:0;width:clamp(90px,20vw,118px);display:flex;flex-direction:column;align-items:center;gap:6px}

  @media(max-width:640px){
    .wai-card-row{flex-direction:column!important;align-items:stretch!important;padding:14px 14px!important;gap:14px!important}
    .wai-card-icon{width:100%!important;flex-direction:row!important;gap:12px!important;margin-right:0!important;align-items:center!important}
    .wai-card-name{margin-right:0!important;flex:unset!important;width:100%!important}
    .wai-card-specs{grid-template-columns:1fr 1fr!important;margin-right:0!important;width:100%!important;gap:6px!important;overflow:visible!important}
    .wai-card-specs > div{overflow:visible!important;height:auto!important;min-height:0!important}
    .wai-card-cta{width:100%!important;flex-direction:row!important;flex-wrap:wrap!important;gap:8px!important;align-items:center!important;justify-content:flex-start!important}
    .wai-card-cta .wai-btn-p,.wai-card-cta button{flex:1 1 auto!important;min-width:120px!important}
  }
  .wai-btn-s{transition:all .3s ease!important}
  .wai-btn-s:hover{background:rgba(255,255,255,0.09)!important;border-color:rgba(255,255,255,.22)!important}
  .wai-form-section{animation:wai-slide-in .3s ease!important}
  .wai-input:focus{border-color:rgba(255,107,53,.5)!important;background:rgba(255,255,255,.07)!important;box-shadow:0 0 0 3px rgba(255,107,53,.12)!important}
`;

/* ─── Device slot definitions ───────────────────────────────────── */
const SLOTS = [
  {
    key: 'battery',
    apiType: 'Battery',
    label: 'Heimspeicher',
    sublabel: 'Batteriespeicher · BMS · Modbus / MQTT / Cloud',
    icon: '⚡',
    accent: '#22c55e',
    bg: 'rgba(34,197,94,0.06)',
    border: 'rgba(34,197,94,0.22)',
    match: ['battery','heimspeicher','bat','batteriespeicher'],
    protos: ['modbus','mqtt','cloud'] as Proto[],
    defaultPort: 502,
    mqttTopicDefault: 'energy/battery',
    fields: {
      modbus: ['ip','port','soc','soh','voltage','current','temperature'],
      mqtt:   ['mqttBroker','mqttPort','mqttTopic','mqttUser','mqttPass','mqttTls'],
      cloud:  ['deviceId','apiBaseUrl','apiKey'],
    },
    protoLabel: { modbus:'Modbus TCP', mqtt:'MQTT', cloud:'Cloud API' },
    description: 'Verbindet Batteriespeicher über Modbus RTU/TCP, MQTT-Broker oder Hersteller-Cloud-API.',
    protocols_info: 'Modbus RTU · TCP · MQTT · SunSpec',
    standard: 'IEC 62619 · SunSpec',
  },
  {
    key: 'inverter',
    apiType: 'Inverter',
    label: 'PV-Wechselrichter',
    sublabel: 'Solar Inverter · MPPT · SunSpec / Modbus / MQTT',
    icon: '☀️',
    accent: '#ff9500',
    bg: 'rgba(255,149,0,0.06)',
    border: 'rgba(255,149,0,0.22)',
    match: ['inverter','wechselrichter','pv'],
    protos: ['modbus','mqtt','sunspec','cloud'] as Proto[],
    defaultPort: 502,
    mqttTopicDefault: 'energy/pv',
    fields: {
      modbus:  ['ip','port','power','voltage','current','temperature'],
      mqtt:    ['mqttBroker','mqttPort','mqttTopic','mqttUser','mqttPass','mqttTls'],
      sunspec: ['ip','port'],
      cloud:   ['deviceId','apiBaseUrl','apiKey'],
    },
    protoLabel: { modbus:'Modbus TCP', mqtt:'MQTT', sunspec:'SunSpec REST', cloud:'Cloud API' },
    description: 'Verbindet PV-Wechselrichter via Modbus TCP, MQTT, SunSpec-REST oder Hersteller-Cloud-API.',
    protocols_info: 'Modbus TCP · MQTT · SunSpec · REST',
    standard: 'IEC 61850 · SunSpec',
  },
  {
    key: 'wallbox',
    apiType: 'Wallbox',
    label: 'Wallbox / EVSE',
    sublabel: 'Ladestation · OCPP 2.0.1 · ISO 15118 · MQTT',
    icon: '🔌',
    accent: '#3b82f6',
    bg: 'rgba(59,130,246,0.06)',
    border: 'rgba(59,130,246,0.22)',
    match: ['wallbox','evse','charger','ladestation'],
    protos: ['ocpp','mqtt','modbus','cloud'] as Proto[],
    defaultPort: 9000,
    mqttTopicDefault: 'energy/ev',
    fields: {
      ocpp:   ['ip','port','chargeCurrent'],
      mqtt:   ['mqttBroker','mqttPort','mqttTopic','mqttUser','mqttPass','mqttTls'],
      modbus: ['ip','port','chargeCurrent'],
      cloud:  ['deviceId','apiBaseUrl','apiKey'],
    },
    protoLabel: { ocpp:'OCPP 2.0.1', mqtt:'MQTT', modbus:'Modbus TCP', cloud:'Cloud API' },
    description: 'Verbindet Wallbox/EVSE über OCPP 2.0.1, MQTT, Modbus TCP oder Hersteller-Cloud-API.',
    protocols_info: 'OCPP 2.0.1 · MQTT · Modbus TCP · REST',
    standard: 'ISO 15118-20 · IEC 61851',
  },
  {
    key: 'meter',
    apiType: 'Smart Meter',
    label: 'Smart Meter',
    sublabel: 'Energiezähler · SML · DLMS/COSEM · MQTT',
    icon: '📊',
    accent: '#a855f7',
    bg: 'rgba(168,85,247,0.06)',
    border: 'rgba(168,85,247,0.22)',
    match: ['smart meter','meter','zähler','smartmeter'],
    protos: ['modbus','mqtt','cloud'] as Proto[],
    defaultPort: 502,
    mqttTopicDefault: 'energy/smartmeter',
    fields: {
      modbus: ['ip','port','meterId'],
      mqtt:   ['mqttBroker','mqttPort','mqttTopic','mqttUser','mqttPass','mqttTls'],
      cloud:  ['deviceId','apiBaseUrl','apiKey'],
    },
    protoLabel: { modbus:'Modbus TCP', mqtt:'MQTT', cloud:'Cloud API' },
    description: 'Verbindet Smart Meter über Modbus TCP (SML/DLMS), MQTT oder Cloud-Integration.',
    protocols_info: 'SML · DLMS/COSEM · MQTT · Modbus TCP',
    standard: 'IEC 62056 · EN 13757',
  },
] as const;

type Slot = typeof SLOTS[number];

/* ─── Status helpers ────────────────────────────────────────────── */
const getStatusInfo = (s: ConnState, deviceStatus?: string) => {
  const ds = (deviceStatus || '').toLowerCase();
  if (s === 'connected' || (ds.includes('connected') && !ds.includes('partial')))
    return { color:'#22c55e', label:'Verbunden',       dot:'#22c55e' };
  if (s === 'partial' || ds.includes('partial'))
    return { color:'#f59e0b', label:'Teilverbunden',   dot:'#f59e0b' };
  if (s === 'connecting' || ds.includes('pending'))
    return { color:'#f59e0b', label:'Verbinde…',       dot:'#f59e0b' };
  if (s === 'failed')
    return { color:'#f87171', label:'Verbindungsfehler', dot:'#f87171' };
  return   { color:'#6b7280', label:'Nicht verbunden', dot:'#6b7280' };
};

/* ─── Polling helper ────────────────────────────────────────────── */
async function pollUntilConnected(
  requestId: string,
  signal: AbortSignal,
  onUpdate: (s: string) => void,
): Promise<void> {
  const start = Date.now();
  let interval = 1000;
  while (true) {
    if (signal.aborted) return;
    await new Promise(r => setTimeout(r, interval));
    if (signal.aborted) return;
    try {
      const res = await fetch(`${API_URL}/connections/${encodeURIComponent(requestId)}`, { signal });
      if (res.ok) {
        const data = await res.json();
        if (data.status) onUpdate(data.status);
        if (data.status === 'connected') return;
        if (data.status === 'failed') throw new Error('Backend: connection failed');
      }
    } catch (e) {
      if (signal.aborted) return;
    }
    if (Date.now() - start > 90000) throw new Error('Timeout');
    interval = Math.min(5000, Math.floor(interval * 1.4));
  }
}

/* ─── SOC Ring ──────────────────────────────────────────────────── */
const SOCRing: React.FC<{ soc: number; accent: string }> = ({ soc, accent }) => {
  const r = 18, circ = 2 * Math.PI * r, dash = circ * Math.min(1, soc / 100);
  return (
    <svg width={48} height={48} viewBox="0 0 48 48">
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4"/>
      <circle cx="24" cy="24" r={r} fill="none" stroke={accent} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:'24px 24px', transition:'stroke-dasharray 1s ease' }}/>
      <text x="24" y="28" textAnchor="middle" fill="white" fontSize="9" fontWeight="800" fontFamily="monospace">{soc}%</text>
    </svg>
  );
};

/* ─── Spinner ────────────────────────────────────────────────────── */
const Spinner: React.FC<{ color: string }> = ({ color }) => (
  <svg width={18} height={18} viewBox="0 0 18 18" style={{ animation:'wai-spin-bar .8s linear infinite', flexShrink:0 }}>
    <circle cx="9" cy="9" r="7" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="30 14" strokeLinecap="round"/>
  </svg>
);

/* ─── Proto badge ────────────────────────────────────────────────── */
const ProtoBadge: React.FC<{ label: string; accent: string }> = ({ label, accent }) => (
  <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase',
    color:accent, background:`${accent}12`, border:`1px solid ${accent}30`,
    borderRadius:4, padding:'2px 7px', fontFamily:'monospace', flexShrink:0 }}>
    {label}
  </span>
);

/* ─── Input ──────────────────────────────────────────────────────── */
const FInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; accent: string }> = ({ label, accent, ...props }) => (
  <label style={{ display:'flex', flexDirection:'column', gap:4, flex:1, minWidth:130 }}>
    <span style={{ fontSize:10, color:'rgba(248,250,252,0.4)', letterSpacing:'0.13em', textTransform:'uppercase', fontFamily:'monospace' }}>{label}</span>
    <input {...props} className="wai-input" style={{
      background:'rgba(255,255,255,0.05)', border:`1px solid ${accent}28`, borderRadius:9,
      padding:'9px 12px', color:'#f8fafc', fontSize:13, outline:'none',
      fontFamily:'monospace', width:'100%', boxSizing:'border-box',
      transition:'all .25s ease', ...props.style
    }}/>
  </label>
);

/* ─── Per-card connect panel ─────────────────────────────────────── */
const ConnectPanel: React.FC<{
  slot: Slot;
  device: Device | null;
  connState: ConnState;
  onConnected: (d: Partial<Device>) => void;
  onClose: () => void;
}> = ({ slot, device, connState, onConnected, onClose }) => {
  const [proto, setProto] = useState<Proto>(slot.protos[0]);
  const [ip, setIp] = useState(device?.ip || '');
  const [port, setPort] = useState<number>(Number(device?.port) || slot.defaultPort);
  const [deviceId, setDeviceId] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [meterId, setMeterId] = useState('');
  const [chargeCurrent, setChargeCurrent] = useState(16);
  const [power, setPower] = useState(0);
  const [soc, setSoc] = useState(50);
  const [soh, setSoh] = useState(95);
  const [voltage, setVoltage] = useState(400);
  const [current, setCurrent] = useState(10);
  const [temperature, setTemperature] = useState(25);
  // MQTT fields
  const [mqttBroker, setMqttBroker] = useState('localhost');
  const [mqttPort, setMqttPort] = useState(1883);
  const [mqttTopic, setMqttTopic] = useState(slot.mqttTopicDefault ?? 'energy/#');
  const [mqttUser, setMqttUser] = useState('');
  const [mqttPass, setMqttPass] = useState('');
  const [mqttTls, setMqttTls] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const validate = (): string | null => {
    if (proto === 'mqtt') {
      if (!mqttBroker) return 'MQTT Broker-Adresse erforderlich';
      if (!mqttPort || mqttPort < 1 || mqttPort > 65535) return 'MQTT Port 1–65535 erforderlich';
      if (!mqttTopic) return 'MQTT Topic erforderlich';
      return null;
    }
    if (proto === 'modbus' || proto === 'ocpp' || proto === 'sunspec') {
      if (!ip) return 'IP-Adresse erforderlich';
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return 'Ungültige IP-Adresse';
      if (!port || port < 1 || port > 65535) return 'Port 1–65535 erforderlich';
    } else {
      if (!deviceId) return 'Device-ID erforderlich';
      if (!apiBaseUrl) return 'API Base URL erforderlich';
      if (!apiKey) return 'API Key erforderlich';
    }
    return null;
  };

  const buildParams = () => {
    const base = { protocol: proto, ip, port, type: slot.apiType };
    if (proto === 'mqtt') {
      return {
        protocol: 'mqtt', type: slot.apiType,
        broker_host: mqttBroker,
        broker_port: mqttPort,
        topic: mqttTopic,
        username: mqttUser || undefined,
        password: mqttPass || undefined,
        tls: mqttTls,
      };
    }
    if (proto === 'cloud') {
      return { ...base, device_id: deviceId, api_base_url: apiBaseUrl, api_key: apiKey };
    }
    if (slot.key === 'battery')  return { ...base, soc, soh, voltage, current, temperature };
    if (slot.key === 'inverter') return { ...base, power, voltage, current, temperature };
    if (slot.key === 'wallbox')  return { ...base, charge_current: chargeCurrent };
    if (slot.key === 'meter')    return { ...base, meter_id: meterId };
    return base;
  };

  const handleConnect = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    setStatusMsg('Verbindung wird aufgebaut…');
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const params = buildParams();

      if (proto === 'cloud') {
        // Cloud sync endpoint
        const res = await fetch(`${API_URL}/devices/cloud_sync`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'X-API-Key': import.meta.env.VITE_API_KEY || '' },
          body: JSON.stringify(params),
          signal: ac.signal,
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Cloud API Fehler');
        setStatusMsg('✓ Cloud-Verbindung hergestellt');
        onConnected({ ...data, status:'connected', ip: data.ip || ip, type: slot.apiType });
        return;
      }

      if (proto === 'mqtt') {
        // MQTT broker connect — POST to /devices/connect or /devices/{id}/connect with protocol=mqtt
        const targetId = device?.id;
        const url = targetId
          ? `${API_URL}/devices/${encodeURIComponent(targetId)}/connect`
          : `${API_URL}/devices/connect`;
        setStatusMsg(`Verbinde mit MQTT-Broker ${mqttBroker}:${mqttPort}…`);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'X-API-Key': import.meta.env.VITE_API_KEY || '' },
          body: JSON.stringify(params),
          signal: ac.signal,
        });
        const data = await res.json().catch(() => ({}));
        const requestId = data.request_id || data.requestId;
        if (requestId) {
          setStatusMsg(`MQTT-Verbindung wird bestätigt (Topic: ${mqttTopic})…`);
          await pollUntilConnected(requestId, ac.signal, (s) => setStatusMsg(`MQTT Status: ${s}`));
        }
        setStatusMsg(`✓ MQTT verbunden — Broker: ${mqttBroker}:${mqttPort}, Topic: ${mqttTopic}`);
        onConnected({
          id: data.device_id || data.id || device?.id,
          status: 'connected', type: slot.apiType,
          brand: data.brand || device?.brand || '',
          ip: mqttBroker,
        });
        return;
      }

      // Modbus / OCPP / SunSpec: POST to /devices/{id}/connect or /devices/connect
      const targetId = device?.id;
      const url = targetId
        ? `${API_URL}/devices/${encodeURIComponent(targetId)}/connect`
        : `${API_URL}/devices/connect`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'X-API-Key': import.meta.env.VITE_API_KEY || '' },
        body: JSON.stringify(params),
        signal: ac.signal,
      });
      const data = await res.json().catch(() => ({}));

      const requestId = data.request_id || data.requestId;
      if (requestId) {
        setStatusMsg('Warte auf Bestätigung vom Gerät…');
        await pollUntilConnected(requestId, ac.signal, (s) => setStatusMsg(`Status: ${s}`));
      }

      setStatusMsg('✓ Erfolgreich verbunden');
      onConnected({
        id: data.device_id || data.id || device?.id,
        status: 'connected',
        ip, type: slot.apiType,
        brand: data.brand || device?.brand || '',
        model: data.model || device?.model || '',
        manufacturer: data.manufacturer || device?.manufacturer || '',
        soc: data.soc ?? device?.soc,
        power_kw: data.power_kw ?? device?.power_kw,
      });
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError(e instanceof Error ? e.message : 'Verbindung fehlgeschlagen');
      setStatusMsg('');
    } finally {
      setLoading(false);
    }
  };

  const isCloud = proto === 'cloud';
  const isMqtt  = proto === 'mqtt';
  const accent = slot.accent;

  const protoLabels: Record<string, string> = {
    modbus:'Modbus TCP', cloud:'Cloud API', ocpp:'OCPP 2.0.1', sunspec:'SunSpec REST', mqtt:'MQTT'
  };

  return (
    <div className="wai-form-section" style={{
      borderTop:`1px solid ${accent}22`, marginTop:0,
      background:`linear-gradient(180deg,${accent}05,transparent)`,
      padding:'18px 22px 20px',
    }}>
      {/* Protocol selector */}
      <div style={{ display:'flex', gap:8, marginBottom:18, flexWrap:'wrap' }}>
        <span style={{ fontSize:10, color:'rgba(248,250,252,0.35)', letterSpacing:'0.12em', textTransform:'uppercase', alignSelf:'center', marginRight:4 }}>Protokoll</span>
        {slot.protos.map(p => (
          <button key={p} type="button"
            onClick={() => { setProto(p); setError(''); }}
            style={{
              padding:'6px 14px', borderRadius:999, fontSize:11, fontWeight:700,
              border: proto===p ? `1px solid ${accent}60` : '1px solid rgba(255,255,255,0.1)',
              background: proto===p ? `${accent}20` : 'rgba(255,255,255,0.04)',
              color: proto===p ? accent : 'rgba(248,250,252,0.45)',
              cursor:'pointer', outline:'none', transition:'all .25s ease',
              letterSpacing:'0.06em',
            }}>
            {protoLabels[p] || p}
          </button>
        ))}
      </div>

      {/* Fields */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:10 }}>
        {/* Network fields */}
        {!isCloud && !isMqtt && <>
          <FInput label="IP-Adresse" accent={accent} type="text" value={ip}
            onChange={e=>setIp(e.target.value)} placeholder="192.168.1.50" style={{ minWidth:140 }}/>
          <FInput label={`Port (Standard: ${slot.defaultPort})`} accent={accent} type="number" value={port}
            onChange={e=>setPort(Number(e.target.value))} style={{ maxWidth:110 }}/>
        </>}

        {/* MQTT fields */}
        {isMqtt && <>
          <FInput label="Broker-Adresse" accent={accent} type="text" value={mqttBroker}
            onChange={e=>setMqttBroker(e.target.value)} placeholder="192.168.1.10 oder mqtt.example.com" style={{ minWidth:200 }}/>
          <FInput label={`Port (${mqttTls ? '8883 TLS' : '1883 plain'})`} accent={accent} type="number" value={mqttPort}
            onChange={e=>setMqttPort(Number(e.target.value))} style={{ maxWidth:120 }}/>
          <FInput label="Topic-Prefix" accent={accent} type="text" value={mqttTopic}
            onChange={e=>setMqttTopic(e.target.value)} placeholder="energy/battery" style={{ minWidth:180 }}/>
          <FInput label="Benutzername (optional)" accent={accent} type="text" value={mqttUser}
            onChange={e=>setMqttUser(e.target.value)} placeholder="mqtt_user" style={{ minWidth:140 }}/>
          <FInput label="Passwort (optional)" accent={accent} type="password" value={mqttPass}
            onChange={e=>setMqttPass(e.target.value)} placeholder="••••••••" style={{ minWidth:140 }}/>
          {/* TLS toggle */}
          <label style={{ display:'flex', flexDirection:'column', gap:4, justifyContent:'flex-end', paddingBottom:4 }}>
            <span style={{ fontSize:10, color:'rgba(248,250,252,0.4)', letterSpacing:'0.13em', textTransform:'uppercase', fontFamily:'monospace' }}>TLS / SSL</span>
            <button type="button"
              onClick={() => { setMqttTls(t => { const next = !t; setMqttPort(p => p === (t ? 8883 : 1883) ? (next ? 8883 : 1883) : p); return next; }); }}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'9px 14px', borderRadius:9, cursor:'pointer',
                background: mqttTls ? `${accent}20` : 'rgba(255,255,255,0.04)',
                border: mqttTls ? `1px solid ${accent}55` : `1px solid ${accent}28`,
                color: mqttTls ? accent : 'rgba(248,250,252,0.35)', fontSize:12, fontWeight:700, outline:'none',
                transition:'all .25s ease', fontFamily:'monospace',
              }}>
              <span style={{ width:16, height:16, borderRadius:'50%', background: mqttTls ? accent : 'rgba(255,255,255,0.1)',
                border:`2px solid ${mqttTls ? accent : 'rgba(255,255,255,0.2)'}`, display:'inline-block',
                boxShadow: mqttTls ? `0 0 8px ${accent}60` : 'none', transition:'all .25s ease' }}/>
              {mqttTls ? 'TLS aktiv (Port 8883)' : 'TLS deaktiviert'}
            </button>
          </label>
          {/* Topic info box */}
          <div style={{ width:'100%', padding:'10px 14px', borderRadius:10,
            background:'rgba(255,255,255,0.03)', border:`1px solid ${accent}18`,
            fontSize:10, color:'rgba(248,250,252,0.35)', fontFamily:'monospace', lineHeight:1.7 }}>
            <div style={{ color:accent, fontWeight:700, marginBottom:4 }}>📡 Subscribed Topics</div>
            <div>{mqttTopic}/power &nbsp;·&nbsp; {mqttTopic}/soc</div>
            <div>{mqttTopic}/status &nbsp;·&nbsp; {mqttTopic}/voltage</div>
            <div style={{ marginTop:4, color:'rgba(248,250,252,0.2)' }}>Backend subscribt automatisch energy/#</div>
          </div>
        </>}

        {/* Cloud fields */}
        {isCloud && <>
          <FInput label="Device-ID" accent={accent} type="text" value={deviceId}
            onChange={e=>setDeviceId(e.target.value)} placeholder="z.B. BAT-001"/>
          <FInput label="API Base URL" accent={accent} type="text" value={apiBaseUrl}
            onChange={e=>setApiBaseUrl(e.target.value)} placeholder="https://cloud.example.com/api" style={{ minWidth:200 }}/>
          <FInput label="API Key" accent={accent} type="password" value={apiKey}
            onChange={e=>setApiKey(e.target.value)} placeholder="••••••••"/>
        </>}

        {/* Battery-specific */}
        {slot.key==='battery' && !isCloud && !isMqtt && <>
          <FInput label="SoC (%)" accent={accent} type="number" value={soc} min={0} max={100}
            onChange={e=>setSoc(Number(e.target.value))} style={{ maxWidth:90 }}/>
          <FInput label="SoH (%)" accent={accent} type="number" value={soh} min={0} max={100}
            onChange={e=>setSoh(Number(e.target.value))} style={{ maxWidth:90 }}/>
          <FInput label="Spannung (V)" accent={accent} type="number" value={voltage}
            onChange={e=>setVoltage(Number(e.target.value))} style={{ maxWidth:110 }}/>
          <FInput label="Strom (A)" accent={accent} type="number" value={current}
            onChange={e=>setCurrent(Number(e.target.value))} style={{ maxWidth:100 }}/>
          <FInput label="Temperatur (°C)" accent={accent} type="number" value={temperature}
            onChange={e=>setTemperature(Number(e.target.value))} style={{ maxWidth:120 }}/>
        </>}

        {/* Inverter-specific */}
        {slot.key==='inverter' && !isCloud && !isMqtt && <>
          <FInput label="Leistung (kW)" accent={accent} type="number" value={power}
            onChange={e=>setPower(Number(e.target.value))} style={{ maxWidth:120 }}/>
          <FInput label="Spannung (V)" accent={accent} type="number" value={voltage}
            onChange={e=>setVoltage(Number(e.target.value))} style={{ maxWidth:110 }}/>
          <FInput label="Strom (A)" accent={accent} type="number" value={current}
            onChange={e=>setCurrent(Number(e.target.value))} style={{ maxWidth:100 }}/>
          <FInput label="Temperatur (°C)" accent={accent} type="number" value={temperature}
            onChange={e=>setTemperature(Number(e.target.value))} style={{ maxWidth:120 }}/>
        </>}

        {/* Wallbox-specific */}
        {slot.key==='wallbox' && !isCloud && !isMqtt && <>
          <FInput label="Ladestrom (A)" accent={accent} type="number" value={chargeCurrent} min={6} max={32}
            onChange={e=>setChargeCurrent(Number(e.target.value))} style={{ maxWidth:120 }}/>
        </>}

        {/* Smart Meter-specific */}
        {slot.key==='meter' && !isCloud && !isMqtt && <>
          <FInput label="Meter-ID" accent={accent} type="text" value={meterId}
            onChange={e=>setMeterId(e.target.value)} placeholder="z.B. 123456"/>
        </>}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginTop:12, padding:'9px 14px', background:'rgba(248,113,113,0.08)',
          border:'1px solid rgba(248,113,113,0.25)', borderRadius:10,
          color:'#f87171', fontSize:12, display:'flex', gap:8, alignItems:'center' }}>
          <span>⚠</span> {error}
        </div>
      )}

      {/* Status message */}
      {statusMsg && !error && (
        <div style={{ marginTop:12, padding:'9px 14px', background:`${accent}0a`,
          border:`1px solid ${accent}25`, borderRadius:10,
          color:accent, fontSize:12, display:'flex', gap:8, alignItems:'center' }}>
          {loading && <Spinner color={accent}/>}
          {statusMsg}
        </div>
      )}

      {/* Actions */}
      <div style={{ marginTop:16, display:'flex', gap:10, alignItems:'center' }}>
        <button type="button" className="wai-btn-p"
          onClick={handleConnect}
          disabled={loading || connState==='connected'}
          style={{
            background: connState==='connected' ? `${accent}20` : `linear-gradient(90deg,#ff6b35,#ff9500)`,
            border: connState==='connected' ? `1px solid ${accent}40` : 'none',
            borderRadius:999, padding:'10px 24px', fontWeight:800, fontSize:12,
            color: connState==='connected' ? accent : '#0a0305',
            cursor: (loading || connState==='connected') ? 'default' : 'pointer',
            outline:'none', letterSpacing:'0.04em',
            animation: (!loading && connState!=='connected') ? 'wai-glow-o 4s ease-in-out infinite' : 'none',
            display:'flex', alignItems:'center', gap:8,
          }}>
          {loading && <Spinner color={connState==='connected' ? accent : '#0a0305'}/>}
          {loading ? 'Verbinde…' : connState==='connected' ? '✓ Verbunden' : 'Jetzt verbinden'}
        </button>
        <button type="button" className="wai-btn-s"
          onClick={onClose} disabled={loading}
          style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:999, padding:'10px 18px', fontWeight:700, fontSize:12,
            color:'rgba(248,250,252,0.45)', cursor:loading?'default':'pointer', outline:'none' }}>
          Schließen
        </button>
        {connState==='connected' && (
          <span style={{ fontSize:11, color:'#22c55e', fontFamily:'monospace', marginLeft:4 }}>
            ● Gerät ist online
          </span>
        )}
      </div>
    </div>
  );
};

/* ─── Main DeviceGrid ────────────────────────────────────────────── */
const DeviceGrid: React.FC<DeviceGridProps> = ({ devices }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [openPanel, setOpenPanel] = useState<string | null>(null);
  const [connStates, setConnStates] = useState<Record<string, ConnState>>({});
  const [connDevices, setConnDevices] = useState<Record<string, Partial<Device>>>({});
  // Multiple connections per slot (key: `${slotKey}:${index}`)
  const [extraConns, setExtraConns] = useState<Record<string, Partial<Device>[]>>({});
  // Which "add another" panel is open per slot
  const [addPanel, setAddPanel] = useState<string | null>(null);

  // Initialize conn states from incoming devices
  useEffect(() => {
    setConnStates(prev => {
      const next = { ...prev };
      SLOTS.forEach(slot => {
        if (next[slot.key]) return; // keep user-initiated state
        const d = devices.find(dev => slot.match.some(k => (dev.type||'').toLowerCase().includes(k)));
        if (!d) { next[slot.key] = 'idle'; return; }
        const s = (d.status||'').toLowerCase();
        if (s.includes('connected') && !s.includes('partial')) next[slot.key] = 'connected';
        else if (s.includes('partial')) next[slot.key] = 'partial';
        else if (s.includes('pending')) next[slot.key] = 'connecting';
        else next[slot.key] = 'idle';
      });
      return next;
    });
  }, [devices]);

  // Particle canvas – defer init so offsetWidth is available after layout
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let raf: number;

    const init = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.offsetWidth || canvas.parentElement?.offsetWidth || 800;
      const h = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 400;
      canvas.width = w;
      canvas.height = h;
      const pts = Array.from({ length: 18 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
        r: Math.random() * 1.1 + .3,
        c: Math.random() > .5 ? 'rgba(255,107,53,' : 'rgba(59,130,246,',
      }));
      cancelAnimationFrame(raf);
      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        pts.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
          if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.c + '0.22)'; ctx.fill();
        });
        raf = requestAnimationFrame(draw);
      };
      draw();
    };

    const ro = new ResizeObserver(() => init());
    ro.observe(canvas.parentElement ?? canvas);
    const t = setTimeout(init, 60);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); clearTimeout(t); };
  }, []);

  const handleConnected = useCallback((slotKey: string, data: Partial<Device>) => {
    if (addPanel === slotKey) {
      // Adding an additional connection for this slot
      setExtraConns(p => ({ ...p, [slotKey]: [...(p[slotKey] ?? []), data] }));
      setAddPanel(null);
    } else {
      setConnStates(p => ({ ...p, [slotKey]: 'connected' }));
      setConnDevices(p => ({ ...p, [slotKey]: data }));
      setOpenPanel(null);
    }
  }, [addPanel]);

  return (
    <div style={{ position: 'relative' }}>
      <style>{WAI_CSS}</style>
      <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }}/>

      {/* Header bar */}
      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:3, height:22, background:'linear-gradient(180deg,#ff6b35,#ff9500)', borderRadius:999 }}/>
          <span style={{ fontSize:12, fontWeight:700, color:'rgba(248,250,252,0.5)', letterSpacing:'0.16em', textTransform:'uppercase' }}>
            {Object.values(connStates).filter(s=>s==='connected').length} / {SLOTS.length} Geräte verbunden
          </span>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['MQTT','TLS 1.3','ISO 15118','OCPP 2.0.1'].map(t => (
            <span key={t} style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:'rgba(59,130,246,0.55)',
              background:'rgba(59,130,246,0.07)', border:'1px solid rgba(59,130,246,0.14)',
              borderRadius:4, padding:'2px 7px' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* 4 device cards */}
      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', gap:10 }}>
        {SLOTS.map(slot => {
          const apiDevice = devices.find(d => slot.match.some(k => (d.type||'').toLowerCase().includes(k))) ?? null;
          const extraData = connDevices[slot.key] ?? {};
          const device = apiDevice ?? (Object.keys(extraData).length ? extraData as Device : null);
          const cState = connStates[slot.key] ?? 'idle';
          const si = getStatusInfo(cState, device?.status);
          const isOpen = openPanel === slot.key;
          const isAddOpen = addPanel === slot.key;
          const isBatt = slot.key === 'battery';
          const safeSoc = Number.isFinite(device?.soc) ? Math.max(0, Math.min(100, Number(device?.soc))) : 0;
          const extras = extraConns[slot.key] ?? [];
          // Total connected count for this slot (primary + extras)
          const totalConnected = (cState === 'connected' ? 1 : 0) + extras.length;

          return (
            <div key={slot.key} className="wai-dcard" style={{
              background: `linear-gradient(118deg, rgba(16,22,52,0.88) 0%, rgba(20,28,60,0.84) 55%, ${slot.bg})`,
              border: `1px solid ${cState==='connected' ? slot.border : isOpen ? slot.border+'88' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 18, overflow: 'hidden',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              position: 'relative',
              boxShadow: cState==='connected' ? `0 0 0 1px ${slot.accent}18` : 'none',
            }}>
              {/* Top accent stripe */}
              <div style={{ height: 2.5, background: cState==='connected'
                ? `linear-gradient(90deg,${slot.accent},${slot.accent}44,transparent)`
                : isOpen ? `linear-gradient(90deg,rgba(255,107,53,0.5),transparent)`
                : 'linear-gradient(90deg,rgba(255,255,255,0.04),transparent)'
              }}/>

              {/* Scan line */}
              <div style={{ position:'absolute', left:0, right:0, height:1,
                background:`linear-gradient(90deg,transparent,${slot.accent}14,transparent)`,
                animation:'wai-scan 22s linear infinite', pointerEvents:'none', zIndex:0 }}/>

              {/* Main card row */}
              <div className="wai-card-row" style={{ padding:'clamp(10px,2vw,16px) clamp(10px,2.5vw,20px)' }}>

                {/* ── Icon col ── */}
                <div className="wai-card-icon" style={{ flexShrink:0, width:54, display:'flex', flexDirection:'column', alignItems:'center', gap:4, marginRight:10 }}>
                  <div style={{ position:'relative', width:52, height:52 }}>
                    <svg width={52} height={52} viewBox="0 0 52 52" fill="none" style={{ position:'absolute', top:0, left:0 }}>
                      <polygon points="26,2 49,14 49,38 26,50 3,38 3,14"
                        fill={`${slot.accent}09`} stroke={slot.accent} strokeWidth="1.3"
                        strokeOpacity={cState==='connected'?0.65:0.22}/>
                      <polygon points="26,2 49,14 49,38 26,50 3,38 3,14"
                        fill="none" stroke={slot.accent} strokeWidth="0.7" strokeOpacity="0.14"
                        style={{ animation:'wai-spin 30s linear infinite', transformOrigin:'26px 26px' }}/>
                    </svg>
                    <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                      animation: cState==='connected' ? 'wai-float 4s ease-in-out infinite' : 'none' }}>
                      {slot.icon}
                    </div>
                  </div>
                  {/* Status dot */}
                  <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:si.dot, animation:'wai-breathe 3s ease-in-out infinite' }}/>
                    {cState==='connected' && <div style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:si.dot, animation:'wai-ping 2.5s ease-out infinite' }}/>}
                    {cState==='connecting' && <Spinner color={si.dot}/>}
                  </div>
                </div>

                {/* ── Name + badge ── */}
                <div className="wai-card-name" style={{ flex:'1 1 120px', minWidth:0, marginRight:10 }}>
                  <div style={{ fontSize:15, fontWeight:900, color:'#f8fafc', letterSpacing:'-0.02em', marginBottom:2 }}>
                    {slot.label}
                    {totalConnected > 1 && (
                      <span style={{ marginLeft:8, fontSize:10, fontWeight:700, color:slot.accent,
                        background:`${slot.accent}14`, border:`1px solid ${slot.accent}30`,
                        borderRadius:999, padding:'2px 8px', verticalAlign:'middle' }}>
                        {totalConnected}×
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(248,250,252,0.3)', marginBottom:8 }}>{slot.sublabel}</div>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:5,
                    background:`${si.color}12`, border:`1px solid ${si.color}28`, borderRadius:999,
                    padding:'3px 10px', fontSize:10, fontWeight:700, color:si.color,
                    letterSpacing:'0.08em', textTransform:'uppercase' }}>
                    {cState==='connecting' && <Spinner color={si.color}/>}
                    {si.label}
                  </span>
                  {device && (
                    <div style={{ marginTop:7, fontSize:10, color:'rgba(248,250,252,0.32)', fontFamily:'monospace', lineHeight:1.5 }}>
                      {device.brand && <span>{device.brand}</span>}
                      {device.model && <span> · {device.model}</span>}
                      {device.ip && <div style={{ color:'rgba(248,250,252,0.2)' }}>{device.ip}</div>}
                    </div>
                  )}
                  {/* Extra connected devices list */}
                  {extras.length > 0 && (
                    <div style={{ marginTop:6 }}>
                      {extras.map((ex, i) => (
                        <div key={i} style={{ fontSize:10, color:'rgba(248,250,252,0.3)', fontFamily:'monospace',
                          display:'flex', alignItems:'center', gap:5 }}>
                          <span style={{ color:slot.accent }}>✓</span>
                          {ex.brand ?? slot.label} {ex.model ?? ''}{ex.ip ? ` · ${ex.ip}` : ''}
                          <button type="button"
                            onClick={() => setExtraConns(p => ({ ...p, [slot.key]: (p[slot.key]??[]).filter((_,j)=>j!==i) }))}
                            style={{ fontSize:9, color:'#f87171', background:'none', border:'none', cursor:'pointer', padding:'0 2px' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Specs mini grid ── */}
                <div className="wai-card-specs" style={{ flex:1, minWidth:0, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 6px', marginRight:8 }}>
                  {[
                    { label:'Protokoll', value: slot.protos.map(p=>({modbus:'Modbus',cloud:'Cloud',ocpp:'OCPP',sunspec:'SunSpec',mqtt:'MQTT'}[p]||p)).join(' · ') },
                    { label:'Standard', value: slot.standard },
                    { label:'Sicherheit', value:'TLS 1.3 · mTLS' },
                    { label:'Schnittstelle', value: device?.ip || slot.protocols_info },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding:'clamp(4px,1.5vw,7px) clamp(5px,1.5vw,9px)', background:'rgba(255,255,255,0.025)', borderRadius:9, border:'1px solid rgba(255,255,255,0.045)' }}>
                      <div style={{ fontSize:9, color:'rgba(248,250,252,0.24)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:2 }}>{label}</div>
                      <div style={{ fontSize:10, fontWeight:700, color:'rgba(248,250,252,0.58)', fontFamily:'monospace', overflowWrap:'break-word', wordBreak:'break-word', whiteSpace:'normal', lineHeight:1.4 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* ── Metrics + CTA ── */}
                <div className="wai-card-cta" style={{ flexShrink:0, width:'clamp(90px,20vw,118px)', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                  {isBatt && cState==='connected' ? (
                    <SOCRing soc={safeSoc} accent={slot.accent}/>
                  ) : (
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
                      {slot.protos.map(p => (
                        <ProtoBadge key={p} accent={slot.accent}
                          label={({modbus:'RTU',cloud:'API',ocpp:'OCPP',sunspec:'SunSpec',mqtt:'MQTT'}[p]||p)}/>
                      ))}
                    </div>
                  )}

                  {/* Primary connect / connected button */}
                  {cState === 'connected' ? (
                    <div style={{ width:'100%', textAlign:'center', padding:'7px 10px', borderRadius:999,
                      background:`${slot.accent}12`, border:`1px solid ${slot.accent}35`,
                      fontSize:11, fontWeight:800, color:slot.accent }}>
                      ✓ Verbunden
                    </div>
                  ) : (
                    <button type="button" className="wai-btn-p"
                      onClick={() => { setOpenPanel(isOpen ? null : slot.key); setAddPanel(null); }}
                      style={{
                        width:'100%', outline:'none', borderRadius:999,
                        padding:'8px 10px', fontWeight:800, fontSize:11, cursor:'pointer',
                        letterSpacing:'0.04em', boxShadow:'none',
                        background: isOpen ? `${slot.accent}20` : 'linear-gradient(90deg,#ff6b35,#ff9500)',
                        color: isOpen ? slot.accent : '#0a0305',
                        border: isOpen ? `1px solid ${slot.accent}40` : 'none',
                        animation: isOpen ? 'none' : 'wai-glow-o 4s ease-in-out infinite',
                      }}>
                      {isOpen ? '▲ Schließen' : '+ Verbinden'}
                    </button>
                  )}

                  {/* Weitere hinzufügen — nur wenn schon verbunden */}
                  {cState === 'connected' && (
                    <button type="button"
                      onClick={() => { setAddPanel(isAddOpen ? null : slot.key); setOpenPanel(null); }}
                      style={{
                        width:'100%', outline:'none', borderRadius:999, padding:'6px 10px',
                        fontWeight:700, fontSize:10, cursor:'pointer', letterSpacing:'0.04em',
                        background: isAddOpen ? `${slot.accent}18` : 'rgba(255,255,255,0.04)',
                        color: isAddOpen ? slot.accent : 'rgba(248,250,252,0.4)',
                        border: `1px solid ${isAddOpen ? slot.accent+'44' : 'rgba(255,255,255,0.1)'}`,
                        transition:'all .25s ease',
                      }}>
                      {isAddOpen ? '▲ Schließen' : `+ Weiteres ${slot.label.split(' ')[0]}`}
                    </button>
                  )}

                  {cState === 'connected' && (
                    <button type="button"
                      onClick={() => { setConnStates(p=>({...p,[slot.key]:'idle'})); setOpenPanel(slot.key); setAddPanel(null); }}
                      style={{ fontSize:10, color:'rgba(248,250,252,0.25)', background:'none', border:'none',
                        cursor:'pointer', textDecoration:'underline', padding:0 }}>
                      Neu konfigurieren
                    </button>
                  )}
                </div>
              </div>

              {/* ── Inline connect panel (primary) ── */}
              {isOpen && (
                <ConnectPanel
                  slot={slot}
                  device={apiDevice}
                  connState={cState}
                  onConnected={(d) => handleConnected(slot.key, d)}
                  onClose={() => setOpenPanel(null)}
                />
              )}

              {/* ── Inline connect panel (additional device) ── */}
              {isAddOpen && (
                <div>
                  <div style={{ padding:'10px 22px 0', fontSize:11, fontWeight:700, color:slot.accent,
                    letterSpacing:'0.1em', textTransform:'uppercase', background:`${slot.accent}06` }}>
                    ＋ Weiteres {slot.label} hinzufügen
                  </div>
                  <ConnectPanel
                    slot={slot}
                    device={null}
                    connState="idle"
                    onConnected={(d) => handleConnected(slot.key, d)}
                    onClose={() => setAddPanel(null)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeviceGrid;
