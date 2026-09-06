import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { KpiCard, KpiCardSkeleton } from '../components/dashboard/KpiCard';
import { EmptyState } from '../components/dashboard/EmptyState';
import { AttendanceCard } from '../components/dashboard/AttendanceCard';
import { LeaveBalanceCard } from '../components/dashboard/LeaveBalanceCard';
import { MonthlyHoursCard } from '../components/dashboard/MonthlyHoursCard';
import { UpcomingHolidaysCard } from '../components/dashboard/UpcomingHolidaysCard';
import { PresentAbsentCard } from '../components/dashboard/PresentAbsentCard';
import type { Role } from '../types/user';
import type { DashboardData, KpiCardData, ChartDataPoint } from '../types/dashboard';
import {
  mockExecutiveData,
  mockSalesData,
  mockHrData,
  mockFinanceData,
  mockInventoryData,
  mockEmployeeData,
} from '../data/mockDashboardData';

// ─────────────────────────────────────────────────────────
// Helper: select mock data by role
// ─────────────────────────────────────────────────────────

const getDashboardData = (role: Role): DashboardData => {
  if (role === 'super_admin' || role === 'admin' || role === 'manager') {
    return mockExecutiveData;
  }
  if (role === 'sales') return mockSalesData;
  if (role === 'hr') return mockHrData;
  if (role === 'finance') return mockFinanceData;
  if (role === 'inventory_manager') return mockInventoryData;
  return mockEmployeeData;
};

// ─────────────────────────────────────────────────────────
// Chart color palette (Zorvi brand + semantic colors)
// ─────────────────────────────────────────────────────────

const CHART_COLORS = ['#f0512f', '#ff7a59', '#0e9f6e', '#f59e0b', '#ef4444', '#f97316', '#38bdf8'];

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-slate-100 font-semibold">
          {typeof p.value === 'number' && p.value >= 1000
            ? `$${(p.value / 1000).toFixed(0)}K`
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Chart sections by view type
// ─────────────────────────────────────────────────────────

const ExecutiveCharts: React.FC<{ revenueChart: ChartDataPoint[]; headcountChart: ChartDataPoint[] }> = ({
  revenueChart,
  headcountChart,
}) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Revenue vs Expenses */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Revenue vs Expenses</h3>
          <p className="text-xs text-slate-500">Last 7 months</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#f0512f]" />Revenue
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />Expenses
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={revenueChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f0512f" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f0512f" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" stroke="#f0512f" strokeWidth={2} fill="url(#revGrad)" dot={false} />
          <Area type="monotone" dataKey="secondary" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>

    {/* Headcount trend */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-100">Headcount Growth</h3>
        <p className="text-xs text-slate-500">Last 7 months</p>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={headcountChart} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#f0512f" fillOpacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  </div>
);

const PipelineChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60"
  >
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-100">Pipeline Stage Breakdown</h3>
      <p className="text-xs text-slate-500">Active leads by stage</p>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 40, bottom: 0 }} barSize={18}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis dataKey="label" type="category" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

const GenericBarChart: React.FC<{ data: ChartDataPoint[]; title: string; subtitle: string }> = ({
  data,
  title,
  subtitle,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/60"
  >
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={32}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

// ─────────────────────────────────────────────────────────
// DashboardPage
// ─────────────────────────────────────────────────────────

const SHOW_EMPTY_STATE = false; // Set to false to show the active interactive daily-use attendance dashboard

const DashboardPage: React.FC = () => {
  const { user, organization, isLoading } = useAuth();

  const dashboardData = useMemo(() => {
    if (!user) return null;
    return getDashboardData(user.role);
  }, [user]);

  const kpis: KpiCardData[] = dashboardData?.kpis ?? [];

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <KpiCardSkeleton key={i} index={i} />)}
        </div>
      </div>
    );
  }

  if (!user || !organization) return null;

  // ── Empty state fallback (if specifically toggled) ──
  if (SHOW_EMPTY_STATE) {
    return (
      <div className="relative overflow-hidden">
        <EmptyState role={user.role} primaryFocus={organization.primaryFocus} />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Welcome header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient-accent">{user.fullName.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {organization.name} · Here's your daily attendance & operations overview.
          </p>
        </div>

        {/* Quick date/time badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </motion.div>

      {/* ── Attendance & Time Tracking Section (Primary daily-use surface) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Daily Time & Attendance
          </h3>
        </div>

        {/* Top 3 Attendance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Primary Check In / Out Card (Largest, top-left) */}
          <div className="lg:col-span-5 flex flex-col">
            <AttendanceCard />
          </div>

          {/* Monthly Hours Card */}
          <div className="lg:col-span-4 flex flex-col">
            <MonthlyHoursCard />
          </div>

          {/* Leave Balance Card */}
          <div className="lg:col-span-3 flex flex-col">
            <LeaveBalanceCard />
          </div>
        </div>

        {/* Secondary Attendance Row: Present/Absent Matrix & Upcoming Holidays */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1">
          {/* Present/Absent Summary & Heatmap */}
          <div className="lg:col-span-7 flex flex-col">
            <PresentAbsentCard />
          </div>

          {/* Upcoming Holidays */}
          <div className="lg:col-span-5 flex flex-col">
            <UpcomingHolidaysCard />
          </div>
        </div>
      </div>

      {/* ── Role KPIs & Overview ── */}
      <div className="pt-4 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Organization & Performance KPIs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.id} data={kpi} index={i} />
          ))}
        </div>
      </div>

      {/* ── Charts (role-specific) ── */}
      {dashboardData?.viewType === 'executive' && (
        <ExecutiveCharts
          revenueChart={dashboardData.revenueChart}
          headcountChart={dashboardData.headcountChart}
        />
      )}

      {dashboardData?.viewType === 'sales' && (
        <PipelineChart data={dashboardData.pipelineChart} />
      )}

      {dashboardData?.viewType === 'hr' && (
        <GenericBarChart
          data={dashboardData.attendanceChart}
          title="Weekly Attendance"
          subtitle="Present vs absent this week"
        />
      )}

      {dashboardData?.viewType === 'finance' && (
        <GenericBarChart
          data={dashboardData.spendChart}
          title="Spend by Category"
          subtitle="This month's expense breakdown"
        />
      )}

      {dashboardData?.viewType === 'inventory' && (
        <GenericBarChart
          data={dashboardData.stockChart}
          title="Stock Value by Category"
          subtitle="Current inventory breakdown"
        />
      )}
    </div>
  );
};

export default DashboardPage;
