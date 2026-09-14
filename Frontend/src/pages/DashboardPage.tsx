import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Users,
  CheckCircle2,
  CalendarClock,
  ShieldCheck,
  Clock,
  Calendar,
  CalendarCheck,
  UserPlus,
  ArrowRight,
  Sparkles,
  Check,
  X,
  RefreshCw,
  Search,
  Coffee,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';
import { useCrmSummary } from '../hooks/useCrm';
import { KpiCard, KpiCardSkeleton } from '../components/dashboard/KpiCard';
import { AttendanceCard } from '../components/dashboard/AttendanceCard';
import { LeaveBalanceCard } from '../components/dashboard/LeaveBalanceCard';
import { MonthlyHoursCard } from '../components/dashboard/MonthlyHoursCard';
import { UpcomingHolidaysCard } from '../components/dashboard/UpcomingHolidaysCard';
import { PresentAbsentCard } from '../components/dashboard/PresentAbsentCard';
import { ROLE_LABELS, ROLE_COLORS, type Role } from '../types/user';
import type { KpiCardData } from '../types/dashboard';

interface OrganizationDashboardStats {
  organization: {
    id: string;
    name: string;
    timezone: string;
    shiftStartTime: string;
  };
  stats: {
    totalAccounts: number;
    roleDistribution: Record<string, number>;
    activeRolesList: string[];
    checkedInTodayCount: number;
    onBreakTodayCount: number;
    checkedOutTodayCount: number;
    notCheckedInTodayCount: number;
    activeTodayTotal: number;
    todayAttendanceRate: number;
    pendingLeavesCount: number;
    configuredPermissionsCount: number;
    managedStaffCount: number;
    upcomingHolidaysCount: number;
  };
  personal: {
    myCurrentStatus: 'checked_in' | 'checked_out' | 'on_break' | 'not_checked_in';
    myDaysPresent: number;
    myWorkedHours: number;
    myRemainingLeaves: number;
    myPendingLeavesCount: number;
  };
  todayRoster: Array<{
    userId: string;
    fullName: string;
    email: string;
    role: Role;
    status: 'checked_in' | 'checked_out' | 'on_break' | 'not_checked_in';
    checkInAt: string | null;
    checkOutAt: string | null;
    workedMinutes: number;
    isLate: boolean;
  }>;
  pendingLeaves: Array<{
    id: string;
    employeeName: string;
    employeeEmail: string;
    employeeRole: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    createdAt: string;
  }>;
  upcomingHolidays: Array<{
    id: string;
    name: string;
    date: string;
    dayOfWeek: string;
  }>;
}

