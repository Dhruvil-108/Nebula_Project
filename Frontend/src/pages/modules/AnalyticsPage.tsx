import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, ArrowRight } from 'lucide-react';

const AnalyticsPage: React.FC = () => (
  <div className="flex items-center justify-center min-h-[70vh] px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <div className="relative mb-8 inline-block">
        <div className="absolute inset-0 bg-violet-500/20 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto">
          <BarChart3 className="w-9 h-9 text-violet-400" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold mb-4">
        Coming Soon
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Unified Analytics</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Cross-module business intelligence: revenue trends, workforce analytics, recruitment funnel metrics, and custom reports in one unified view.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <ArrowRight className="w-4 h-4" />
        Revenue · Workforce · Funnel · Custom Reports
      </div>
    </motion.div>
  </div>
);

export default AnalyticsPage;
