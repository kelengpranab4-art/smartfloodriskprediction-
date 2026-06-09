import React, { useState } from 'react';
import axios from 'axios';
import { Phone, Bell, CheckCircle, XCircle, Loader2, X } from 'lucide-react';

export default function AlertSignup({ zones, onClose }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedZone, setSelectedZone] = useState(zones[0]?.zone || '');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.post('http://localhost:8000/subscribe', {
        phone_number: phoneNumber,
        zone_name: selectedZone
      });
      setStatus('success');
      setMessage(res.data.message);
      setTimeout(() => onClose?.(), 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.detail || 'Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-in" style={{ padding: 24, maxWidth: 400, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 8, 
            background: 'var(--teal-100)', color: 'var(--teal-700)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Bell size={18} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, m: 0 }}>SMS Alert Signup</h2>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        )}
      </div>

      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Register your phone number to receive instant SMS notifications when flood risk becomes critical in your area.
      </p>

      {status === 'success' ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <CheckCircle size={48} color="var(--risk-low)" style={{ marginBottom: 12 }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Subscription Active!</h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{message}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)' }}>
                <Phone size={14} />
              </div>
              <input
                type="tel"
                placeholder="+91 XXXXX XXXXX"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--text)',
                  fontSize: 14, outline: 'none'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Select Neighborhood / Zone
            </label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text)',
                fontSize: 14, outline: 'none', appearance: 'none'
              }}
            >
              {zones.map(z => (
                <option key={z.zone} value={z.zone}>{z.zone}</option>
              ))}
            </select>
          </div>

          {status === 'error' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--risk-high)', fontSize: 12 }}>
              <XCircle size={14} />
              <span>{message}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="btn-teal" 
            style={{ marginTop: 8, width: '100%', height: 44 }}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Register for Alerts'}
          </button>
        </form>
      )}

      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <p style={{ fontSize: 11, color: 'var(--gray-500)' }}>
          By signing up, you agree to receive automated flood alerts. Data rates may apply.
        </p>
      </div>
    </div>
  );
}
