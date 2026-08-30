import React from 'react';
import { Package, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const InventoryAlertMock: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800 p-4 text-xs font-sans shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-slate-200 text-sm">Inventory & Stock</span>
          <Badge variant="amber" size="sm">Auto-Reorder Active</Badge>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">SKUs tracked: 1,420</span>
      </div>

      <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-100 text-[11px]">Server Rack Component #409-X</div>
            <div className="text-[10px] text-amber-300/80">Stock: 14 units left (Threshold: 25)</div>
          </div>
        </div>
        <button className="px-2.5 py-1 bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 rounded text-[10px] font-medium flex items-center gap-1 transition-colors">
          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
          PO #1042 Sent
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
        <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800/60">
          <span>Supplier: Silico Tech</span>
          <span className="text-emerald-400 font-mono">Lead: 2 Days</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-950/40 rounded border border-slate-800/60">
          <span>Replenishment Cost</span>
          <span className="text-slate-200 font-mono">$4,320.00</span>
        </div>
      </div>
    </div>
  );
};
