import React from 'react';
import { motion } from 'framer-motion';
import { 
  XCircle, 
  CheckCircle2, 
  Layers, 
  ArrowRight, 
  Unlink, 
  Sparkles,
  RefreshCcw,
  Clock,
  EyeOff,
  BrainCircuit
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ProblemSolution: React.FC = () => {
  const painPoints = [
    {
      title: 'Fragmented SaaS Sprawl',
      desc: '6 separate subscriptions, 6 logins, disparate data schemas, and broken third-party syncs.',
      icon: <Unlink className="w-4 h-4 text-rose-500" />
    },
    {
      title: 'Repetitive Manual Data Entry',
      desc: 'Copy-pasting leads to finance, candidate details to HR, and sales forecasts to inventory spreadsheets.',
      icon: <RefreshCcw className="w-4 h-4 text-rose-500" />
    },
    {
      title: 'Zero Cross-Department Visibility',
      desc: 'Finance doesn’t know sales pipeline size; Sales doesn’t know inventory stockouts; HR operates in a silo.',
      icon: <EyeOff className="w-4 h-4 text-rose-500" />
    },
    {
      title: 'Static Data Without Decision Support',
      desc: 'Dashboards display numbers but give no guidance on what actions to take or which bottlenecks to resolve.',
      icon: <Clock className="w-4 h-4 text-rose-500" />
    }
  ];

  const solutions = [
    {
      title: 'Single Unified Data Operating System',
      desc: 'One canonical data model for deals, employees, candidates, receipts, inventory, and KPIs.',
      icon: <Layers className="w-4 h-4 text-emerald-500" />
    },
    {
      title: 'Automatic Cross-Module Workflow Sync',
      desc: 'Hired candidates in ATS flow directly into HRMS. Closed CRM deals trigger inventory reservations and billing.',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    },
    {
      title: '360° Real-Time Operational Visibility',
      desc: 'Executives and managers see synchronized live metrics across all departments on a single pane of glass.',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    },
    {
      title: 'AI-Assisted Decision Intelligence',
      desc: 'Plain-language operational explanations and predictive recommendations highlighting what to do next.',
      icon: <BrainCircuit className="w-4 h-4 text-[#ea580c]" />
    }
  ];

  return (
    <section id="comparison" className="py-24 relative overflow-hidden bg-slate-50/80 border-t border-slate-200/80 scroll-mt-20">
      {/* Background glow accents */}
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-1/2 right-0 w-96 h-96 bg-[#f0512f]/5 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge variant="brand" size="md" className="mb-4">
            The Shift to Unified Operations
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4">
            Why modern businesses are replacing fragmented stacks with Nebula.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Compare the operational friction of juggling disconnected tools against the clarity of an all-in-one hub.
          </p>
        </motion.div>

        {/* Side by Side Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Before Nebula Card */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-6 sm:p-10 rounded-3xl bg-white border border-rose-200/90 shadow-lg shadow-rose-500/5 relative transition-shadow hover:shadow-xl hover:shadow-rose-500/10 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-rose-100">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-rose-600 font-semibold block mb-1">
                    The Old Paradigm
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    Before Nebula (Disconnected Stacks)
                  </h3>
                </div>
                <Badge variant="rose" size="sm">Fragmented & Manual</Badge>
              </div>

              <div className="space-y-6">
                {painPoints.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-rose-50/50 transition-colors"
                  >
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-500 shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-rose-100 bg-rose-50/80 p-4 rounded-2xl text-xs sm:text-sm text-rose-800 font-mono border border-rose-200/80">
              Outcome: Hours lost every week to manual reconciling and delayed decision making.
            </div>
          </motion.div>

          {/* After Nebula Card */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="p-6 sm:p-10 rounded-3xl bg-white border-2 border-orange-400 shadow-xl shadow-orange-500/10 relative transition-shadow hover:shadow-2xl hover:shadow-orange-500/15 flex flex-col justify-between"
          >
            <div className="absolute -top-3.5 right-8">
              <Badge variant="brand" size="sm" dot>The Nebula Standard</Badge>
            </div>

            <div>
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-orange-100">
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#ea580c] font-semibold block mb-1">
                    The New Operating System
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    After Nebula (Unified Hub)
                  </h3>
                </div>
                <Sparkles className="w-5 h-5 text-[#f0512f]" />
              </div>

              <div className="space-y-6">
                {solutions.map((item, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1, duration: 0.4 }}
                    className="flex items-start gap-4 p-3 rounded-xl hover:bg-orange-50/50 transition-colors"
                  >
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-orange-100 bg-orange-50/80 p-4 rounded-2xl text-xs sm:text-sm text-[#ea580c] font-mono flex items-center justify-between border border-orange-200">
              <span>Outcome: Manage → Analyze → Automate from one login.</span>
              <span className="text-white font-bold bg-[#f0512f] px-2.5 py-1 rounded-lg text-[10px]">100% Synced</span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
