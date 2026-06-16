import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { Building2, TrendingUp, Leaf, AlertTriangle } from 'lucide-react';

const IMPACT_COLOR = { Severe: '#e11d48', Significant: '#d97706', Moderate: '#059669' };

export default function UrbanizationAnalysis({ data }) {
  if (!data) return null;

  // Prepare grouped bar chart data
  const barData = data.zones.map(z => ({
    zone: z.zone,
    '2015': z.timeline['2015'].built_up,
    '2020': z.timeline['2020'].built_up,
    '2025': z.timeline['2025'].built_up,
  }));

  const vegData = data.zones.map(z => ({
    zone: z.zone,
    '2015': z.timeline['2015'].vegetation,
    '2020': z.timeline['2020'].vegetation,
    '2025': z.timeline['2025'].vegetation,
  }));

  // Timeline data for line chart
  const timelineData = ['2015', '2020', '2025'].map(year => {
    const row = { year };
    data.zones.forEach(z => {
      row[`${z.zone}_built`] = z.timeline[year].built_up;
      row[`${z.zone}_veg`] = z.timeline[year].vegetation;
    });
    return row;
  });

  const cs = data.city_summary;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
        {[
          { icon: <Building2 size={16} color="#6366f1" />, label: 'Avg Built-up (2025)', value: `${cs.avg_built_up_2025}%`, bg: '#eef2ff', sub: `+${cs.avg_urbanization_increase}% from 2015` },
          { icon: <Leaf size={16} color="#059669" />, label: 'Avg Vegetation (2025)', value: `${cs.avg_vegetation_2025}%`, bg: '#f0fdf4', sub: `-${cs.avg_vegetation_loss}% from 2015` },
          { icon: <TrendingUp size={16} color="#d97706" />, label: 'Urban Growth Rate', value: `${(cs.avg_urbanization_increase / 10).toFixed(1)}%/yr`, bg: '#fffbeb', sub: 'Over 10 years' },
          { icon: <AlertTriangle size={16} color="#e11d48" />, label: 'Vegetation Loss', value: `${(cs.avg_vegetation_loss / 10).toFixed(1)}%/yr`, bg: '#fff1f2', sub: 'Increases flood risk' },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '16px 18px', background: card.bg, border: 'none' }}>
            <div style={{ marginBottom: 8 }}>{card.icon}</div>
            <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>{card.label}</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>

        {/* Built-up Growth */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={15} color="#6366f1" /> Built-up Area Growth (%)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="2015" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2020" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2025" fill="#312e81" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vegetation Decline */}
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Leaf size={15} color="#059669" /> Vegetation Cover Decline (%)
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={vegData} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis dataKey="zone" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <YAxis domain={[0, 60]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="2015" fill="#86efac" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2020" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="2025" fill="#14532d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Impact Assessment Table */}
      <div className="card" style={{ padding: 20, overflow: 'auto' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
          Urbanization Impact on Flood Vulnerability
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Zone', 'Built-up Increase', 'Vegetation Loss', 'Loss Rate', 'Flood Impact'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.zones.map(z => (
              <tr key={z.zone} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{z.zone}</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#6366f1' }}>+{z.change_2015_2025.built_up_increase}%</td>
                <td style={{ padding: '12px', fontWeight: 700, color: '#e11d48' }}>-{z.change_2015_2025.vegetation_loss}%</td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{z.change_2015_2025.vegetation_loss_rate_per_year}%/yr</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: IMPACT_COLOR[z.flood_impact] + '22',
                    color: IMPACT_COLOR[z.flood_impact],
                  }}>
                    {z.flood_impact}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Metadata */}
      <div className="card" style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)' }}>
        <strong>Source:</strong> {data.data_source} · <strong>Method:</strong> {data.classification_method}
      </div>
    </div>
  );
}
