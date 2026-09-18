import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Play,
  RefreshCw,
  Users,
  CalendarDays,
  Timer,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  useAttendanceToday,
  useAttendanceAction,
  useAttendanceSummary,
  useAttendanceRoster,
} from '../../hooks/useHrms';
import { LiveAttendancePill, AttendanceStatusPill } from '../../components/hrms/HrmsStatusPill';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { useAuth } from '../../contexts/AuthContext';
import type { LiveAttendanceState, RosterStatus } from '../../types/hrms';
import { ROLE_LABELS, type Role } from '../../types/user';

const ROSTER_STATUS_LABELS: Record<RosterStatus, string> = {
  not_checked_in: 'Not Clocked In',
  checked_in: 'Present',
  on_break: 'On Break',
  checked_out: 'Checked Out',
  on_leave: 'On Leave',
};

const fmtHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const fmtClock = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

// ─────────────────────────────────────────────────────────
// My Attendance view
// ─────────────────────────────────────────────────────────
const MyAttendance: React.FC = () => {
  const { data: today, isLoading } = useAttendanceToday();
  const actionMutation = useAttendanceAction();

  // Live ticking elapsed time (ticks every 30s while working/on break)
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

  const now2 = new Date();
  const { data: summary, isLoading: summaryLoading } = useAttendanceSummary({
    month: now2.getMonth() + 1,
    year: now2.getFullYear(),
  });

  const state = (today?.currentStatus ?? 'not_checked_in') as LiveAttendanceState;

  const stateConfigTable: Record<LiveAttendanceState, { chip: string; title: string; desc: string }> = {
    not_checked_in: {
      chip: 'bg-[#FBF0E7] text-[#6B6B6B] border-[#ECE0D6]',
      title: 'Not checked in',
      desc: 'Start your shift by checking in below.',
    },
    checked_in: {
      chip: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25',
      title: 'Working',
      desc: 'You are checked in. Shift started at ' + fmtClock(today?.checkInAt ?? null) + '.',
    },
    on_break: {
      chip: 'bg-[#B45309]/10 text-[#B45309] border-[#B45309]/25',
      title: 'On Break',
      desc: 'Your break is running. End it to resume work.',
    },
    checked_out: {
      chip: 'bg-[#FBF0E7] text-[#6B6B6B] border-[#ECE0D6]',
      title: 'Checked out',
      desc: 'Shift complete at ' + fmtClock(today?.checkOutAt ?? null) + '. See you tomorrow!',
    },
  };
  const stateConfig = stateConfigTable[state];

  // Daily-hours chart data (working days of the current month)
  const chartData: Array<{ day: number; hours: number; status: string }> = useMemo(
    () =>
      (summary?.dailyBreakdown || [])
        .filter((d) => d.status !== 'pending')
        .map((d) => ({
          day: d.dayOfMonth,
          hours: d.workedHours,
          status: d.status,
        })),
    [summary]
  );

  const barColor = (status: string) =>
    status === 'present'
      ? '#C2540C'
      : status === 'half_day'
        ? '#B45309'
        : status === 'on_leave'
          ? '#DE7A3D'
          : status === 'absent'
            ? '#DC2626'
            : '#ECE0D6';

  return (
    <div className="space-y-6">
      {/* ── Check-in / out card ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-6">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-32 rounded bg-[#FBEAE0]" />
            <div className="h-16 rounded-xl bg-[#FBEAE0]" />
            <div className="h-10 w-40 rounded-xl bg-[#FBEAE0]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#C2540C]" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Today&apos;s Shift</h3>
                {today?.isLate && state !== 'not_checked_in' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/25">
                    <AlertCircle className="w-3 h-3" />
                    Late
                  </span>
                )}
              </div>
              <LiveAttendancePill status={state} />
            </div>

            {/* Live clock + elapsed */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Current time</p>
                <p className="text-xl font-bold text-[#1A1A1A] font-mono">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Worked today</p>
                <p className="text-xl font-bold text-[#C2540C] font-mono">{fmtHM(liveMinutes)}</p>
              </div>
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Shift starts</p>
                <p className="text-xl font-bold text-[#1A1A1A] font-mono">{today?.shiftStartTime || '—'}</p>
              </div>
            </div>

            {/* State banner */}
            <div className={`rounded-xl border px-4 py-3 mb-5 ${stateConfig.chip}`}>
              <p className="text-sm font-semibold">{stateConfig.title}</p>
              <p className="text-xs opacity-80 mt-0.5">{stateConfig.desc}</p>
            </div>

            {/* Action buttons — visually distinct states */}
            <div className="flex flex-wrap items-center gap-2">
              {state === 'not_checked_in' && (
                <button
                  type="button"
                  onClick={() => actionMutation.mutate('check-in')}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#16A34A] hover:bg-[#12813A] text-white transition-colors disabled:opacity-50 shadow-md shadow-[#16A34A]/20"
                >
                  {actionMutation.isPending ? <Timer className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Check In
                </button>
              )}
              {state === 'checked_in' && (
                <>
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate('break-in')}
                    disabled={actionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#B45309] hover:bg-[#92400E] text-white transition-colors disabled:opacity-50"
                  >
                    <Coffee className="w-4 h-4" />
                    Break In
                  </button>
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate('check-out')}
                    disabled={actionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#DC2626] hover:bg-[#A81F16] text-white transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Check Out
                  </button>
                </>
              )}
              {state === 'on_break' && (
                <>
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate('break-out')}
                    disabled={actionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#16A34A] hover:bg-[#12813A] text-white transition-colors disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Break Out
                  </button>
                  <span className="text-xs text-[#6B6B6B]">Check out is disabled while on break.</span>
                </>
              )}
              {state === 'checked_out' && (
                <span className="text-xs text-[#6B6B6B] inline-flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />
                  Shift complete — {fmtHM(today?.totalWorkedMinutes ?? 0)} logged.
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Monthly stats + chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-3">
          {summaryLoading || !summary ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-[#FBEAE0] animate-pulse" />)
          ) : (
            <>
              <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-[#16A34A]" />
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Present days</p>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {summary.totalPresentDays}
                  <span className="text-sm text-[#9B9B9B] font-medium"> / {summary.expectedWorkingDays} expected</span>
                </p>
              </div>
              <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#C2540C]" />
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Hours worked</p>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {summary.totalWorkedHours}
                  <span className="text-sm text-[#9B9B9B] font-medium"> hrs this month</span>
                </p>
              </div>
              <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-[#DC2626]" />
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Absent / Leave</p>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {summary.totalAbsentDays}
                  <span className="text-sm text-[#9B9B9B] font-medium"> absent · {summary.totalLeaveDays} on leave</span>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-8 rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#C2540C]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Daily Hours — {now2.toLocaleString([], { month: 'long' })}</h4>
          </div>
          {summaryLoading ? (
            <div className="h-56 rounded-xl bg-[#FBEAE0] animate-pulse" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#9B9B9B' }} tickLine={false} axisLine={{ stroke: '#ECE0D6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9B9B9B' }} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip
                    formatter={(v) => [`${v}h`, 'Worked']}
                    labelFormatter={(l) => `Day ${l}`}
                    contentStyle={{ borderRadius: 12, border: '1px solid #ECE0D6', fontSize: 12 }}
                  />
                  <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={barColor(d.status)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Team Roster view (manager/HR/admin only)
// ─────────────────────────────────────────────────────────
const TeamRoster: React.FC = () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [rosterDate, setRosterDate] = useState(todayStr);
  const { data, isLoading, isError, error, refetch } = useAttendanceRoster(
    rosterDate === todayStr ? undefined : rosterDate
  );

  const roster = data?.roster || [];
  const counts = useMemo(() => {
    const c: Record<string, number> = { present: 0, on_break: 0, checked_out: 0, not_checked_in: 0, on_leave: 0 };
    for (const r of roster) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [roster]);

  if (isError) {
    const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
    return (
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-14 text-center">
        <Users className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
        <p className="text-sm font-medium text-[#1A1A1A]">Roster unavailable</p>
        <p className="text-xs text-[#6B6B6B] mt-1">
          {message || 'Only managers, HR, and admins can view the org-wide roster.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls + counters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/25">
            {counts.checked_in} present
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#B45309]/10 text-[#B45309] border border-[#B45309]/25">
            {counts.on_break} on break
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBF0E7] text-[#6B6B6B] border border-[#ECE0D6]">
            {counts.checked_out} checked out
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBEAE0] text-[#C2540C] border border-[#F0D3BC]">
            {counts.on_leave} on leave
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={rosterDate}
            max={todayStr}
            onChange={(e) => setRosterDate(e.target.value)}
            className="rounded-lg border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#C2540C]/25 focus:border-[#C2540C] transition-all"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] border border-[#ECE0D6] transition-colors"
            title="Refresh roster"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Roster table */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Member</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Clock-in</th>
                <th className="px-5 py-3 font-semibold">Worked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#FBEAE0] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <Users className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No roster entries</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">No accounts were active on this date.</p>
                  </td>
                </tr>
              ) : (
                roster.map((entry, idx) => (
                  <motion.tr
                    key={entry.userId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3), duration: 0.25 }}
                    className="hover:bg-[#FBF8F4] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#1A1A1A]">{entry.fullName}</div>
                      <div className="text-xs text-[#6B6B6B]">{entry.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-[#6B6B6B]">
                        {ROLE_LABELS[entry.role as Role] || entry.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <LiveAttendancePill status={entry.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {fmtClock(entry.checkInAt)}
                      {entry.isLate && (
                        <span className="ml-1.5 text-[10px] font-semibold text-[#DC2626]">late</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">{fmtHM(entry.workedMinutes)}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Attendance page — tabs
// ─────────────────────────────────────────────────────────
export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isManagement = ['super_admin', 'admin', 'manager', 'hr'].includes(user?.role || '');
  const [tab, setTab] = useState<'mine' | 'team'>('mine');

  return (
    <div className="hrms-submodule-page p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Attendance</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Track your shift in real time{isManagement ? ' and review the team roster' : ''}.
          </p>
        </div>
        {isManagement && (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
            <button
              type="button"
              onClick={() => setTab('mine')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'mine' ? 'bg-[#C2540C] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              My Attendance
            </button>
            <button
              type="button"
              onClick={() => setTab('team')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === 'team' ? 'bg-[#C2540C] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Team Roster
            </button>
          </div>
        )}
      </motion.div>

      {tab === 'mine' ? <MyAttendance /> : <TeamRoster />}
    </div>
  );
};

export default AttendancePage;
