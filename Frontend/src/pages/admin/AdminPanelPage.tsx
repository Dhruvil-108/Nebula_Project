import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Users,
  UserCheck,
  UserX,
  Clock,
  Coffee,
  LogOut,
  CalendarClock,
  RefreshCw,
  Search,
  Ban,
  CheckCircle2,
  KeyRound,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Crown,
  Activity,
  Building2,
  X,
  TrendingUp,
  CalendarOff,
  CalendarCheck,
  ShieldAlert,
  LogIn,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useAdminOverview,
  useAdminUsers,
  useAdminAuditLogs,
  useUpdateUserStatus,
  useUpdateUserRole,
} from '../../hooks/useAdmin';
import { ADMIN_ASSIGNABLE_ROLES } from '../../lib/adminApi';
import { ROLE_LABELS } from '../../types/user';
import type { Role } from '../../types/user';
import { apiClient } from '../../lib/apiClient';
import type { PermissionRowDto } from '../../hooks/useModuleAccess';

// ─────────────────────────────────────────────────────────
// Theme tokens — identical palette to HRMS/Admin pages
// ─────────────────────────────────────────────────────────
const cardCls = 'rounded-2xl border border-[#ECE0D6] bg-white shadow-sm';
const thCls =
  'px-5 py-3 font-semibold text-[11px] uppercase tracking-wider text-[#6B6B6B]';
const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

// Recharts palette — pure vibrant orange, emeralds, ambers
const C = {
  orange: '#f97316',
  orangeLight: '#fb923c',
  peach: '#fed7aa',
  green: '#16A34A',
  amber: '#D97706',
  sky: '#0284C7',
  rose: '#DC2626',
  slate: '#94A3B8',
};

const fmtDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString() : '—';
const fmtDateTime = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleString() : '—';

const ADMIN_ACTIONS = [
  'account_enabled',
  'account_disabled',
  'role_changed',
  'user_created',
  'login',
  'logout',
  'signup',
];

interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
  lastLoginAt?: string | null;
}

// ─────────────────────────────────────────────────────────
// Chart tooltip — themed
// ─────────────────────────────────────────────────────────
const ChartTip: React.FC<{ active?: boolean; payload?: Array<{ value: number; name?: string; payload?: { label?: string } }>; label?: string }> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wide mb-0.5">
        {payload[0]?.payload?.label || label}
      </p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs font-bold text-[#1A1A1A]">
          {p.value}
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────
const StatTile: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  accent?: boolean;
}> = ({ icon, label, value, sub, accent }) => (
  <div className={`${cardCls} p-5 relative overflow-hidden`}>
    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#fff7ed] blur-2xl pointer-events-none" />
    <div className="flex items-center justify-between mb-3 relative">
      <p className="text-[11px] font-semibold text-[#6B6B6B] uppercase tracking-wider">
        {label}
      </p>
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
          accent ? 'bg-[#f97316] text-white' : 'bg-[#fff7ed] text-[#f97316]'
        }`}
      >
        {icon}
      </div>
    </div>
    <p className="text-2xl font-bold text-[#1A1A1A] tracking-tight relative">{value}</p>
    {sub && <p className="text-[11px] text-[#9B9B9B] mt-1 relative">{sub}</p>}
  </div>
);

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25',
    invited: 'bg-amber-500/10 text-amber-600 border-amber-500/25',
    disabled: 'bg-rose-500/10 text-rose-600 border-rose-500/25',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
        map[status] || 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]'
      }`}
    >
      {status}
    </span>
  );
};

