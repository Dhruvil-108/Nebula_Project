import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Receipt, 
  Package, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  Layers,
  ShieldCheck,
  Search,
  Bell,
  ChevronRight
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CrmKanbanMock } from './CrmKanbanMock';
import { HrmsCardMock } from './HrmsCardMock';
import { ExpenseFlowMock } from './ExpenseFlowMock';
import { InventoryAlertMock } from './InventoryAlertMock';
import { AiInsightMock } from './AiInsightMock';

export const CompositeHeroDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'crm' | 'hrms' | 'expenses' | 'inventory'>('all');

  return (
    <div className="relative w-full max-w-6xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-indigo-500/30 via-slate-800/40 to-slate-900/60 shadow-2xl shadow-indigo-950/50">
      {/* Outer Glow Halo */}
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-60 pointer-events-none" />

      {/* Main Container Shell */}
      <div className="relative bg-slate-950/95 backdrop-blur-xl rounded-xl border border-slate-800/80 overflow-hidden shadow-2xl">
        
        {/* Fake App Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2 text-slate-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="font-mono text-slate-400">app.nebula.io</span>
              <span className="text-slate-600">/</span>
              <span className="text-indigo-400 font-medium">Apex Global Ops</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/60 rounded-md border border-slate-800 text-slate-400 text-[11px]">
              <Search className="w-3 h-3 text-slate-500" />
              <span>Cmd + K to search anything...</span>
            </div>
            <Badge variant="emerald" size="sm" dot>All 6 Systems Live</Badge>
          </div>
        </div>

        {/* Top KPI Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/40 border-b border-slate-800/60 text-left">
          
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pipeline ARR</span>
              <span className="text-emerald-400 font-medium flex items-center text-[11px]">
                +24.8% <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">$1,482,900</div>
            <div className="text-[10px] text-slate-500 mt-1">CRM · 18 deals in closing</div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Headcount & HR</span>
              <span className="text-cyan-400 font-medium flex items-center text-[11px]">
                96% Attendance
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">142 Employees</div>
            <div className="text-[10px] text-slate-500 mt-1">HRMS · 4 offers pending in ATS</div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Monthly Spend</span>
              <span className="text-emerald-400 font-medium flex items-center text-[11px]">
                Under Budget
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">$62,400</div>
            <div className="text-[10px] text-slate-500 mt-1">Expenses · 3 approvals waiting</div>
          </div>

          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Inventory Health</span>
              <span className="text-amber-400 font-medium flex items-center text-[11px]">
                1 Warning
              </span>
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">99.2% Fill Rate</div>
            <div className="text-[10px] text-slate-500 mt-1">Inventory · 1,420 Active SKUs</div>
          </div>

        </div>

        {/* Dashboard Main Visual Layout */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* AI Banner */}
          <AiInsightMock />

          {/* Dual Column Layout: CRM Kanban & Other Modular Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left: CRM Interactive Kanban (7 cols) */}
            <div className="lg:col-span-7">
              <CrmKanbanMock />
            </div>

            {/* Right: Stacked HRMS & Expense / Inventory (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <HrmsCardMock />
              <ExpenseFlowMock />
            </div>

          </div>

          {/* Bottom Bar: Inventory Live Pulse */}
          <InventoryAlertMock />

        </div>

        {/* Bottom Status Banner */}
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              SOC2 Type II Certified
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline">Multi-Tenant Isolated Database</span>
          </div>
          <div className="text-indigo-400 font-medium flex items-center gap-1">
            <span>Unified Data Fabric Active</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

      </div>
    </div>
  );
};
