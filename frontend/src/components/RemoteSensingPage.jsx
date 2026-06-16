import React, { useState, useEffect } from 'react';
import api from '../api';
import { Satellite, Leaf, Shield, Building2, Droplets, History, ArrowLeft, RefreshCw, AlertCircle, Waves, Mountain } from 'lucide-react';

import NDVIAnalysis from './NDVIAnalysis';
import SusceptibilityMap from './SusceptibilityMap';
import UrbanizationAnalysis from './UrbanizationAnalysis';
import WaterBodyAnalysis from './WaterBodyAnalysis';
import HistoricalComparison from './HistoricalComparison';
import DrainageAnalysis from './DrainageAnalysis';
import TopographyAnalysis from './TopographyAnalysis';

const TABS = [
  { id: 'ndvi', label: 'NDVI Analysis', icon: <Leaf size={14} /> },
  { id: 'susceptibility', label: 'Susceptibility Map', icon: <Shield size={14} /> },
  { id: 'urbanization', label: 'Urbanization', icon: <Building2 size={14} /> },
  { id: 'water', label: 'Water Bodies', icon: <Droplets size={14} /> },
  { id: 'historical', label: 'Historical', icon: <History size={14} /> },
  { id: 'drainage', label: 'Drainage Systems', icon: <Waves size={14} /> },
  { id: 'topography', label: 'Topography & DEM', icon: <Mountain size={14} /> },
];

export default function RemoteSensingPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('ndvi');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ndviData, setNdviData] = useState(null);
  const [suscData, setSuscData] = useState(null);
  const [urbanData, setUrbanData] = useState(null);
  const [waterData, setWaterData] = useState(null);
  const [histData, setHistData] = useState(null);
  const [drainageData, setDrainageData] = useState(null);
  const [topoData, setTopoData] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ndvi, susc, urban, water, hist, drain, topo] = await Promise.all([
        api.get('/remote-sensing/ndvi'),
        api.get('/remote-sensing/susceptibility'),
        api.get('/remote-sensing/urbanization'),
        api.get('/remote-sensing/water-bodies'),
        api.get('/remote-sensing/historical'),
        api.get('/remote-sensing/drainage'),
        api.get('/remote-sensing/topography'),
      ]);
      setNdviData(ndvi.data);
      setSuscData(susc.data);
      setUrbanData(urban.data);
      setWaterData(water.data);
      setHistData(hist.data);
      setDrainageData(drain.data);
      setTopoData(topo.data);
    } catch (e) {
      console.error('Remote Sensing fetch error:', e);
      setError('Failed to load remote sensing data. Ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Summary cards data
  const avgNdvi = ndviData?.summary?.average_ndvi ?? '—';
  const highRiskZones = ndviData?.summary?.high_susceptibility_zones ?? '—';
  const avgUrban = urbanData?.city_summary?.avg_built_up_2025 ?? '—';
  const vegLoss = urbanData?.city_summary?.avg_vegetation_loss ?? '—';

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={onBack}
            className="btn-outline"
            style={{ padding: '7px 14px', fontSize: 12, borderRadius: 10 }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 10px rgba(15,23,42,0.3)',
          }}>
            <Satellite size={20} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal-700)', lineHeight: 1 }}>
              Remote Sensing & GIS Analysis
            </h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Satellite-derived environmental intelligence · Sentinel-2 / Landsat · Guwahati, Assam
            </p>
          </div>
        </div>
        <button onClick={fetchAll} disabled={loading} className="btn-teal" style={{ padding: '8px 18px', fontSize: 12 }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Loading…' : 'Refresh Data'}
        </button>
      </div>

      {/* Overview Cards */}
      {!loading && !error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {[
            { icon: <Leaf size={18} color="#059669" />, label: 'Average NDVI', value: avgNdvi, bg: '#f0fdf4', color: '#059669' },
            { icon: <Building2 size={18} color="#6366f1" />, label: 'Urbanization (2025)', value: `${avgUrban}%`, bg: '#eef2ff', color: '#6366f1' },
            { icon: <Shield size={18} color="#e11d48" />, label: 'High-Risk Zones', value: highRiskZones, bg: '#fff1f2', color: '#e11d48' },
            { icon: <Leaf size={18} color="#d97706" />, label: 'Vegetation Loss', value: `${vegLoss}%`, bg: '#fffbeb', color: '#d97706' },
          ].map(card => (
            <div key={card.label} className="card" style={{ padding: '18px 20px', background: card.bg, border: 'none' }}>
              <div style={{ marginBottom: 10 }}>{card.icon}</div>
              <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 4 }}>{card.label}</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="card" style={{ padding: '8px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.2s',
              background: activeTab === tab.id ? 'linear-gradient(135deg, var(--teal-700), var(--teal-500))' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(0,178,178,0.3)' : 'none',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: '#e11d48' }}>
          <AlertCircle size={28} style={{ margin: '0 auto 12px' }} />
          <p>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--teal-500)' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading satellite data…</p>
        </div>
      )}

      {/* Tab Content */}
      {!loading && !error && (
        <div className="fade-in">
          {activeTab === 'ndvi' && <NDVIAnalysis data={ndviData} />}
          {activeTab === 'susceptibility' && <SusceptibilityMap data={suscData} />}
          {activeTab === 'urbanization' && <UrbanizationAnalysis data={urbanData} />}
          {activeTab === 'water' && <WaterBodyAnalysis data={waterData} />}
          {activeTab === 'historical' && <HistoricalComparison data={histData} />}
          {activeTab === 'drainage' && <DrainageAnalysis data={drainageData} />}
          {activeTab === 'topography' && <TopographyAnalysis data={topoData} />}
        </div>
      )}
    </div>
  );
}