export const DashboardPage: React.FC = () => {
  const { user, organization, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const [rosterSearch, setRosterSearch] = useState('');

  // ── Fetch real live dashboard statistics ──
  const {
    data: dashboardData,
    isLoading: isStatsLoading,
    refetch,
    isRefetching,
  } = useQuery<OrganizationDashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get<OrganizationDashboardStats>('/dashboard/stats');
      return res.data;
    },
    refetchInterval: 15000, // Live poll every 15s for attendance synchronization
  });

  // ── CRM summary KPIs (slotted into the existing KPI-card contract) ──
  const { data: crmSummary, isLoading: isCrmSummaryLoading } = useCrmSummary();

  // ── Leave approvals mutations (for Admin, Super Admin, HR, Manager) ──
  const approveLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/leaves/requests/${id}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Leave request approved successfully.');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to approve leave request.');
    },
  });

  const rejectLeaveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/leaves/requests/${id}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.info('Leave request rejected.');
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to reject leave request.');
    },
  });

  // ── Generate 100% REAL role-specific KPI cards based on active user role ──
  const roleKpis: KpiCardData[] = useMemo(() => {
    if (!dashboardData || !user) return [];

    const { stats, personal } = dashboardData;
    const role = user.role;

    if (role === 'super_admin' || role === 'admin') {
      return [
        {
          id: 'total-accounts',
          title: 'Total Accounts',
          value: stats.totalAccounts,
          trendPercent: null,
          trendLabel: 'Active workspace accounts',
          iconName: 'Users',
          colorClasses: 'bg-indigo-500/10 text-indigo-400',
        },
        {
          id: 'checked-in-today',
          title: "Today's Check-ins",
          value: `${stats.checkedInTodayCount} / ${stats.totalAccounts}`,
          trendPercent: stats.todayAttendanceRate > 0 ? stats.todayAttendanceRate : null,
          trendLabel: `${stats.todayAttendanceRate}% attendance rate`,
          iconName: 'CheckCircle2',
          colorClasses: 'bg-emerald-500/10 text-emerald-400',
        },
        {
          id: 'pending-leaves',
          title: 'Pending Leaves',
          value: stats.pendingLeavesCount,
          trendPercent: null,
          trendLabel: stats.pendingLeavesCount === 1 ? '1 awaiting review' : `${stats.pendingLeavesCount} awaiting review`,
          iconName: 'CalendarClock',
          colorClasses: 'bg-amber-500/10 text-amber-400',
        },
        {
          id: 'configured-permissions',
          title: 'Configured Permissions',
          value: stats.configuredPermissionsCount,
          trendPercent: null,
          trendLabel: `${stats.activeRolesList.length} active roles in matrix`,
          iconName: 'ShieldCheck',
          colorClasses: 'bg-orange-500/10 text-orange-400',
        },
      ];
    }

    if (role === 'hr') {
      return [
        {
          id: 'managed-staff',
          title: 'Managed Team Staff',
          value: stats.managedStaffCount,
          trendPercent: null,
          trendLabel: 'Employees, interns & recruiters',
          iconName: 'Users',
          colorClasses: 'bg-rose-500/10 text-rose-400',
        },
        {
          id: 'attendance-rate',
          title: "Today's Attendance",
          value: `${stats.todayAttendanceRate}%`,
          trendPercent: null,
          trendLabel: `${stats.checkedInTodayCount} of ${stats.totalAccounts} checked in today`,
          iconName: 'CheckCircle2',
          colorClasses: 'bg-emerald-500/10 text-emerald-400',
        },
        {
          id: 'hr-pending-leaves',
          title: 'Pending Leave Approvals',
          value: stats.pendingLeavesCount,
          trendPercent: null,
          trendLabel: stats.pendingLeavesCount > 0 ? 'Requires HR action' : 'All caught up',
          iconName: 'CalendarClock',
          colorClasses: 'bg-amber-500/10 text-amber-400',
        },
        {
          id: 'upcoming-holidays',
          title: 'Upcoming Holidays',
          value: stats.upcomingHolidaysCount,
          trendPercent: null,
          trendLabel: 'Scheduled in organization',
          iconName: 'Calendar',
          colorClasses: 'bg-sky-500/10 text-sky-400',
        },
      ];
    }

    if (role === 'manager') {
      return [
        {
          id: 'team-size',
          title: 'Total Team Size',
          value: stats.totalAccounts,
          trendPercent: null,
          trendLabel: 'Organization roster',
          iconName: 'Users',
          colorClasses: 'bg-amber-500/10 text-amber-400',
        },
        {
          id: 'team-checked-in',
          title: 'Team Present Today',
          value: `${stats.checkedInTodayCount} / ${stats.totalAccounts}`,
          trendPercent: null,
          trendLabel: `${stats.todayAttendanceRate}% clocked in`,
          iconName: 'CheckCircle2',
          colorClasses: 'bg-emerald-500/10 text-emerald-400',
        },
        {
          id: 'team-leaves',
          title: 'Pending Team Leaves',
          value: stats.pendingLeavesCount,
          trendPercent: null,
          trendLabel: 'Requests awaiting decision',
          iconName: 'CalendarClock',
          colorClasses: 'bg-rose-500/10 text-rose-400',
        },
        {
          id: 'manager-hours',
          title: 'My Monthly Hours',
          value: `${personal.myWorkedHours} hrs`,
          trendPercent: null,
          trendLabel: 'Logged this month',
          iconName: 'Clock',
          colorClasses: 'bg-sky-500/10 text-sky-400',
        },
      ];
    }

    if (role === 'sales') {
      const crmKpis: KpiCardData[] = [
        {
          id: 'crm-active-leads',
          title: 'Active Leads',
          value: crmSummary?.activeLeads ?? 0,
          trendPercent: null,
          trendLabel: crmSummary?.activeLeads === 1 ? '1 lead in play' : `${crmSummary?.activeLeads ?? 0} leads in play`,
          iconName: 'Users',
          colorClasses: 'bg-emerald-500/10 text-emerald-400',
        },
        {
          id: 'crm-pipeline',
          title: 'Pipeline Value',
          value: `$${(crmSummary?.pipelineValue ?? 0).toLocaleString()}`,
          trendPercent: null,
          trendLabel: `${crmSummary?.pipelineDeals ?? 0} open deal${(crmSummary?.pipelineDeals ?? 0) === 1 ? '' : 's'}`,
          iconName: 'Target',
          colorClasses: 'bg-orange-500/10 text-orange-400',
        },
        {
          id: 'crm-won-month',
          title: 'Won This Month',
          value: `$${(crmSummary?.wonThisMonthValue ?? 0).toLocaleString()}`,
          trendPercent: null,
          trendLabel: `${crmSummary?.wonThisMonth ?? 0} deal${(crmSummary?.wonThisMonth ?? 0) === 1 ? '' : 's'} closed`,
          iconName: 'CheckCircle2',
          colorClasses: 'bg-emerald-500/10 text-emerald-400',
        },
        {
          id: 'crm-conversion',
          title: 'Lead Conversion',
          value: crmSummary?.conversionRate !== null && crmSummary?.conversionRate !== undefined ? `${crmSummary.conversionRate}%` : '—',
          trendPercent: null,
          trendLabel: 'Won vs closed leads (all time)',
          iconName: 'TrendingUp',
          colorClasses: 'bg-sky-500/10 text-sky-400',
        },
      ];
      return crmKpis;
    }

    // Default for Employee & Intern (Personal Work Dashboard)
    return [
      {
        id: 'my-days-present',
        title: 'Days Present this Month',
        value: `${personal.myDaysPresent} days`,
        trendPercent: null,
        trendLabel: 'Actual shift attendance',
        iconName: 'CalendarCheck',
        colorClasses: 'bg-emerald-500/10 text-emerald-400',
      },
      {
        id: 'my-worked-hours',
        title: 'Hours Worked this Month',
        value: `${personal.myWorkedHours} hrs`,
        trendPercent: null,
        trendLabel: 'Total logged time',
        iconName: 'Clock',
        colorClasses: 'bg-sky-500/10 text-sky-400',
      },
      {
        id: 'my-leaves-balance',
        title: 'Remaining Leave Days',
        value: `${personal.myRemainingLeaves} days`,
        trendPercent: null,
        trendLabel: 'Annual, casual & sick balances',
        iconName: 'Calendar',
        colorClasses: 'bg-indigo-500/10 text-indigo-400',
      },
      {
        id: 'my-pending-leaves',
        title: 'My Pending Leave Requests',
        value: personal.myPendingLeavesCount,
        trendPercent: null,
        trendLabel: personal.myPendingLeavesCount > 0 ? 'Awaiting supervisor approval' : 'None pending',
        iconName: 'CalendarClock',
        colorClasses: 'bg-amber-500/10 text-amber-400',
      },
    ];
  }, [dashboardData, user, crmSummary]);

  // Filter roster by search input
  const filteredRoster = (dashboardData?.todayRoster || []).filter((emp) => {
    const q = rosterSearch.toLowerCase();
    return (
      emp.fullName.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (ROLE_LABELS[emp.role] || emp.role).toLowerCase().includes(q)
    );
  });

  // ── Loading state ──
  if (
    isAuthLoading ||
    (isStatsLoading && !dashboardData) ||
    (user?.role === 'sales' && isCrmSummaryLoading && !crmSummary)
  ) {
    return (
      <div className="dashboard-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
        <div className="h-10 w-64 bg-slate-800 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <KpiCardSkeleton key={i} index={i} />
          ))}
        </div>
        <div className="h-64 bg-slate-900/60 rounded-2xl animate-pulse border border-slate-800" />
      </div>
    );
  }

  if (!user || !organization) return null;

  const isManagementRole = ['super_admin', 'admin', 'manager', 'hr'].includes(user.role);

  return (
    <div className="dashboard-page p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Welcome Header with Role Badge & Actions ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800/60"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${ROLE_COLORS[user.role] || 'text-slate-300 bg-slate-800 border-slate-700'
                }`}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {ROLE_LABELS[user.role] || user.role} Dashboard
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {organization.name}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient-accent">{user.fullName.split(' ')[0]}</span> 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isManagementRole
              ? `Real-time operations, attendance, and team overview for ${organization.name}.`
              : `Your personalized daily shift attendance, time tracking, and leave balances.`}
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Quick link: Create Account for Super Admin, Admin, and HR */}
          {(user.role === 'super_admin' || user.role === 'admin' || user.role === 'hr') && (
            <Link
              to="/dashboard/accounts"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Create Account
            </Link>
          )}

          {/* Quick link: Permissions Matrix for Super Admin */}
          {user.role === 'super_admin' && (
            <Link
              to="/dashboard/permissions"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#f0512f]" />
              Permissions
            </Link>
          )}

          {/* Refresh button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Live time indicator */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </motion.div>

      {/* ── Real Role-Specific Performance KPIs (Zero Dummy Data) ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isManagementRole ? 'Real-Time Organization Metrics' : 'My Personal Activity Overview'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {roleKpis.map((kpi, i) => (
            <KpiCard key={kpi.id} data={kpi} index={i} />
          ))}
        </div>
      </div>

      {/* ── Management Operational Views (Super Admin, Admin, HR, Manager) ── */}
      {isManagementRole && dashboardData && (
        <div className="space-y-6">
          {/* ── Live Attendance Roster & Summary Row ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Today Attendance Breakdown (5 cols) */}
            <div className="lg:col-span-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">Today's Team Presence</h4>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {dashboardData.stats.todayAttendanceRate}% Rate
                </span>
              </div>

              {/* Status Breakdown Counters */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <p className="text-[11px] text-slate-400">Present</p>
                    <p className="text-base font-bold text-white">{dashboardData.stats.checkedInTodayCount}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div>
                    <p className="text-[11px] text-slate-400">On Break</p>
                    <p className="text-base font-bold text-white">{dashboardData.stats.onBreakTodayCount}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <div>
                    <p className="text-[11px] text-slate-400">Checked Out</p>
                    <p className="text-base font-bold text-white">{dashboardData.stats.checkedOutTodayCount}</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                  <div>
                    <p className="text-[11px] text-slate-400">Not Clocked In</p>
                    <p className="text-base font-bold text-slate-300">{dashboardData.stats.notCheckedInTodayCount}</p>
                  </div>
                </div>
              </div>

              {/* Active Roles Summary */}
              <div className="pt-2 border-t border-slate-800/60">
                <p className="text-[11px] font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  Configured Roles in Org ({dashboardData.stats.activeRolesList.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dashboardData.stats.activeRolesList.map((r) => (
                    <span
                      key={r}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${ROLE_COLORS[r as Role] || 'text-slate-400 bg-slate-800 border-slate-700'
                        }`}
                    >
                      {ROLE_LABELS[r as Role] || r}: {dashboardData.stats.roleDistribution[r] || 0}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Today Team Attendance Roster Table (8 cols) */}
            <div className="lg:col-span-8 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-sm font-semibold text-white">Today's Team Attendance Roster</h4>
                  <span className="text-xs text-slate-500 font-mono">({filteredRoster.length} members)</span>
                </div>

                {/* Filter search */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter roster..."
                    value={rosterSearch}
                    onChange={(e) => setRosterSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {filteredRoster.length === 0 ? (
                <div className="py-10 text-center text-slate-500 text-xs">
                  No accounts match your roster search.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="pb-2 font-medium">Team Member</th>
                        <th className="pb-2 font-medium">Role</th>
                        <th className="pb-2 font-medium">Today's Status</th>
                        <th className="pb-2 font-medium">Clock-In Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {filteredRoster.map((emp) => {
                        const roleColor = ROLE_COLORS[emp.role] || 'text-slate-400 bg-slate-800 border-slate-700';
                        return (
                          <tr key={emp.userId} className="hover:bg-slate-900/30 transition-colors">
                            <td className="py-2.5 pr-2">
                              <div className="font-medium text-white">{emp.fullName}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{emp.email}</div>
                            </td>
                            <td className="py-2.5 pr-2">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${roleColor}`}>
                                {ROLE_LABELS[emp.role] || emp.role}
                              </span>
                            </td>
                            <td className="py-2.5 pr-2">
                              {emp.status === 'checked_in' && (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  Present
                                </span>
                              )}
                              {emp.status === 'on_break' && (
                                <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                  <Coffee className="w-3 h-3" />
                                  On Break
                                </span>
                              )}
                              {emp.status === 'checked_out' && (
                                <span className="inline-flex items-center gap-1 text-sky-400 font-medium">
                                  <LogOut className="w-3 h-3" />
                                  Checked Out
                                </span>
                              )}
                              {emp.status === 'not_checked_in' && (
                                <span className="text-slate-500 font-normal">Not Clocked In</span>
                              )}
                            </td>
                            <td className="py-2.5 text-slate-400 font-mono text-[11px]">
                              {emp.checkInAt ? new Date(emp.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Pending Leave Approvals Section (Shown when requests exist) ── */}
          {dashboardData.pendingLeaves.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 shadow-lg space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-semibold text-white">
                    Pending Leave Approvals ({dashboardData.pendingLeaves.length})
                  </h4>
                </div>
                <span className="text-xs text-amber-400 font-medium">Action Required</span>
              </div>

              <div className="divide-y divide-slate-800/80">
                {dashboardData.pendingLeaves.map((leave) => (
                  <div key={leave.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{leave.employeeName}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                          {leave.employeeRole}
                        </span>
                        <span className="text-xs text-amber-300 font-medium">· {leave.leaveType}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                        {leave.reason ? ` — "${leave.reason}"` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => approveLeaveMutation.mutate(leave.id)}
                        disabled={approveLeaveMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectLeaveMutation.mutate(leave.id)}
                        disabled={rejectLeaveMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-600 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ── Daily Time & Attendance Section (Real per-user check-in and records) ── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {isManagementRole ? 'My Personal Shift & Attendance' : 'Daily Time & Shift Tracking'}
          </h3>
        </div>

        {/* Top 3 Attendance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Primary Check In / Out Card */}
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
    </div>
  );
};

export default DashboardPage;
