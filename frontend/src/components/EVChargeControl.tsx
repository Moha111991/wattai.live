import React, { useEffect, useState } from 'react';
import { API_URL, WS_URL } from '../lib/api';

interface EVState {
  ev_soc: number;
  ev_power_kw: number;
  ev_charging: boolean;
}

interface WallboxInfo {
  id?: string;
  type?: string;
  status?: string;
  enabled?: boolean;
  brand?: string;
  model?: string;
}

/**
 * Reusable EV charging control: shows SOC, power, status and allows
 * starting/stopping charging via the Wallbox.
 */
const EVChargeControl: React.FC = () => {
  const [evState, setEvState] = useState<EVState>({
    ev_soc: 0,
    ev_power_kw: 0,
    ev_charging: false,
  });
  const [loading, setLoading] = useState(false);
  const [power, setPower] = useState<number>(11);
  const [error, setError] = useState<string | null>(null);
  const [wallbox, setWallbox] = useState<WallboxInfo | null>(null);
  const [wallboxError, setWallboxError] = useState<string | null>(null);
  const [cloudSoc, setCloudSoc] = useState<number | null>(null);
  const [cloudAvailable, setCloudAvailable] = useState<boolean | null>(null);
  const [cloudProvider, setCloudProvider] = useState<string | null>(null);

  // WebSocket für Live-EV-Daten
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if ('ev_soc' in data && 'ev_power_kw' in data && 'ev_charging' in data) {
        setEvState({
          ev_soc: data.ev_soc,
          ev_power_kw: data.ev_power_kw,
          ev_charging: data.ev_charging,
        });
      }
    };
    return () => ws.close();
  }, []);

  // Verfügbarkeit der Wallbox aus der Geräte-Übersicht prüfen
  useEffect(() => {
    const loadWallbox = async () => {
      try {
        const res = await fetch(`${API_URL}/devices`, {
          headers: {
            'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) return;
        const data = await res.json();
        const devices = data.devices || [];
        const wb = devices.find(
          (d: any) => (d.type || '').toLowerCase().includes('wallbox')
        );
        if (wb) {
          setWallbox(wb);
        }
      } catch (e: any) {
        setWallboxError(e?.message || 'Geräteübersicht konnte nicht geladen werden.');
      }
    };
    loadWallbox();
  }, []);

  // Optionalen SOC aus der Fahrzeug-Cloud / dem BMS abrufen
  useEffect(() => {
    let cancelled = false;

    const loadCloudSoc = async () => {
      try {
        const res = await fetch(`${API_URL}/ev/cloud_status`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.available && typeof data.soc === 'number') {
          setCloudSoc(data.soc);
          setCloudAvailable(true);
          setCloudProvider(data.provider || null);
        } else {
          setCloudAvailable(false);
        }
      } catch {
        if (!cancelled) {
          setCloudAvailable(false);
        }
      }
    };

    loadCloudSoc();
    const id = setInterval(loadCloudSoc, 30000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const hasWallbox = !!wallbox;
  const wallboxConnected =
    hasWallbox &&
    (wallbox!.status === 'connected' || wallbox!.status === 'online' || wallbox!.enabled === true);

  const setCharging = async (charging: boolean) => {
    if (!wallboxConnected) return; // Sicherheitsnetz
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE',
        },
        body: JSON.stringify({ state: charging, power_kw: power }),
      });
      if (!res.ok) throw new Error('Fehler beim Senden der Anfrage');
      const result = await res.json();
      setEvState((prev) => ({
        ...prev,
        ev_soc: result.soc ?? prev.ev_soc,
        ev_power_kw: result.power_kw ?? prev.ev_power_kw,
        ev_charging: charging,
      }));
    } catch (e: any) {
      setError(e.message || 'Unbekannter Fehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>EV-Ladeübersicht</h2>
      <p className="ev-subtitle">
        Übersicht zum aktuellen Ladestand deines E-Autos und Steuerung der Wallbox.
        Die Verbindung bzw. das Entfernen der Wallbox erfolgt im Tab "Übersicht" → "Geräte";
        hier steuerst du nur den aktuellen Ladevorgang (Start/Stop und Ladeleistung).
        SOC und Ladeleistung werden aus den Live-Daten der verbundenen Wallbox bzw. des
        Backends abgelesen; während der Fahrt ist der genaue SOC nur über das
        Batteriemanagementsystem (Fahrzeug/Cloud) zugänglich.
      </p>

      <div className="ev-info-grid">
        <div>
          <span className="ev-label">SOC (Wallbox/Backend):</span>
          <span className="ev-value">{evState.ev_soc}%</span>
        </div>
        <div>
          <span className="ev-label">Ladeleistung:</span>
          <span className="ev-value">{evState.ev_power_kw} kW</span>
        </div>
        <div className={evState.ev_charging ? 'ev-status' : 'ev-status not-charging'}>
          <span className="ev-label">Status:</span>
          <span className="ev-value">
            {evState.ev_charging ? 'Lädt gerade' : 'Nicht am Laden'}
          </span>
        </div>
        {cloudAvailable && cloudSoc !== null && (
          <div>
            <span className="ev-label">SOC (Fahrzeug-Cloud/BMS):</span>
            <span className="ev-value">
              {cloudSoc}%{cloudProvider ? ` (${cloudProvider})` : ''}
            </span>
          </div>
        )}
      </div>

      <div className="ev-power-select">
        <label htmlFor="power" className="ev-label">
          Ladeleistung wählen:
        </label>
        <select
          id="power"
          value={power}
          onChange={(e) => setPower(Number(e.target.value))}
          disabled={!wallboxConnected || evState.ev_charging || loading}
        >
          <option value={3.7}>3.7 kW (Eco)</option>
          <option value={7.4}>7.4 kW (Standard)</option>
          <option value={11}>11 kW (Schnell)</option>
        </select>
      </div>

      <div className="ev-actions">
        <button
          title="Startet den Ladevorgang mit der gewählten Ladeleistung. Ideal bei PV-Überschuss oder wenn du schnell Reichweite brauchst."
          onClick={() => setCharging(true)}
          disabled={!wallboxConnected || evState.ev_charging || loading}
        >
          Start Laden
        </button>
        <button
          title="Beendet den aktuellen Ladevorgang – z.B. um Netzbezug zu sparen oder wenn genug geladen wurde."
          onClick={() => setCharging(false)}
          disabled={!wallboxConnected || !evState.ev_charging || loading}
        >
          Stop Laden
        </button>
      </div>

      {error && (
        <p style={{ color: '#d32f2f', marginTop: '1rem' }}>Fehler: {error}</p>
      )}

      {/* Hinweis zur Wallbox-Verfügbarkeit */}
      {!hasWallbox && (
        <p style={{ marginTop: '0.75rem', fontSize: 13, color: '#666' }}>
          ⚠️ Keine verbundene Wallbox gefunden. Bitte im Tab "Übersicht" → "Geräte" eine
          Wallbox verbinden.
        </p>
      )}
      {hasWallbox && !wallboxConnected && (
        <p style={{ marginTop: '0.75rem', fontSize: 13, color: '#666' }}>
          ⚠️ Wallbox erkannt, aber nicht verbunden (Status: {wallbox?.status ?? 'unbekannt'}).
          Bitte das Gerät in der Übersicht aktivieren.
        </p>
      )}
      {hasWallbox && wallboxConnected && (
        <p style={{ marginTop: '0.75rem', fontSize: 13, color: '#666' }}>
          Verbundene Wallbox: {wallbox?.brand ?? 'Unbekannt'} {wallbox?.model ?? ''}
          {wallbox?.status ? ` (Status: ${wallbox.status})` : ''}
        </p>
      )}

      {wallboxError && (
        <p style={{ marginTop: '0.5rem', fontSize: 12, color: '#d32f2f' }}>
          Geräte-Info: {wallboxError}
        </p>
      )}
    </div>
  );
};

export default EVChargeControl;
