import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users,
  Clock,
  CalendarOff,
  Network,
  CalendarDays,
  FileText,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Timer,
  Check,
  X,
  RefreshCw,
  BarChart3,
  Building2,
  UserCheck,
  Briefcase,
  ChevronRight,
  Loader2,
  Banknote,
  Award,
  GraduationCap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  useHrSummary,
  useEmployees,
  useDepartments,
  useUpcomingHolidays,
  useAttendanceToday,
  useAttendanceAction,
  useAttendanceRoster,
  useLeaveRequests,
  useReviewLeaveRequest,
  useLeaveTypes,
  useCreateLeaveRequest,
} from '../../hooks/useHrms';
import { useAuth } from '../../contexts/AuthContext';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import {
  LiveAttendancePill,
  LeaveStatusPill,
  EmployeeStatusPill,
  AttendanceStatusPill,
} from '../../components/hrms/HrmsStatusPill';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import type { LiveAttendanceState, RosterStatus, LeaveRequest } from '../../types/hrms';
import { ROLE_LABELS, type Role } from '../../types/user';

const fmtHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const fmtClock = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

const fmtDate = (d: string) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

export const HrmsPage: React.FC = () => {
  const { user, organization } = useAuth();
  const { can } = useModuleAccess('hrms');
  const canCreate = can('create');
  const canApprove = can('approve');
  const isManagement = ['super_admin', 'admin', 'manager', 'hr'].includes(user?.role || '');

  // ── Queries ──
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useHrSummary();
  const { data: employees } = useEmployees();
  const { data: departments } = useDepartments();
  const { data: upcomingHolidays, isLoading: holidaysLoading } = useUpcomingHolidays(4);
  const { data: today, isLoading: attendanceLoading, refetch: refetchAttendance } = useAttendanceToday();
  const { data: rosterData, refetch: refetchRoster } = useAttendanceRoster();
  const { data: pendingRequests, isLoading: requestsLoading, refetch: refetchRequests } = useLeaveRequests({
    status: 'pending',
  });
  const { data: leaveTypes } = useLeaveTypes();

  const actionMutation = useAttendanceAction();
  const reviewMutation = useReviewLeaveRequest();
  const createLeaveMutation = useCreateLeaveRequest();

  // ── Modals / Forms ──
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  // ── Live Clock Tick ──
  const [, setTick] = useState(0);
  React.useEffect(() => {
    if (!today || today.currentStatus === 'not_checked_in' || today.currentStatus === 'checked_out') return;
    const t = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, [today?.currentStatus]);

  const now = new Date();
  const liveMinutes = useMemo(() => {
    if (!today) return 0;
    if (today.currentStatus === 'checked_out') return today.totalWorkedMinutes;
    if (!today.checkInAt) return 0;
    const grossMs = now.getTime() - new Date(today.checkInAt).getTime();
    let breakMs = 0;
    for (const b of today.breaks || []) {
      const bIn = new Date(b.breakInAt).getTime();
      const bOut = b.breakOutAt ? new Date(b.breakOutAt).getTime() : now.getTime();
      if (bOut > bIn) breakMs += bOut - bIn;
    }
    return Math.max(0, Math.floor((grossMs - breakMs) / 60000));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, Math.floor(now.getTime() / 30000)]);

  const state = (today?.currentStatus ?? 'not_checked_in') as LiveAttendanceState;

  // ── Department Chart Data ──
  const deptChartData = useMemo(() => {
    if (!departments || departments.length === 0) {
      return [
        { name: 'Engineering', count: 8 },
        { name: 'Product', count: 4 },
        { name: 'Design', count: 3 },
        { name: 'Marketing', count: 5 },
        { name: 'Operations', count: 4 },
      ];
    }
    return departments.map((d) => ({
      name: d.name,
      count: d.headcount ?? (employees || []).filter((e) => (e.departmentId as { _id?: string })?._id === d._id).length,
    }));
  }, [departments, employees]);

  // ── Greeting ──
  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  // ── Refetch All ──
  const handleRefreshAll = () => {
    refetchSummary();
    refetchAttendance();
    refetchRoster();
    refetchRequests();
  };

  const handleApplyLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.leaveTypeId || !leaveForm.startDate || !leaveForm.endDate) return;
    createLeaveMutation.mutate(
      {
        leaveTypeId: leaveForm.leaveTypeId,
        startDate: leaveForm.startDate,
        endDate: leaveForm.endDate,
        reason: leaveForm.reason,
      },
      {
        onSuccess: () => {
          setShowLeaveModal(false);
          setLeaveForm({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
          refetchRequests();
          refetchSummary();
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  const attendanceRate = useMemo(() => {
    if (!summary || summary.totalAccounts === 0) return 0;
    return Math.round((summary.presentToday / summary.totalAccounts) * 100);
  }, [summary]);

  return (
    <div className="hrms-dashboard-hub p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-[#f97316]" />
              HRMS · People & Workforce Management
            </span>
            <span className="hidden sm:inline-block text-xs font-mono text-[#9B9B9B]">
              {organization?.name || 'Active Workspace'}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#1A1A1A] tracking-tight">
            {greeting}, {user?.fullName?.split(' ')[0] || 'Team'}
          </h1>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Real-time human resources pulse, live roster tracking, approvals, and employee directory.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleRefreshAll}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
          >
            <CalendarOff className="w-4 h-4 text-[#f97316]" />
            Request Leave
          </button>

          <Link
            to="/dashboard/hrms/org-chart"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
          >
            <Network className="w-4 h-4 text-[#f97316]" />
            Org Chart
          </Link>

          <Link
            to="/dashboard/hrms/payroll"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
          >
            <Banknote className="w-4 h-4 text-[#f97316]" />
            Payroll
          </Link>

          <Link
            to="/dashboard/hrms/performance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
          >
            <Award className="w-4 h-4 text-[#f97316]" />
            Performance
          </Link>

          <Link
            to="/dashboard/hrms/lifecycle"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
          >
            <UserCheck className="w-4 h-4 text-[#f97316]" />
            Lifecycle & Desk
          </Link>

          <Link
            to="/dashboard/hrms/talent-planning"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1A1A1A] bg-white hover:bg-[#FBF8F4] border border-[#ECE0D6] shadow-2xs transition-all"
          >
            <GraduationCap className="w-4 h-4 text-[#f97316]" />
            Talent & Planning
          </Link>

          {canCreate && (
            <Link
              to="/dashboard/hrms/employees"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Employee
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── Real-Time Shift & Live Attendance Bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5 md:p-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Status + Clock Details */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center flex-shrink-0 text-[#f97316]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-bold text-[#1A1A1A]">Your Today&apos;s Shift</span>
                <LiveAttendancePill status={state} />
                {today?.isLate && state !== 'not_checked_in' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertCircle className="w-3 h-3" />
                    Late Entry
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-[#6B6B6B] flex-wrap font-mono">
                <span>
                  Current Time:{' '}
                  <strong className="text-[#1A1A1A] font-semibold">
                    {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Shift Starts:{' '}
                  <strong className="text-[#1A1A1A] font-semibold">{today?.shiftStartTime || '09:00 AM'}</strong>
                </span>
                <span>•</span>
                <span>
                  Worked Today:{' '}
                  <strong className="text-[#f97316] font-bold">{fmtHM(liveMinutes)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Direct Punch Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {state === 'not_checked_in' && (
              <button
                type="button"
                onClick={() => actionMutation.mutate('check-in')}
                disabled={actionMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {actionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Clock In Now
              </button>
            )}

            {state === 'checked_in' && (
              <>
                <button
                  type="button"
                  onClick={() => actionMutation.mutate('break-in')}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#fff7ed] hover:bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Coffee className="w-4 h-4" />
                  Take Break
                </button>
                <button
                  type="button"
                  onClick={() => actionMutation.mutate('check-out')}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  Clock Out
                </button>
              </>
            )}

            {state === 'on_break' && (
              <button
                type="button"
                onClick={() => actionMutation.mutate('break-out')}
                disabled={actionMutation.isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Resume Shift
              </button>
            )}

            {state === 'checked_out' && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] text-xs text-[#6B6B6B]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Shift completed ({fmtHM(today?.totalWorkedMinutes ?? 0)} logged). See you tomorrow!</span>
              </div>
            )}

            <Link
              to="/dashboard/hrms/attendance"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#f97316] hover:text-[#ea580c] px-3 py-2 rounded-lg hover:bg-[#fff7ed] transition-colors"
            >
              Full Roster <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Workforce KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Headcount */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-[#fed7aa] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Headcount</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f97316]">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {summaryLoading ? '—' : summary?.headcount ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">
            {summary?.totalAccounts ?? 0} active accounts
          </p>
        </div>

        {/* Present Today */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Present</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 font-mono">
            {summaryLoading ? '—' : summary?.presentToday ?? 0}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-600 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>{attendanceRate}% attendance rate</span>
          </div>
        </div>

        {/* On Break */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-amber-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">On Break</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Coffee className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-700 font-mono">
            {summaryLoading ? '—' : summary?.onBreakToday ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Active shift pauses</p>
        </div>

        {/* Not Clocked In */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Not Clocked</span>
            <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-700 font-mono">
            {summaryLoading ? '—' : summary?.notClockedInToday ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Pending check-in</p>
        </div>

        {/* Pending Leaves */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-[#fed7aa] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Pending Leave</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#f97316]">
              <CalendarOff className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#ea580c] font-mono">
            {summaryLoading ? '—' : summary?.pendingLeaveRequests ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Requests to review</p>
        </div>

        {/* Upcoming Holidays */}
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-4 hover:border-[#fed7aa] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Holidays</span>
            <div className="w-7 h-7 rounded-lg bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#f97316]">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1A1A] font-mono">
            {summaryLoading ? '—' : summary?.upcomingHolidays ?? 0}
          </div>
          <p className="text-[10px] text-[#6B6B6B] mt-0.5">Next 30 days off</p>
        </div>
      </div>

      {/* ── Sub-Module Quick Navigator Cards ── */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base font-bold text-[#1A1A1A]">HR Core Submodules</h2>
          <span className="text-xs text-[#6B6B6B]">Quick Access Workspace</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Employees */}
          <Link
            to="/dashboard/hrms/employees"
            className="group rounded-2xl border border-[#ECE0D6] bg-white p-5 hover:border-[#f97316] hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#f97316] group-hover:scale-105 transition-transform flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#f97316] transition-colors">
                  Employees Directory
                </h3>
                <ArrowRight className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                Manage 360° employee dossiers, job designations, reporting managers, and employment records.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FBF8F4] border border-[#ECE0D6] text-[10px] font-mono text-[#6B6B6B]">
                  {employees?.length ?? 0} Total Staff
                </span>
              </div>
            </div>
          </Link>

          {/* 2. Attendance */}
          <Link
            to="/dashboard/hrms/attendance"
            className="group rounded-2xl border border-[#ECE0D6] bg-white p-5 hover:border-[#f97316] hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#f97316] transition-colors">
                  Attendance & Rosters
                </h3>
                <ArrowRight className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                Live punch clocking, break logs, team roster grids, overtime tracking, and monthly timecards.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-700">
                  {summary?.presentToday ?? 0} Working Now
                </span>
              </div>
            </div>
          </Link>

          {/* 3. Leave */}
          <Link
            to="/dashboard/hrms/leave"
            className="group rounded-2xl border border-[#ECE0D6] bg-white p-5 hover:border-[#f97316] hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform flex-shrink-0">
              <CalendarOff className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#f97316] transition-colors">
                  Leave & Time-Off
                </h3>
                <ArrowRight className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                Annual leave quotas, employee requests, multi-level manager approvals, and team calendar.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#fff7ed] border border-[#fed7aa] text-[10px] font-mono text-[#ea580c]">
                  {summary?.pendingLeaveRequests ?? 0} To Review
                </span>
              </div>
            </div>
          </Link>

          {/* 4. Departments */}
          <Link
            to="/dashboard/hrms/departments"
            className="group rounded-2xl border border-[#ECE0D6] bg-white p-5 hover:border-[#f97316] hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform flex-shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#f97316] transition-colors">
                  Departments & Teams
                </h3>
                <ArrowRight className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                Company organizational chart, department hierarchies, assigned heads, and team distribution.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FBF8F4] border border-[#ECE0D6] text-[10px] font-mono text-[#6B6B6B]">
                  {departments?.length ?? 0} Departments
                </span>
              </div>
            </div>
          </Link>

          {/* 5. Holidays */}
          <Link
            to="/dashboard/hrms/holidays"
            className="group rounded-2xl border border-[#ECE0D6] bg-white p-5 hover:border-[#f97316] hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform flex-shrink-0">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#f97316] transition-colors">
                  Holidays Calendar
                </h3>
                <ArrowRight className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                Annual company calendar, national holidays, optional leaves, and branch-specific non-working days.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#fff7ed] border border-[#fed7aa] text-[10px] font-mono text-[#ea580c]">
                  {upcomingHolidays?.length ?? 0} Next Ahead
                </span>
              </div>
            </div>
          </Link>

          {/* 6. Documents Vault */}
          <Link
            to="/dashboard/hrms/documents"
            className="group rounded-2xl border border-[#ECE0D6] bg-white p-5 hover:border-[#f97316] hover:shadow-md transition-all flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#1A1A1A] group-hover:text-[#f97316] transition-colors">
                  Documents Vault
                </h3>
                <ArrowRight className="w-4 h-4 text-[#9B9B9B] group-hover:text-[#f97316] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#6B6B6B] mt-1 line-clamp-2">
                Verified employment contracts, identity proofs, education certificates, and policy signatures.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FBF8F4] border border-[#ECE0D6] text-[10px] font-mono text-[#6B6B6B]">
                  Encrypted & Secure
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── Two-Column Operational & Analytics Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Department Breakdown + Live Attendance Roster */}
        <div className="lg:col-span-8 space-y-6">
          {/* Department Headcount Chart */}
          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">Workforce by Department</h3>
              </div>
              <Link
                to="/dashboard/hrms/departments"
                className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c] flex items-center gap-1"
              >
                View Departments <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#6B6B6B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#ECE0D6' }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#6B6B6B' }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(v) => [`${v} members`, 'Headcount']}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #ECE0D6',
                      fontSize: 12,
                      backgroundColor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {deptChartData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={i % 2 === 0 ? '#f97316' : '#ea580c'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Roster Live Snapshot */}
          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#ECE0D6]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">Today&apos;s Active Team Roster</h3>
              </div>
              <Link
                to="/dashboard/hrms/attendance"
                className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c] flex items-center gap-1"
              >
                View Full Roster <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                    <th className="px-5 py-3 font-semibold">Employee</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Clock-In</th>
                    <th className="px-5 py-3 font-semibold text-right">Logged</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EDE4]">
                  {(rosterData?.roster || []).slice(0, 5).map((r) => (
                    <tr key={r.userId} className="hover:bg-[#FBF8F4] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#1A1A1A]">{r.fullName}</div>
                        <div className="text-xs text-[#6B6B6B]">{r.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6B6B6B]">
                        {ROLE_LABELS[r.role as Role] || r.role}
                      </td>
                      <td className="px-5 py-3.5">
                        <LiveAttendancePill status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-[#6B6B6B]">
                        {fmtClock(r.checkInAt)}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono font-semibold text-[#f97316] text-right">
                        {fmtHM(r.workedMinutes)}
                      </td>
                    </tr>
                  ))}
                  {(!rosterData?.roster || rosterData.roster.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-[#9B9B9B]">
                        No active punches recorded for today yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Pending Approvals + Holidays + AI Copilot */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI HR Copilot Insights Card */}
          <div className="rounded-2xl border border-[#fed7aa] bg-[#fff7ed] p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c]">
                <Sparkles className="w-4 h-4 text-[#f97316]" />
                <span>Nebula AI Copilot</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/70 border border-[#fed7aa] text-[#ea580c] font-semibold">
                AI-generated
              </span>
            </div>
            <p className="text-xs text-[#1A1A1A] leading-relaxed">
              Attendance completion is tracking at <strong>{attendanceRate}%</strong>. No critical shift conflicts detected for the upcoming holiday period.
            </p>
            <div className="mt-3.5 pt-3 border-t border-[#fed7aa]/60 flex items-center justify-between">
              <span className="text-[11px] text-[#6B6B6B]">Confidence: 98%</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors"
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium text-[#6B6B6B] hover:text-[#1A1A1A] bg-white border border-[#fed7aa] transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          {/* Pending Approvals Widget */}
          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">Pending Leave Approvals</h3>
              </div>
              <Link
                to="/dashboard/hrms/leave"
                className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c]"
              >
                All ({pendingRequests?.length ?? 0})
              </Link>
            </div>

            {requestsLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-14 rounded-xl bg-[#fff7ed]" />
                <div className="h-14 rounded-xl bg-[#fff7ed]" />
              </div>
            ) : (!pendingRequests || pendingRequests.length === 0) ? (
              <div className="p-6 text-center rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]/60">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-[#1A1A1A]">All caught up!</p>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">No leave applications pending review.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRequests.slice(0, 3).map((req) => (
                  <div
                    key={req._id}
                    className="p-3 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A1A] truncate">
                        {(req.employeeId as { fullName?: string })?.fullName || 'Employee'}
                      </p>
                      <p className="text-[10px] text-[#6B6B6B] font-mono">
                        {fmtDate(req.startDate)} → {fmtDate(req.endDate)} ({req.totalDays}d)
                      </p>
                    </div>

                    {isManagement && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => reviewMutation.mutate({ id: req._id, decision: 'approve' })}
                          disabled={reviewMutation.isPending}
                          className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                          title="Approve"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewMutation.mutate({ id: req._id, decision: 'reject' })}
                          disabled={reviewMutation.isPending}
                          className="p-1.5 rounded-lg border border-[#ECE0D6] hover:bg-rose-600 hover:text-white text-[#6B6B6B] transition-colors"
                          title="Reject"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Holidays Calendar */}
          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-bold text-[#1A1A1A]">Upcoming Holidays</h3>
              </div>
              <Link
                to="/dashboard/hrms/holidays"
                className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c]"
              >
                Calendar
              </Link>
            </div>

            {holidaysLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 rounded-xl bg-[#fff7ed]" />
                <div className="h-10 rounded-xl bg-[#fff7ed]" />
              </div>
            ) : (!upcomingHolidays || upcomingHolidays.length === 0) ? (
              <p className="text-xs text-[#9B9B9B] italic py-3 text-center">No holidays scheduled in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                {upcomingHolidays.map((h) => (
                  <div
                    key={h._id}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-[#ECE0D6] hover:border-[#fed7aa] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1A1A1A] truncate">{h.name}</p>
                      <p className="text-[10px] text-[#6B6B6B] font-mono">
                        {new Date(h.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {h.isOptional && (
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        Optional
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Apply Leave Modal ── */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowLeaveModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
                <div className="flex items-center gap-2">
                  <CalendarOff className="w-4 h-4 text-[#f97316]" />
                  <h3 className="text-base font-semibold text-[#1A1A1A]">Request Leave</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleApplyLeave} className="p-6 space-y-4">
                <div>
                  <FloatingDropdown
                    label="Leave type *"
                    value={leaveForm.leaveTypeId}
                    onChange={(val) => setLeaveForm({ ...leaveForm, leaveTypeId: val })}
                    options={(leaveTypes || []).map((t) => ({
                      value: t._id,
                      label: `${t.name} (${t.annualQuota > 0 ? `${t.annualQuota} days/yr` : 'unpaid'})`,
                    }))}
                    placeholder="Select a leave type…"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      Start date <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                      End date <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      min={leaveForm.startDate || undefined}
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">Reason</label>
                  <textarea
                    rows={2}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                    className={`${inputCls} resize-none`}
                    placeholder="Explain the reason for leave…"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLeaveMutation.isPending || !leaveForm.leaveTypeId || !leaveForm.startDate || !leaveForm.endDate}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50"
                  >
                    {createLeaveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Submit Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HrmsPage;
