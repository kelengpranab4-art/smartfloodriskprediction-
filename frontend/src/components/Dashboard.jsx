import React, { useState, useEffect } from 'react';
import api, { wsBaseUrl } from '../api';
import { Activity, Clock, RefreshCw, MapPin, BarChart2, Droplets, ChevronDown, ChevronUp, Cpu, AlertCircle, AlertTriangle, Moon, Sun, BellRing } from 'lucide-react';
import FloodMap from './FloodMap';
import RiskChart from './RiskChart';
import ZoneCard from './ZoneCard';
import SimulationPanel from './SimulationPanel';
import ModelMetrics from './ModelMetrics';
import ReportFloodModal from './ReportFloodModal';
import AlertSignup from './AlertSignup';

export default function Dashboard() {
  const [zones, setZones] = useState([]);
  const [forecast, setForecast] = useState([]);
  const [history, setHistory] = useState([]);
  const [reports, setReports] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [activeTab, setActiveTab] = useState('forecast');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('—');
  const [showMetrics, setShowMetrics] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSignupOpen, setSignupOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('flood-theme') || 'light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('flood-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [zonesRes, forecastRes, historicalRes, reportsRes] = await Promise.all([
        api.get('/zones/risk'),
        api.get('/forecast'),
        api.get('/historical'),
        api.get('/reports'),
      ]);
      setZones(zonesRes.data);
      setForecast(forecastRes.data);
      setHistory(historicalRes.data);
      setReports(reportsRes.data);
      if (!selectedZone && zonesRes.data.length > 0) setSelectedZone(zonesRes.data[0]);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
    const t = setInterval(fetchData, 60000); 

    // WebSocket connection for real-time Emergency Alerts
    const ws = new WebSocket(wsBaseUrl);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'EMERGENCY_ALERT') {
          setActiveAlert(data);
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    return () => {
      clearInterval(t);
      ws.close();
    }; 
  }, []);

  const handleSimulateResult = (d) => setSelectedZone(d);

  const high = zones.filter(z => z.risk === 'High').length;
  const med = zones.filter(z => z.risk === 'Medium').length;
  const low = zones.filter(z => z.risk === 'Low').length;

  const stats = [
    { label: 'High Risk', value: high, dot: 'var(--risk-high)', bg: 'var(--teal-50)', border: 'var(--risk-high)', text: 'var(--risk-high)' },
    { label: 'Medium Risk', value: med, dot: 'var(--risk-medium)', bg: 'var(--teal-50)', border: 'var(--risk-medium)', text: 'var(--risk-medium)' },
    { label: 'Low Risk', value: low, dot: 'var(--risk-low)', bg: 'var(--teal-50)', border: 'var(--risk-low)', text: 'var(--risk-low)' },
    { label: 'Monitored', value: zones.length, dot: 'var(--teal-500)', bg: 'var(--teal-50)', border: 'var(--teal-500)', text: 'var(--teal-700)' },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 60, width: '100%', borderRadius: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="skeleton" style={{ height: 460, borderRadius: 14 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="skeleton" style={{ height: 280, borderRadius: 14 }} />
              <div className="skeleton" style={{ height: 280, borderRadius: 14 }} />
            </div>
          </div>
          <div className="skeleton" style={{ height: 600, borderRadius: 14 }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 20px 40px' }} className="fade-in">

      {/* ─── HEADER ─────────────────────────────────────── */}
      {activeAlert && (
        <div className="glass" style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'rgba(225, 29, 72, 0.9)', color: '#fff',
          padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 20px rgba(225, 29, 72, 0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertCircle className="animate-pulse" size={24} color="#fff" />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>CRITICAL ALERT: {activeAlert.zone}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{activeAlert.message}</div>
            </div>
          </div>
          <button 
            onClick={() => setActiveAlert(null)}
            style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            DISMISS
          </button>
        </div>
      )}

      <header style={{ marginBottom: 24, marginTop: activeAlert ? 70 : 0, transition: 'margin-top 0.3s' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'linear-gradient(135deg, var(--teal-700), var(--teal-400))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,178,178,0.3)',
              }}>
                <Droplets size={18} color="#fff" />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal-700)', letterSpacing: '-0.3px', lineHeight: 1 }}>
                  Guwahati Flood Risk
                </h1>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  AI-Powered Urban Flood Decision System · Assam, India
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button 
              onClick={toggleTheme}
              className="btn-outline"
              style={{ width: 36, height: 36, padding: 0, justifyContent: 'center', borderRadius: 10 }}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>

            <button 
              onClick={() => setSignupOpen(true)} 
              className="btn-outline flex items-center gap-1.5" 
              style={{ padding: '7px 16px', fontSize: 12, borderColor: 'var(--teal-500)', color: 'var(--teal-700)', borderRadius: 10, background: 'var(--bg)' }}
            >
              <BellRing size={13} />
              Alert Signup
            </button>

            <button 
              onClick={() => setModalOpen(true)} 
              className="btn-outline flex items-center gap-1.5" 
              style={{ padding: '7px 16px', fontSize: 12, borderColor: '#f59e0b', color: '#d97706', borderRadius: 10, background: 'var(--bg)' }}
            >
              <AlertTriangle size={13} />
              Report Flood
            </button>

            <div className="glass" style={{
              display: 'flex', alignItems: 'center', gap: 8,
              borderRadius: 10, padding: '7px 14px',
            }}>
              <div className="pulse-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--teal-500)' }} />
              <Clock size={13} style={{ color: 'var(--gray-500)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Updated <strong style={{ color: 'var(--text)' }}>{lastUpdated}</strong>
              </span>
            </div>
            <button onClick={fetchData} disabled={refreshing} className="btn-teal" style={{ padding: '7px 16px', fontSize: 12 }}>
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          {stats.map(s => (
            <div key={s.label} className="card" style={{
              display: 'flex', alignItems: 'center', gap: 10,
              borderRadius: 10, padding: '10px 16px', minWidth: 120,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 18, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="card" style={{ overflow: 'hidden', height: 460, padding: 0 }}>
            <FloodMap theme={theme} zoneData={zones} reportsData={reports} selectedZone={selectedZone} setSelectedZone={setSelectedZone} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <SimulationPanel onSimulateResult={handleSimulateResult} />

            <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', minHeight: 280 }}>
              <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
                <button className={`tab ${activeTab === 'forecast' ? 'active' : ''}`} onClick={() => setActiveTab('forecast')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Activity size={13} /> 6-Hr Forecast</span>
                </button>
                <button className={`tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><BarChart2 size={13} /> History</span>
                </button>
              </div>
              <div style={{ flex: 1, minHeight: 180 }}>
                <RiskChart
                  data={activeTab === 'forecast' ? forecast : history}
                  title={activeTab === 'forecast' ? '6-Hour Risk Forecast' : '24-Hour Risk History'}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          {isSignupOpen ? (
            <AlertSignup zones={zones} onClose={() => setSignupOpen(false)} />
          ) : (
            <ZoneCard data={selectedZone || (zones.length > 0 ? zones[0] : null)} />
          )}
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setShowMetrics(v => !v)}
          className="btn-outline"
          style={{
            width: '100%', justifyContent: 'center', padding: '11px',
            fontSize: 13, borderRadius: 12, gap: 8,
            background: showMetrics ? 'var(--teal-50)' : 'var(--surface)',
          }}
        >
          <Cpu size={15} />
          {showMetrics ? 'Hide' : 'View'} Model Performance & Accuracy
          {showMetrics ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showMetrics && (
          <div className="fade-in" style={{ marginTop: 18 }}>
            <ModelMetrics />
          </div>
        )}
      </div>
      <ReportFloodModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onRefresh={fetchData} 
      />
    </div>
  );
}
