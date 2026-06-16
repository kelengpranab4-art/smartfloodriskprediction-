import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Leaf, AlertTriangle } from 'lucide-react';

const NDVI_COLOR = (ndvi) => {
  if (ndvi >= 0.45) return '#059669';
  if (ndvi >= 0.35) return '#10b981';
  if (ndvi >= 0.25) return '#d97706';
  if (ndvi >= 0.18) return '#ea580c';
  return '#e11d48';
};

const SUSC_BADGE = {
  'Very Low':  { bg: '#d1fae5', color: '#065f46' },
  'Low':       { bg: '#d1fae5', color: '#059669' },
  'Medium':    { bg: '#fef3c7', color: '#92400e' },
  'High':      { bg: '#ffe4e6', color: '#be123c' },
  'Very High': { bg: '#fecdd3', color: '#9f1239' },
};

export default function NDVIAnalysis({ data }) {
  if (!data) return null;

  const chartData = data.zones.map(z => ({
    name: z.zone,
    ndvi: z.ndvi,
    color: NDVI_COLOR(z.ndvi),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* NDVI Scale Legend */}
      <div className="card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Leaf size={16} color="#059669" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>NDVI Interpretation Scale</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { range: '0.45+', label: 'Dense Vegetation', color: '#059669' },
            { range: '0.35–0.44', label: 'High Vegetation', color: '#10b981' },
            { range: '0.25–0.34', label: 'Medium Vegetation', color: '#d97706' },
            { range: '0.18–0.24', label: 'Low Vegetation', color: '#ea580c' },
            { range: '<0.18', label: 'Very Low / Bare', color: '#e11d48' },
          ].map(s => (
            <div key={s.range} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 6, background: 'var(--gray-100)', fontSize: 11
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 600, color: s.color }}>{s.range}</span>
              <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NDVI Bar Chart */}
      <div className="card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          Zone-wise NDVI Values
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <YAxis domain={[0, 0.6]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip
              contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }}
              formatter={(v) => [v.toFixed(3), 'NDVI']}
            />
            <Bar dataKey="ndvi" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Zone-wise NDVI Table */}
      <div className="card" style={{ padding: 20, overflow: 'auto' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          Detailed NDVI Analysis by Zone
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Zone', 'NDVI', 'Vegetation Status', 'Flood Susceptibility', 'Vegetation %', 'Built-up %'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.zones.map(z => {
              const badge = SUSC_BADGE[z.flood_susceptibility] || SUSC_BADGE['Medium'];
              return (
                <tr key={z.zone} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{z.zone}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: NDVI_COLOR(z.ndvi) }}>
                      {z.ndvi.toFixed(3)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: NDVI_COLOR(z.ndvi) }} />
                      {z.vegetation_status}
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: badge.bg, color: badge.color,
                    }}>
                      {z.flood_susceptibility}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#059669', fontWeight: 600 }}>{z.land_cover.vegetation_pct}%</td>
                  <td style={{ padding: '12px', color: '#64748b', fontWeight: 600 }}>{z.land_cover.built_up_pct}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Metadata */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-muted)' }}>
        <span><strong>Satellite:</strong> {data.metadata.satellite}</span>
        <span><strong>Resolution:</strong> {data.metadata.resolution}</span>
        <span><strong>Formula:</strong> {data.metadata.formula}</span>
        <span><strong>Bands:</strong> {data.metadata.bands_used}</span>
      </div>
    </div>
  );
}
