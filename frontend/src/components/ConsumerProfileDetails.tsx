import type { ConsumerProfile } from "./ConsumerProfileSelector";

interface ConsumerProfileDetailsProps {
  profile: Partial<ConsumerProfile> | null;
  soc: number;
  cycles: number;
}

export default function ConsumerProfileDetails({ profile, soc, cycles }: ConsumerProfileDetailsProps) {
  if (!profile) return null;
  return (
    <div className="consumer-profile-details">
      <h3>{profile.name ?? "Verbraucher"} Details</h3>
      <ul>
        <li>Kapazität: {profile.capacity ?? "-"} kWh</li>
        <li>Leistung: {profile.power ?? "-"} kW</li>
        <li>SOC: {soc}%</li>
        <li>Zyklusverlauf: {cycles} Zyklen</li>
      </ul>
    </div>
  );
}
