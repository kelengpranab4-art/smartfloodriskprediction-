import React, { useState } from 'react';
import { Bot, Loader2, PlayCircle, ShieldCheck } from 'lucide-react';
import api from '../api';

export default function AIDecisionAssistant({ selectedZoneData }) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState('');

  const generateInsight = async () => {
    if (!selectedZoneData) return;
    setLoading(true);
    setInsight('');

    try {
      const payload = {
        zone: selectedZoneData.zone,
        risk: selectedZoneData.risk || selectedZoneData.risk_label || 'Unknown',
        score: selectedZoneData.score || selectedZoneData.risk_score || 0,
        rainfall: selectedZoneData.rainfall,
        river_level: selectedZoneData.river_level
      };

      const res = await api.post('/ai/analyze-flood', payload);
      setInsight(res.data.insight);
    } catch (err) {
      console.error(err);
      setInsight('⚠️ Unable to connect to AI engine. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card fade-in" style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1px solid #e2e8f0', minHeight: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155' }}>AI Decision Assistant</h3>
            <p style={{ fontSize: 11, color: '#64748b' }}>GPT-powered operational strategy</p>
          </div>
        </div>

        <button
          onClick={generateInsight}
          disabled={loading || !selectedZoneData}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 8,
            background: 'var(--teal-700)', color: '#fff', border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, opacity: (loading || !selectedZoneData) ? 0.7 : 1
          }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={14} />}
          {loading ? 'Analyzing...' : 'Generate Plan'}
        </button>
      </div>

      <div style={{
        background: '#fff', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0',
        minHeight: 100, fontSize: 13, lineHeight: 1.6, color: '#334155', position: 'relative'
      }}>
        {!insight && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
            <ShieldCheck size={28} style={{ marginBottom: 8 }} />
            <p>Click "Generate Plan" to request an automated evacuation or standby strategy.</p>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#6d28d9', fontWeight: 600 }}>
            <div className="pulse-dot" style={{ background: '#6d28d9' }} /> Generating AI response...
          </div>
        )}

        {insight && !loading && (
          <div className="fade-in" style={{ whiteSpace: 'pre-wrap' }}>
            {insight}
          </div>
        )}
      </div>
    </div>
  );
}
