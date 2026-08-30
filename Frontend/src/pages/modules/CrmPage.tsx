import React from 'react';
import { motion } from 'framer-motion';
import { Users, ArrowRight } from 'lucide-react';

const CrmPage: React.FC = () => (
  <div className="flex items-center justify-center min-h-[70vh] px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <div className="relative mb-8 inline-block">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <Users className="w-9 h-9 text-emerald-400" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
        Coming Soon
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">CRM — Leads & Pipeline</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Manage contacts, track deals through your sales pipeline, log activities, and close more business. Full CRM module launching in the next sprint.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <ArrowRight className="w-4 h-4" />
        Leads · Pipeline · Contacts · Activities
      </div>
    </motion.div>
  </div>
);

export default CrmPage;
