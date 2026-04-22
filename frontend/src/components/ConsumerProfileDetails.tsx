import React from "react";

export default function ConsumerProfileDetails({ profile, soc, cycles }: { profile: any, soc: number, cycles: number }) {
  if (!profile) return null;
  return (
    <div className="consumer-profile-details">
      <h3>{profile.name} Details</h3>
      <ul>
        <li>Kapazität: {profile.capacity} kWh</li>
        <li>Leistung: {profile.power} kW</li>
        <li>SOC: {soc}%</li>
        <li>Zyklusverlauf: {cycles} Zyklen</li>
      </ul>
    </div>
  );
}
