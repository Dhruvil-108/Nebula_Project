import React from 'react';
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
    <section id="analytics" className="py-24 relative overflow-hidden bg-slate-950 border-t border-slate-800/80">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-[#f0512f]/10 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" size="md" className="mb-4">
            Unified Analytics + Autonomous AI
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Not just raw data. <br />
            <span className="text-gradient-accent">Actionable intelligence that guides decisions.</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Traditional dashboards force you to spend hours hunting for correlations. Nebula’s AI engine analyzes cross-module patterns in real-time and provides clear, plain-language recommendations.
          </p>
        </div>

        {/* Big Feature Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column (5 cols): Feature details */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="p-3 rounded-xl bg-[#f0512f]/10 border border-[#f0512f]/20 inline-flex items-center gap-2 text-[#ff8c70] text-xs font-semibold">
              <BrainCircuit className="w-4 h-4 text-[#f0512f]" />
              <span>Plain-Language Operational Guidance</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Know what happened, why it happened, and what to do next.
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              Because all six modules share the exact same underlying tenant data model, Nebula can connect dots that isolated point solutions never see.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-[#f0512f]/20 text-[#ff8c70] border border-[#f0512f]/30 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Synthesized Executive KPIs</h4>
                  <p className="text-xs text-slate-400">Blended CAC, Employee Output, Burn Multiple, and Fill Rate in one view.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Automated Anomaly Detection</h4>
                  <p className="text-xs text-slate-400">Proactively identifies budget drift, inventory shortages, or hiring bottlenecks before they impact customers.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">1-Click Automation Execution</h4>
                  <p className="text-xs text-slate-400">Execute recommended operational workflows directly from the insight card with full audit logging.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowUpRight className="w-4 h-4" />}
              >
                Experience Unified Analytics
              </Button>
            </div>
          </div>

          {/* Right Column (7 cols): Stylized AI Insights Feed & Chart Panel */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Chart visualization snippet */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f0512f]" />
                  <span className="font-bold text-slate-100 text-sm">Enterprise Cross-Department Velocity</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="sm">+28.4% Efficiency</Badge>
                  <span className="text-[11px] font-mono text-slate-400">Real-Time Sync</span>
                </div>
              </div>

              {/* Stylized Bars Preview */}
              <div className="space-y-3 mb-6">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Revenue Velocity (CRM)</span>
                    <span className="font-mono text-emerald-400 font-semibold">$1.48M (114% of Target)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#f0512f] to-[#ff8c70] rounded-full w-[88%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Staffing Fulfillment & Retention (HRMS/ATS)</span>
                    <span className="font-mono text-amber-300 font-semibold">96.4% Operational</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full w-[94%]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>Spend Efficiency (Expenses & Inventory)</span>
                    <span className="font-mono text-emerald-300 font-semibold">92.8% Policy Match</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-[#f0512f] rounded-full w-[78%]" />
                  </div>
                </div>
              </div>

              {/* Feed of Live AI Plain-Language Cards */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block">
                  Active Plain-Language AI Insights
                </span>

                {insights.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-[#f0512f]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-semibold text-[#ff8c70] flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#f0512f]" />
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                        {item.impact}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-100 mb-1">
                      {item.title}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug mb-2">
                      {item.action}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">{item.tag}</span>
                      <span className="text-[#ff7a59] font-medium cursor-pointer hover:underline">
                        Apply Suggested Action →
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
