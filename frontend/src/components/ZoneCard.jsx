import React from 'react';
import { AlertCircle, Droplets, Waves, ShieldAlert, CheckCircle2, Cpu, Zap, MapPin } from 'lucide-react';

export default function ZoneCard({ data }) {
  if (!data) return (
    <div className="card" style={{ padding: 32, textAlign: 'center', color: 'var(--gray-500)' }}>
      <MapPin size={28} style={{ margin: '0 auto 10px', color: 'var(--teal-300)' }} />
      <p>Click a zone on the map<br />to see AI analysis</p>
    </div>
  );

  const { zone, risk, reason, actions, rainfall, river_level } = data;
  const isHigh = risk === 'High';
  const isMedium = risk === 'Medium';

  const cfg = isHigh
    ? { cardClass: 'card-high', badgeClass: 'badge-high', Icon: ShieldAlert, dot: 'var(--risk-high)', bar: '#f43f5e', label: 'HIGH RISK' }
    : isMedium
      ? { cardClass: 'card-medium', badgeClass: 'badge-medium', Icon: AlertCircle, dot: 'var(--risk-medium)', bar: '#f59e0b', label: 'MEDIUM RISK' }
      : { cardClass: 'card-low', badgeClass: 'badge-low', Icon: CheckCircle2, dot: 'var(--risk-low)', bar: '#10b981', label: 'LOW RISK' };

  return (
    <div className={`card ${cfg.cardClass} fade-in`} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Zone name + badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 6 }}>{zone}</h2>
          <span className={`badge ${cfg.badgeClass}`}>
            <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
            {cfg.label}
          </span>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: isHigh ? '#ffe4e6' : isMedium ? '#fef3c7' : '#d1fae5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <cfg.Icon size={20} color={cfg.dot} />
        </div>
      </div>

      <hr className="divider" />

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{
          background: 'var(--teal-50)', border: '1px solid var(--teal-200)',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Droplets size={14} color="var(--teal-500)" />
            <span style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rainfall</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--teal-700)', lineHeight: 1 }}>
            {rainfall} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-500)' }}>mm</span>
          </p>
        </div>
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '12px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Waves size={14} color="#3b82f6" />
            <span style={{ fontSize: 11, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>River Level</span>
          </div>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#1d4ed8', lineHeight: 1 }}>
            {river_level} <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--gray-500)' }}>m</span>
          </p>
        </div>
      </div>

      {/* AI Model */}
      <div style={{
        background: '#fff', border: '1px solid var(--gray-200)',
        borderRadius: 10, padding: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <Cpu size={13} color="var(--teal-500)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--teal-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Model</span>
          <span className="badge badge-teal" style={{ marginLeft: 'auto', fontSize: 10 }}>
            {data.model_type || 'Hybrid Ensemble (RF + GB + LR)'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--gray-500)' }}>
            {data.confidence_score ? (data.confidence_score * 100).toFixed(0) : 0}% conf.
          </span>
        </div>

        <p style={{ fontSize: 11, color: 'var(--gray-500)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Feature Drivers</p>
        <div style={{ height: 7, borderRadius: 4, overflow: 'hidden', background: 'var(--gray-200)', display: 'flex' }}>
          <div style={{ width: `${data.rainfall_contribution || 50}%`, background: 'var(--teal-400)', transition: 'width 1s' }} />
          <div style={{ flex: 1, background: '#3b82f6', transition: 'width 1s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 10, fontWeight: 600 }}>
          <span style={{ color: 'var(--teal-600, var(--teal-500))' }}>🌧 Rainfall {data.rainfall_contribution || 50}%</span>
          <span style={{ color: '#3b82f6' }}>🌊 River {data.river_level_contribution || 50}%</span>
        </div>
      </div>

      {/* Analysis */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          Analysis
        </p>
        <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.65 }}>{reason}</p>
      </div>

      <hr className="divider" />

      {/* Actions */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Recommended Actions
        </p>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {actions?.map((a, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.5 }}>
              <div style={{ marginTop: 5, minWidth: 6, height: 6, width: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
              {a}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
