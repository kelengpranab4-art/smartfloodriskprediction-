import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  const high = v > 0.66;
  const med = v > 0.33;
  const color = high ? '#e11d48' : med ? '#d97706' : '#059669';
  const lbl = high ? 'High' : med ? 'Medium' : 'Low';
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      fontSize: 12, minWidth: 160,
    }}>
      <p style={{ color: '#64748b', marginBottom: 6 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontWeight: 700, color }}>{lbl} Risk</span>
        <span style={{ color: '#94a3b8' }}>({(v * 100).toFixed(0)}%)</span>
      </div>
      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 2, color: '#64748b' }}>
        <span>🌧 Rainfall: {payload[0].payload.rainfall} mm</span>
        <span>🌊 River: {payload[0].payload.river_level} m</span>
      </div>
    </div>
  );
};

export default function RiskChart({ data, title }) {
  if (!data?.length) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
      No data available
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00b2b2" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#00b2b2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} />
          <ReferenceLine y={0.66} stroke="#fca5a5" strokeDasharray="4 3"
            label={{ value: 'High', fill: '#e11d48', fontSize: 10, position: 'right' }} />
          <ReferenceLine y={0.33} stroke="#fcd34d" strokeDasharray="4 3"
            label={{ value: 'Med', fill: '#d97706', fontSize: 10, position: 'right' }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone" dataKey="risk_score"
            stroke="#00b2b2" strokeWidth={2.5}
            fill="url(#tealGrad)" fillOpacity={1}
            dot={{ r: 3, fill: '#00b2b2', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#1c7b8c' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
