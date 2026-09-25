import React from 'react';
import { motion } from 'framer-motion';

export const TrustStrip: React.FC = () => {
  const companies = [
    { name: 'VANGUARD TECH', symbol: 'VT' },
    { name: 'NEXUS LOGISTICS', symbol: 'NL' },
    { name: 'APEX HEALTH', symbol: 'AH' },
    { name: 'STRATA FINANCE', symbol: 'SF' },
    { name: 'AETHER DIGITAL', symbol: 'AD' },
    { name: 'CYBERION LABS', symbol: 'CL' },
  ];

  return (
    <section className="py-16 border-y border-slate-200/80 bg-slate-50/60 relative overflow-hidden">
      <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">
          Trusted by operations leaders and fast-growing organizations worldwide
        </p>

        {/* Company Wordmarks Strip with Hover Bounce */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center mb-14">
          {companies.map((company, idx) => (
            <motion.div 
              key={company.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              whileHover={{ y: -3, scale: 1.05 }}
              className="flex items-center gap-2.5 text-slate-600 hover:text-slate-900 transition-colors font-mono font-semibold tracking-wider text-xs cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[11px] text-[#ea580c] font-bold border border-slate-200 shadow-xs">
                {company.symbol}
              </div>
              <span className="text-slate-700">{company.name}</span>
            </motion.div>
          ))}
        </div>

        {/* Key Metrics Grid with Animated Stagger */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10 border-t border-slate-200 text-center">
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            className="p-4 rounded-xl transition-transform"
          >
            <div className="text-3xl sm:text-5xl font-extrabold text-slate-900 font-mono tracking-tight text-gradient">
              6-in-1
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
              Modules Unified in One Single Data Fabric
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="p-4 rounded-xl transition-transform"
          >
            <div className="text-3xl sm:text-5xl font-extrabold text-[#ea580c] font-mono tracking-tight">
              40%
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
              Average Reduction in Admin & Manual Data Overhead
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4 }}
            className="p-4 rounded-xl transition-transform"
          >
            <div className="text-3xl sm:text-5xl font-extrabold text-[#f0512f] font-mono tracking-tight">
              100%
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
              Organization-Level Multi-Tenant Data Isolation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4 }}
            className="p-4 rounded-xl transition-transform"
          >
            <div className="text-3xl sm:text-5xl font-extrabold text-emerald-600 font-mono tracking-tight">
              99.99%
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1.5">
              High Availability Enterprise SLA Guarantee
            </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
