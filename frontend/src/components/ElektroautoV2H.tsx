import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ElektroautoV2H.module.css";
import { API_URL, fetchDevices } from "../lib/api";
import V2HAnimated3D from "./graphics/V2HAnimated3D";

const API_BASE = API_URL;

type WallboxDevice = {
  id?: string;
  device_id?: string;
  name?: string;
  model?: string;
  brand?: string;
  type?: string;
};

type WallboxDetails = {
  status?: string;
  ev_connected?: boolean;
  connector_locked?: boolean;
  power_kw?: number;
  soc?: number;
  v2h_ready?: boolean;
};

type DevicesResponse = {
  devices?: WallboxDevice[];
};

const ElektroautoV2H: React.FC = () => {
  const [v2hStatus, setV2hStatus] = useState<{
    active: boolean;
    power_kw: number;
    house_power_kw?: number;
    error?: string;
    wallbox_present?: boolean;
    wallbox_enabled?: boolean;
    wallbox_online?: boolean;
    preferred_wallbox_id?: string;
    v2h_capable?: boolean;
  }>({ active: false, power_kw: 0 });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [wallboxData, setWallboxData] = useState<WallboxDetails | null>(null);
  const [wallboxes, setWallboxes] = useState<WallboxDevice[]>([]);
  const [selectedWallboxId, setSelectedWallboxId] = useState<string | null>(null);
  const [autoDisabledHint, setAutoDisabledHint] = useState(false);
  const prevActiveRef = useRef<boolean>(false);

  // Fetch V2H status (inkl. optional ausgewählter Wallbox-ID)
  const fetchV2hStatus = useCallback(async () => {
    try {
      // Nur dann eine wallbox_id übergeben, wenn der Nutzer bereits eine explizit gewählt hat.
      const query = selectedWallboxId
        ? `?wallbox_id=${encodeURIComponent(selectedWallboxId)}`
        : "";
      const res = await fetch(`${API_BASE}/v2h/status${query}`);
      const data = await res.json();
      const wasActive = prevActiveRef.current;
      const nowActive = Boolean(data.active);
      setV2hStatus(data);
      setErrorMsg(data.error || null);
      // Auto-Hinweis: Wenn V2H zuvor aktiv war und jetzt aufgrund eines Fehlers
      // serverseitig abgeschaltet wurde, dem Nutzer einen kurzen Hinweis anzeigen.
      if (wasActive && !nowActive && data.error) {
        setAutoDisabledHint(true);
      }
      if (nowActive) {
        setAutoDisabledHint(false);
      }
      prevActiveRef.current = nowActive;
      // Falls noch keine Wallbox gewählt ist, aber das Backend eine bevorzugte empfiehlt,
      // diese automatisch im Dropdown vorauswählen (z.B. Wallbox mit angeschlossenem Fahrzeug).
      if (!selectedWallboxId && data.preferred_wallbox_id) {
        setSelectedWallboxId(data.preferred_wallbox_id);
      }
    } catch {
      setErrorMsg("Fehler beim Laden des V2H-Status.");
    }
  }, [selectedWallboxId]);

  // Fetch wallbox data after V2H activation
  const fetchWallboxData = async () => {
    try {
      const res = await fetch(`${API_BASE}/devices/wallbox_goe/details`);
      const data: WallboxDetails = await res.json();
      setWallboxData(data);
    } catch {
      setWallboxData(null);
    }
  };

  // verfügbare Wallboxen laden
  useEffect(() => {
    fetchDevices()
      .then((data: DevicesResponse) => {
        const all = (data.devices || []).filter(
          (dev) => (dev.type || "").toLowerCase().includes("wallbox")
        );
        setWallboxes(all);
      })
      .catch(() => setWallboxes([]));
  }, []);

  // V2H-Status regelmäßig aktualisieren, immer basierend auf der aktuell selektierten Wallbox
  useEffect(() => {
    fetchV2hStatus();
    const interval = setInterval(fetchV2hStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchV2hStatus]);

  // Enable V2H with confirmation
  const handleEnable = () => {
    setShowConfirm(true);
  };

  const confirmEnable = async () => {
    setLoading(true);
    setErrorMsg(null);
    setShowConfirm(false);
    try {
      const payload = selectedWallboxId
        ? { wallbox_id: selectedWallboxId }
        : undefined;
      // Bei neuer Aktivierung vorherigen Auto-Safety-Hinweis zurücksetzen
      setAutoDisabledHint(false);
      const res = await fetch(`${API_BASE}/v2h/enable`, {
        method: "POST",
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error || "Aktivierung fehlgeschlagen.");
      } else {
        await fetchWallboxData();
      }
      await fetchV2hStatus();
    } catch {
      setErrorMsg("Fehler bei Aktivierung.");
    }
    setLoading(false);
  };

  // Disable V2H
  const handleDisable = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await fetch(`${API_BASE}/v2h/disable`, { method: "POST" });
      await fetchV2hStatus();
    } catch {
      setErrorMsg("Fehler beim Deaktivieren.");
    }
    setLoading(false);
  };

  // Dynamic button style
  const enableBtnClass = `${styles.button} ${v2hStatus.active ? styles.active : styles.inactive}`;
  const disableBtnClass = `${styles.button} ${!v2hStatus.active ? styles.inactive : styles.active}`;

  return (
    <div className={styles.card}>
      <h2 className="tab-page-title">Vehicle-to-Home (V2H)</h2>
      <p className={`tab-page-subtitle ${styles.hint}`}>
        Mit V2H kann dein Elektroauto als zusätzlicher Hausspeicher dienen. Am
        sinnvollsten ist der Einsatz, wenn das Fahrzeug häufig steht, du wenig
        fährst oder der Akku ohnehin hoch geladen ist – so kannst du abends und
        nachts mehr eigenen Solarstrom nutzen.
      </p>
      <div className={styles.heroImageContainer}>
        <V2HAnimated3D />
      </div>
      <div>
        <strong>Status:</strong> {v2hStatus.active ? "Aktiv" : "Inaktiv"}
      </div>
      <div>
        <strong>Leistung:</strong> {v2hStatus.power_kw} kW
      </div>
      <div>
        <strong>Hausverbrauch:</strong>{" "}
        {typeof v2hStatus.house_power_kw === "number"
          ? `${v2hStatus.house_power_kw.toFixed(2)} kW`
          : "-"}
      </div>
      <div className={styles.wallboxInfo}>
        <div>
          <strong>Wallbox online erreichbar:</strong>{" "}
          {v2hStatus.wallbox_online === true
            ? "Ja"
            : v2hStatus.wallbox_online === false
            ? "Nein"
            : "Unbekannt"}
        </div>
        <div>
          <strong>V2H-fähig:</strong>{" "}
          {v2hStatus.wallbox_online === false
            ? "Unbekannt (Wallbox offline)"
            : v2hStatus.v2h_capable === false
            ? "Nein"
            : v2hStatus.v2h_capable === true
            ? "Ja"
            : "Unbekannt"}
        </div>
      </div>
      <p className={styles.hint}>
        V2H wird nur freigegeben, wenn eine aktivierte Wallbox vorhanden ist,
        diese online erreichbar ist, ein Fahrzeug erkannt wird und die
        Kombination als V2H-bereit gilt. Die Kommunikation folgt dabei den
        Standards OCPP (Wallbox ↔ Backend) und ISO 15118 (Fahrzeug ↔ Wallbox).
      </p>
      <p className={styles.hint}>
        Über diese Standards werden u. a. Fernsteuerung der Wallbox (Start/Stop von
        Ladevorgängen), Überwachung in Echtzeit (Status, Energieverbrauch, Fehler),
        Smart Charging mit Lastmanagement und zeit- oder preisabhängigem Laden,
        Firmware-Updates over-the-air, Sicherheitsfunktionen (verschlüsselte
        Kommunikation, Zertifikate) sowie perspektivisch bidirektionales Laden
        (V2H/V2G) unterstützt.
      </p>
      {wallboxes.length > 0 ? (
        <div className={styles.wallboxSelect}>
          <strong>Aktive Wallbox für V2H:</strong>
          <select
            value={selectedWallboxId || ""}
            onChange={(e) =>
              setSelectedWallboxId(e.target.value || null)
            }
          >
            {wallboxes.map((wb) => {
              const id = wb.id || wb.device_id || wb.name || wb.model;
              const label =
                wb.name ||
                wb.model ||
                `${wb.brand || "Wallbox"} ${wb.type || ""}`;
              return (
                <option key={id} value={id}>
                  {label}
                </option>
              );
            })}
          </select>
          <p className={styles.hint}>
            Hier wählst du die Wallbox, über die Energie aus dem EV-Akku
            zusätzlich über den Wechselrichter ins Haus eingespeist werden kann.
          </p>
        </div>
      ) : (
        <p className={styles.hint}>
          Keine verbundene Wallbox gefunden. Bitte zuerst im Tab „Geräte“ eine
          echte Wallbox verbinden.
        </p>
      )}
      {wallboxData && (
        <div className={styles.wallboxInfo}>
          <div>
            <strong>Wallbox-Status:</strong> {wallboxData.status || "unbekannt"}
          </div>
          <div>
            <strong>Fahrzeug erkannt:</strong> {wallboxData.ev_connected ? "Ja" : "Nein"}
          </div>
          <div>
            <strong>Stecker verriegelt:</strong> {wallboxData.connector_locked ? "Ja" : "Nein"}
          </div>
          <div>
            <strong>Leistung an Wallbox:</strong> {typeof wallboxData.power_kw === "number" ? `${wallboxData.power_kw.toFixed(2)} kW` : "-"}
          </div>
          {typeof wallboxData.soc === "number" && (
            <div>
              <strong>EV-SOC (falls verfügbar):</strong> {wallboxData.soc}%
            </div>
          )}
          <div>
            <strong>V2H-bereit:</strong> {wallboxData.v2h_ready ? "Ja" : "Nein"}
          </div>
        </div>
      )}
      {autoDisabledHint && (
        <p className={styles.hint}>
          V2H wurde aus Sicherheitsgründen automatisch deaktiviert, weil eine der
          Voraussetzungen (z.&nbsp;B. Wallbox offline oder kein Fahrzeug mehr erkannt)
          nicht mehr erfüllt war.
        </p>
      )}
      {errorMsg && (
        <p className={styles.error}>
          <strong>Warnung:</strong> {errorMsg}
        </p>
      )}
      <div className={styles.buttonRow}>
        <button
          className={enableBtnClass}
          onClick={handleEnable}
          disabled={loading || !!errorMsg || v2hStatus.active}
        >
          V2H aktivieren
        </button>
        <button
          className={disableBtnClass}
          onClick={handleDisable}
          disabled={loading || !v2hStatus.active}
        >
          V2H deaktivieren
        </button>
      </div>
      {showConfirm && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3 className="tab-section-title">V2H aktivieren bestätigen</h3>
            <p className="tab-section-subtitle">Möchten Sie Vehicle-to-Home wirklich aktivieren? Die Wallbox wird verbunden und die Automatisierung gestartet.</p>
            <button className={styles.button} onClick={confirmEnable} disabled={loading}>Bestätigen</button>
            <button className={styles.button} onClick={() => setShowConfirm(false)} disabled={loading}>Abbrechen</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElektroautoV2H;
