import React from 'react';
import { Package, AlertTriangle, RefreshCw, Layers } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const InventoryAlertMock: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 text-xs font-sans shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold text-slate-900 text-sm">Inventory & Stock</span>
          <Badge variant="amber" size="sm">Auto-Reorder Active</Badge>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">SKUs tracked: 1,420</span>
      </div>

      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 text-[11px]">Server Rack Component #409-X</div>
            <div className="text-[10px] text-amber-800 font-medium">Stock: 14 units left (Threshold: 25)</div>
          </div>
        </div>
        <button className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors">
          <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-700" />
          PO #1042 Sent
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600">
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
          <span>Supplier: Silico Tech</span>
          <span className="text-emerald-700 font-mono font-medium">Lead: 2 Days</span>
        </div>
        <div className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200">
          <span>Replenishment Cost</span>
          <span className="text-slate-900 font-mono font-bold">$4,320.00</span>
        </div>
      </div>
    </div>
  );
};
