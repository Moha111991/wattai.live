import { useEffect, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { API_URL } from "../lib/api";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler
} from "chart.js";
import type { ChartOptions, TooltipItem } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

/* ─── Canvas gradient helper ────────────────────────────────────────────── */
function makeGradient(ctx: CanvasRenderingContext2D, h: number, r: number, g: number, b: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0,   `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(0.55,`rgba(${r},${g},${b},0.12)`);
  grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
  return grad;
}

export default function PowerChart() {
  const [raster, setRaster] = useState<"minute" | "hour">("minute");
  const [pvData,   setPvData]   = useState<{ time: string; value: number }[]>([]);
  const [consData, setConsData] = useState<{ time: string; value: number }[]>([]);
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const agg = raster === "hour" ? "60" : "1";
        const [pvRes, consRes] = await Promise.all([
          fetch(`${API_URL}/history/pv?hours=24&raster=${agg}`,          { headers:{ 'X-API-Key': import.meta.env.VITE_API_KEY||'Quick10' } }),
          fetch(`${API_URL}/history/consumption?hours=24&raster=${agg}`, { headers:{ 'X-API-Key': import.meta.env.VITE_API_KEY||'Quick10' } }),
        ]);
        const pvJson   = await pvRes.json();
        const consJson = await consRes.json();
        if (Array.isArray(pvJson.data))   setPvData(pvJson.data);
        if (Array.isArray(consJson.data)) setConsData(consJson.data);
      } catch {}
    };
    fetch_();
  }, [raster]);

  const labels = pvData.map(d =>
    new Date(d.time).toLocaleTimeString('de-DE', { hour:'2-digit', minute:'2-digit' })
  );

  /* Build canvas gradients lazily in the datasets */
  const pvGradFn   = (ctx: { chart: { ctx: CanvasRenderingContext2D; height: number } }) => makeGradient(ctx.chart.ctx, ctx.chart.height, 255, 149,   0);
  const consGradFn = (ctx: { chart: { ctx: CanvasRenderingContext2D; height: number } }) => makeGradient(ctx.chart.ctx, ctx.chart.height,  59, 130, 246);

  const chartData = {
    labels,
    datasets: [
      {
        label: "PV-Ertrag (kW)",
        data:  pvData.map(d => d.value),
        borderColor: "#ff9500",
        backgroundColor: pvGradFn as never,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#ff9500",
        pointHoverBorderColor: "rgba(22,30,65,0.88)",
        pointHoverBorderWidth: 2,
      },
      {
        label: "Verbrauch (kW)",
        data:  consData.map(d => d.value),
        borderColor: "#3b82f6",
        backgroundColor: consGradFn as never,
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#3b82f6",
        pointHoverBorderColor: "rgba(22,30,65,0.88)",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        labels: {
          color: 'rgba(248,250,252,0.85)',
          font: { size: 12, weight: 'bold' },
          boxWidth: 20, boxHeight: 3,
          padding: 20,
          usePointStyle: false,
          generateLabels: (chart) =>
            chart.data.datasets.map((ds, i) => ({
              text: typeof ds.label === 'string' ? ds.label : '',
              fillStyle: 'transparent',
              strokeStyle: typeof ds.borderColor === 'string' ? ds.borderColor : '#fff',
              lineWidth: 2.5,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
              index: i,
            })),
        },
      },
      tooltip: {
        backgroundColor: 'rgba(18,24,55,0.92)',
        borderColor: 'rgba(255,107,53,0.3)',
        borderWidth: 1,
        titleColor: 'rgba(248,250,252,0.5)',
        bodyColor: '#f8fafc',
        titleFont: { size: 10, weight: 'bold' as const },
        bodyFont: { size: 14, weight: 'bold' as const },
        padding: 14,
        cornerRadius: 12,
        boxPadding: 6,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => ` ${(ctx.raw as number).toFixed(2)} kW`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(248,250,252,0.6)',
          font: { size: 11, weight: '600' as const },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
        border: { color: 'rgba(255,255,255,0.06)' },
      },
      y: {
        ticks: {
          color: 'rgba(248,250,252,0.6)',
          font: { size: 11, weight: '600' as const },
          callback: (v) => `${Number(v).toFixed(1)} kW`,
        },
        grid: { color: 'rgba(255,255,255,0.04)', drawTicks: false },
        border: { color: 'transparent' },
      },
    },
  };

  const btnBase: React.CSSProperties = {
    border: 'none', borderRadius: 999, padding: '9px 22px',
    fontWeight: 800, fontSize: 12, cursor: 'pointer',
    letterSpacing: '0.06em', transition: 'all .4s cubic-bezier(.16,1,.3,1)',
  };

  return (
    <div style={{
      position: 'relative',
      background: 'rgba(22,30,65,0.78)',
      backdropFilter: 'blur(18px)',
      border: '1px solid rgba(255,107,53,0.18)',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 24px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,107,53,0.06), 0 8px 32px rgba(255,149,0,0.1)',
      transform: 'perspective(1200px) rotateX(1.2deg)',
      transformOrigin: 'center bottom',
    }}>
      {/* Top stripe */}
      <div style={{ height: 3, background: 'linear-gradient(90deg,#ff9500,#ff6b35,#3b82f6)', boxShadow: '0 0 14px rgba(255,149,0,0.6)' }}/>

      {/* Background glow orbs */}
      <div style={{ position:'absolute', top:'-20%', left:'-5%', width:'45%', height:'120%', borderRadius:'50%', background:'radial-gradient(circle,rgba(255,149,0,0.05),transparent 70%)', pointerEvents:'none' }}/>
      <div style={{ position:'absolute', top:'-20%', right:'-5%', width:'40%', height:'120%', borderRadius:'50%', background:'radial-gradient(circle,rgba(59,130,246,0.05),transparent 70%)', pointerEvents:'none' }}/>

      <style>{`
        @keyframes pc-scan{0%{top:0}100%{top:100%}}
        @keyframes pc-breathe{0%,100%{opacity:.4}50%{opacity:1}}
        .pc-btn-active{background:linear-gradient(90deg,#ff6b35,#ff9500)!important;color:#0a0305!important;box-shadow:0 0 24px rgba(255,107,53,0.4)!important}
        .pc-btn-idle{background:rgba(255,107,53,0.08)!important;color:rgba(248,250,252,0.7)!important;border:1px solid rgba(255,107,53,0.2)!important}
        .pc-btn-idle:hover{background:rgba(255,107,53,0.15)!important;color:#f8fafc!important}
      `}</style>
      <div style={{ position:'absolute', left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,149,0,0.12),transparent)', animation:'pc-scan 18s linear infinite', pointerEvents:'none', zIndex:0 }}/>

      <div style={{ padding:'20px 24px', position:'relative', zIndex:1 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-0.01em', color:'#f8fafc', marginBottom:3, textShadow:'0 0 24px rgba(255,149,0,0.4)' }}>
              Energieverlauf · 24h
            </div>
            <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.18em', textTransform:'uppercase', color:'rgba(255,149,0,0.8)' }}>
              PV-Ertrag & Verbrauch
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              className={raster==='minute' ? 'pc-btn-active' : 'pc-btn-idle'}
              onClick={() => setRaster("minute")}
              disabled={raster==="minute"}
              style={{ ...btnBase }}>
              1 Min
            </button>
            <button
              className={raster==='hour' ? 'pc-btn-active' : 'pc-btn-idle'}
              onClick={() => setRaster("hour")}
              disabled={raster==="hour"}
              style={{ ...btnBase }}>
              1 Std
            </button>
          </div>
        </div>

        {/* Chart area with subtle 3D inner shadow */}
        <div style={{
          width:'100%', height:'clamp(220px,40vw,320px)',
          background:'rgba(2,4,14,0.55)', borderRadius:14,
          border:'1px solid rgba(255,255,255,0.04)',
          boxShadow:'inset 0 2px 24px rgba(0,0,0,0.4)',
          padding:'12px 4px 4px',
        }}>
          <Line ref={chartRef} data={chartData} options={options}/>
        </div>

        {/* Legend / metrics strip */}
        <div style={{ display:'flex', gap:20, marginTop:14, flexWrap:'wrap' }}>
          {[
            { label:'PV-Ertrag', color:'#ff9500', unit:'kW', val: pvData.length ? pvData[pvData.length-1]?.value?.toFixed(1) : '—' },
            { label:'Verbrauch', color:'#3b82f6', unit:'kW', val: consData.length ? consData[consData.length-1]?.value?.toFixed(1) : '—' },
          ].map(({ label, color, unit, val }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:10, padding:'8px 14px' }}>
              <div style={{ width:24, height:3, borderRadius:999, background:color, boxShadow:`0 0 6px ${color}` }}/>
              <div>
                <div style={{ fontSize:9, color:'rgba(248,250,252,0.4)', letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700 }}>{label}</div>
                <div style={{ fontSize:15, fontWeight:900, color, fontFamily:'monospace' }}>{val} <span style={{ fontSize:10, fontWeight:600, opacity:.6 }}>{unit}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
