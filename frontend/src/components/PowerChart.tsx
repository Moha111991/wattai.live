import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import { API_URL } from "../lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PowerChart() {
  const [raster, setRaster] = useState<"minute" | "hour">("minute");
  const [pvData, setPvData] = useState<{ time: string; value: number }[]>([]);
  const [consData, setConsData] = useState<{ time: string; value: number }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const agg = raster === "hour" ? "60" : "1";
  const pvRes = await fetch(`${API_URL}/history/pv?hours=24&raster=${agg}`, {
    headers: {
      'X-API-Key': import.meta.env.VITE_API_KEY || 'Quick10'
    }
  });
  const consRes = await fetch(`${API_URL}/history/consumption?hours=24&raster=${agg}`, {
    headers: {
      'X-API-Key': import.meta.env.VITE_API_KEY || 'Quick10'
    }
  });
        const pvJson = await pvRes.json();
        const consJson = await consRes.json();
        setPvData(pvJson.data);
        setConsData(consJson.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [raster]);

  const labels = Array.isArray(pvData) ? pvData.map(d => new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })) : [];

  const data = {
    labels,
    datasets: [
      {
        label: "PV-Ertrag (kW)",
        data: Array.isArray(pvData) ? pvData.map(d => d.value) : [],
        borderColor: "#4f5bd5",
        backgroundColor: "rgba(79,91,213,0.1)",
        fill: true,
      },
      {
        label: "Verbrauch (kW)",
        data: Array.isArray(consData) ? consData.map(d => d.value) : [],
        borderColor: "#fb6a4f",
        backgroundColor: "rgba(251,106,79,0.1)",
        fill: true,
      }
    ]
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button className="button" onClick={() => setRaster("minute")} disabled={raster === "minute"}>1 Minute</button>
        <button className="button" onClick={() => setRaster("hour")} disabled={raster === "hour"} style={{ marginLeft: 8 }}>1 Stunde</button>
      </div>
      <Line data={data} />
    </div>
  );
}