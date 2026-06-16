import React from 'react';
import { AlertCircle, Waves, BatteryWarning, Trash2, Droplets, MapPin, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
  Critical: { bg: '#ffe4e6', color: '#e11d48', bar: '#e11d48' },
  Warning: { bg: '#fef3c7', color: '#d97706', bar: '#fbbf24' },
  OK: { bg: '#d1fae5', color: '#059669', bar: '#34d399' },
};

export default function DrainageAnalysis({ data }) {
  if (!data) return null;

  const { bharalu_river, brahmaputra_backwater, city_drainage_health, zones } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Hero Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        
        {/* Backwater Effect Card */}
        <div className="card" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', color: '#fff', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Waves size={20} color="#60a5fa" />
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Brahmaputra Backwater Effect</h3>
          </div>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            High Brahmaputra levels are forcing the Bharalumukh sluice gates {brahmaputra_backwater.bharalumukh_sluice_gates.toLowerCase()}, trapping stormwater inside the city.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 12 }}>
            <div>
              <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Status</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>{brahmaputra_backwater.current_status}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' }}>Pumps Active</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#fbbf24' }}>{brahmaputra_backwater.pump_capacity_utilized_pct}% Load</p>
            </div>
          </div>
        </div>

        {/* Bharalu River Health Card */}
        <div className="card" style={{ padding: '20px 24px', borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <Trash2 size={18} color="#e11d48" />
            <h3 style={{ fontSize: 16, fontWeight: 800 }}>Bharalu River Capacity</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Condition</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#e11d48' }}>{bharalu_river.status}</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Capacity Lost</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#d97706' }}>{bharalu_river.capacity_loss_pct}%</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Flow Velocity</p>
              <p style={{ fontSize: 14, fontWeight: 700 }}>{bharalu_river.flow_velocity_m_s} m/s (Stagnant)</p>
            </div>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Major Blocks</p>
              <p style={{ fontSize: 12, fontWeight: 600 }}>{bharalu_river.major_choke_points.length} locations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone artificial drainage stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'stretch' }}>
        
        {/* Table */}
        <div className="card" style={{ padding: 20, overflow: 'auto' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={15} color="var(--teal-600)" /> Zone-Level Artificial Drainage Infrastructure
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['Zone', 'Drainage Capacity', 'Siltation %', 'Status', 'Primary Bottleneck'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map(z => {
                const config = STATUS_COLORS[z.status];
                return (
                  <tr key={z.zone} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{z.zone}</td>
                    <td style={{ padding: '12px', fontWeight: 600 }}>{z.artificial_drain_capacity}</td>
                    <td style={{ padding: '12px', fontWeight: 800, color: z.siltation_pct > 70 ? '#e11d48' : z.siltation_pct > 40 ? '#d97706' : '#059669' }}>
                      {z.siltation_pct}%
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: config.bg, color: config.color }}>
                        {z.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', fontSize: 12 }}>{z.primary_issue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Siltation Chart */}
        <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
            Siltation Blockage (%)
          </h3>
          <div style={{ flex: 1, minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones} layout="vertical" margin={{ left: 0, right: 10, bottom: 0, top: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--gray-200)" />
                <YAxis dataKey="zone" type="category" width={80} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', fontSize: 12 }} />
                <Bar dataKey="siltation_pct" radius={[0, 4, 4, 0]} barSize={20}>
                  {zones.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status].bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Summary Insights */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, background: '#fff1f2', border: '1px solid #fecdd3' }}>
        <BatteryWarning size={24} color="#e11d48" />
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 800, color: '#9f1239' }}>Overall City Drainage Grade: {city_drainage_health.overall_grade}</h4>
          <p style={{ fontSize: 12, color: '#be123c', marginTop: 3 }}>
            Only {city_drainage_health.rcc_drainage_coverage_pct}% of the city is covered by proper RCC drains. 
            Furthermore, {city_drainage_health.natural_buffers_lost_pct}% of natural wetland buffers have been lost to urbanization.
            Critical reliance is placed on the {city_drainage_health.total_pump_stations} pumping stations, especially at {city_drainage_health.critical_stations.join(', ')}.
          </p>
        </div>
      </div>

    </div>
  );
}
