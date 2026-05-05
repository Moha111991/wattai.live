import { useState, useEffect, useRef } from "react";
import { API_URL, resolveWsUrl } from "../lib/api";

type ConnectParams = Record<string, unknown>;

interface DeviceLike {
  id: string;
  type: string;
  brand: string;
  enabled: boolean;
  ip: string;
  port?: string | number;
  status: string;
  manufacturer?: string;
  model?: string;
  soc?: number;
  power_kw?: number;
}

interface ConnectionInfo {
  status?: string;
  device_id?: string;
  request_id?: string;
  requestId?: string;
  [key: string]: unknown;
}

interface PollOptions {
  interval?: number;
  maxInterval?: number;
  timeout?: number;
  backoff?: number;
  signal?: AbortSignal;
  onUpdate?: (info: ConnectionInfo) => void;
}

const getRequestId = (data: ConnectionInfo): string | undefined => {
  if (typeof data.request_id === 'string') return data.request_id;
  if (typeof data.requestId === 'string') return data.requestId;
  return undefined;
};

const normalizeDevice = (device: Partial<DeviceLike>): DeviceLike => ({
  id: String(device.id ?? `${(device.type ?? 'device').toLowerCase()}_${Math.random().toString(36).slice(2, 8)}`),
  type: String(device.type ?? 'Unbekannt'),
  brand: String(device.brand ?? 'Unbekannt'),
  enabled: Boolean(device.enabled ?? false),
  ip: String(device.ip ?? '-'),
  status: String(device.status ?? 'offline'),
  port: device.port,
  manufacturer: typeof device.manufacturer === 'string' ? device.manufacturer : undefined,
  model: typeof device.model === 'string' ? device.model : undefined,
  soc: typeof device.soc === 'number' ? device.soc : undefined,
  power_kw: typeof device.power_kw === 'number' ? device.power_kw : undefined,
});


