import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ShieldAlert, Navigation } from 'lucide-react';

const ActionableInsights = ({ reason, actions }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="glass p-6 rounded-2xl border border-white/5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
            <Lightbulb size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Explainable Why</h3>
        </div>
        <p className="text-gray-300 leading-relaxed italic border-l-4 border-blue-500/50 pl-4 py-2 bg-blue-500/5 rounded-r-lg">
          "{reason}"
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-6 rounded-2xl border border-white/5"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
            <ShieldAlert size={20} />
          </div>
          <h3 className="text-lg font-bold text-white">Recommended Actions</h3>
        </div>
        <ul className="space-y-3">
          {actions.map((action, index) => (
            <li key={index} className="flex items-start gap-3 group text-gray-400 hover:text-white transition-colors">
              <span className="flex-shrink-0 w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-xs font-bold group-hover:bg-teal-500/20 group-hover:text-teal-400 transition-colors">
                {index + 1}
              </span>
              <span className="text-sm">{action}</span>
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
         initial={{ opacity: 0, x: 20 }}
         animate={{ opacity: 1, x: 0 }}
         transition={{ delay: 0.2 }}
         className="glass p-6 rounded-2xl border border-white/5 flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-all group"
      >
        <div className="p-3 bg-white/5 rounded-xl text-gray-400 group-hover:text-accent transition-colors">
          <Navigation size={24} />
        </div>
        <div>
          <h4 className="text-white font-bold group-hover:text-accent transition-colors">View Risk Map</h4>
          <p className="text-xs text-gray-500">Analyze Guwahati zones & topography</p>
        </div>
      </motion.div>
    </div>
  );
};

export default ActionableInsights;
