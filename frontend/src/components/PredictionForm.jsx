import React, { useState } from 'react';
import { Droplet, Waves, Send, RotateCcw } from 'lucide-react';
import axios from 'axios';

const PredictionForm = ({ onPredict, loading: externalLoading }) => {
  const [rainfall, setRainfall] = useState(50);
  const [riverLevel, setRiverLevel] = useState(45);
  const [loading, setLoading] = useState(false);

  const isLoading = externalLoading || loading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onPredict) {
      onPredict({ rainfall, river_level: riverLevel });
      return;
    }
    // Standalone usage: call API directly
    setLoading(true);
    try {
      await axios.post('http://localhost:8000/predict', {
        rainfall: parseFloat(rainfall),
        river_level: parseFloat(riverLevel),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRainfall(50);
    setRiverLevel(45);
  };

  const rainfallColor = rainfall > 200
    ? 'var(--risk-high)'
    : rainfall > 100
      ? 'var(--risk-medium)'
      : 'var(--teal-500)';

  const riverColor = riverLevel > 49.68
    ? 'var(--risk-high)'
    : riverLevel > 48
      ? 'var(--risk-medium)'
      : 'var(--risk-low)';

  return (
    <div className="card" style={{ padding: '20px 22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Send size={15} color="var(--teal-500)" />
          Simulation Mode
        </h2>
        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: 6, borderRadius: 7, border: '1px solid var(--gray-200)',
            background: 'var(--gray-50)', cursor: 'pointer', display: 'flex',
            alignItems: 'center', transition: 'all 0.15s',
          }}
          title="Reset values"
        >
          <RotateCcw size={14} color="var(--gray-500)" />
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Rainfall slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplet size={14} color="var(--teal-500)" />
              Rainfall (mm)
            </label>
            <span style={{
              fontSize: 13, fontWeight: 700, color: rainfallColor,
              background: 'var(--teal-50)', border: '1px solid var(--teal-200)',
              padding: '3px 10px', borderRadius: 6,
            }}>
              {rainfall} mm
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="250"
            value={rainfall}
            onChange={(e) => setRainfall(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--gray-400)' }}>
            <span>0 (None)</span>
            <span>125 (Heavy)</span>
            <span>250 (Extreme)</span>
          </div>
        </div>

        {/* River Level slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Waves size={14} color="#3b82f6" />
              River Level (m)
            </label>
            <span style={{
              fontSize: 13, fontWeight: 700, color: riverColor,
              background: '#eff6ff', border: '1px solid #bfdbfe',
              padding: '3px 10px', borderRadius: 6,
            }}>
              {riverLevel} m
            </span>
          </div>
          <input
            type="range"
            min="40"
            max="60"
            step="0.1"
            value={riverLevel}
            onChange={(e) => setRiverLevel(Number(e.target.value))}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--gray-400)' }}>
            <span>40 (Low)</span>
            <span style={{ color: 'var(--risk-high)', fontWeight: 600 }}>⚠ 49.7 Danger</span>
            <span>60 (Extreme)</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-teal"
          style={{ width: '100%', padding: '11px' }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff', borderRadius: '50%',
                display: 'inline-block', animation: 'spin 0.7s linear infinite',
              }} />
              Predicting…
            </>
          ) : (
            <>
              <Send size={14} /> Predict Risk
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PredictionForm;
