import React from 'react';
import { Receipt, CheckCircle2, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ExpenseFlowMock: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800 p-4 text-xs font-sans shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200 text-sm">Expense Approvals</span>
          <Badge variant="emerald" size="sm">Auto-Categorized</Badge>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Policy: Auto-audit pass</span>
      </div>

      <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <span className="font-medium text-slate-200 text-[11px]">AWS Cloud & Database Tier-2</span>
          </div>
          <span className="font-mono text-emerald-400 font-bold">$1,840.00</span>
        </div>
        
        {/* Step progress bar */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mt-3">
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1. Submitted</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Mgr Approved</span>
          </div>
          <div className="flex items-center gap-1 text-indigo-300 font-medium bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>3. Finance Audit</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
        <span className="flex items-center gap-1 text-slate-400">
          <FileText className="w-3 h-3 text-slate-500" />
          Attached: receipt_inv_8820.pdf
        </span>
        <span className="text-emerald-400 font-mono">Matched to GL Code 6200</span>
      </div>
    </div>
  );
};
