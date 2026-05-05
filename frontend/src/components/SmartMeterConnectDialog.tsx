
import { useState } from "react";
import { API_URL } from "../lib/api";

type ModbusConnectParams = {
  ip: string;
  port: number;
  meterId: string;
};

type CloudConnectParams = {
  protocol: 'cloud';
} & Record<string, unknown>;

type ConnectParams = ModbusConnectParams | CloudConnectParams;

type CloudSyncResponse = {
  error?: string;
} & Record<string, unknown>;

export default function SmartMeterConnectDialog({ onConnect }: { onConnect: (params: ConnectParams) => Promise<unknown> | void }) {
  const [protocol, setProtocol] = useState<'modbus' | 'cloud'>('modbus');
  // Modbus fields
  const [ip, setIp] = useState("");
  const [port, setPort] = useState(502);
  const [meterId, setMeterId] = useState("");
  // Cloud fields
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (protocol === 'modbus') {
      if (!ip) return "IP-Adresse ist erforderlich.";
      if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return "Ungültige IP-Adresse.";
      if (!port || port < 1 || port > 65535) return "Port muss zwischen 1 und 65535 liegen.";
      if (!meterId) return "Meter-ID ist erforderlich.";
    } else if (protocol === 'cloud') {
      if (!deviceId) return "Device-ID ist erforderlich.";
      if (!apiBaseUrl) return "API Base URL ist erforderlich.";
      if (!apiKey) return "API Key ist erforderlich.";
    }
    return null;
  };

  const handleConnect = async () => {
    setError(null);
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setLoading(true);
    try {
      if (protocol === 'modbus') {
        await onConnect({ ip, port, meterId });
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
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
        const data: CloudSyncResponse = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Cloud API Verbindung fehlgeschlagen');
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
        if (onConnect) await onConnect({ protocol: 'cloud', ...data });
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Verbindung fehlgeschlagen.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div className="smartmeter-connect-dialog" style={{ minWidth: 'var(--tab-dialog-min-width)', padding: 16, background: '#fff', borderRadius: 8, boxShadow: '0 2px 16px #0002', textAlign: 'left' }}>
      <h3 style={{ marginTop: 0 }}>Smart Meter verbinden</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          <input type="radio" checked={protocol === 'modbus'} onChange={() => setProtocol('modbus')} disabled={loading} /> Modbus
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" checked={protocol === 'cloud'} onChange={() => setProtocol('cloud')} disabled={loading} /> Cloud API
        </label>
      </div>
      {protocol === 'modbus' && (
        <>
          <label>IP-Adresse:</label>
          <input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.x.x" disabled={loading} style={{ width: '100%', marginBottom: 8 }} />
          <label>Port:</label>
          <input type="number" value={port} onChange={e => setPort(Number(e.target.value))} disabled={loading} style={{ width: '100%', marginBottom: 8 }} />
          <label>Meter-ID:</label>
          <input value={meterId} onChange={e => setMeterId(e.target.value)} placeholder="z.B. 123456" disabled={loading} style={{ width: '100%', marginBottom: 8 }} />
        </>
      )}
      {protocol === 'cloud' && (
        <>
          <label>Device-ID:</label>
          <input value={deviceId} onChange={e => setDeviceId(e.target.value)} placeholder="z.B. SM123456" disabled={loading} style={{ width: '100%', marginBottom: 8 }} />
          <label>API Base URL:</label>
          <input value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} placeholder="https://cloud.smartmeter.com/api" disabled={loading} style={{ width: '100%', marginBottom: 8 }} />
          <label>API Key:</label>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" disabled={loading} style={{ width: '100%', marginBottom: 8 }} />
        </>
      )}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>✅ Verbunden!</div>}
      <button onClick={handleConnect} disabled={loading} style={{ width: '100%', padding: 8, background: '#2196f3', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Verbinde...' : 'Verbinden'}
      </button>
    </div>
  );
}
