import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

const ReportFloodModal = ({ isOpen, onClose, onRefresh }) => {
  const [zone, setZone] = useState('Anil Nagar');
  const [severity, setSeverity] = useState('Slight Waterlogging');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const zones = ["Beltola", "Zoo Road", "Anil Nagar", "Bhangagarh", "Uzan Bazaar"];
  const severities = ["Slight Waterlogging", "Knee-Deep", "Severe Flooding"];

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone_name: zone,
          severity,
          description
        })
      });
      if (response.ok) {
        onRefresh();
        onClose();
        setDescription('');
      } else {
        alert('Failed to submit report');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700/50 rounded-xl p-6 w-[400px] shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30 text-yellow-400">
            <AlertTriangle size={20} />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent">Report Flood</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Affected Zone</label>
            <select 
              value={zone} 
              onChange={e => setZone(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</label>
            <select 
              value={severity} 
              onChange={e => setSeverity(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {severities.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="E.g. Knee-deep water blocking the main intersection..."
              required
              rows={3}
              className="bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-gray-200 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium rounded-lg p-3 text-sm transition-colors shadow-lg shadow-blue-900/30"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportFloodModal;
