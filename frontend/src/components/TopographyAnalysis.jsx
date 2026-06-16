import React from 'react';
import { Mountain, AlertTriangle, Droplets, ArrowDown, MapPin, Layers, TriangleAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';

const RISK_COLORS = {
  Critical: { bg: '#ffe4e6', color: '#e11d48', dot: '#e11d48' },
  'Very High': { bg: '#ffe4e6', color: '#e11d48', dot: '#e11d48' },
  High: { bg: '#fef3c7', color: '#d97706', dot: '#f59e0b' },
  Moderate: { bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  Low: { bg: '#d1fae5', color: '#059669', dot: '#34d399' },
};

const SEVERITY_COLORS = {
  Critical: { bg: '#ffe4e6', border: '#fecdd3', color: '#9f1239', icon: '#e11d48' },
  Warning: { bg: '#fef3c7', border: '#fde68a', color: '#92400e', icon: '#d97706' },
  Moderate: { bg: '#d1fae5', border: '#a7f3d0', color: '#065f46', icon: '#059669' },
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: '#0f172a', color: '#e2e8f0', padding: '12px 16px', borderRadius: 10,
      fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', maxWidth: 220,
    }}>
      <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 4, color: '#60a5fa' }}>{d.label}</p>
      <p>Elevation: <strong style={{ color: '#fbbf24' }}>{d.elevation_m}m</strong></p>
      <p>Distance: <strong>{d.distance_km} km</strong> from foothills</p>
    </div>
  );
};