// Simple polling helper: polls GET /connections/{requestId} until status === 'connected'
async function pollConnection(requestId: string, {
  interval = 1000,
  maxInterval = 5000,
  timeout = 120000,
  backoff = 1.5,
  signal,
  onUpdate,
} : PollOptions = {}) {
  const start = Date.now();
  let current = interval;

  while (true) {
    if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');

    try {
      const res = await fetch(`${API_URL}/connections/${encodeURIComponent(requestId)}`, {
        method: 'GET',
        credentials: 'include',
        signal,
      });

      if (res.status === 404) {
        // not yet known, continue
      } else if (!res.ok) {
        // for 5xx allow retry, for 4xx (other than 404) treat as fatal
        if (res.status >= 500 && res.status < 600) {
          // continue and retry
        } else {
          const txt = await res.text().catch(() => '');
          throw new Error(`Polling failed: ${res.status} ${txt}`);
        }
      } else {
        const info: ConnectionInfo = await res.json();
        if (onUpdate) onUpdate(info);
        if (info.status === 'connected') return info;
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') throw err;
      // network/transient errors: ignore and retry until timeout
    }

    if (Date.now() - start > timeout) throw new Error('Polling timeout');

    await new Promise((resolve, reject) => {
      const t = setTimeout(resolve, current);
      if (signal) signal.addEventListener('abort', () => {
        clearTimeout(t);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });

    current = Math.min(maxInterval, Math.floor(current * backoff));
  }
}

function BatteryModbusDialog({ onConnect, onClose, realDevices }: { onConnect: (params: ConnectParams) => void | Promise<void>, onClose: () => void, realDevices: DeviceLike[] }) {
  const [protocol, setProtocol] = useState<'modbus' | 'cloud'>('modbus');
  const [step, setStep] = useState(1);
  // Modbus fields
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(502);
  // Cloud fields
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  // Step 2: Battery data
  const [soc, setSoc] = useState(50);
  const [soh, setSoh] = useState(95);
  const [voltage, setVoltage] = useState(400);
  const [current, setCurrent] = useState(10);
  const [temperature, setTemperature] = useState(25);
  const [errorStatus, setErrorStatus] = useState('OK');
  const [command, setCommand] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (protocol === 'modbus') {
      if (!ip) return "IP-Adresse ist erforderlich.";
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return "Ungültige IP-Adresse.";
      if (!port || port < 1 || port > 65535) return "Port muss zwischen 1 und 65535 liegen.";
    } else if (protocol === 'cloud') {
      if (!deviceId) return "Device-ID ist erforderlich.";
      if (!apiBaseUrl) return "API Base URL ist erforderlich.";
      if (!apiKey) return "API Key ist erforderlich.";
    }
    return null;
  };

  const handleConnect = async () => {
    setError('');
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    try {
      if (protocol === 'modbus') {
        // Only allow if IP/port matches a real battery device
  const found = realDevices.find((d: DeviceLike) => (d.ip === ip || (d.ip || '').split(',').includes(ip)) && (d.port ? d.port == port : true));
        if (found) {
          setStep(2);
          setError('');
        } else {
          setError('Keine echte Batterie mit dieser IP/Port gefunden!');
        }
      } else if (protocol === 'cloud') {
        // Call backend /devices/cloud_sync endpoint
        const res = await fetch(`${API_URL}/devices/cloud_sync`, {
          method: 'POST',
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ device_id: deviceId, api_base_url: apiBaseUrl, api_key: apiKey })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Cloud API Verbindung fehlgeschlagen');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        if (onConnect) await onConnect({ protocol: 'cloud', ...data });
        onClose();
        alert("Batterie über Cloud API verbunden und registriert!");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Verbindung fehlgeschlagen.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    onConnect({ ip, port, soc, soh, voltage, current, temperature, errorStatus, command });
    onClose();
    alert("Batterie über Modbus verbunden und registriert!");
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        {protocol === 'modbus' && step === 1 && (
          <>
            <h3>Modbus Verbindung zur Batterie</h3>
            <label>IP-Adresse: <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="z.B. 192.168.1.50" /></label><br/>
            <label>Port: <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} /></label><br/>
            {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
            <button onClick={handleConnect} disabled={!ip || loading}>Verbinden</button>
            <button onClick={onClose} style={{marginLeft:8}}>Abbrechen</button>
          </>
        )}
        {protocol === 'modbus' && step === 2 && (
          <>
            <h3>Batterie registrieren (Modbus)</h3>
            <label>SoC (%): <input type="number" value={soc} onChange={e => setSoc(Number(e.target.value))} /></label><br/>
            <label>SoH (%): <input type="number" value={soh} onChange={e => setSoh(Number(e.target.value))} /></label><br/>
            <label>Spannung (V): <input type="number" value={voltage} onChange={e => setVoltage(Number(e.target.value))} /></label><br/>
            <label>Strom (A): <input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} /></label><br/>
            <label>Temperatur (°C): <input type="number" value={temperature} onChange={e => setTemperature(Number(e.target.value))} /></label><br/>
            <label>Fehlerstatus: <input type="text" value={errorStatus} onChange={e => setErrorStatus(e.target.value)} /></label><br/>
            <label>Steuerbefehl: <input type="text" value={command} onChange={e => setCommand(e.target.value)} placeholder="z.B. set_power=2.5" /></label><br/>
            <button onClick={handleRegister}>Registrieren</button>
            <button onClick={onClose} style={{marginLeft:8}}>Abbrechen</button>
          </>
        )}
        {protocol === 'cloud' && (
          <>
            <h3>Batterie verbinden (Cloud API)</h3>
            <label>Device-ID: <input type="text" value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="z.B. BAT123456" /></label><br/>
            <label>API Base URL: <input type="text" value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} placeholder="https://cloud.battery.com/api" /></label><br/>
            <label>API Key: <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" /></label><br/>
            {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
            {success && <div style={{color:'green',marginBottom:8}}>✅ Verbunden!</div>}
            <button onClick={handleConnect} disabled={loading} style={{marginRight:8}}>Verbinden</button>
            <button onClick={onClose}>Abbrechen</button>
          </>
        )}
        <div style={{marginTop:16}}>
          <label>
            <input type="radio" checked={protocol === 'modbus'} onChange={() => setProtocol('modbus')} disabled={loading} /> Modbus
          </label>
          <label style={{ marginLeft: 16 }}>
            <input type="radio" checked={protocol === 'cloud'} onChange={() => setProtocol('cloud')} disabled={loading} /> Cloud API
          </label>
        </div>
      </div>
    </div>
  );
}

void BatteryModbusDialog;

// ...existing code...
import DeviceGrid from './DeviceGrid';
import SmartMeterConnectDialog from './SmartMeterConnectDialog';
import InverterConnectDialog from './InverterConnectDialog';

function DeviceConnectDialog({ deviceType, realDevices, onConnect, onClose }: { deviceType: string, realDevices: DeviceLike[], onConnect: (params: ConnectParams) => void | Promise<void>, onClose: () => void }) {
  const [protocol, setProtocol] = useState<'modbus' | 'cloud'>('modbus');
  const [step, setStep] = useState(1);
  const [ip, setIp] = useState('');
  const [port, setPort] = useState(502);
  const [error, setError] = useState('');
  // Cloud fields
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  // Common fields
  const [soc, setSoc] = useState(50);
  const [soh, setSoh] = useState(95);
  const [voltage, setVoltage] = useState(400);
  const [current, setCurrent] = useState(10);
  const [temperature, setTemperature] = useState(25);
  const [errorStatus, setErrorStatus] = useState('OK');
  const [command, setCommand] = useState('');
  // Wallbox
  const [charging, setCharging] = useState(false);
  // Inverter
  const [power, setPower] = useState(0);
  // Smart Meter
  const [meterReading, setMeterReading] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (protocol === 'modbus') {
      if (!ip) return "IP-Adresse ist erforderlich.";
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return "Ungültige IP-Adresse.";
      if (!port || port < 1 || port > 65535) return "Port muss zwischen 1 und 65535 liegen.";
    } else if (protocol === 'cloud') {
      if (!deviceId) return "Device-ID ist erforderlich.";
      if (!apiBaseUrl) return "API Base URL ist erforderlich.";
      if (!apiKey) return "API Key ist erforderlich.";
    }
    return null;
  };

  const handleConnect = async () => {
    setError('');
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    try {
      if (protocol === 'modbus') {
  const found = realDevices.find((d: DeviceLike) => (d.ip === ip || (d.ip || '').split(',').includes(ip)) && (d.port ? d.port == port : true));
        if (found) {
          setStep(2);
          setError('');
        } else {
          setError('Kein echtes Gerät mit dieser IP/Port gefunden!');
        }
      } else if (protocol === 'cloud') {
        // Call backend /devices/cloud_sync endpoint
        const res = await fetch(`${API_URL}/devices/cloud_sync`, {
          method: 'POST',
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ device_id: deviceId, api_base_url: apiBaseUrl, api_key: apiKey })
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Cloud API Verbindung fehlgeschlagen');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        if (onConnect) await onConnect({ protocol: 'cloud', ...data });
        onClose();
        alert(`${deviceType} über Cloud API verbunden und registriert!`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Verbindung fehlgeschlagen.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    let params: ConnectParams = { ip, port };
    if (deviceType === 'Battery') {
      params = { ...params, soc, soh, voltage, current, temperature, errorStatus, command };
    } else if (deviceType === 'Wallbox') {
      params = { ...params, charging, voltage, current, command };
    } else if (deviceType === 'Inverter') {
      params = { ...params, power, voltage, current, temperature, command };
    } else if (deviceType === 'Smart Meter') {
      params = { ...params, meterReading, voltage, current, command };
    }
    onConnect(params);
    onClose();
    alert(`${deviceType} über Modbus verbunden und registriert!`);
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog">
        {protocol === 'modbus' && step === 1 && (
          <>
            <h3>{deviceType} verbinden (Modbus)</h3>
            <label>IP-Adresse: <input type="text" value={ip} onChange={e => setIp(e.target.value)} placeholder="z.B. 192.168.1.50" /></label><br/>
            <label>Port: <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} /></label><br/>
            {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
            <button onClick={handleConnect} disabled={!ip || loading}>Verbinden</button>
            <button onClick={onClose} style={{marginLeft:8}}>Abbrechen</button>
          </>
        )}
        {protocol === 'modbus' && step === 2 && (
          <>
            <h3>{deviceType} registrieren (Modbus)</h3>
            {deviceType === 'Battery' && <>
              <label>SoC (%): <input type="number" value={soc} onChange={e => setSoc(Number(e.target.value))} /></label><br/>
              <label>SoH (%): <input type="number" value={soh} onChange={e => setSoh(Number(e.target.value))} /></label><br/>
              <label>Spannung (V): <input type="number" value={voltage} onChange={e => setVoltage(Number(e.target.value))} /></label><br/>
              <label>Strom (A): <input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} /></label><br/>
              <label>Temperatur (°C): <input type="number" value={temperature} onChange={e => setTemperature(Number(e.target.value))} /></label><br/>
              <label>Fehlerstatus: <input type="text" value={errorStatus} onChange={e => setErrorStatus(e.target.value)} /></label><br/>
              <label>Steuerbefehl: <input type="text" value={command} onChange={e => setCommand(e.target.value)} placeholder="z.B. set_power=2.5" /></label><br/>
            </>}
            {deviceType === 'Wallbox' && <>
              <label>Laden aktiv: <input type="checkbox" checked={charging} onChange={e => setCharging(e.target.checked)} /></label><br/>
              <label>Spannung (V): <input type="number" value={voltage} onChange={e => setVoltage(Number(e.target.value))} /></label><br/>
              <label>Strom (A): <input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} /></label><br/>
              <label>Steuerbefehl: <input type="text" value={command} onChange={e => setCommand(e.target.value)} placeholder="z.B. start_charge" /></label><br/>
            </>}
            {deviceType === 'Inverter' && <>
              <label>Leistung (kW): <input type="number" value={power} onChange={e => setPower(Number(e.target.value))} /></label><br/>
              <label>Spannung (V): <input type="number" value={voltage} onChange={e => setVoltage(Number(e.target.value))} /></label><br/>
              <label>Strom (A): <input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} /></label><br/>
              <label>Temperatur (°C): <input type="number" value={temperature} onChange={e => setTemperature(Number(e.target.value))} /></label><br/>
              <label>Steuerbefehl: <input type="text" value={command} onChange={e => setCommand(e.target.value)} placeholder="z.B. set_power=2.5" /></label><br/>
            </>}
            {deviceType === 'Smart Meter' && <>
              <label>Zählerstand: <input type="number" value={meterReading} onChange={e => setMeterReading(Number(e.target.value))} /></label><br/>
              <label>Spannung (V): <input type="number" value={voltage} onChange={e => setVoltage(Number(e.target.value))} /></label><br/>
              <label>Strom (A): <input type="number" value={current} onChange={e => setCurrent(Number(e.target.value))} /></label><br/>
              <label>Steuerbefehl: <input type="text" value={command} onChange={e => setCommand(e.target.value)} placeholder="z.B. reset_meter" /></label><br/>
            </>}
            <button onClick={handleRegister}>Registrieren</button>
            <button onClick={onClose} style={{marginLeft:8}}>Abbrechen</button>
          </>
        )}
        {protocol === 'cloud' && (
          <>
            <h3>{deviceType} verbinden (Cloud API)</h3>
            <label>Device-ID: <input type="text" value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="z.B. WBX123456" /></label><br/>
            <label>API Base URL: <input type="text" value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} placeholder="https://cloud.wallbox.com/api" /></label><br/>
            <label>API Key: <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" /></label><br/>
            {error && <div style={{color:'red',marginBottom:8}}>{error}</div>}
            {success && <div style={{color:'green',marginBottom:8}}>✅ Verbunden!</div>}
            <button onClick={handleConnect} disabled={loading} style={{marginRight:8}}>Verbinden</button>
            <button onClick={onClose}>Abbrechen</button>
          </>
        )}
        <div style={{marginTop:16}}>
          <label>
            <input type="radio" checked={protocol === 'modbus'} onChange={() => setProtocol('modbus')} disabled={loading} /> Modbus
          </label>
          <label style={{ marginLeft: 16 }}>
            <input type="radio" checked={protocol === 'cloud'} onChange={() => setProtocol('cloud')} disabled={loading} /> Cloud API
          </label>
        </div>
      </div>
    </div>
  );
}

export default function DeviceManager() {
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectType, setConnectType] = useState<string>('');
  const [devices, setDevices] = useState<DeviceLike[]>([]);
  const [showSmartMeterDialog, setShowSmartMeterDialog] = useState(false);
  const [smartMeterDevice, setSmartMeterDevice] = useState<DeviceLike | null>(null);
  const [showInverterDialog, setShowInverterDialog] = useState(false);
  const [inverterDevice, setInverterDevice] = useState<DeviceLike | null>(null);
  // track active poll controllers so we can cancel if component unmounts
  const pollControllers = useRef<Map<string, AbortController>>(new Map());
  // cleanup on unmount: abort any outstanding polls
  useEffect(() => {
    const controllers = pollControllers.current;
    return () => {
      controllers.forEach(ac => {
        try { ac.abort(); } catch { /* ignore */ }
      });
      controllers.clear();
    };
  }, []);
  useEffect(() => {
    fetch(`${API_URL}/devices`, {
      headers: {
        'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        // Aggregate all batteries into one card (average SOC, sum power)
        const deviceList = ((data.devices || []) as Partial<DeviceLike>[]).map(normalizeDevice);
        const typeMap: Record<string, DeviceLike> = {};
        const batteries = deviceList.filter((dev: DeviceLike) => (dev.type || '').toLowerCase().includes('battery'));
        if (batteries.length > 0) {
          // Aggregate: average SOC, sum power, concat brands/models
          const avgSoc = batteries.reduce((sum: number, b: DeviceLike) => sum + (b.soc ?? 0), 0) / batteries.length;
          const sumPower = batteries.reduce((sum: number, b: DeviceLike) => sum + (b.power_kw ?? 0), 0);
          typeMap['battery'] = {
            id: 'batteries_agg',
            type: 'Battery',
            brand: batteries.map((b: DeviceLike) => b.brand || 'Unbekannt').filter(Boolean).join(' + ') || 'Unbekannt',
            enabled: true,
            ip: batteries.map((b: DeviceLike) => b.ip || '').filter(Boolean).join(', '),
            status: batteries.every((b: DeviceLike) => b.status === 'connected') ? 'connected' : 'partially connected',
            manufacturer: batteries.map((b: DeviceLike) => b.manufacturer || '').filter(Boolean).join(' + ') || '-',
            model: batteries.map((b: DeviceLike) => b.model || '').filter(Boolean).join(' + ') || '-',
            soc: Math.round(avgSoc),
            power_kw: Math.round(sumPower * 100) / 100
          };
        }
        deviceList.forEach((dev: DeviceLike) => {
          const t = (dev.type || '').toLowerCase();
          if (t.includes('smart meter') && !typeMap['smart_meter']) typeMap['smart_meter'] = dev;
          else if (t.includes('inverter') && !typeMap['inverter']) typeMap['inverter'] = dev;
          else if (t.includes('wallbox') && !typeMap['wallbox']) typeMap['wallbox'] = dev;
        });
        setDevices(Object.values(typeMap));
      });
  }, []);

  // WebSocket push: listen for connection updates from backend
  useEffect(() => {
    try {
      const wsUrl = resolveWsUrl();
      const socket = new WebSocket(wsUrl);

      socket.addEventListener('open', () => {
        console.debug('ws connected', wsUrl);
      });

      socket.addEventListener('message', (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && data.type === 'connection_update') {
            const reqId = data.request_id;
            const devId = data.device_id;
            const status = data.status;
            if (devId) {
              setDevices(devs => devs.map(d => d.id === devId ? { ...d, status } : d));
            } else if (reqId) {
              // attempt best-effort: if any device currently pending, set it
              setDevices(devs => devs.map(d => d.status === 'pending' ? { ...d, status } : d));
            }
          }
        } catch {
          // ignore malformed messages
        }
      });

      socket.addEventListener('close', () => {
        console.debug('ws closed');
      });

      return () => {
        try { socket.close(); } catch { }
      };
    } catch (e) {
      console.warn('ws init failed', e);
    }
  }, []);

  const handleConnect = (device: DeviceLike) => {
    setConnectType(device.type);
    setShowConnectDialog(true);
  };

  const handleInverterConnect = async (params: ConnectParams) => {
    if (!inverterDevice) return;
    try {
      const res = await fetch(`${API_URL}/devices/${inverterDevice.id}/connect`, {
        method: "POST",
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
  const data: ConnectionInfo = await res.json().catch(() => ({} as ConnectionInfo));
  const requestId = getRequestId(data);

      // mark pending in UI
      setDevices(devices => devices.map(d => d.id === inverterDevice.id ? { ...d, status: "pending" } : d));

      if (requestId) {
        const ac = new AbortController();
        pollControllers.current.set(requestId, ac);
        pollConnection(requestId, {
          signal: ac.signal,
          onUpdate: (info: ConnectionInfo) => {
            // if backend reports a different device_id, try to update that one too
            const devId = info.device_id || inverterDevice.id;
            setDevices(devices => devices.map(d => d.id === devId ? { ...d, status: info.status || d.status } : d));
          }
        }).then((info: ConnectionInfo) => {
          const devId = info.device_id || inverterDevice.id;
          setDevices(devices => devices.map(d => d.id === devId ? { ...d, status: "connected" } : d));
          alert("Inverter verbunden!");
        }).catch((err: unknown) => {
          console.warn('poll failed', err);
          setDevices(devices => devices.map(d => d.id === inverterDevice.id ? { ...d, status: "failed" } : d));
        }).finally(() => {
          pollControllers.current.delete(requestId);
          setShowInverterDialog(false);
          setInverterDevice(null);
        });
      } else {
        // no request id returned — fall back to immediate connected state
        setDevices(devices => devices.map(d => d.id === inverterDevice.id ? { ...d, status: "connected" } : d));
        setShowInverterDialog(false);
        setInverterDevice(null);
        alert("Inverter verbunden!");
      }
    } catch (e) {
      setDevices(devices => devices.map(d => d.id === inverterDevice.id ? { ...d, status: "failed" } : d));
      setShowInverterDialog(false);
      setInverterDevice(null);
      console.warn(e);
      alert("Fehler beim Verbinden des Inverters.");
    }
  };

  const handleSmartMeterConnect = async (params: ConnectParams) => {
    if (!smartMeterDevice) return;
    try {
      const res = await fetch(`${API_URL}/devices/${smartMeterDevice.id}/connect`, {
        method: "POST",
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
  const data: ConnectionInfo = await res.json().catch(() => ({} as ConnectionInfo));
  const requestId = getRequestId(data);

      setDevices(devices => devices.map(d => d.id === smartMeterDevice.id ? { ...d, status: "pending" } : d));

      if (requestId) {
        const ac = new AbortController();
        pollControllers.current.set(requestId, ac);
        pollConnection(requestId, {
          signal: ac.signal,
          onUpdate: (info: ConnectionInfo) => {
            const devId = info.device_id || smartMeterDevice.id;
            setDevices(devices => devices.map(d => d.id === devId ? { ...d, status: info.status || d.status } : d));
          }
        }).then((info: ConnectionInfo) => {
          const devId = info.device_id || smartMeterDevice.id;
          setDevices(devices => devices.map(d => d.id === devId ? { ...d, status: "connected" } : d));
          alert("Smart Meter verbunden!");
        }).catch((err: unknown) => {
          console.warn('poll failed', err);
          setDevices(devices => devices.map(d => d.id === smartMeterDevice.id ? { ...d, status: "failed" } : d));
        }).finally(() => {
          pollControllers.current.delete(requestId);
          setShowSmartMeterDialog(false);
          setSmartMeterDevice(null);
        });
      } else {
        setDevices(devices => devices.map(d => d.id === smartMeterDevice.id ? { ...d, status: "connected" } : d));
        setShowSmartMeterDialog(false);
        setSmartMeterDevice(null);
        alert("Smart Meter verbunden!");
      }
    } catch (e) {
      setDevices(devices => devices.map(d => d.id === smartMeterDevice.id ? { ...d, status: "failed" } : d));
      setShowSmartMeterDialog(false);
      setSmartMeterDevice(null);
      console.warn(e);
      alert("Fehler beim Verbinden des Smart Meters.");
    }
  };

  return (
    <>
      <DeviceGrid devices={devices} onConnect={handleConnect} />
      {showSmartMeterDialog && (
        <SmartMeterConnectDialog
          onConnect={handleSmartMeterConnect}
        />
      )}
      {showInverterDialog && inverterDevice && (
        <InverterConnectDialog
          inverter={inverterDevice}
          onConnect={handleInverterConnect}
        />
      )}
      {showConnectDialog && (
        <DeviceConnectDialog
          deviceType={connectType}
          realDevices={devices.filter((d: DeviceLike) => (d.type || '').toLowerCase().includes(connectType.toLowerCase()))}
          onConnect={async (params: ConnectParams) => {
            // Try to find a representative device for this type to POST a connect request to
            const target = devices.find(d => (d.type || '').toLowerCase() === connectType.toLowerCase() || (d.type || '').toLowerCase().includes(connectType.toLowerCase()));
            if (!target) {
              // fallback: update UI immediately
              setDevices(devices => devices.map(d => (d.type === connectType ? { ...d, status: "connected", ...params } : d)));
              return;
            }

            try {
              const res = await fetch(`${API_URL}/devices/${target.id}/connect`, {
                method: 'POST',
                headers: {
                  'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(params)
              });
              const data: ConnectionInfo = await res.json().catch(() => ({} as ConnectionInfo));
              const requestId = getRequestId(data);

              setDevices(devices => devices.map(d => (d.id === target.id ? { ...d, status: 'pending' } : d)));

              if (requestId) {
                const ac = new AbortController();
                pollControllers.current.set(requestId, ac);
                pollConnection(requestId, {
                  signal: ac.signal,
                  onUpdate: (info: ConnectionInfo) => {
                    const devId = info.device_id || target.id;
                    setDevices(devices => devices.map(d => d.id === devId ? { ...d, status: info.status || d.status } : d));
                  }
                }).then((info: ConnectionInfo) => {
                  const devId = info.device_id || target.id;
                  setDevices(devices => devices.map(d => d.id === devId ? { ...d, status: 'connected', ...params } : d));
                }).catch((err: unknown) => {
                  console.warn('poll failed', err);
                  setDevices(devices => devices.map(d => d.id === target.id ? { ...d, status: 'failed' } : d));
                }).finally(() => {
                  pollControllers.current.delete(requestId);
                });
              } else {
                setDevices(devices => devices.map(d => d.id === target.id ? { ...d, status: 'connected', ...params } : d));
              }
            } catch (err) {
              console.warn(err);
              setDevices(devices => devices.map(d => (d.type === connectType ? { ...d, status: "failed", ...params } : d)));
            }
          }}
          onClose={() => setShowConnectDialog(false)}
        />
      )}
    </>
  );
}

