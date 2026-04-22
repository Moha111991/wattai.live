import React from "react";
import { FaBolt, FaChargingStation, FaTachometerAlt, FaHome, FaFire, FaBatteryFull } from "react-icons/fa";
import "./DeviceGrid.css";

const deviceTypes = {
  Inverter: { icon: <FaBolt />, color: "active" },
  Wallbox: { icon: <FaChargingStation />, color: "active" },
  "Smart Meter": { icon: <FaTachometerAlt />, color: "active" },
  "Smart Home": { icon: <FaHome />, color: "active" },
  "Heating System": { icon: <FaFire />, color: "active" },
  "Battery Storage": { icon: <FaBatteryFull />, color: "active" },
  Battery: { icon: <FaBatteryFull />, color: "active" },
  Heimspeicher: { icon: <FaBatteryFull />, color: "active" },
  Batteriespeicher: { icon: <FaBatteryFull />, color: "active" },
};

export default function DeviceGrid({ devices = [], onConnect }) {
  return (
    <div className="device-grid">
      {devices.map((d, i) => (
        <div className={`device-card ${d.status}`} key={i}>
          <div className="device-icon">{deviceTypes[d.type]?.icon || (d.type?.toLowerCase().includes('battery') ? <FaBatteryFull /> : null)}</div>
          <div className="device-type">{d.type}</div>
          <div className="device-name">{d.name}</div>
          <div className="device-connection">Verbindung: {d.connection}</div>
          <div className="device-status">Status: <span>{d.status}</span></div>
          <button className="device-action" onClick={() => onConnect && onConnect(d)}>
            Gerät verbinden
          </button>
        </div>
      ))}
    </div>
  );
}
