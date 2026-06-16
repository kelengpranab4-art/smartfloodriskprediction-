import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Satellite, Layers } from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const GUWAHATI_CENTER = [26.1445, 91.7362];

const ZONES_COORDS = {
  'Beltola': [[26.1265, 91.7925], [26.1150, 91.7950], [26.1120, 91.7820], [26.1235, 91.7760]],
  'Zoo Road': [[26.1600, 91.7800], [26.1510, 91.7850], [26.1450, 91.7750], [26.1550, 91.7650]],
  'Anil Nagar': [[26.1700, 91.7750], [26.1650, 91.7800], [26.1600, 91.7700], [26.1660, 91.7650]],
  'Bhangagarh': [[26.1620, 91.7650], [26.1550, 91.7700], [26.1500, 91.7550], [26.1580, 91.7500]],
  'Uzan Bazaar': [[26.1950, 91.7500], [26.1900, 91.7550], [26.1850, 91.7450], [26.1900, 91.7400]],
};

const riskConfig = {
  High: { stroke: '#e11d48', fill: '#f43f5e', opacity: 0.35, selectedOpacity: 0.55, weight: 2.5 },
  Medium: { stroke: '#d97706', fill: '#f59e0b', opacity: 0.30, selectedOpacity: 0.48, weight: 2 },
  Low: { stroke: '#059669', fill: '#10b981', opacity: 0.20, selectedOpacity: 0.35, weight: 1.5 },
};

const getGibsDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 2); // 2 days ago to ensure 'best' layer is processed
  return date.toISOString().split('T')[0];
};

const GIBS_DATE = getGibsDate();

const SATELLITE_LAYERS = [
  { id: 'street', label: '🗺 Street', url: null },
  { 
    id: 'modis', 
    label: '🛰 Satellite', 
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${GIBS_DATE}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`, 
    attr: 'NASA GIBS / MODIS Terra' 
  },
  { 
    id: 'ndwi', 
    label: '🌧 Precipitation', 
    url: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/${GIBS_DATE}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`, 
    attr: 'NASA GIBS / GPM IMERG' 
  },
];

