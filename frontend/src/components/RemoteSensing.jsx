import React, { useState, useEffect } from 'react';
import api from '../api';
import { Satellite, Droplets, Map, Radio, RefreshCw, AlertCircle, Layers, Wind } from 'lucide-react';

const NDWI_COLOR = (ndwi) => {
  if (ndwi > 0.3) return '#1d4ed8';   // blue - water
  if (ndwi > -0.1) return '#0891b2';  // teal - moist
  return '#854d0e';                    // brown - dry
};

const NDWI_BG = (ndwi) => {
  if (ndwi > 0.3) return '#dbeafe';
  if (ndwi > -0.1) return '#cffafe';
  return '#fef3c7';
};

const RISK_COLOR = { High: '#e11d48', Medium: '#d97706', Low: '#059669' };

function GaugeBar({ value, max, color, label, unit }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: 'var(--gray-600)' }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: 'var(--gray-200)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

export default function RemoteSensing() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/remote-sensing');
      setData(res.data);
      if (!selectedZone && res.data.zones?.length > 0) {
        setSelectedZone(res.data.zones[0].zone);
      }
    } catch (e) {
      console.error('Remote Sensing API Error:', e);
      setError('Failed to load satellite data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>
      <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--teal-500)' }} />
      <p>Loading satellite data…</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: 24, textAlign: 'center', color: '#e11d48' }}>
      <AlertCircle size={20} style={{ margin: '0 auto 8px' }} />
      {error}
    </div>
  );

  const zone = data?.zones?.find(z => z.zone === selectedZone) || data?.zones?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Satellite size={18} color="#60a5fa" />
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gray-900)' }}>Remote Sensing</h2>
            <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>
              {data?.data_source} · {new Date(data?.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <button onClick={fetchData} className="btn-outline" style={{ padding: '6px 12px', fontSize: 11 }}>
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
        {[
          { icon: <Map size={16} color="#3b82f6" />, label: 'Coverage Area', value: `${data?.coverage_area_km2} km²`, bg: '#eff6ff' },
          { icon: <Droplets size={16} color="#e11d48" />, label: 'Total Flood Area', value: `${data?.total_flood_area_km2} km²`, bg: '#fff1f2' },
          { icon: <Radio size={16} color="#7c3aed" />, label: 'Satellite', value: 'MODIS Terra/Aqua', bg: '#f5f3ff' },
          { icon: <Layers size={16} color="#059669" />, label: 'Zones Monitored', value: `${data?.zones?.length}`, bg: '#f0fdf4' },
        ].map((card) => (
          <div key={card.label} className="card" style={{ padding: '14px 16px', background: card.bg, border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>{card.icon}</div>
            <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>{card.label}</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)' }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── ZONE SELECTOR ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {data?.zones?.map(z => (
          <button
            key={z.zone}
            onClick={() => setSelectedZone(z.zone)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: selectedZone === z.zone ? 'var(--teal-600)' : 'var(--gray-100)',
              color: selectedZone === z.zone ? '#fff' : 'var(--gray-700)',
              border: 'none', transition: 'all 0.2s'
            }}
          >
            {z.zone}
          </button>
        ))}
      </div>

      {/* ── ZONE DETAIL ── */}
      {zone && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* NDWI Card */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              💧 Water Index (NDWI)
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 42, fontWeight: 900, color: NDWI_COLOR(zone.ndwi), lineHeight: 1 }}>
                {zone.ndwi > 0 ? '+' : ''}{zone.ndwi}
              </div>
              <div style={{
                background: NDWI_BG(zone.ndwi), color: NDWI_COLOR(zone.ndwi),
                padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, marginBottom: 6
              }}>
                {zone.ndwi_label}
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray-500)', lineHeight: 1.6 }}>
              NDWI &gt; 0.3 → Water detected<br />
              -0.1 to 0.3 → Moist soil<br />
              &lt; -0.1 → Dry conditions
            </div>
          </div>

          {/* Flood Inundation Card */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              🌊 Flood Inundation
            </p>
            <div style={{ fontSize: 38, fontWeight: 900, color: RISK_COLOR[zone.risk_label] || '#059669', lineHeight: 1, marginBottom: 8 }}>
              {zone.flood_area_km2} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-500)' }}>km²</span>
            </div>
            <GaugeBar value={zone.flood_pct} max={100} color={RISK_COLOR[zone.risk_label] || '#059669'} label="% of zone flooded" unit="%" />
            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
              Total zone area: {zone.total_area_km2} km²
            </div>
          </div>

          {/* SAR  */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              📡 SAR Water Pixels
            </p>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#7c3aed', lineHeight: 1, marginBottom: 8 }}>
              {(zone.sar_water_ratio * 100).toFixed(1)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--gray-500)' }}>%</span>
            </div>
            <GaugeBar value={zone.sar_water_ratio * 100} max={100} color="#7c3aed" label="SAR backscatter water ratio" unit="%" />
            <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>
              Synthetic Aperture Radar estimated
            </div>
          </div>

          {/* Satellite Info */}
          <div className="card" style={{ padding: 20 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              🛰 Satellite Pass
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Source</span>
                <span style={{ fontWeight: 700 }}>{zone.satellite}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Last pass</span>
                <span style={{ fontWeight: 700 }}>{zone.last_satellite_pass_minutes_ago} min ago</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Resolution</span>
                <span style={{ fontWeight: 700 }}>250m / pixel</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Risk Status</span>
                <span style={{ fontWeight: 700, color: RISK_COLOR[zone.risk_label] }}>{zone.risk_label}</span>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
