import React, { useState } from 'react';
import { DollarSign, User, MoreHorizontal, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface Deal {
  id: string;
  name: string;
  company: string;
  value: string;
  contact: string;
  probability: string;
  stage: 'Qualified' | 'Proposal' | 'Negotiation';
}

export const CrmKanbanMock: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([
    { id: '1', name: 'Global ERP Migration', company: 'Apex BioCorp', value: '$48,500', contact: 'Sarah Jenkins', probability: '85%', stage: 'Negotiation' },
    { id: '2', name: 'Ops Hub Rollout (500 seats)', company: 'Nexus Logistics', value: '$36,000', contact: 'David Kim', probability: '70%', stage: 'Proposal' },
    { id: '3', name: 'ATS + HRMS Suite', company: 'Vanguard Retail', value: '$24,200', contact: 'Elena Vance', probability: '90%', stage: 'Qualified' },
  ]);

  const stages = [
    { name: 'Qualified', count: 4, sum: '$68k', color: 'text-[#ff7a59] border-[#f0512f]/30' },
    { name: 'Proposal', count: 3, sum: '$92k', color: 'text-amber-400 border-amber-500/30' },
    { name: 'Negotiation', count: 2, sum: '$84.5k', color: 'text-emerald-400 border-emerald-500/30' },
  ];

  return (
    <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800 p-4 text-xs font-sans shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#f0512f] animate-pulse" />
          <span className="font-semibold text-slate-200 text-sm">CRM Pipeline</span>
          <Badge variant="brand" size="sm">Q3 Enterprise</Badge>
        </div>
        <div className="text-slate-400 flex items-center gap-1.5 font-mono">
          <span>Weighted:</span>
          <span className="text-emerald-400 font-semibold">$244,500</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {stages.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.name);
          return (
            <div key={stage.name} className="space-y-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  {stage.name}
                </span>
                <span className="text-slate-300 font-mono">{stage.sum}</span>
              </div>

              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-2.5 rounded-md bg-slate-900 border border-slate-800 hover:border-[#f0512f]/40 transition-all duration-150 group cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center justify-between text-slate-200 font-medium mb-1">
                      <span className="truncate pr-1 text-slate-100">{deal.company}</span>
                      <span className="font-mono text-emerald-400 shrink-0 font-semibold">{deal.value}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mb-2">{deal.name}</p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {deal.contact}
                      </span>
                      <span className="text-[#ff8c70] bg-[#f0512f]/10 px-1.5 py-0.5 rounded font-mono text-[9px] border border-[#f0512f]/30">
                        {deal.probability}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