export default function FloodMap({ theme, zoneData, reportsData, selectedZone, setSelectedZone }) {
  const [activeLayer, setActiveLayer] = useState('street');
  const selectedSat = SATELLITE_LAYERS.find(l => l.id === activeLayer);
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={GUWAHATI_CENTER}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Base map — street or satellite based on toggle */}
        {activeLayer === 'street' ? (
          <TileLayer
            attribution='&copy; <a href="https://carto.com">CARTO</a>'
            url={theme === 'dark'
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
            maxZoom={19}
          />
        ) : (
          <>
            {/* Always show street as base so zones are visible */}
            <TileLayer
              attribution='&copy; <a href="https://carto.com">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
              opacity={0.3}
            />
            <TileLayer
              attribution={selectedSat?.attr || 'NASA GIBS'}
              url={selectedSat?.url || ''}
              maxZoom={8}
              opacity={0.85}
            />
          </>
        )}

        {zoneData.map(zone => {
          const coords = ZONES_COORDS[zone.zone];
          if (!coords) return null;
          const cfg = riskConfig[zone.risk] || riskConfig.Low;
          const isSel = selectedZone?.zone === zone.zone;

          return (
            <Polygon
              key={zone.zone}
              positions={coords}
              pathOptions={{
                color: cfg.stroke,
                fillColor: cfg.fill,
                fillOpacity: isSel ? cfg.selectedOpacity : cfg.opacity,
                weight: isSel ? cfg.weight + 1 : cfg.weight,
                dashArray: isSel ? null : null,
              }}
              eventHandlers={{ click: () => setSelectedZone(zone) }}
            >
              <Tooltip sticky direction="top" offset={[0, -10]}>
                <div style={{
                  fontFamily: 'Inter, sans-serif', minWidth: 190,
                  padding: '2px 0',
                }}>
                  <div style={{
                    fontWeight: 800, fontSize: 14, color: '#0f172a',
                    borderBottom: '1px solid #f1f5f9', paddingBottom: 6, marginBottom: 8,
                  }}>
                    {zone.zone}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Risk Level</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: zone.risk === 'High' ? '#ffe4e6' : zone.risk === 'Medium' ? '#fef3c7' : '#d1fae5',
                      color: zone.risk === 'High' ? '#be123c' : zone.risk === 'Medium' ? '#92400e' : '#065f46',
                    }}>
                      {zone.risk}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>🌧 Rainfall</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{zone.rainfall} mm</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>🌊 River Level</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a' }}>{zone.river_level} m</span>
                  </div>

                  <div style={{ height: 5, borderRadius: 3, display: 'flex', overflow: 'hidden', background: '#f1f5f9' }}>
                    <div style={{ width: `${zone.rainfall_contribution || 50}%`, background: '#00b2b2' }} />
                    <div style={{ flex: 1, background: '#3b82f6' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, fontWeight: 600 }}>
                    <span style={{ color: '#00b2b2' }}>Rain {zone.rainfall_contribution || 50}%</span>
                    <span style={{ color: '#3b82f6' }}>River {zone.river_level_contribution || 50}%</span>
                  </div>

                  <div style={{
                    marginTop: 8, paddingTop: 6, borderTop: '1px solid #f1f5f9',
                    fontSize: 11, color: '#94a3b8', display: 'flex', justifyContent: 'space-between',
                  }}>
                    <span>Click to select</span>
                    <span>{zone.confidence_score ? (zone.confidence_score * 100).toFixed(0) : 0}% confidence</span>
                  </div>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* CITIZEN REPORTS MARKERS */}
        {reportsData && reportsData.map(report => {
          const coords = ZONES_COORDS[report.zone_name];
          if (!coords) return null;
          // Stable pseudo-random jitter based on ID so markers don't stack but also don't dance on refresh
          const jitterLat = (report.id % 10 - 5) * 0.0015;
          const jitterLng = ((report.id * 3) % 10 - 5) * 0.0015;
          const lat = coords[0][0] + jitterLat - 0.002;
          const lng = coords[0][1] + jitterLng + 0.002;

          const reportIcon = new L.DivIcon({
            html: `<div style="background:#be123c; color:white; border-radius:50%; width:24px; height:24px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 10px rgba(190,18,60,0.5); font-size:14px; font-weight:800; border:2px solid white;">!</div>`,
            className: 'custom-leaflet-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          return (
            <Marker key={report.id} position={[lat, lng]} icon={reportIcon}>
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif' }}>
                  <div style={{ fontWeight: 'bold', borderBottom: '1px solid #ccc', paddingBottom: '4px', marginBottom: '8px' }}>
                    🚨 Citizen Report: {report.zone_name}
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <strong>Severity:</strong> <span style={{ color: '#be123c' }}>{report.severity}</span>
                  </div>
                  <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                    <strong>Description:</strong> {report.description}
                  </div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                    Reported at: {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>

      {/* Satellite Layer Toggle */}
      <div style={{
        position: 'absolute', bottom: 20, left: 10, zIndex: 9999,
        display: 'flex', gap: 6, background: 'rgba(255,255,255,0.95)',
        borderRadius: 10, padding: '6px 8px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
        border: '1px solid var(--gray-200)'
      }}>
        <Layers size={14} color="var(--teal-600)" style={{ marginRight: 4, alignSelf: 'center' }} />
        {SATELLITE_LAYERS.map(layer => (
          <button
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            style={{
              padding: '4px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: activeLayer === layer.id ? 'var(--teal-600)' : 'transparent',
              color: activeLayer === layer.id ? '#fff' : 'var(--gray-600)',
            }}
          >{layer.label}</button>
        ))}
      </div>
    </div>
  );
}
