import React from 'react';
import { Sparkles, TrendingUp, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AiInsightMock: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 rounded-xl border border-indigo-500/30 p-4 text-xs font-sans shadow-xl relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-100 text-sm">Nebula AI Operations Engine</span>
          <Badge variant="indigo" size="sm">Live Insights</Badge>
        </div>
        <span className="text-[10px] text-indigo-300 font-mono">Cross-Module Correlation</span>
      </div>

      <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-lg mb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1 shrink-0" />
          <div>
            <div className="font-semibold text-slate-100 text-[11px] mb-1">
              Sales pipeline velocity increased 34% after onboarding 4 new account executives in ATS.
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              Recommended action: Approve pending PO #1042 in Inventory to avoid inventory bottlenecks in enterprise hardware fulfillments.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
        <span className="text-slate-400 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Impact: <strong className="text-slate-200">+$64k projected quarterly margin</strong>
        </span>
        <button className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[10px]">
          Execute Automation <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
