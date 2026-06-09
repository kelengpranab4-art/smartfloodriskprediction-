import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

const RiskIndicator = ({ risk, score }) => {
  const getStyles = () => {
    switch (risk) {
      case 'High':
        return {
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: <AlertTriangle size={32} className="text-red-500" />,
          shadow: 'shadow-red-500/20'
        };
      case 'Medium':
        return {
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          icon: <AlertCircle size={32} className="text-yellow-500" />,
          shadow: 'shadow-yellow-500/20'
        };
      default:
        return {
          color: 'text-green-500',
          bg: 'bg-green-500/10',
          border: 'border-green-500/20',
          icon: <CheckCircle size={32} className="text-green-500" />,
          shadow: 'shadow-green-500/20'
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`glass p-8 rounded-3xl border ${styles.border} ${styles.shadow} flex flex-col items-center text-center`}
    >
      <div className={`p-4 rounded-full ${styles.bg} mb-4`}>
        {styles.icon}
      </div>
      
      <h3 className="text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">
        Flood Risk Level
      </h3>
      <h2 className={`text-5xl font-black ${styles.color} mb-4`}>
        {risk}
      </h2>
      
      <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden mb-2">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${score * 100}%` }}
          className={`h-full bg-current ${styles.color}`}
        />
      </div>
      <p className="text-gray-500 text-xs">
        Confidence Score: {(score * 100).toFixed(1)}%
      </p>
    </motion.div>
  );
};

export default RiskIndicator;
