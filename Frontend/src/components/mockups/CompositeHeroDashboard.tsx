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
    <div className="relative w-full max-w-[1550px] mx-auto">
      {/* Floating Animated Badges for Rich Hero Aesthetics */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="hidden 2xl:flex absolute -top-5 -left-4 z-20 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/8 text-xs text-slate-800"
      >
        <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-600">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-xs">+34% Revenue Velocity</div>
          <div className="text-[10px] text-slate-500 font-mono">Real-time CRM Pipeline</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="hidden 2xl:flex absolute -bottom-5 -right-4 z-20 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/8 text-xs text-slate-800"
      >
        <div className="p-1.5 rounded-xl bg-orange-100 text-[#ea580c]">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-xs">Autonomous AI Copilot</div>
          <div className="text-[10px] text-slate-500 font-mono">Cross-module correlation</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        className="hidden 2xl:flex absolute -top-5 -right-4 z-20 items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-xl shadow-slate-900/8 text-xs text-slate-800"
      >
        <div className="p-1.5 rounded-xl bg-amber-100 text-amber-600">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="font-bold text-slate-900 text-xs">SOC 2 Multi-Tenant</div>
          <div className="text-[10px] text-slate-500 font-mono">Encrypted Partition</div>
        </div>
      </motion.div>

      {/* Main Container Shell */}
      <div className="relative rounded-2xl p-1 bg-gradient-to-b from-orange-200/80 via-slate-200/80 to-slate-200 shadow-2xl shadow-slate-900/10">
        <div className="relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xl">

          {/* Fake App Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="h-4 w-[1px] bg-slate-200" />
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-[#f0512f] animate-pulse" />
                <span className="font-mono text-slate-500">app.nebula.io</span>
                <span className="text-slate-400">/</span>
                <span className="text-[#ea580c] font-semibold">Apex Global Ops</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white rounded-md border border-slate-200 text-slate-500 text-[11px] shadow-2xs">
                <Search className="w-3 h-3 text-slate-400" />
                <span>Cmd + K to search anything...</span>
              </div>
              <Badge variant="emerald" size="sm" dot>All 6 Systems Live</Badge>
            </div>
          </div>

          {/* Top KPI Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 sm:p-5 bg-slate-50/60 border-b border-slate-200 text-left">

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs transition-colors cursor-default"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Pipeline ARR</span>
                <span className="text-emerald-600 font-semibold flex items-center text-[11px]">
                  +24.8% <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">$1,482,900</div>
              <div className="text-[10px] text-slate-500 mt-1">CRM · 18 deals in closing</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs transition-colors cursor-default"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Headcount & HR</span>
                <span className="text-amber-600 font-semibold flex items-center text-[11px]">
                  96% Attendance
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">142 Employees</div>
              <div className="text-[10px] text-slate-500 mt-1">HRMS · 4 offers pending in ATS</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs transition-colors cursor-default"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Monthly Spend</span>
                <span className="text-emerald-600 font-semibold flex items-center text-[11px]">
                  Under Budget
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">$62,400</div>
              <div className="text-[10px] text-slate-500 mt-1">Expenses · 3 approvals waiting</div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="p-3.5 bg-white rounded-xl border border-slate-200 hover:border-orange-300 shadow-xs transition-colors cursor-default"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>Inventory Health</span>
                <span className="text-amber-600 font-semibold flex items-center text-[11px]">
                  1 Warning
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">99.2% Fill Rate</div>
              <div className="text-[10px] text-slate-500 mt-1">Inventory · 1,420 Active SKUs</div>
            </motion.div>

          </div>

          {/* Dashboard Main Visual Layout */}
          <div className="p-4 sm:p-6 space-y-4 bg-slate-50/30">

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
          <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                SOC2 Type II Certified
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-slate-500">Multi-Tenant Isolated Database</span>
            </div>
            <div className="text-[#ea580c] font-semibold flex items-center gap-1">
              <span>Unified Data Fabric Active</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
