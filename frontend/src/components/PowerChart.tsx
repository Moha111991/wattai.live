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
import type { ChartOptions } from "chart.js";

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

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5e1',
          boxWidth: 14,
          boxHeight: 14,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#cbd5e1',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 7,
        },
        grid: {
          color: 'rgba(148,163,184,0.2)',
        },
      },
      y: {
        ticks: {
          color: '#cbd5e1',
        },
        grid: {
          color: 'rgba(148,163,184,0.2)',
        },
      },
    },
  };

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.82)', border: '1px solid rgba(103,232,249,0.2)', borderRadius: 16, padding: 16, boxShadow: '0 14px 36px rgba(2,6,23,0.34)', width: '100%', maxWidth: '100%', minWidth: 0 }}>
      <h3 style={{ color: '#e0f2fe', fontSize: 22, fontWeight: 800, marginBottom: 12, overflowWrap: 'anywhere' }}>Energieverlauf (24h)</h3>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="button" onClick={() => setRaster("minute")} disabled={raster === "minute"} style={{ background: raster === 'minute' ? 'linear-gradient(90deg, #0ea5e9, #14b8a6)' : 'rgba(15,23,42,0.6)', border: '1px solid rgba(125,211,252,0.35)', color: '#f8fafc' }}>1 Minute</button>
        <button className="button" onClick={() => setRaster("hour")} disabled={raster === "hour"} style={{ background: raster === 'hour' ? 'linear-gradient(90deg, #0ea5e9, #14b8a6)' : 'rgba(15,23,42,0.6)', border: '1px solid rgba(125,211,252,0.35)', color: '#f8fafc' }}>1 Stunde</button>
      </div>
      <div style={{ width: '100%', minWidth: 0, height: 'clamp(220px, 42vw, 340px)' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}