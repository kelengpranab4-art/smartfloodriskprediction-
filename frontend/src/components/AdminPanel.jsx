import React, { useState, useEffect } from 'react';
import api, { apiBaseUrl } from '../api';
import axios from 'axios';
import { 
  Shield, Users, MessageSquare, Radio, Activity, 
  Trash2, AlertTriangle, LogOut, Loader2, CheckCircle,
  BellRing, RefreshCw, Smartphone, Send, Sparkles
} from 'lucide-react';

export default function AdminPanel({ onLogout }) {
  const [apiKey, setApiKey] = useState(localStorage.getItem('flood-admin-key') || '');
  const [isAuth, setIsAuth] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [telemetry, setTelemetry] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Emergency Alert Form State
  const [alertForm, setAlertForm] = useState({
    zone: 'Guwahati West',
    risk_level: 'High',
    message: ''
  });

  // Direct SMS Form State
  const [directSmsForm, setDirectSmsForm] = useState({
    phone_number: '',
    message: ''
  });

  const axiosAdmin = axios.create({
    baseURL: apiBaseUrl,
    headers: { 'X-Admin-Key': apiKey }
  });

  const checkAuth = async () => {
    setLoading(true);
    try {
      const res = await axiosAdmin.get('/admin/telemetry');
      setTelemetry(res.data);
      setIsAuth(true);
      localStorage.setItem('flood-admin-key', apiKey);
      fetchData();
    } catch (err) {
      setError('Invalid Admin Key or Server Error');
      setIsAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      const [telRes, subRes, repRes] = await Promise.all([
        axiosAdmin.get('/admin/telemetry'),
        axiosAdmin.get('/admin/subscribers'),
        axiosAdmin.get('/reports') // Public endpoint but management is admin
      ]);
      setTelemetry(telRes.data);
      setSubscribers(subRes.data);
      setReports(repRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isAuth) {
      const t = setInterval(fetchData, 30000);
      return () => clearInterval(t);
    }
  }, [isAuth]);

  const handleDeleteSub = async (id) => {
    if (!window.confirm('Delete this subscriber?')) return;
    await axiosAdmin.delete(`/admin/subscribers/${id}`);
    fetchData();
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm('Delete this report?')) return;
    await axiosAdmin.delete(`/admin/reports/${id}`);
    fetchData();
  };

  const handleTriggerAlert = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Trigger ${alertForm.risk_level} alert for ${alertForm.zone}?`)) return;
    setLoading(true);
    try {
      await api.post('/trigger_alert', alertForm);
      alert('Alert broadcasted successfully!');
      setAlertForm({ ...alertForm, message: '' });
    } catch (err) {
      alert('Failed to trigger alert.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendDirectSMS = async (e) => {
    e.preventDefault();
    if (!window.confirm(`Send SMS to ${directSmsForm.phone_number}?`)) return;
    setLoading(true);
    try {
      await axiosAdmin.post('/admin/send-sms', directSmsForm);
      alert('SMS sent successfully!');
      setDirectSmsForm({ phone_number: '', message: '' });
    } catch (err) {
      alert('Failed to send SMS.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDraft = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/draft-sms', {
        zone: "Targeted User",
        risk_level: "Critical/High",
        metrics: "Rapid water level rise detected near your registered location."
      });
      setDirectSmsForm(prev => ({ ...prev, message: res.data.draft }));
    } catch (err) {
      console.error(err);
      alert("AI drafting failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  if (!isAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="card fade-in" style={{ padding: 32, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ 
            width: 50, height: 50, borderRadius: 12, background: 'var(--teal-700)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' 
          }}>
            <Shield color="#fff" size={28} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Admin Access</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>
            Enter your secret administrative key to manage the Guwahati Flood System.
          </p>
          <input 
            type="password" 
            placeholder="Admin API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ 
              width: '100%', padding: '12px 16px', borderRadius: 10, 
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', marginBottom: 16, outline: 'none'
            }}
          />
          {error && <p style={{ color: 'var(--risk-high)', fontSize: 13, marginBottom: 16 }}>{error}</p>}
          <button onClick={checkAuth} disabled={loading} className="btn-teal" style={{ width: '100%', height: 46 }}>
            {loading ? <Loader2 className="animate-spin" /> : 'Authenticate'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 30px' }} className="fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--teal-700)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield color="#fff" size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal-700)' }}>Control Center</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>System Administrator Dashboard</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={fetchData} className="btn-outline" style={{ padding: '8px 16px' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={onLogout} className="btn-outline" style={{ borderColor: 'var(--risk-high)', color: 'var(--risk-high)' }}>
            <LogOut size={14} /> Exit Admin
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 32 }}>
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
            { id: 'subscribers', label: 'Subscribers', icon: <Users size={16} /> },
            { id: 'reports', label: 'Citizen Reports', icon: <MessageSquare size={16} /> },
            { id: 'overrides', label: 'Manual Overrides', icon: <Radio size={16} /> },
            { id: 'direct_sms', label: 'Direct SMS', icon: <Smartphone size={16} /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`tab ${activeTab === item.id ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, textAlign: 'left' }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </aside>

        <main>
          {activeTab === 'overview' && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Subscribers</p>
                <h2 style={{ fontSize: 32, fontWeight: 800 }}>{telemetry?.total_subscribers}</h2>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reports to Review</p>
                <h2 style={{ fontSize: 32, fontWeight: 800 }}>{telemetry?.total_reports}</h2>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live WS Connections</p>
                <h2 style={{ fontSize: 32, fontWeight: 800 }}>{telemetry?.active_ws_clients}</h2>
              </div>
              <div className="card" style={{ padding: 24 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Model Health</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <CheckCircle size={18} color="var(--risk-low)" />
                  <span style={{ fontWeight: 600 }}>{telemetry?.model_status}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscribers' && (
            <div className="card fade-in" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: 'var(--teal-50)', borderBottom: '1px solid var(--border)' }}>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '14px 20px' }}>Phone Number</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px' }}>Zone</th>
                    <th style={{ textAlign: 'left', padding: '14px 20px' }}>Joined</th>
                    <th style={{ textAlign: 'right', padding: '14px 20px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map(sub => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 600 }}>{sub.phone_number}</td>
                      <td style={{ padding: '14px 20px' }}>{sub.zone_name}</td>
                      <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{new Date(sub.timestamp).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteSub(sub.id)} style={{ color: 'var(--risk-high)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'reports' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reports.map(rep => (
                <div key={rep.id} className="card fade-in" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span className={`badge badge-${rep.severity === 'Critical' ? 'high' : 'medium'}`}>{rep.severity}</span>
                      <span style={{ fontWeight: 700 }}>{rep.zone_name}</span>
                    </div>
                    <p style={{ fontSize: 13, marginBottom: 4 }}>{rep.description}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(rep.timestamp).toLocaleString()}</p>
                  </div>
                  <button onClick={() => handleDeleteReport(rep.id)} className="btn-outline" style={{ borderColor: 'var(--risk-high)', color: 'var(--risk-high)', padding: 8 }}>
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'overrides' && (
            <div className="card fade-in" style={{ padding: 32, maxWidth: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <AlertTriangle color="var(--risk-high)" size={24} />
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Broadcast Emergency Alert</h3>
              </div>
              <form onSubmit={handleTriggerAlert} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Impacted Zone</label>
                  <select 
                    value={alertForm.zone}
                    onChange={(e) => setAlertForm({ ...alertForm, zone: e.target.value })}
                    style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                  >
                    <option>Beltola</option>
                    <option>Zoo Road</option>
                    <option>Anil Nagar</option>
                    <option>Bhangagarh</option>
                    <option>Uzan Bazaar</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Risk Level</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['Medium', 'High', 'Critical'].map(level => (
                      <label key={level} style={{ 
                        flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', 
                        textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: alertForm.risk_level === level ? 'var(--teal-50)' : 'transparent',
                        borderColor: alertForm.risk_level === level ? 'var(--teal-500)' : 'var(--border)',
                        color: alertForm.risk_level === level ? 'var(--teal-700)' : 'var(--text)'
                      }}>
                        <input 
                          type="radio" name="risk_level" style={{ display: 'none' }}
                          onChange={() => setAlertForm({ ...alertForm, risk_level: level })}
                        />
                        {level}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Alert Message</label>
                  <textarea 
                    required
                    value={alertForm.message}
                    onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                    placeholder="e.g. Flash flood warning. Evacuate low lying areas immediately."
                    style={{ 
                      width: '100%', height: 100, padding: 12, borderRadius: 10, 
                      border: '1px solid var(--border)', background: 'var(--surface)', 
                      color: 'var(--text)', fontSize: 13, resize: 'none' 
                    }}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-teal" style={{ height: 48, background: 'var(--risk-high)', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.3)' }}>
                  {loading ? <Loader2 className="animate-spin" /> : <><BellRing size={18} /> Broadcast Alert Now</>}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'direct_sms' && (
            <div className="card fade-in" style={{ padding: 32, maxWidth: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <Smartphone color="var(--teal-600)" size={24} />
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Send Direct SMS</h3>
              </div>
              <form onSubmit={handleSendDirectSMS} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Recipient Phone Number</label>
                  <input 
                    required
                    type="text"
                    value={directSmsForm.phone_number}
                    onChange={(e) => setDirectSmsForm({ ...directSmsForm, phone_number: e.target.value })}
                    placeholder="+919876543210"
                    style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 600 }}>Message</label>
                    <button 
                      type="button" onClick={handleAutoDraft} disabled={loading}
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', 
                        borderRadius: 6, fontSize: 11, fontWeight: 700, border: '1px solid #8b5cf6',
                        background: '#f3e8ff', color: '#6d28d9', cursor: 'pointer' 
                      }}
                    >
                      <Sparkles size={12} /> AI Auto-Draft (Mock/GPT)
                    </button>
                  </div>
                  <textarea 
                    required
                    value={directSmsForm.message}
                    onChange={(e) => setDirectSmsForm({ ...directSmsForm, message: e.target.value })}
                    placeholder="Enter your message here..."
                    style={{ 
                      width: '100%', height: 100, padding: 12, borderRadius: 10, 
                      border: '1px solid var(--border)', background: 'var(--surface)', 
                      color: 'var(--text)', fontSize: 13, resize: 'none', outline: 'none'
                    }}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-teal" style={{ height: 48, boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)' }}>
                  {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Send SMS Now</>}
                </button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
