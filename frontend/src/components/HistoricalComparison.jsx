import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { History, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

const YEAR_COLORS = { '2015': '#93c5fd', '2020': '#6366f1', '2025': '#312e81' };

export default function HistoricalComparison({ data }) {
  const [selectedMetric, setSelectedMetric] = useState('vulnerability');
  if (!data) return null;

  const ct = data.city_trends;

  // Prepare chart data per metric
  const metricConfigs = {
    vulnerability: {
      label: 'Vulnerability Index',
      key: 'vulnerability_index',
      color: '#e11d48',
      domain: [0, 1],
    },
    ndvi: {
      label: 'NDVI (Vegetation)',
      key: 'ndvi',
      color: '#059669',
      domain: [0, 0.6],
    },
    built_up: {
      label: 'Built-up Area (%)',
      key: 'built_up_pct',
      color: '#6366f1',
      domain: [0, 100],
    },
    flood_events: {
      label: 'Flood Events',
      key: 'flood_events',
      color: '#d97706',
      domain: [0, 12],
    },
  };

  const cfg = metricConfigs[selectedMetric];

  // Line chart data (time as X, zones as lines)
  const lineData = ['2015', '2020', '2025'].map(year => {
    const row = { year };
    data.zones.forEach(z => {
      row[z.zone] = z.data[year][cfg.key];
    });
    return row;
  });

  const ZONE_COLORS = ['#e11d48', '#d97706', '#059669', '#6366f1', '#0891b2'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* City Trend Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          {
            icon: <TrendingUp size={16} color="#e11d48" />,
            label: 'Vulnerability Increase',
            value: `+${ct.vulnerability_increase_pct}%`,
            bg: '#fff1f2',
            sub: `${ct.avg_vulnerability_2015.toFixed(2)} → ${ct.avg_vulnerability_2025.toFixed(2)}`,
          },
          {
            icon: <AlertTriangle size={16} color="#d97706" />,
            label: 'Flood Events (2025)',
            value: ct.total_flood_events_2025,
            bg: '#fffbeb',
            sub: `Was ${ct.total_flood_events_2015} in 2015 (+${ct.total_flood_events_2025 - ct.total_flood_events_2015})`,
          },
          {
            icon: <TrendingDown size={16} color="#059669" />,
            label: 'Analysis Period',
            value: '10 Years',
            bg: '#f0fdf4',
            sub: data.analysis_period,
          },
          {
            icon: <History size={16} color="#6366f1" />,
            label: 'Data Sources',
            value: `${data.data_sources.length}`,
            bg: '#eef2ff',
            sub: 'Multi-sensor fusion',
          },
        ].map(card => (
          <div key={card.label} className="card" style={{ padding: '16px 18px', background: card.bg, border: 'none' }}>
            <div style={{ marginBottom: 8 }}>{card.icon}</div>
            <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>{card.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{card.value}</p>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Metric Selector + Line Chart */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={15} color="var(--teal-600)" /> Historical Trend Analysis
          </h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {Object.entries(metricConfigs).map(([key, mc]) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  background: selectedMetric === key ? 'var(--teal-600)' : 'var(--gray-100)',
                  color: selectedMetric === key ? '#fff' : 'var(--text-muted)',
                  border: 'none', transition: 'all 0.2s',
                }}
              >
                {mc.label}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-muted)', fontWeight: 700 }} />
            <YAxis domain={cfg.domain} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
            <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            {data.zones.map((z, i) => (
              <Line
                key={z.zone}
                type="monotone"
                dataKey={z.zone}
                stroke={ZONE_COLORS[i]}
                strokeWidth={2.5}
                dot={{ r: 4, fill: ZONE_COLORS[i] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Zone Trend Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {data.zones.map((z, i) => (
          <div key={z.zone} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: ZONE_COLORS[i] }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{z.zone}</h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>NDVI Trend</span>
                <span style={{ fontWeight: 700, color: z.trends.ndvi_change < 0 ? '#e11d48' : '#059669' }}>
                  {z.trends.ndvi_change > 0 ? '+' : ''}{z.trends.ndvi_change.toFixed(3)} ({z.trends.ndvi_trend})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Urban Expansion</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>+{z.trends.urban_expansion_pct}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Vulnerability ↑</span>
                <span style={{ fontWeight: 700, color: '#e11d48' }}>+{(z.trends.vulnerability_increase * 100).toFixed(0)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Flood Events ↑</span>
                <span style={{ fontWeight: 700, color: '#d97706' }}>+{z.trends.flood_events_increase}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Data Sources */}
      <div className="card" style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)' }}>
        <strong>Data Sources:</strong> {data.data_sources.join(' · ')} · <strong>Period:</strong> {data.analysis_period}
      </div>
    </div>
  );
}
