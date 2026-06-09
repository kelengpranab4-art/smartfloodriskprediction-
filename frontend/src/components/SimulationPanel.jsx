import React, { useState } from 'react';
import axios from 'axios';
import { Sliders, Droplets, Waves, RefreshCw, Play, CloudRain, Mountain, Settings, ThermometerSun } from 'lucide-react';

export default function SimulationPanel({ onSimulateResult }) {
  const [rainfall, setRainfall] = useState(50);
  const [riverLevel, setRiverLevel] = useState(48.5);
  const [humidity, setHumidity] = useState(75);
  const [soilMoisture, setSoilMoisture] = useState(0.5);
  const [drainageCap, setDrainageCap] = useState(0.4);
  const [temp, setTemp] = useState(28);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8000/predict', {
        rainfall: parseFloat(rainfall),
        river_level: parseFloat(riverLevel),
        humidity: parseFloat(humidity),
        soil_moisture: parseFloat(soilMoisture),
        drainage_cap: parseFloat(drainageCap),
        temp: parseFloat(temp)
      });
      onSimulateResult({ zone: 'Simulation', rainfall, river_level: riverLevel, ...res.data });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const rainfallColor = rainfall > 200 ? 'var(--risk-high)' : rainfall > 100 ? 'var(--risk-medium)' : 'var(--teal-500)';
  const riverColor = riverLevel > 49.68 ? 'var(--risk-high)' : riverLevel > 48 ? 'var(--risk-medium)' : 'var(--risk-low)';
  const humidityColor = humidity > 90 ? 'var(--risk-high)' : humidity > 70 ? 'var(--risk-medium)' : '#3b82f6';
  const soilColor = soilMoisture > 0.8 ? 'var(--risk-high)' : soilMoisture > 0.5 ? 'var(--risk-medium)' : '#8b5cf6';
  const drainColor = drainageCap > 0.8 ? 'var(--risk-high)' : drainageCap > 0.5 ? 'var(--risk-medium)' : '#f59e0b';
  const tempColor = temp > 35 ? 'var(--risk-high)' : temp < 20 ? '#3b82f6' : '#eab308';

  return (
    <div className="card" style={{ padding: '18px 20px' }}>

      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--teal-50)', border: '1px solid var(--teal-200)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sliders size={15} color="var(--teal-600, var(--teal-500))" />
        </div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--gray-900)', lineHeight: 1 }}>Scenario Simulator</h3>
          <p style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>Hybrid Model (6 Features)</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Rainfall */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplets size={14} color="var(--teal-500)" />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>Rainfall</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: rainfallColor }}>{rainfall} mm</div>
          </div>
          <input type="range" min="0" max="300" step="1" value={rainfall} onChange={e => setRainfall(e.target.value)} />
        </div>

        {/* River Level */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Waves size={14} color="#3b82f6" />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>River Level</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: riverColor }}>{riverLevel} m</div>
          </div>
          <input type="range" min="42" max="55" step="0.1" value={riverLevel} onChange={e => setRiverLevel(e.target.value)} />
        </div>

        {/* Humidity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CloudRain size={14} color="#3b82f6" />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>Humidity</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: humidityColor }}>{humidity} %</div>
          </div>
          <input type="range" min="40" max="100" step="1" value={humidity} onChange={e => setHumidity(e.target.value)} />
        </div>

        {/* Soil Moisture */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mountain size={14} color="#8b5cf6" />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>Soil Saturation</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: soilColor }}>{(soilMoisture * 100).toFixed(0)} %</div>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={soilMoisture} onChange={e => setSoilMoisture(e.target.value)} />
        </div>

        {/* Drainage Capacity */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Settings size={14} color="#f59e0b" />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>Drainage Blockage</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: drainColor }}>{(drainageCap * 100).toFixed(0)} %</div>
          </div>
          <input type="range" min="0" max="1" step="0.05" value={drainageCap} onChange={e => setDrainageCap(e.target.value)} />
        </div>

        {/* Temperature */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ThermometerSun size={14} color="#eab308" />
              <span style={{ fontSize: 13, color: 'var(--gray-700)', fontWeight: 500 }}>Temperature</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: tempColor }}>{temp} °C</div>
          </div>
          <input type="range" min="15" max="45" step="0.5" value={temp} onChange={e => setTemp(e.target.value)} />
        </div>

        <button onClick={handleSimulate} disabled={loading} className="btn-teal" style={{ width: '100%', padding: '11px', marginTop: 4 }}>
          {loading
            ? <><RefreshCw size={14} className="animate-spin" /> Running…</>
            : <><Play size={14} /> Run Prediction</>}
        </button>
      </div>
    </div>
  );
}