export default function TopographyAnalysis({ data }) {
  if (!data) return null;

  const { zones, elevation_profile, hill_cutting_hotspots, basin_effect } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Basin Effect Hero Card ────────────────────────────────── */}
      <div className="card" style={{
        padding: '24px 28px', borderRadius: 14,
        background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Layers size={22} color="#60a5fa" />
          <h3 style={{ fontSize: 17, fontWeight: 800 }}>The Basin Effect — Bowl-Shaped Terrain</h3>
        </div>
        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 18 }}>
          {basin_effect.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          {[
            { label: 'City Avg. Elevation', value: `${basin_effect.city_avg_elevation_m}m`, color: '#60a5fa' },
            { label: 'Danger Level (Brahmaputra)', value: `${basin_effect.brahmaputra_danger_level_m}m`, color: '#f87171' },
            { label: 'Highest Recorded', value: `${basin_effect.brahmaputra_highest_recorded_m}m`, color: '#fbbf24' },
            { label: 'Catchment Area', value: `${basin_effect.catchment_area_km2} km²`, color: '#34d399' },
            { label: 'Surrounding Hills', value: basin_effect.total_hills_surrounding, color: '#a78bfa' },
            { label: 'Runoff Concentration', value: `${basin_effect.runoff_concentration_time_hrs} hrs`, color: '#fb923c' },
          ].map(item => (
            <div key={item.label}>
              <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: item.color, lineHeight: 1.2, marginTop: 3 }}>{item.value}</p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 18, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(248, 113, 113, 0.15)', border: '1px solid rgba(248, 113, 113, 0.3)',
        }}>
          <p style={{ fontSize: 12, color: '#fca5a5', lineHeight: 1.6 }}>
            <strong style={{ color: '#f87171' }}>⚠ Water Trapping Mechanism:</strong> {basin_effect.water_trapping_mechanism}
          </p>
        </div>
      </div>


      {/* ── Elevation Cross-Section Chart ─────────────────────────── */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Mountain size={18} color="var(--teal-600)" />
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
              Elevation Cross-Section: Meghalaya Foothills → Brahmaputra
            </h3>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              SRTM DEM 30m profile showing ~167m elevation drop over 25 km
            </p>
          </div>
        </div>

        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={elevation_profile} margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
              <defs>
                <linearGradient id="elevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#059669" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-200)" />
              <XAxis
                dataKey="distance_km"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                label={{ value: 'Distance from Meghalaya Foothills (km)', position: 'bottom', offset: 15, fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <YAxis
                domain={[0, 230]}
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                label={{ value: 'Elevation (m)', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11, fill: 'var(--text-muted)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={49.68} stroke="#e11d48" strokeDasharray="5 5" strokeWidth={2}>
                <Label value="Danger Level 49.68m" position="right" fill="#e11d48" fontSize={10} />
              </ReferenceLine>
              <ReferenceLine y={51} stroke="#60a5fa" strokeDasharray="3 3">
                <Label value="City Avg 51m" position="left" fill="#60a5fa" fontSize={10} />
              </ReferenceLine>
              <Area
                type="monotone" dataKey="elevation_m" fill="url(#elevGrad)"
                stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>


      {/* ── Runoff Risk Table ─────────────────────────────────────── */}
      <div className="card" style={{ padding: 20, overflow: 'auto', borderRadius: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Droplets size={15} color="var(--teal-600)" /> Zone-Level Topographic & Runoff Risk Assessment
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              {['Zone', 'Elevation (m)', 'Terrain Type', 'Runoff Velocity', 'Flash Flood Risk', 'Silt Factor', 'Bordering Hills'].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 700,
                  color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {zones.map(z => {
              const riskConfig = RISK_COLORS[z.flash_flood_risk] || RISK_COLORS.Moderate;
              return (
                <tr key={z.zone} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px', fontWeight: 700, color: 'var(--text)' }}>{z.zone}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontWeight: 800, color: z.avg_elevation_m < 50 ? '#e11d48' : 'var(--text)' }}>
                      {z.avg_elevation_m}m
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 4 }}>
                      ({z.min_elevation_m}–{z.max_elevation_m})
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 600, fontSize: 12 }}>{z.terrain_type}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      fontWeight: 800, fontSize: 14,
                      color: z.hill_runoff_velocity_m_s > 2.0 ? '#e11d48' : z.hill_runoff_velocity_m_s > 1.5 ? '#d97706' : '#059669',
                    }}>
                      {z.hill_runoff_velocity_m_s} m/s
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: riskConfig.bg, color: riskConfig.color,
                    }}>
                      {z.flash_flood_risk}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 50, height: 6, background: 'var(--gray-200)', borderRadius: 4, overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${z.silt_deposit_factor * 100}%`, height: '100%', borderRadius: 4,
                          background: z.silt_deposit_factor > 0.7 ? '#e11d48' : z.silt_deposit_factor > 0.5 ? '#d97706' : '#059669',
                        }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700 }}>{(z.silt_deposit_factor * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px', fontSize: 11, color: 'var(--text-muted)' }}>
                    {z.bordering_hills.join(', ')}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>


      {/* ── Hill Cutting & Erosion Hotspots ───────────────────────── */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TriangleAlert size={16} color="#e11d48" /> Active Hill-Cutting & Erosion Hotspots
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          {hill_cutting_hotspots.map(spot => {
            const sConfig = SEVERITY_COLORS[spot.severity] || SEVERITY_COLORS.Moderate;
            return (
              <div key={spot.location} className="card" style={{
                padding: '18px 22px', borderRadius: 14,
                background: sConfig.bg, border: `1px solid ${sConfig.border}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={16} color={sConfig.icon} />
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: sConfig.color }}>{spot.location}</h4>
                  </div>
                  <span style={{
                    padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800,
                    background: spot.color, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {spot.severity}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: sConfig.color, lineHeight: 1.6, marginBottom: 14, opacity: 0.85 }}>
                  {spot.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 10, color: sConfig.color, opacity: 0.7, textTransform: 'uppercase' }}>Erosion Vol.</p>
                    <p style={{ fontSize: 15, fontWeight: 800, color: sConfig.color }}>
                      {(spot.erosion_volume_m3_yr / 1000).toFixed(1)}K m³/yr
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: sConfig.color, opacity: 0.7, textTransform: 'uppercase' }}>Drain Clog Risk</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: sConfig.color }}>{spot.drain_clogging_risk}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: sConfig.color, opacity: 0.7, textTransform: 'uppercase' }}>Affected Zone</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: sConfig.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={11} /> {spot.affected_zone}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Data Sources Footer ───────────────────────────────────── */}
      <div className="card" style={{
        padding: '14px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12,
        background: 'var(--surface)', border: '1px solid var(--border)',
      }}>
        <Layers size={16} color="var(--teal-600)" />
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 2 }}>DATA SOURCES</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {data.data_sources?.join(' · ')}
          </p>
        </div>
      </div>

    </div>
  );
}
