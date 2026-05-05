import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

export default function SmartMeterEnergyWidget() {
  const [importKwh, setImportKwh] = useState<number | null>(null);
  const [exportKwh, setExportKwh] = useState<number | null>(null);
  const [powerW, setPowerW] = useState<number | null>(null);
  const [voltageV, setVoltageV] = useState<number | null>(null);
  const [currentA, setCurrentA] = useState<number | null>(null);
  const [energyTodayKwh, setEnergyTodayKwh] = useState<number | null>(null);
  const [energyTotalKwh, setEnergyTotalKwh] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/smartmeter/energy`)
      .then(res => res.json())
      .then(data => {
        setImportKwh(typeof data.import_kwh === 'number' ? data.import_kwh : null);
        setExportKwh(typeof data.export_kwh === 'number' ? data.export_kwh : null);
        setPowerW(typeof data.power_w === 'number' ? data.power_w : null);
        setVoltageV(typeof data.voltage_v === 'number' ? data.voltage_v : null);
        setCurrentA(typeof data.current_a === 'number' ? data.current_a : null);
        setEnergyTodayKwh(typeof data.energy_today_kwh === 'number' ? data.energy_today_kwh : null);
        setEnergyTotalKwh(typeof data.energy_total_kwh === 'number' ? data.energy_total_kwh : null);
        setLoading(false);
      })
      .catch(() => {
        setError("Fehler beim Laden der Energiewerte");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>🔄 Lade Smart Meter Daten...</div>;
  if (error) return <div style={{color: 'red'}}>{error}</div>;

  return (
  <div style={{background: '#f5f7fa', border: '1.5px solid #2196f3', borderRadius: 8, padding: 16, margin: 0, width: '100%', maxWidth: '100%', minWidth: 0}}>
      <h4 style={{color: '#2196f3', marginBottom: 12}}>⚡ Smart Meter Energie</h4>
      <div style={{marginBottom: 8}}>
        <b>Bezogene Energie:</b> {importKwh !== null ? importKwh.toLocaleString(undefined, {maximumFractionDigits: 2}) : "-"} kWh
      </div>
      <div>
        <b>Eingespeiste Energie:</b> {exportKwh !== null ? exportKwh.toLocaleString(undefined, {maximumFractionDigits: 2}) : "-"} kWh
      </div>
      <hr style={{margin: '12px 0'}} />
      <div style={{marginBottom: 4}}>
        <b>Aktuelle Leistung:</b> {powerW !== null ? powerW.toLocaleString(undefined, {maximumFractionDigits: 0}) : "-"} W
      </div>
      <div style={{marginBottom: 4}}>
        <b>Spannung:</b> {voltageV !== null ? voltageV.toLocaleString(undefined, {maximumFractionDigits: 1}) : "-"} V
      </div>
      <div style={{marginBottom: 8}}>
        <b>Strom:</b> {currentA !== null ? currentA.toLocaleString(undefined, {maximumFractionDigits: 2}) : "-"} A
      </div>
      <div style={{marginBottom: 4}}>
        <b>Energie heute:</b> {energyTodayKwh !== null ? energyTodayKwh.toLocaleString(undefined, {maximumFractionDigits: 2}) : "-"} kWh
      </div>
      <div>
        <b>Energie gesamt:</b> {energyTotalKwh !== null ? energyTotalKwh.toLocaleString(undefined, {maximumFractionDigits: 2}) : "-"} kWh
      </div>
      <p style={{marginTop: 12, fontSize: 12, color: '#555'}}>
        Voraussetzung f&uuml;r Smart-Home-Features (z. B. Home Assistant):
        Ihr Smart-Home-System ist mit demselben MQTT-Broker verbunden wie dieses Energiemanagementsystem.
      </p>
    </div>
  );
}
