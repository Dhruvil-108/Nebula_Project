import React from 'react';
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
      icon: <Unlink className="w-4 h-4 text-rose-400" />
    },
    {
      title: 'Repetitive Manual Data Entry',
      desc: 'Copy-pasting leads to finance, candidate details to HR, and sales forecasts to inventory spreadsheets.',
      icon: <RefreshCcw className="w-4 h-4 text-rose-400" />
    },
    {
      title: 'Zero Cross-Department Visibility',
      desc: 'Finance doesn’t know sales pipeline size; Sales doesn’t know inventory stockouts; HR operates in a silo.',
      icon: <EyeOff className="w-4 h-4 text-rose-400" />
    },
    {
      title: 'Static Data Without Decision Support',
      desc: 'Dashboards display numbers but give no guidance on what actions to take or which bottlenecks to resolve.',
      icon: <Clock className="w-4 h-4 text-rose-400" />
    }
  ];

  const solutions = [
    {
      title: 'Single Unified Data Operating System',
      desc: 'One canonical data model for deals, employees, candidates, receipts, inventory, and KPIs.',
      icon: <Layers className="w-4 h-4 text-emerald-400" />
    },
    {
      title: 'Automatic Cross-Module Workflow Sync',
      desc: 'Hired candidates in ATS flow directly into HRMS. Closed CRM deals trigger inventory reservations and billing.',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    },
    {
      title: '360° Real-Time Operational Visibility',
      desc: 'Executives and managers see synchronized live metrics across all departments on a single pane of glass.',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    },
    {
      title: 'AI-Assisted Decision Intelligence',
      desc: 'Plain-language operational explanations and predictive recommendations highlighting what to do next.',
      icon: <BrainCircuit className="w-4 h-4 text-indigo-400" />
    }
  ];

  return (
    <section id="comparison" className="py-24 relative overflow-hidden bg-slate-950">
      {/* Background glow accents */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="indigo" size="md" className="mb-4">
            The Shift to Unified Operations
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Why modern businesses are replacing fragmented stacks with Nebula.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Compare the operational friction of juggling disconnected tools against the clarity of an all-in-one hub.
          </p>
        </div>

        {/* Side by Side Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Before Nebula Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/50 border border-rose-500/20 backdrop-blur-md relative">
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold block mb-1">
                  The Old Paradigm
                </span>
                <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  Before Nebula (Disconnected Stacks)
                </h3>
              </div>
              <Badge variant="rose" size="sm">Fragmented & Manual</Badge>
            </div>

            <div className="space-y-6">
              {painPoints.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200 mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 bg-rose-950/20 p-4 rounded-xl text-xs text-rose-300/90 font-mono">
              Outcome: Hours lost every week to manual reconciling and delayed decision making.
            </div>
          </div>

          {/* After Nebula Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-md relative shadow-xl shadow-emerald-950/30">
            <div className="absolute top-0 right-8 -translate-y-1/2">
              <Badge variant="emerald" size="sm" dot>The Nebula Standard</Badge>
            </div>

            <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold block mb-1">
                  The New Operating System
                </span>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  After Nebula (Unified Hub)
                </h3>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>

            <div className="space-y-6">
              {solutions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3.5">
                  <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 bg-emerald-950/20 p-4 rounded-xl text-xs text-emerald-300 font-mono flex items-center justify-between">
              <span>Outcome: Manage → Analyze → Automate from one login.</span>
              <span className="text-indigo-400 font-bold">100% Synced</span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
