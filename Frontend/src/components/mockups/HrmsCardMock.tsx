import React from 'react';
import { Users, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const HrmsCardMock: React.FC = () => {
  return (
    <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800 p-4 text-xs font-sans shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-slate-200 text-sm">HRMS & People Ops</span>
          <Badge variant="cyan" size="sm">142 Active Staff</Badge>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Today: 96.4% Present</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-1">Time & Attendance</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-100 font-mono">137 / 142</span>
            <Badge variant="emerald" size="sm" dot>On Track</Badge>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800/80">
          <span className="text-[10px] text-slate-400 block mb-1">Pending Leave Requests</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-amber-300 font-mono">3 Requests</span>
            <span className="text-[10px] text-indigo-400 font-medium">Review →</span>
          </div>
        </div>
      </div>

      {/* Leave preview row */}
      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center font-bold text-xs">
            AL
          </div>
          <div>
            <div className="font-medium text-slate-200 text-[11px]">Alex Liang · Lead Engineer</div>
            <div className="text-[10px] text-slate-400">Annual Leave · 3 Days (Sep 2 - Sep 4)</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-medium transition-colors">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
