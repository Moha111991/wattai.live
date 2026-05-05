import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_URL } from '../lib/api';

interface ChartProps {
  title: string;
  endpoint: string;
  dataKey: string;
  color: string;
  hours?: number;
}

interface HistoryApiPoint {
  time: string;
  value: number;
}

interface HistoryApiResponse {
  data?: HistoryApiPoint[];
}

interface ChartDataPoint {
  time: string;
  value: number;
}

export default function HistoryChart({ title, endpoint, dataKey, color, hours = 24 }: ChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
  const res = await fetch(`${API_URL}${endpoint}?hours=${hours}`, {
    headers: {
      'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
    }
  });
        const json: HistoryApiResponse = await res.json();
        
        if (Array.isArray(json.data)) {
          setData(json.data.map((d) => ({
            time: new Date(d.time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
            value: d.value
          })));
        }
        setLoading(false);
      } catch (err) {
        console.error('Chart fetch error:', err);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Alle 60s aktualisieren
    return () => clearInterval(interval);
  }, [endpoint, hours]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/82 shadow-[0_14px_36px_rgba(2,6,23,0.34)] p-6" style={{ color: '#e2e8f0' }}>
        <h3 className="text-xl md:text-2xl font-bold text-cyan-50 mb-4 leading-tight break-words" style={{ color: '#e0f2fe', fontSize: '1.35rem', lineHeight: 1.3 }}>{title}</h3>
        <div className="h-64 flex items-center justify-center text-cyan-100/70">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cyan-200/20 bg-slate-900/82 shadow-[0_14px_36px_rgba(2,6,23,0.34)] p-6" style={{ color: '#e2e8f0' }}>
      <h3 className="text-xl md:text-2xl font-bold text-cyan-50 mb-4 leading-tight break-words" style={{ color: '#e0f2fe', fontSize: '1.35rem', lineHeight: 1.3 }}>{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
          <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#cbd5e1' }} />
          <YAxis tick={{ fontSize: 12, fill: '#cbd5e1' }} />
          <Tooltip />
          <Legend wrapperStyle={{ color: '#e2e8f0' }} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} name={dataKey} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}