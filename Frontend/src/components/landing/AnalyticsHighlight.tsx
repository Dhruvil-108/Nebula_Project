import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight, 
  BrainCircuit, 
  Zap, 
  Layers, 
  CheckCircle2, 
  BarChart2, 
  LineChart,
  ShieldAlert
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

export const AnalyticsHighlight: React.FC = () => {
  const navigate = useNavigate();

  const insights = [
    {
      type: 'Predictive Sales & Capacity',
      title: 'Deal close velocity +34% after 4 new AEs completed onboarding in HRMS.',
      action: 'Recommendation: Approve requisition for 2 additional technical solutions engineers in ATS to avoid implementation bottlenecks.',
      impact: '+$140k ARR Projected',
      tag: 'Cross-Module Correlation'
    },
    {
      type: 'Supply Chain & Cash Flow',
      title: 'Inventory SKU #409-X stock levels will deplete in 5 days at current sales run-rate.',
      action: 'Recommendation: PO #1042 generated automatically. Manager pre-authorization ready for finance approval.',
      impact: 'Zero fulfillment delay',
      tag: 'Automated Prevention'
    },
    {
      type: 'Spend Governance',
      title: 'Monthly cloud infrastructure expenditure is 14% below quarterly allocation budget.',
      action: 'Recommendation: Reallocate $8,500 surplus toward Q4 lead acquisition campaigns.',
      impact: 'Budget Optimized',
      tag: 'Financial Efficiency'
    }
  ];

  return (
    <section id="analytics" className="py-24 relative overflow-hidden bg-slate-50/70 border-t border-slate-200/80 scroll-mt-20">
      {/* Background ambient lighting */}
      <motion.div 
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-tr from-[#f0512f]/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" 
      />

      <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge variant="brand" size="md" className="mb-4">
            Unified Analytics + Autonomous AI
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4">
            Not just raw data. <br />
            <span className="text-gradient-accent">Actionable intelligence that guides decisions.</span>
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Traditional dashboards force you to spend hours hunting for correlations. Nebula’s AI engine analyzes cross-module patterns in real-time and provides clear, plain-language recommendations.
          </p>
        </motion.div>

        {/* Big Feature Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (5 cols): Feature details */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6 text-left"
          >
            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200 inline-flex items-center gap-2 text-[#ea580c] text-xs font-semibold">
              <BrainCircuit className="w-4 h-4 text-[#f0512f]" />
              <span>Plain-Language Operational Guidance</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
              Know what happened, why it happened, and what to do next.
            </h3>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Because all six modules share the exact same underlying tenant data model, Nebula can connect dots that isolated point solutions never see.
            </p>

            <div className="space-y-3.5 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-orange-100 text-[#ea580c] border border-orange-200 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Synthesized Executive KPIs</h4>
                  <p className="text-xs text-slate-600">Blended CAC, Employee Output, Burn Multiple, and Fill Rate in one view.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700 border border-amber-200 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Automated Anomaly Detection</h4>
                  <p className="text-xs text-slate-600">Proactively identifies budget drift, inventory shortages, or hiring bottlenecks before they impact customers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">1-Click Automation Execution</h4>
                  <p className="text-xs text-slate-600">Execute recommended operational workflows directly from the insight card with full audit logging.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
                className="shadow-lg shadow-[#f0512f]/20"
              >
                Experience Unified Analytics
              </Button>
            </div>
          </motion.div>

          {/* Right Column (7 cols): Stylized AI Insights Feed & Chart Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 space-y-4"
          >
            
            {/* Chart visualization snippet */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#f0512f] animate-pulse" />
                  <span className="font-bold text-slate-900 text-sm">Enterprise Cross-Department Velocity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="sm">+28.4% Efficiency</Badge>
                  <span className="text-[11px] font-mono text-slate-500">Real-Time Sync</span>
                </div>
              </div>

              {/* Stylized Bars Preview with Framer Motion fill animation */}
              <div className="space-y-4 mb-7">
                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1.5">
                    <span className="font-medium">Revenue Velocity (CRM)</span>
                    <span className="font-mono text-emerald-600 font-semibold">$1.48M (114% of Target)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '88%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-to-r from-[#f0512f] to-[#ff8c70] rounded-full" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1.5">
                    <span className="font-medium">Staffing Fulfillment & Retention (HRMS/ATS)</span>
                    <span className="font-mono text-amber-600 font-semibold">96.4% Operational</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '94%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full" 
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-700 mb-1.5">
                    <span className="font-medium">Spend Efficiency (Expenses & Inventory)</span>
                    <span className="font-mono text-emerald-600 font-semibold">92.8% Policy Match</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      whileInView={{ width: '78%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-[#f0512f] rounded-full" 
                    />
                  </div>
                </div>
              </div>

              {/* Feed of Live AI Plain-Language Cards */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-semibold block">
                  Active Plain-Language AI Insights
                </span>

                {insights.map((item, idx) => (
                  <motion.div 
                    key={idx}
                    whileHover={{ x: 6, transition: { duration: 0.15 } }}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-orange-300 hover:bg-orange-50/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-[#ea580c] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.impact}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mb-1">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug mb-2">
                      {item.action}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-200/80">
                      <span>{item.tag}</span>
                      <span className="text-[#ea580c] font-semibold hover:underline">
                        Apply Suggested Action →
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>

          </motion.div>

        </div>

      </div>
    </section>
  );
};
