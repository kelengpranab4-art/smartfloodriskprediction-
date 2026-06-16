import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip } from 'react-leaflet';
import { Shield, Info } from 'lucide-react';

const GUWAHATI_CENTER = [26.1445, 91.7362];

const ZONES_COORDS = {
  'Beltola': [[26.1265, 91.7925], [26.1150, 91.7950], [26.1120, 91.7820], [26.1235, 91.7760]],
  'Zoo Road': [[26.1600, 91.7800], [26.1510, 91.7850], [26.1450, 91.7750], [26.1550, 91.7650]],
  'Anil Nagar': [[26.1700, 91.7750], [26.1650, 91.7800], [26.1600, 91.7700], [26.1660, 91.7650]],
  'Bhangagarh': [[26.1620, 91.7650], [26.1550, 91.7700], [26.1500, 91.7550], [26.1580, 91.7500]],
  'Uzan Bazaar': [[26.1950, 91.7500], [26.1900, 91.7550], [26.1850, 91.7450], [26.1900, 91.7400]],
};

const CLASS_CONFIG = {
  High: { fill: '#f43f5e', stroke: '#e11d48', opacity: 0.45 },
  Medium: { fill: '#f59e0b', stroke: '#d97706', opacity: 0.38 },
  Low: { fill: '#10b981', stroke: '#059669', opacity: 0.30 },
};

export default function SusceptibilityMap({ data }) {
  const [selectedZone, setSelectedZone] = useState(null);
  if (!data) return null;

  const sel = data.zones.find(z => z.zone === selectedZone);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Legend */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={15} color="var(--teal-600)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Flood Susceptibility Classification</span>
        </div>
        <div style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
          {['High', 'Medium', 'Low'].map(c => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: CLASS_CONFIG[c].fill }} />
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Detail split */}
      <div style={{ display: 'grid', gridTemplateColumns: sel ? '1fr 320px' : '1fr', gap: 18 }}>

        {/* Map */}
        <div className="card" style={{ overflow: 'hidden', height: 380, padding: 0, borderRadius: 14 }}>
          <MapContainer center={GUWAHATI_CENTER} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
            {data.zones.map(zone => {
              const coords = ZONES_COORDS[zone.zone];
              if (!coords) return null;
              const cfg = CLASS_CONFIG[zone.classification] || CLASS_CONFIG.Low;
              const isSel = selectedZone === zone.zone;

              return (
                <Polygon
                  key={zone.zone}
                  positions={coords}
                  pathOptions={{
                    color: cfg.stroke,
                    fillColor: cfg.fill,
                    fillOpacity: isSel ? cfg.opacity + 0.2 : cfg.opacity,
                    weight: isSel ? 3.5 : 2,
                  }}
                  eventHandlers={{ click: () => setSelectedZone(zone.zone) }}
                >
                  <Tooltip sticky direction="top" offset={[0, -10]}>
                    <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 160 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{zone.zone}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Susceptibility</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: cfg.fill + '33', color: cfg.stroke }}>
                          {zone.classification}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#64748b' }}>Score</span>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>{(zone.susceptibility_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}
          </MapContainer>
        </div>

        {/* Detail Panel */}
        {sel && (
          <div className="card fade-in" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{sel.zone}</h3>
              <span style={{
                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: sel.color + '22', color: sel.color,
              }}>
                {sel.classification} Susceptibility — {(sel.susceptibility_score * 100).toFixed(0)}%
              </span>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Factor Breakdown
            </div>

            {Object.entries(sel.factors).map(([key, f]) => {
              const pct = Math.min(100, f.contribution / 0.25 * 100);
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text)' }}>{label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                      {f.value}{f.unit ? ` ${f.unit}` : ''} (w: {(f.weight * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--gray-200)', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: sel.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              );
            })}

            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={12} />
              Methodology: {data.methodology}
            </div>
          </div>
        )}
      </div>

      {/* Data Sources Footer */}
      <div className="card" style={{ padding: '12px 20px', fontSize: 11, color: 'var(--text-muted)' }}>
        <strong>Data Sources:</strong> {data.data_sources.join(' · ')}
      </div>
    </div>
  );
}
