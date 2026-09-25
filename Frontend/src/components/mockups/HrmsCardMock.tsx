import React from 'react';
import { Users, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

export const HrmsCardMock: React.FC = () => {
  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 p-4 text-xs font-sans shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold text-slate-900 text-sm">HRMS & People Ops</span>
          <Badge variant="amber" size="sm">142 Active Staff</Badge>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">Today: 96.4% Present</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 block mb-1">Time & Attendance</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-slate-900 font-mono">137 / 142</span>
            <Badge variant="emerald" size="sm" dot>On Track</Badge>
          </div>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
          <span className="text-[10px] text-slate-500 block mb-1">Pending Leave Requests</span>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold text-amber-700 font-mono">3 Requests</span>
            <span className="text-[10px] text-[#ea580c] font-semibold">Review →</span>
          </div>
        </div>
      </div>

      {/* Leave preview row */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 text-[#ea580c] flex items-center justify-center font-bold text-xs">
            AL
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-[11px]">Alex Liang · Lead Engineer</div>
            <div className="text-[10px] text-slate-500">Annual Leave · 3 Days (Sep 2 - Sep 4)</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-semibold transition-colors">
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};
