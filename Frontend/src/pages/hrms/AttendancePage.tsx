import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Plus,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit2,
  Trash2,
  UserCheck,
  FileEdit,
  ShieldCheck,
  Layers,
  Sparkles,
  Check,
  X,
  Briefcase,
  Search,
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
  useShifts,
  useCreateShift,
  useUpdateShift,
  useDeleteShift,
  useAssignShift,
  useActiveShift,
  useRegularizations,
  useCreateRegularization,
  useReviewRegularization,
  useEmployees,
} from '../../hooks/useHrms';
import {
  LiveAttendancePill,
  RegularizationStatusPill,
} from '../../components/hrms/HrmsStatusPill';
import { useAuth } from '../../contexts/AuthContext';
import type {
  LiveAttendanceState,
  RosterStatus,
  Shift,
  ShiftInput,
  AttendanceRegularization,
  RegularizationType,
} from '../../types/hrms';
import { REGULARIZATION_TYPE_LABELS } from '../../types/hrms';
import { ROLE_LABELS, type Role } from '../../types/user';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fmtHM = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
};

const fmtClock = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

// ─────────────────────────────────────────────────────────
// Regularization Request Modal (Employee self-service)
// ─────────────────────────────────────────────────────────
interface RequestRegularizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

const RequestRegularizationModal: React.FC<RequestRegularizationModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(defaultDate || todayStr);
  const [type, setType] = useState<RegularizationType>('missed_check_in');
  const [requestedCheckInTime, setRequestedCheckInTime] = useState('09:00');
  const [requestedCheckOutTime, setRequestedCheckOutTime] = useState('18:00');
  const [reason, setReason] = useState('');

  const createMutation = useCreateRegularization();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    // Convert time strings to ISO datetime strings for the selected date
    const checkInIso = requestedCheckInTime ? new Date(`${date}T${requestedCheckInTime}:00`).toISOString() : undefined;
    const checkOutIso = requestedCheckOutTime ? new Date(`${date}T${requestedCheckOutTime}:00`).toISOString() : undefined;

    createMutation.mutate(
      {
        date,
        type,
        requestedCheckInAt: ['missed_check_in', 'incorrect_hours', 'outdoor_duty', 'work_from_home'].includes(type)
          ? checkInIso
          : undefined,
        requestedCheckOutAt: ['missed_check_out', 'incorrect_hours', 'outdoor_duty', 'work_from_home'].includes(type)
          ? checkOutIso
          : undefined,
        reason: reason.trim(),
      },
      {
        onSuccess: () => {
          onClose();
          setReason('');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE0D6]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#fff7ed] text-[#f97316]">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">Request Punch Regularization</h3>
              <p className="text-xs text-[#6B6B6B]">Submit missed punch or outdoor work correction</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Date</label>
            <input
              type="date"
              value={date}
              max={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Reason / Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RegularizationType)}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
            >
              {Object.entries(REGULARIZATION_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Requested Clock-In</label>
              <input
                type="time"
                value={requestedCheckInTime}
                onChange={(e) => setRequestedCheckInTime(e.target.value)}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Requested Clock-Out</label>
              <input
                type="time"
                value={requestedCheckOutTime}
                onChange={(e) => setRequestedCheckOutTime(e.target.value)}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Justification / Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why punch was missed or outdoor duty details..."
              rows={3}
              className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || !reason.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-50 shadow-sm"
            >
              {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// My Attendance view (Enhanced with Shift Details & Regularizations)
// ─────────────────────────────────────────────────────────
const MyAttendance: React.FC = () => {
  const { data: today, isLoading } = useAttendanceToday();
  const actionMutation = useAttendanceAction();
  const [isRegularizeOpen, setIsRegularizeOpen] = useState(false);

  // User's own regularization history
  const { data: userRegularizations, isLoading: regLoading } = useRegularizations();

  // Live ticking elapsed time
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
      chip: 'bg-[#FBF8F4] text-[#6B6B6B] border-[#ECE0D6]',
      title: 'Not clocked in',
      desc: 'Start your shift by checking in below.',
    },
    checked_in: {
      chip: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      title: 'Working',
      desc: 'You are checked in. Shift started at ' + fmtClock(today?.checkInAt) + '.',
    },
    on_break: {
      chip: 'bg-amber-50 text-amber-800 border-amber-200',
      title: 'On Break',
      desc: 'Your break is running. End it to resume work.',
    },
    checked_out: {
      chip: 'bg-[#FBF8F4] text-[#6B6B6B] border-[#ECE0D6]',
      title: 'Checked out',
      desc: 'Shift complete at ' + fmtClock(today?.checkOutAt) + '. See you tomorrow!',
    },
  };
  const stateConfig = stateConfigTable[state];

  // Daily-hours chart data
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
      ? '#f97316'
      : status === 'half_day'
        ? '#f59e0b'
        : status === 'on_leave'
          ? '#fed7aa'
          : status === 'absent'
            ? '#ef4444'
            : '#ECE0D6';

  return (
    <div className="space-y-6">
      {/* ── Check-in / out & Active Shift Card ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-6">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-32 rounded bg-[#fff7ed]" />
            <div className="h-16 rounded-xl bg-[#fff7ed]" />
            <div className="h-10 w-40 rounded-xl bg-[#fff7ed]" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2 flex-wrap">
                <Clock className="w-4 h-4 text-[#f97316]" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">Today&apos;s Shift</h3>

                {/* Assigned Shift Badge */}
                {today?.shift && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                    style={{
                      borderColor: today.shift.color ? `${today.shift.color}40` : '#ECE0D6',
                      backgroundColor: today.shift.color ? `${today.shift.color}15` : '#FBF8F4',
                      color: today.shift.color || '#1A1A1A',
                    }}
                  >
                    <Briefcase className="w-3 h-3" />
                    {today.shift.name} ({today.shift.startTime} – {today.shift.endTime})
                  </span>
                )}

                {/* Grace period badge */}
                {today?.shift?.graceMinutes !== undefined && today.shift.graceMinutes > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FBF8F4] text-[#6B6B6B] border border-[#ECE0D6]">
                    {today.shift.graceMinutes}m grace
                  </span>
                )}

                {/* Late flag */}
                {today?.isLate && state !== 'not_checked_in' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertCircle className="w-3 h-3" />
                    Late
                  </span>
                )}

                {/* Regularized punch badge */}
                {today?.isRegularized && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <ShieldCheck className="w-3 h-3" />
                    Regularized
                  </span>
                )}

                {/* Overtime accrued */}
                {Boolean(today?.overtimeMinutes && today.overtimeMinutes > 0) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    +{fmtHM(today!.overtimeMinutes!)} Overtime
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <LiveAttendancePill status={state} />
                <button
                  type="button"
                  onClick={() => setIsRegularizeOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6] transition-colors cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5 text-[#f97316]" />
                  Request Regularization
                </button>
              </div>
            </div>

            {/* Live clock + elapsed + timings */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Current time</p>
                <p className="text-xl font-bold text-[#1A1A1A] font-mono">
                  {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Worked today</p>
                <p className="text-xl font-bold text-[#f97316] font-mono">{fmtHM(liveMinutes)}</p>
              </div>
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Shift window</p>
                <p className="text-base font-bold text-[#1A1A1A] font-mono">
                  {today?.shift ? `${today.shift.startTime} – ${today.shift.endTime}` : today?.shiftStartTime || '—'}
                </p>
              </div>
              <div className="rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] p-4">
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1">Overtime</p>
                <p className="text-base font-bold text-[#ea580c] font-mono">
                  {today?.overtimeMinutes ? fmtHM(today.overtimeMinutes) : '0h 00m'}
                </p>
              </div>
            </div>

            {/* State banner */}
            <div className={`rounded-xl border px-4 py-3 mb-5 ${stateConfig.chip}`}>
              <p className="text-sm font-semibold">{stateConfig.title}</p>
              <p className="text-xs opacity-80 mt-0.5">{stateConfig.desc}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {state === 'not_checked_in' && (
                <button
                  type="button"
                  onClick={() => actionMutation.mutate('check-in')}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white transition-colors disabled:opacity-50 shadow-md shadow-[#f97316]/20 cursor-pointer"
                  >
                    <Coffee className="w-4 h-4" />
                    Break In
                  </button>
                  <button
                    type="button"
                    onClick={() => actionMutation.mutate('check-out')}
                    disabled={actionMutation.isPending}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 shadow-md shadow-rose-600/20 cursor-pointer"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Play className="w-4 h-4" />
                    Break Out
                  </button>
                  <span className="text-xs text-[#6B6B6B]">Check out is disabled while on break.</span>
                </>
              )}
              {state === 'checked_out' && (
                <span className="text-xs text-[#6B6B6B] inline-flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-[#9B9B9B]" />
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
            [...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-[#fff7ed] animate-pulse" />)
          ) : (
            <>
              <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Present days</p>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] font-mono">
                  {summary.totalPresentDays}
                  <span className="text-sm text-[#6B6B6B] font-medium"> / {summary.expectedWorkingDays} expected</span>
                </p>
              </div>
              <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#f97316]" />
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Hours worked</p>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] font-mono">
                  {summary.totalWorkedHours}
                  <span className="text-sm text-[#6B6B6B] font-medium"> hrs this month</span>
                </p>
              </div>
              <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">Absent / Leave</p>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A] font-mono">
                  {summary.totalAbsentDays}
                  <span className="text-sm text-[#6B6B6B] font-medium"> absent · {summary.totalLeaveDays} on leave</span>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-8 rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Daily Hours — {now2.toLocaleString([], { month: 'long' })}</h4>
          </div>
          {summaryLoading ? (
            <div className="h-56 rounded-xl bg-[#fff7ed] animate-pulse" />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={{ stroke: '#ECE0D6' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} unit="h" />
                  <Tooltip
                    formatter={(v) => [`${v}h`, 'Worked']}
                    labelFormatter={(l) => `Day ${l}`}
                    contentStyle={{ borderRadius: 12, border: '1px solid #ECE0D6', fontSize: 12, backgroundColor: '#ffffff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
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

      {/* ── My Recent Regularization Requests ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileEdit className="w-4 h-4 text-[#f97316]" />
            <h4 className="text-sm font-semibold text-[#1A1A1A]">My Regularization Requests</h4>
          </div>
          <button
            type="button"
            onClick={() => setIsRegularizeOpen(true)}
            className="text-xs font-semibold text-[#f97316] hover:text-[#ea580c] cursor-pointer"
          >
            + New Request
          </button>
        </div>

        {regLoading ? (
          <div className="h-20 rounded-xl bg-[#fff7ed] animate-pulse" />
        ) : !userRegularizations || userRegularizations.length === 0 ? (
          <div className="p-8 text-center bg-[#FBF8F4] rounded-xl border border-[#ECE0D6]">
            <p className="text-xs text-[#6B6B6B]">No punch regularizations submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ECE0D6] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                  <th className="pb-2 font-semibold">Date</th>
                  <th className="pb-2 font-semibold">Type</th>
                  <th className="pb-2 font-semibold">Requested Times</th>
                  <th className="pb-2 font-semibold">Reason</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Reviewer Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EDE4]">
                {userRegularizations.slice(0, 5).map((reg) => (
                  <tr key={reg._id} className="py-2.5">
                    <td className="py-2.5 font-medium text-[#1A1A1A]">{reg.date}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                        {REGULARIZATION_TYPE_LABELS[reg.type] || reg.type}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#6B6B6B] font-mono">
                      {fmtClock(reg.requestedCheckInAt)} – {fmtClock(reg.requestedCheckOutAt)}
                    </td>
                    <td className="py-2.5 text-[#1A1A1A] max-w-xs truncate" title={reg.reason}>
                      {reg.reason}
                    </td>
                    <td className="py-2.5">
                      <RegularizationStatusPill status={reg.status} />
                    </td>
                    <td className="py-2.5 text-[#6B6B6B] italic">
                      {reg.reviewerComments || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Regularization Modal */}
      <RequestRegularizationModal
        isOpen={isRegularizeOpen}
        onClose={() => setIsRegularizeOpen(false)}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Team Roster view (manager/HR/admin only)
// ─────────────────────────────────────────────────────────
const TeamRoster: React.FC = () => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [rosterDate, setRosterDate] = useState(todayStr);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, error, refetch } = useAttendanceRoster(
    rosterDate === todayStr ? undefined : rosterDate
  );

  const roster = useMemo(() => {
    const list = data?.roster || [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q))
    );
  }, [data?.roster, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { present: 0, on_break: 0, checked_out: 0, not_checked_in: 0, on_leave: 0 };
    for (const r of data?.roster || []) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, [data?.roster]);

  if (isError) {
    const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
    return (
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-14 text-center">
        <Users className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#1A1A1A]">Roster unavailable</p>
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {counts.checked_in || 0} present
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {counts.on_break || 0} on break
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FBF8F4] text-[#6B6B6B] border border-[#ECE0D6]">
            {counts.checked_out || 0} checked out
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
            {counts.on_leave || 0} on leave
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl border border-[#ECE0D6] bg-white text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] transition-all"
            />
          </div>
          <input
            type="date"
            value={rosterDate}
            max={todayStr}
            onChange={(e) => setRosterDate(e.target.value)}
            className="rounded-xl border border-[#ECE0D6] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] transition-all"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
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
                <th className="px-5 py-3 font-semibold">Role & Dept</th>
                <th className="px-5 py-3 font-semibold">Shift</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Clock-in</th>
                <th className="px-5 py-3 font-semibold">Worked</th>
                <th className="px-5 py-3 font-semibold">Overtime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : roster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <Users className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">No roster entries</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">No accounts matched the query for this date.</p>
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
                      <div className="font-semibold text-[#1A1A1A]">{entry.fullName}</div>
                      <div className="text-xs text-[#6B6B6B]">{entry.email}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs font-medium text-[#1A1A1A]">
                        {ROLE_LABELS[entry.role as Role] || entry.role}
                      </div>
                      {entry.department && (
                        <div className="text-[11px] text-[#6B6B6B]">{entry.department}</div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {entry.shift ? (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border"
                          style={{
                            borderColor: entry.shift.color ? `${entry.shift.color}40` : '#ECE0D6',
                            backgroundColor: entry.shift.color ? `${entry.shift.color}15` : '#FBF8F4',
                            color: entry.shift.color || '#1A1A1A',
                          }}
                        >
                          {entry.shift.code || entry.shift.name}
                        </span>
                      ) : (
                        <span className="text-xs text-[#9B9B9B]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <LiveAttendancePill status={entry.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {fmtClock(entry.checkInAt)}
                      {entry.isLate && (
                        <span className="ml-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          late
                        </span>
                      )}
                      {entry.isRegularized && (
                        <span className="ml-1.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          reg
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                      {fmtHM(entry.workedMinutes)}
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono">
                      {entry.overtimeMinutes && entry.overtimeMinutes > 0 ? (
                        <span className="text-[#ea580c] font-semibold bg-[#fff7ed] px-2 py-0.5 rounded border border-[#fed7aa]">
                          +{fmtHM(entry.overtimeMinutes)}
                        </span>
                      ) : (
                        <span className="text-[#9B9B9B]">—</span>
                      )}
                    </td>
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
// Regularizations Approval Queue (manager/HR/admin)
// ─────────────────────────────────────────────────────────
const RegularizationsQueue: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedReg, setSelectedReg] = useState<AttendanceRegularization | null>(null);
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve');
  const [comments, setComments] = useState('');

  const { data: regularizations, isLoading, refetch } = useRegularizations(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );

  const reviewMutation = useReviewRegularization();

  const handleOpenReview = (reg: AttendanceRegularization, act: 'approve' | 'reject') => {
    setSelectedReg(reg);
    setDecision(act);
    setComments('');
  };

  const handleConfirmDecision = () => {
    if (!selectedReg) return;
    reviewMutation.mutate(
      {
        id: selectedReg._id,
        decision,
        comments: comments.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedReg(null);
          refetch();
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                statusFilter === s
                  ? 'bg-[#f97316] text-white shadow-xs'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 self-end rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors cursor-pointer"
          title="Refresh queue"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Queue Table */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3 font-semibold">Employee</th>
                <th className="px-5 py-3 font-semibold">Correction Date</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Requested Times</th>
                <th className="px-5 py-3 font-semibold">Reason</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="px-5 py-4">
                      <div className="h-5 rounded bg-[#fff7ed] animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : !regularizations || regularizations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <ShieldCheck className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
                    <p className="text-sm font-semibold text-[#1A1A1A]">No requests found</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">There are no regularization requests matching this filter.</p>
                  </td>
                </tr>
              ) : (
                regularizations.map((reg) => {
                  const empName =
                    reg.employeeId?.fullName ||
                    `${reg.employeeId?.firstName || ''} ${reg.employeeId?.lastName || ''}`.trim() ||
                    'Employee';
                  return (
                    <tr key={reg._id} className="hover:bg-[#FBF8F4] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#1A1A1A]">{empName}</div>
                        <div className="text-xs text-[#6B6B6B]">{reg.employeeId?.employeeCode || '—'}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-medium text-[#1A1A1A]">{reg.date}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]">
                          {REGULARIZATION_TYPE_LABELS[reg.type] || reg.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#6B6B6B] font-mono">
                        {fmtClock(reg.requestedCheckInAt)} – {fmtClock(reg.requestedCheckOutAt)}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#1A1A1A] max-w-xs truncate" title={reg.reason}>
                        {reg.reason}
                      </td>
                      <td className="px-5 py-3.5">
                        <RegularizationStatusPill status={reg.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {reg.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenReview(reg, 'approve')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReview(reg, 'reject')}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#6B6B6B] italic">
                            {reg.reviewedBy?.fullName ? `By ${reg.reviewedBy.fullName}` : 'Reviewed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Dialog Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedReg(null)} />
          <div className="relative w-full max-w-md rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-[#1A1A1A]">
              {decision === 'approve' ? 'Approve Regularization' : 'Reject Regularization'}
            </h3>
            <p className="text-xs text-[#6B6B6B]">
              {decision === 'approve'
                ? 'Approving will recalculate attendance, mark punch as regularized, and recompute worked & overtime hours.'
                : 'State the reason for rejecting this punch correction request.'}
            </p>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Comments / Feedback {decision === 'reject' ? '(Required)' : '(Optional)'}
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={decision === 'approve' ? 'e.g. Verified with client meeting log' : 'e.g. Inconsistent punch records'}
                rows={3}
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={() => setSelectedReg(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={reviewMutation.isPending || (decision === 'reject' && !comments.trim())}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs ${
                  decision === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {reviewMutation.isPending ? 'Processing...' : decision === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Shifts & Rostering Management (manager/HR/admin)
// ─────────────────────────────────────────────────────────
const ShiftRostering: React.FC = () => {
  const { data: shifts, isLoading, refetch } = useShifts();
  const { data: employees } = useEmployees({ status: 'active' });

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Create / Edit state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [fullDayMinutes, setFullDayMinutes] = useState(480);
  const [halfDayMinutes, setHalfDayMinutes] = useState(240);
  const [workWeekDays, setWorkWeekDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [isNightShift, setIsNightShift] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [color, setColor] = useState('#f97316');

  // Assign state
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10));
  const [effectiveTo, setEffectiveTo] = useState('');

  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift();
  const deleteMutation = useDeleteShift();
  const assignMutation = useAssignShift();

  const handleOpenCreate = () => {
    setEditingShift(null);
    setName('');
    setCode('');
    setStartTime('09:00');
    setEndTime('18:00');
    setGraceMinutes(15);
    setFullDayMinutes(480);
    setHalfDayMinutes(240);
    setWorkWeekDays([1, 2, 3, 4, 5]);
    setIsNightShift(false);
    setIsDefault(false);
    setColor('#f97316');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (shift: Shift) => {
    setEditingShift(shift);
    setName(shift.name);
    setCode(shift.code);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setGraceMinutes(shift.graceMinutes || 15);
    setFullDayMinutes(shift.fullDayMinutes || 480);
    setHalfDayMinutes(shift.halfDayMinutes || 240);
    setWorkWeekDays(shift.workWeekDays || [1, 2, 3, 4, 5]);
    setIsNightShift(Boolean(shift.isNightShift));
    setIsDefault(Boolean(shift.isDefault));
    setColor(shift.color || '#f97316');
    setIsCreateOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ShiftInput = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      startTime,
      endTime,
      graceMinutes: Number(graceMinutes),
      fullDayMinutes: Number(fullDayMinutes),
      halfDayMinutes: Number(halfDayMinutes),
      workWeekDays,
      isNightShift,
      isDefault,
      color,
    };

    if (editingShift) {
      updateMutation.mutate(
        { id: editingShift._id, patch: payload },
        {
          onSuccess: () => {
            setIsCreateOpen(false);
            refetch();
          },
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsCreateOpen(false);
          refetch();
        },
      });
    }
  };

  const handleAssignShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShiftId || selectedEmpIds.length === 0) return;

    assignMutation.mutate(
      {
        employeeIds: selectedEmpIds,
        shiftId: selectedShiftId,
        effectiveFrom,
        effectiveTo: effectiveTo || null,
      },
      {
        onSuccess: () => {
          setIsAssignOpen(false);
          setSelectedEmpIds([]);
        },
      }
    );
  };

  const toggleDay = (dayIndex: number) => {
    setWorkWeekDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex].sort()
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-[#1A1A1A]">Defined Shift Templates</h3>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Configure shift timings, grace rules, work week days, and allocate to employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (shifts && shifts.length > 0) {
                setSelectedShiftId(shifts[0]._id);
              }
              setIsAssignOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa] hover:bg-[#ffedd5] transition-colors cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Assign Shift to Team
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Shift
          </button>
        </div>
      </div>

      {/* Shifts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-[#fff7ed] animate-pulse" />
          ))}
        </div>
      ) : !shifts || shifts.length === 0 ? (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white p-14 text-center">
          <Layers className="w-10 h-10 text-[#E8DCCE] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#1A1A1A]">No shifts defined</p>
          <p className="text-xs text-[#6B6B6B] mt-1">Create your first shift template to start multi-shift rostering.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shifts.map((shift) => (
            <div
              key={shift._id}
              className="rounded-2xl border border-[#ECE0D6] bg-white shadow-sm p-5 hover:border-[#f97316]/50 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-full ring-2 ring-white"
                    style={{ backgroundColor: shift.color || '#f97316' }}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A1A]">{shift.name}</h4>
                    <span className="text-[10px] font-semibold text-[#6B6B6B] tracking-wider uppercase font-mono">
                      {shift.code}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {shift.isDefault && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Default
                    </span>
                  )}
                  {shift.isNightShift && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Night
                    </span>
                  )}
                </div>
              </div>

              {/* Shift Timings */}
              <div className="p-3 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Window</p>
                  <p className="text-sm font-bold text-[#1A1A1A] font-mono">
                    {shift.startTime} – {shift.endTime}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider">Grace Period</p>
                  <p className="text-sm font-bold text-[#f97316] font-mono">{shift.graceMinutes}m</p>
                </div>
              </div>

              {/* Working days pill group */}
              <div>
                <p className="text-[10px] font-semibold text-[#6B6B6B] uppercase tracking-wider mb-1.5">Work Week</p>
                <div className="flex items-center gap-1">
                  {DAY_LABELS.map((day, dIdx) => {
                    const active = (shift.workWeekDays || []).includes(dIdx);
                    return (
                      <span
                        key={day}
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          active
                            ? 'bg-[#fff7ed] text-[#ea580c] border border-[#fed7aa]'
                            : 'bg-[#FBF8F4] text-[#9B9B9B] border border-transparent'
                        }`}
                      >
                        {day}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(shift)}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] transition-colors cursor-pointer"
                  title="Edit shift"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                {!shift.isDefault && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Delete shift "${shift.name}"?`)) {
                        deleteMutation.mutate(shift._id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete shift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Shift Modal ── */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE0D6]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#fff7ed] text-[#f97316]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">
                    {editingShift ? 'Edit Shift Template' : 'Create New Shift'}
                  </h3>
                  <p className="text-xs text-[#6B6B6B]">Define schedule timing & grace thresholds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Shift Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Morning General"
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Shift Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. GEN-AM"
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Grace Period (min)</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Full Day (min)</label>
                  <input
                    type="number"
                    min={60}
                    max={1440}
                    value={fullDayMinutes}
                    onChange={(e) => setFullDayMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Half Day (min)</label>
                  <input
                    type="number"
                    min={30}
                    max={720}
                    value={halfDayMinutes}
                    onChange={(e) => setHalfDayMinutes(Number(e.target.value))}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
              </div>

              {/* Work Week Days selector */}
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((day, idx) => {
                    const isSelected = workWeekDays.includes(idx);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#f97316] text-white shadow-xs'
                            : 'bg-[#FBF8F4] text-[#6B6B6B] border border-[#ECE0D6] hover:bg-[#F3EDE4]'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color & toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Shift Badge Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-[#ECE0D6]"
                    />
                    <span className="text-xs text-[#6B6B6B] font-mono">{color}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isNightShift}
                      onChange={(e) => setIsNightShift(e.target.checked)}
                      className="rounded text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-xs font-medium text-[#1A1A1A]">Night Shift (crosses midnight)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDefault}
                      onChange={(e) => setIsDefault(e.target.checked)}
                      className="rounded text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-xs font-medium text-[#1A1A1A]">Default Shift for Organization</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !name.trim() || !code.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-50 shadow-sm"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Assign Shift Modal ── */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsAssignOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-[#ECE0D6] bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECE0D6]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#fff7ed] text-[#f97316]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A]">Assign Shift to Employees</h3>
                  <p className="text-xs text-[#6B6B6B]">Set effective rosters for individuals or departments</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="p-1 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Target Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(e.target.value)}
                  className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  required
                >
                  {shifts?.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.code}) — {s.startTime} to {s.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Effective From</label>
                  <input
                    type="date"
                    value={effectiveFrom}
                    onChange={(e) => setEffectiveFrom(e.target.value)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={effectiveTo}
                    onChange={(e) => setEffectiveTo(e.target.value)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-sm text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316]"
                  />
                </div>
              </div>

              {/* Employee Selection Checklist */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#1A1A1A]">Select Employees ({selectedEmpIds.length})</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedEmpIds.length === (employees?.length || 0)) {
                        setSelectedEmpIds([]);
                      } else {
                        setSelectedEmpIds(employees?.map((e) => e._id) || []);
                      }
                    }}
                    className="text-xs text-[#f97316] hover:text-[#ea580c] font-semibold"
                  >
                    {selectedEmpIds.length === (employees?.length || 0) ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] p-2 divide-y divide-[#ECE0D6]">
                  {!employees || employees.length === 0 ? (
                    <p className="p-3 text-xs text-[#6B6B6B] text-center">No active employees found</p>
                  ) : (
                    employees.map((emp) => {
                      const isChecked = selectedEmpIds.includes(emp._id);
                      return (
                        <label
                          key={emp._id}
                          className="flex items-center gap-2.5 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedEmpIds((prev) =>
                                isChecked ? prev.filter((id) => id !== emp._id) : [...prev, emp._id]
                              );
                            }}
                            className="rounded text-[#f97316] focus:ring-[#f97316]"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-[#1A1A1A]">
                              {emp.fullName}
                            </span>
                            <span className="text-[#6B6B6B] ml-2">({emp.employeeCode})</span>
                            {emp.designation && (
                              <span className="text-[10px] text-[#9B9B9B] ml-1.5 font-medium">
                                · {emp.designation}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBF8F4] border border-[#ECE0D6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending || !selectedShiftId || selectedEmpIds.length === 0}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white disabled:opacity-50 shadow-sm"
                >
                  {assignMutation.isPending ? 'Assigning...' : `Assign to ${selectedEmpIds.length} Employees`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Attendance page — Enhanced Multi-Tab Experience
// ─────────────────────────────────────────────────────────
export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const isManagement = ['super_admin', 'admin', 'manager', 'hr'].includes(user?.role || '');
  const [tab, setTab] = useState<'mine' | 'team' | 'regularizations' | 'shifts'>('mine');

  // Count pending regularizations for notification badge
  const { data: pendingRegs } = useRegularizations({ status: 'pending' });
  const pendingCount = isManagement && pendingRegs ? pendingRegs.length : 0;

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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Attendance & Rostering</h2>
          <p className="text-sm text-[#6B6B6B] mt-1">
            Real-time shift clock-in, overtime tracking, punch corrections & multi-shift rosters.
          </p>
        </div>

        {/* View Switcher Tabs */}
        {isManagement ? (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6] flex-wrap">
            <button
              type="button"
              onClick={() => setTab('mine')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'mine' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              My Attendance
            </button>
            <button
              type="button"
              onClick={() => setTab('team')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'team' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Team Roster
            </button>
            <button
              type="button"
              onClick={() => setTab('regularizations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer relative ${
                tab === 'regularizations' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Regularizations
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setTab('shifts')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'shifts' ? 'bg-[#f97316] text-white shadow-sm' : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Shift Rostering
            </button>
          </div>
        ) : null}
      </motion.div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'mine' && <MyAttendance />}
          {tab === 'team' && <TeamRoster />}
          {tab === 'regularizations' && <RegularizationsQueue />}
          {tab === 'shifts' && <ShiftRostering />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default AttendancePage;