// ─────────────────────────────────────────────────────────
// Overview tab — the visual command center
// ─────────────────────────────────────────────────────────
const OverviewTab: React.FC<{
  overview: NonNullable<ReturnType<typeof useAdminOverview>['data']>;
  isSuper: boolean;
  onOpenAudit: () => void;
}> = ({ overview, isSuper, onOpenAudit }) => {
  const today = overview.today;
  const accounts = overview.accounts;

  // Presence donut data
  const presenceData = [
    { name: 'Present', value: today.checkedIn, color: C.green },
    { name: 'On Break', value: today.onBreak, color: C.amber },
    { name: 'Checked Out', value: today.checkedOut, color: C.sky },
    {
      name: 'Not In',
      value: Math.max(0, accounts.active - today.activeToday),
      color: C.slate,
    },
  ].filter((d) => d.value > 0);

  // Leave donut data
  const leaveData = [
    { name: 'Pending', value: overview.leaveStats.pending, color: C.amber },
    { name: 'Approved', value: overview.leaveStats.approved, color: C.green },
    { name: 'Rejected', value: overview.leaveStats.rejected, color: C.rose },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-5">
      {/* ── KPI tiles ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={<Users className="w-4 h-4" />}
          label="Total Accounts"
          value={accounts.total}
          sub={`${accounts.active} active · ${accounts.invited} invited`}
        />
        <StatTile
          icon={<Building2 className="w-4 h-4" />}
          label="Active Headcount"
          value={overview.activeHeadcount}
          sub="Employee records active"
        />
        <StatTile
          icon={<CalendarOff className="w-4 h-4" />}
          label="Pending Leaves"
          value={overview.pendingLeaveRequests}
          sub={overview.pendingLeaveRequests > 0 ? 'Needs a decision' : 'All caught up'}
          accent={overview.pendingLeaveRequests > 0}
        />
        {isSuper && overview.superAdmin ? (
          <StatTile
            icon={<ScrollText className="w-4 h-4" />}
            label="Audit Events (30d)"
            value={overview.superAdmin.auditEventsLast30d}
            sub={`${overview.superAdmin.pendingInvites} pending invite${overview.superAdmin.pendingInvites === 1 ? '' : 's'}`}
          />
        ) : (
          <StatTile
            icon={<CalendarClock className="w-4 h-4" />}
            label="Org Shift Start"
            value={overview.organization.shiftStartTime}
            sub={overview.organization.timezone}
          />
        )}
      </div>

      {/* ── Row: presence trend (wide) + today donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${cardCls} p-5 lg:col-span-8`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#f97316]" />
              <h4 className="text-sm font-semibold text-[#1A1A1A]">
                Attendance Trend — Last 7 Days
              </h4>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#fff7ed] text-[#ea580c] font-semibold">
              {today.attendanceRate}% today
            </span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.attendanceTrend} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.orange} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={C.orange} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3EDE4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9B9B9B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} />
                <Area
                  type="monotone"
                  dataKey="present"
                  name="Present"
                  stroke={C.orange}
                  strokeWidth={2.5}
                  fill="url(#attGrad)"
                  dot={{ r: 3, fill: C.orange, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardCls} p-5 lg:col-span-4`}>
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Today's Presence</h4>
          </div>
          {presenceData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#9B9B9B]">
              <Clock className="w-8 h-8 mb-2" />
              <p className="text-xs">No attendance yet today</p>
            </div>
          ) : (
            <>
              <div className="h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={presenceData}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {presenceData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-[#1A1A1A]">{today.attendanceRate}%</p>
                  <p className="text-[10px] text-[#9B9B9B] uppercase tracking-wide">rate</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {presenceData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-[10px] text-[#6B6B6B]">
                      {d.name}: <span className="font-bold text-[#1A1A1A]">{d.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Row: growth (wide) + leave donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`${cardCls} p-5 lg:col-span-8`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">
              Account Growth — New Accounts per Month
            </h4>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.accountGrowth} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3EDE4" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9B9B9B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTip />} cursor={{ fill: '#fff7ed', opacity: 0.5 }} />
                <Bar dataKey="count" name="New accounts" fill={C.orangeLight} radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${cardCls} p-5 lg:col-span-4`}>
          <div className="flex items-center gap-2 mb-2">
            <CalendarCheck className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Leave Pipeline</h4>
          </div>
          {leaveData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-[#9B9B9B]">
              <CalendarCheck className="w-8 h-8 mb-2" />
              <p className="text-xs">No leave requests yet</p>
            </div>
          ) : (
            <>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={leaveData}
                      dataKey="value"
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {leaveData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {leaveData.map((d) => (
                  <div key={d.name} className="text-center">
                    <span className="block w-2 h-2 rounded-full mx-auto mb-1" style={{ background: d.color }} />
                    <span className="text-[10px] text-[#6B6B6B] block">{d.name}</span>
                    <span className="text-xs font-bold text-[#1A1A1A]">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Role distribution ── */}
      <div className={`${cardCls} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-[#f97316]" />
          <h4 className="text-sm font-semibold text-[#1A1A1A]">Role Distribution</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(accounts.roleDistribution || {}).map(([role, count]) => (
            <span
              key={role}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                role === 'super_admin'
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                  : 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]/50'
              }`}
            >
              {role === 'super_admin' && <Crown className="w-3 h-3" />}
              {ROLE_LABELS[role as Role] || role}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* ── Super Admin exclusive: login trend + audit mix ── */}
      {isSuper && overview.superAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`${cardCls} p-5 lg:col-span-7`}>
            <div className="flex items-center gap-2 mb-4">
              <LogIn className="w-4 h-4 text-[#f97316]" />
              <h4 className="text-sm font-semibold text-[#1A1A1A]">Login Activity — Last 7 Days</h4>
            </div>
            {overview.superAdmin.loginTrend.every((d) => d.count === 0) ? (
              <div className="h-40 flex flex-col items-center justify-center text-[#9B9B9B]">
                <LogIn className="w-8 h-8 mb-2" />
                <p className="text-xs">No logins recorded this week</p>
              </div>
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview.superAdmin.loginTrend} margin={{ top: 5, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3EDE4" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6B6B6B' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9B9B9B' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTip />} cursor={{ fill: '#fff7ed', opacity: 0.5 }} />
                    <Bar dataKey="count" name="Logins" fill={C.green} radius={[6, 6, 0, 0]} maxBarSize={38} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className={`${cardCls} p-5 lg:col-span-5`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#f97316]" />
                <h4 className="text-sm font-semibold text-[#1A1A1A]">Top Audit Actions</h4>
              </div>
              <button
                type="button"
                onClick={onOpenAudit}
                className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c]"
              >
                Full trail →
              </button>
            </div>
            {overview.superAdmin.actionBreakdown.length === 0 ? (
              <p className="text-xs text-[#9B9B9B] py-8 text-center">No audit events yet.</p>
            ) : (
              <div className="space-y-2.5">
                {overview.superAdmin.actionBreakdown.map((a) => {
                  const max = overview.superAdmin!.actionBreakdown[0].count || 1;
                  return (
                    <div key={a.action}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono font-semibold text-[#1A1A1A]">
                          {a.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] font-bold text-[#f97316]">{a.count}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[#fff7ed] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(a.count / max) * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-[#fed7aa] to-[#f97316]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Super Admin exclusive: latest security events strip ── */}
      {isSuper && overview.superAdmin && overview.superAdmin.recentAudit.length > 0 && (
        <div className={`${cardCls} p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <ScrollText className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Latest Security Events</h4>
          </div>
          <div className="space-y-2">
            {overview.superAdmin.recentAudit.map((log) => (
              <div
                key={log.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] px-3.5 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-[#fed7aa]/40 text-[#ea580c] flex-shrink-0">
                    {log.action}
                  </span>
                  <span className="text-xs text-[#1A1A1A] font-medium truncate">{log.actorName}</span>
                  <span className="text-[10px] text-[#9B9B9B]">{log.entity}</span>
                </div>
                <span className="text-[10px] text-[#9B9B9B] font-mono flex-shrink-0">
                  {fmtDateTime(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Accounts tab
// ─────────────────────────────────────────────────────────
const AccountsTab: React.FC<{ isSuper: boolean; selfId: string }> = ({
  isSuper,
  selfId,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleEditorFor, setRoleEditorFor] = useState<AdminUserRow | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data: users, isLoading, refetch, isRefetching } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
  });
  const statusMutation = useUpdateUserStatus();
  const roleMutation = useUpdateUserRole();

  const roleOptions = useMemo(() => [...ADMIN_ASSIGNABLE_ROLES], []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`${inputCls} sm:w-44`}
        >
          <option value="">All roles</option>
          {(isSuper ? ['super_admin', ...roleOptions] : roleOptions).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r as Role] || r}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`${inputCls} sm:w-40`}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="disabled">Disabled</option>
        </select>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors self-start"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <th className={thCls}>Account</th>
                <th className={thCls}>Role</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Joined</th>
                {isSuper && <th className={thCls}>Last Login</th>}
                <th className={`${thCls} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={isSuper ? 6 : 5} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (users || []).length === 0 ? (
                <tr>
                  <td colSpan={isSuper ? 6 : 5} className="px-5 py-14 text-center">
                    <Users className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No accounts match</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">Try adjusting your filters or search.</p>
                  </td>
                </tr>
              ) : (
                (users || []).map((u, idx) => {
                  const isSelf = u.id === selfId;
                  const protectedAccount =
                    u.role === 'super_admin' || (!isSuper && u.role === 'admin');
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                      className="hover:bg-[#FBF8F4] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#fff7ed] border border-[#fed7aa]/40 flex items-center justify-center text-[11px] font-bold text-[#ea580c] flex-shrink-0">
                            {u.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A] flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#fff7ed] text-[#ea580c] font-semibold">
                                  YOU
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-[#9B9B9B] truncate max-w-[220px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            u.role === 'super_admin'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                              : 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]/50'
                          }`}
                        >
                          {u.role === 'super_admin' && <Crown className="w-3 h-3" />}
                          {ROLE_LABELS[u.role as Role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={u.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6B6B6B]">{fmtDate(u.createdAt)}</td>
                      {isSuper && (
                        <td className="px-5 py-3.5 text-xs text-[#6B6B6B]">
                          {fmtDateTime(u.lastLoginAt)}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {isSuper && !isSelf && u.role !== 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setRoleEditorFor(u);
                                setNewRole(u.role);
                              }}
                              className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#f97316] hover:bg-[#fff7ed] transition-colors"
                              title="Change role"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}
                          {!isSelf && !protectedAccount && (
                            <button
                              type="button"
                              onClick={() =>
                                statusMutation.mutate({
                                  id: u.id,
                                  status: u.status === 'disabled' ? 'active' : 'disabled',
                                })
                              }
                              disabled={statusMutation.isPending}
                              className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                                u.status === 'disabled'
                                  ? 'text-emerald-600 hover:bg-emerald-500/10'
                                  : 'text-[#6B6B6B] hover:text-[#DC2626] hover:bg-[#DC2626]/10'
                              }`}
                              title={u.status === 'disabled' ? 'Enable account' : 'Disable account'}
                            >
                              {u.status === 'disabled' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : (
                                <Ban className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {roleEditorFor && (
        <div className="fixed inset-0 z-50 flex items-center editor justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
            onClick={() => setRoleEditorFor(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md rounded-2xl bg-white border border-[#ECE0D6] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6]">
              <h3 className="text-base font-semibold text-[#1A1A1A] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#f97316]" />
                Change Role
              </h3>
              <button
                type="button"
                onClick={() => setRoleEditorFor(null)}
                className="p-1.5 rounded-lg text-[#6B6B6B] hover:bg-[#fff7ed] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] px-4 py-3">
                <p className="text-sm font-medium text-[#1A1A1A]">{roleEditorFor.fullName}</p>
                <p className="text-xs text-[#6B6B6B]">{roleEditorFor.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">
                  New role <span className="text-[#DC2626]">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className={inputCls}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r as Role] || r}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-[#9B9B9B] mt-2">
                  Module access updates immediately and the change is recorded in the audit trail.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRoleEditorFor(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#ECE0D6] hover:bg-[#fff7ed] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newRole || newRole === roleEditorFor.role || roleMutation.isPending}
                  onClick={() =>
                    roleMutation.mutate(
                      { id: roleEditorFor.id, role: newRole },
                      { onSuccess: () => setRoleEditorFor(null) }
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50"
                >
                  {roleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Update Role
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Audit tab (super_admin only)
// ─────────────────────────────────────────────────────────
const AuditTab: React.FC = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useAdminAuditLogs({
    page,
    limit: 20,
    action: actionFilter || undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className={`${inputCls} max-w-xs`}
        >
          <option value="">All actions</option>
          {ADMIN_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        {data && (
          <p className="text-xs text-[#6B6B6B]">
            {data.total} event{data.total === 1 ? '' : 's'} · page {data.page} of{' '}
            {Math.max(1, data.pages)}
          </p>
        )}
      </div>

      <div className={`${cardCls} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4]">
                <th className={thCls}>Action</th>
                <th className={thCls}>Actor</th>
                <th className={thCls}>Entity</th>
                <th className={thCls}>IP</th>
                <th className={thCls}>When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : (data?.logs || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <ScrollText className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No audit events</p>
                  </td>
                </tr>
              ) : (
                (data?.logs || []).map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                    className="hover:bg-[#FBF8F4] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]/50">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-xs font-medium text-[#1A1A1A]">{log.actorName}</p>
                      {log.actorRole && (
                        <p className="text-[10px] text-[#9B9B9B]">
                          {ROLE_LABELS[log.actorRole as Role] || log.actorRole}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-[#6B6B6B]">
                      {log.entity}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span className="block text-[10px] text-[#9B9B9B] truncate max-w-[240px]">
                          {Object.entries(log.metadata)
                            .slice(0, 3)
                            .map(([k, v]) => `${k}: ${String(v)}`)
                            .join(' · ')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[11px] font-mono text-[#9B9B9B]">{log.ip || '—'}</td>
                    <td className="px-5 py-3 text-xs text-[#6B6B6B]">{fmtDateTime(log.createdAt)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.pages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded-lg border border-[#ECE0D6] text-[#6B6B6B] hover:bg-[#fff7ed] disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[#6B6B6B] font-mono">
            {page} / {data.pages}
          </span>
          <button
            type="button"
            disabled={page >= data.pages}
            onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
            className="p-2 rounded-lg border border-[#ECE0D6] text-[#6B6B6B] hover:bg-[#fff7ed] disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────
type TabKey = 'overview' | 'accounts' | 'permissions' | 'audit';

export const AdminPanelPage: React.FC = () => {
  const { user } = useAuth();
  const isSuper = user?.role === 'super_admin';
  const [tab, setTab] = useState<TabKey>('overview');

  const { data: overview, isLoading, refetch, isRefetching } = useAdminOverview();

  const { data: permMatrix } = useQuery<PermissionRowDto[]>({
    queryKey: ['moduleAccess', user?.role, user?.id],
    queryFn: async () => {
      const res = await apiClient.get<{ matrix: PermissionRowDto[] }>('/permissions');
      return res.data.matrix;
    },
    enabled: !!isSuper && tab === 'permissions',
  });

  const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { key: 'accounts', label: 'Accounts', icon: <Users className="w-4 h-4" /> },
    ...(isSuper
      ? [
          { key: 'permissions' as TabKey, label: 'Permission Matrix', icon: <ShieldCheck className="w-4 h-4" /> },
          { key: 'audit' as TabKey, label: 'Audit Trail', icon: <ScrollText className="w-4 h-4" /> },
        ]
      : []),
  ];

  return (
    <div className="admin-panel-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isSuper
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/25'
                  : 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]'
              }`}
            >
              {isSuper ? <Crown className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              {isSuper ? 'Super Admin Console' : 'Admin Console'}
            </span>
            <span className="text-xs text-[#9B9B9B] font-mono">
              / {overview?.organization?.name || '…'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
            {isSuper ? 'Organization Control Center' : 'Workspace Administration'}
          </h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            {isSuper
              ? 'Full command over accounts, roles, permissions, and security analytics.'
              : 'Manage accounts and monitor workspace activity at a glance.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors self-start"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin text-[#f97316]' : ''}`} />
        </button>
      </motion.div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-[#ECE0D6] overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'text-[#f97316] border-[#f97316]'
                : 'text-[#6B6B6B] border-transparent hover:text-[#1A1A1A]'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' &&
        (isLoading || !overview ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl bg-[#fff7ed] animate-pulse" />
            ))}
          </div>
        ) : (
          <OverviewTab
            overview={overview}
            isSuper={!!isSuper}
            onOpenAudit={() => setTab('audit')}
          />
        ))}

      {tab === 'accounts' && <AccountsTab isSuper={!!isSuper} selfId={user?.id || ''} />}

      {tab === 'permissions' && isSuper && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs text-[#6B6B6B]">
              Read-only summary of every enabled grant. Edit the live matrix on the
              dedicated Permissions page.
            </p>
            <a
              href="/dashboard/permissions"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Open Permission Editor
            </a>
          </div>
          <div className={`${cardCls} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4]">
                    <th className={thCls}>Role</th>
                    <th className={thCls}>Module</th>
                    <th className={thCls}>Access</th>
                    <th className={thCls}>Actions Granted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EDE4]">
                  {!permMatrix ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="px-5 py-4">
                          <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                        </td>
                      </tr>
                    ))
                  ) : (
                    permMatrix
                      .filter((row) => row.enabled)
                      .map((row, idx) => (
                        <motion.tr
                          key={`${row.role}:${row.module}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                          className="hover:bg-[#FBF8F4] transition-colors"
                        >
                          <td className="px-5 py-3 text-xs font-medium text-[#1A1A1A]">
                            {ROLE_LABELS[row.role as Role] || row.role}
                          </td>
                          <td className="px-5 py-3">
                            <span className="text-xs font-mono font-semibold text-[#ea580c] bg-[#fff7ed] border border-[#fed7aa]/50 px-2 py-0.5 rounded">
                              {row.module}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" />
                              Enabled
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {row.actions.map((a) => (
                                <span
                                  key={a}
                                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#FBF8F4] border border-[#ECE0D6] text-[#6B6B6B]"
                                >
                                  {a}
                                </span>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'audit' && isSuper && <AuditTab />}
    </div>
  );
};

export default AdminPanelPage;
