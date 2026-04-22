import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  title: string;
  endpoint: string;
  dataKey: string;
  color: string;
  hours?: number;
}

export default function HistoryChart({ title, endpoint, dataKey, color, hours = 24 }: ChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const res = await fetch(`${API_URL}${endpoint}?hours=${hours}`, {
    headers: {
      'X-API-Key': import.meta.env.VITE_API_KEY || 'YOUR_API_KEY_HERE'
    }
  });
        const json = await res.json();
        
        if (json.data) {
          setData(json.data.map((d: any) => ({
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
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">Lade Daten...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} name={dataKey} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}