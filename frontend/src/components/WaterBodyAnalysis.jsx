import React, { useState } from 'react';
import { Droplets, MapPin, AlertCircle, Waves, Navigation } from 'lucide-react';

const TYPE_ICON = {
  'Major River': { emoji: '🌊', color: '#1d4ed8', bg: '#dbeafe' },
  'Wetland (Ramsar Site)': { emoji: '🏞️', color: '#059669', bg: '#d1fae5' },
  'Wetland': { emoji: '💧', color: '#0891b2', bg: '#cffafe' },
  'Drainage Channel': { emoji: '🔧', color: '#7c3aed', bg: '#f5f3ff' },
};

const DRAIN_COLOR = { Good: '#059669', Moderate: '#d97706', Poor: '#e11d48' };

export default function WaterBodyAnalysis({ data }) {
  const [selectedWB, setSelectedWB] = useState(null);
  if (!data) return null;

  const stats = data.brahmaputra_stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Brahmaputra Quick Stats */}
      <div className="card" style={{ padding: '18px 22px', background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', color: '#fff', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <Waves size={20} color="#60a5fa" />
          <h3 style={{ fontSize: 16, fontWeight: 800 }}>Brahmaputra River — Key Levels</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
          {[
            { label: 'Warning Level', value: `${stats.warning_level_m} m`, color: '#fbbf24' },
            { label: 'Danger Level', value: `${stats.danger_level_m} m`, color: '#f87171' },
            { label: 'Highest Recorded', value: `${stats.highest_recorded_m} m`, color: '#ef4444' },
            { label: 'Record Year', value: stats.highest_recorded_year, color: '#94a3b8' },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Water Bodies Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {data.water_bodies.map(wb => {
          const cfg = TYPE_ICON[wb.type] || TYPE_ICON['Wetland'];
          const isActive = selectedWB === wb.name;
          return (
            <div
              key={wb.name}
              className="card"
              onClick={() => setSelectedWB(isActive ? null : wb.name)}
              style={{
                padding: 20, cursor: 'pointer',
                borderColor: isActive ? cfg.color : undefined,
                borderWidth: isActive ? 2 : undefined,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {cfg.emoji}
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{wb.name}</h4>
                  <p style={{ fontSize: 11, color: cfg.color, fontWeight: 600 }}>{wb.type}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                {wb.area_km2 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Area</span>
                    <span style={{ fontWeight: 700 }}>{wb.area_km2} km²</span>
                  </div>
                )}
                {wb.length_km && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Length</span>
                    <span style={{ fontWeight: 700 }}>{wb.length_km} km</span>
                  </div>
                )}
                {wb.max_depth_m && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Max Depth</span>
                    <span style={{ fontWeight: 700 }}>{wb.max_depth_m} m</span>
                  </div>
                )}
                {wb.total_length_km && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total Length</span>
                    <span style={{ fontWeight: 700 }}>{wb.total_length_km} km</span>
                  </div>
                )}
                {wb.flood_influence_radius_km && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Flood Influence</span>
                    <span style={{ fontWeight: 700, color: '#d97706' }}>{wb.flood_influence_radius_km} km radius</span>
                  </div>
                )}
                {wb.condition && (
                  <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 6, background: '#fef3c7', fontSize: 11, color: '#92400e' }}>
                    ⚠️ {wb.condition}
                  </div>
                )}
                {wb.significance && (
                  <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: 6, background: '#d1fae5', fontSize: 11, color: '#065f46' }}>
                    ✦ {wb.significance}
                  </div>
                )}
              </div>

              {(wb.affected_zones || wb.coverage_zones) && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Affected Zones</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {(wb.affected_zones || wb.coverage_zones).map(z => (
                      <span key={z} style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--gray-100)', fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>
                        {z}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zone Proximity Table */}
      <div className="card" style={{ padding: 20, overflow: 'auto' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Navigation size={15} color="var(--teal-600)" /> Zone Proximity Analysis
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Zone', 'Brahmaputra Distance', 'Nearest Wetland', 'Wetland Distance', 'Drainage Quality'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.zone_proximity).map(([zone, prox]) => (
              <tr key={zone} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text)' }}>{zone}</td>
                <td style={{ padding: '12px', fontWeight: 700, color: prox.brahmaputra_km <= 1.5 ? '#e11d48' : prox.brahmaputra_km <= 3 ? '#d97706' : '#059669' }}>
                  {prox.brahmaputra_km} km
                </td>
                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{prox.nearest_wetland}</td>
                <td style={{ padding: '12px', fontWeight: 600 }}>{prox.wetland_km} km</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: DRAIN_COLOR[prox.drainage_quality] + '22',
                    color: DRAIN_COLOR[prox.drainage_quality],
                  }}>
                    {prox.drainage_quality}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="card" style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)' }}>
        <strong>Total Wetland Area:</strong> {data.total_wetland_area_km2} km² ·
        <strong> Key Bodies:</strong> Brahmaputra, Deepor Beel (Ramsar), Borsola Beel, Silsako Beel
      </div>
    </div>
  );
}
