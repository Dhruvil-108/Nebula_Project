import React from 'react';
import { Receipt, CheckCircle2, ArrowRight, ShieldCheck, FileText } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const ExpenseFlowMock: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 text-xs font-sans shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-900 text-sm">Expense Approvals</span>
          <Badge variant="emerald" size="sm">Auto-Categorized</Badge>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Policy: Auto-audit pass</span>
      </div>

      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-[#f0512f]" />
            <span className="font-semibold text-slate-800 text-[11px]">AWS Cloud & Database Tier-2</span>
          </div>
          <span className="font-mono text-emerald-600 font-bold">$1,840.00</span>
        </div>
        
        {/* Step progress bar */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mt-3">
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>1. Submitted</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>2. Mgr Approved</span>
          </div>
          <div className="flex items-center gap-1 text-[#ea580c] font-semibold bg-orange-100/70 px-1.5 py-0.5 rounded border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-ping" />
            <span>3. Finance Audit</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <span className="flex items-center gap-1 text-slate-500">
          <FileText className="w-3 h-3 text-slate-400" />
          Attached: receipt_inv_8820.pdf
        </span>
        <span className="text-emerald-700 font-mono font-medium">Matched to GL Code 6200</span>
      </div>
    </div>
  );
};
