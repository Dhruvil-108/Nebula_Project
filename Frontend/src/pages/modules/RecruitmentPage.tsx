import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ArrowRight } from 'lucide-react';

const RecruitmentPage: React.FC = () => (
  <div className="flex items-center justify-center min-h-[70vh] px-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-md"
    >
      <div className="relative mb-8 inline-block">
        <div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full" />
        <div className="relative w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <Briefcase className="w-9 h-9 text-amber-400" />
        </div>
      </div>
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-4">
        Coming Soon
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Recruitment — ATS</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-6">
        Post jobs, manage applicants through custom pipeline stages, schedule interviews, and make offers — all without leaving Nebula.
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
        <ArrowRight className="w-4 h-4" />
        Job Posts · Applicants · Interviews · Offers
      </div>
    </motion.div>
  </div>
);

export default RecruitmentPage;
