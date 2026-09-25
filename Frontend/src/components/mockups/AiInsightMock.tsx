import React from 'react';
import { Sparkles, TrendingUp, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const AiInsightMock: React.FC = () => {
  return (
    <div className="mockup-ai-insight w-full bg-gradient-to-r from-orange-50/90 via-white to-orange-50/50 rounded-xl border border-orange-200/90 p-4 text-xs font-sans shadow-sm relative overflow-hidden">

      <div className="flex items-center justify-between pb-3 mb-3 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center border border-orange-200">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">Nebula AI Operations Engine</span>
          <Badge variant="brand" size="sm">Live Insights</Badge>
        </div>
        <span className="text-[10px] text-[#ea580c] font-mono font-medium">Cross-Module Correlation</span>
      </div>

      <div className="ai-insight-callout p-3 bg-white/95 border border-orange-200/80 rounded-lg mb-3 shadow-2xs">
        <div className="flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#f0512f] mt-1 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900 text-[11px] mb-1">
              Sales pipeline velocity increased 34% after onboarding 4 new account executives in ATS.
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Recommended action: Approve pending PO #1042 in Inventory to avoid inventory bottlenecks in enterprise hardware fulfillments.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-slate-200/80 shadow-2xs">
        <span className="text-slate-600 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Impact: <strong className="text-slate-900">+$64k projected quarterly margin</strong>
        </span>
        <button className="text-[#ea580c] hover:text-[#c2410c] font-semibold flex items-center gap-1 text-[10px]">
          Execute Automation <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
