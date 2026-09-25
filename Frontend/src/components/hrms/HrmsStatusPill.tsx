import React from 'react';
import { clsx } from 'clsx';
import type {
  AttendanceStatus,
  EmployeeStatus,
  LeaveRequestStatus,
  LiveAttendanceState,
  RosterStatus,
} from '../../types/hrms';
import {
  EMPLOYEE_STATUS_LABELS,
  LEAVE_STATUS_LABELS,
} from '../../types/hrms';

// ─────────────────────────────────────────────────────────
// HRMS status → color mapping (extends the design-system
// semantic tokens from CRM's StagePill — no new colors):
//   success → #16A34A · warning → #B45309 · danger → #DC2626
//   info → #3B82F6 · brand/subtle → #f97316 on #fff7ed
//   neutral → #fff7ed bg + #6B6B6B text
// ─────────────────────────────────────────────────────────

const PILL_SUCCESS = 'bg-emerald-50 text-emerald-700 border-emerald-200';
const PILL_WARNING = 'bg-amber-50 text-amber-700 border-amber-200';
const PILL_DANGER = 'bg-rose-50 text-rose-700 border-rose-200';
const PILL_BRAND = 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]';
const PILL_NEUTRAL = 'bg-slate-100 text-slate-700 border-slate-200';

const DOT_SUCCESS = 'bg-emerald-500';
const DOT_WARNING = 'bg-amber-500';
const DOT_DANGER = 'bg-rose-500';
const DOT_BRAND = 'bg-[#f97316]';
const DOT_NEUTRAL = 'bg-slate-400';

// ── Attendance status ──
const ATTENDANCE_STYLES: Record<AttendanceStatus | 'pending', { pill: string; dot: string; label: string }> = {
  present: { pill: PILL_SUCCESS, dot: DOT_SUCCESS, label: 'Present' },
  absent: { pill: PILL_DANGER, dot: DOT_DANGER, label: 'Absent' },
  half_day: { pill: PILL_WARNING, dot: DOT_WARNING, label: 'Half Day' },
  on_leave: { pill: PILL_BRAND, dot: DOT_BRAND, label: 'On Leave' },
  holiday: { pill: PILL_NEUTRAL, dot: DOT_NEUTRAL, label: 'Holiday' },
  weekend: { pill: PILL_NEUTRAL, dot: DOT_NEUTRAL, label: 'Weekend' },
  pending: { pill: PILL_NEUTRAL, dot: DOT_NEUTRAL, label: 'Upcoming' },
};

// ── Live / roster state ──
const LIVE_STYLES: Record<LiveAttendanceState | RosterStatus, { pill: string; dot: string; label: string }> = {
  not_checked_in: { pill: PILL_NEUTRAL, dot: DOT_NEUTRAL, label: 'Not Clocked In' },
  checked_in: { pill: PILL_SUCCESS, dot: DOT_SUCCESS, label: 'Working' },
  on_break: { pill: PILL_WARNING, dot: DOT_WARNING, label: 'On Break' },
  checked_out: { pill: PILL_NEUTRAL, dot: DOT_NEUTRAL, label: 'Checked Out' },
  on_leave: { pill: PILL_BRAND, dot: DOT_BRAND, label: 'On Leave' },
};

// ── Leave request status ──
const LEAVE_STYLES: Record<LeaveRequestStatus, { pill: string; dot: string }> = {
  pending: { pill: PILL_WARNING, dot: DOT_WARNING },
  approved: { pill: PILL_SUCCESS, dot: DOT_SUCCESS },
  rejected: { pill: PILL_DANGER, dot: DOT_DANGER },
};

// ── Employee status ──
const EMPLOYEE_STYLES: Record<EmployeeStatus, { pill: string; dot: string }> = {
  active: { pill: PILL_SUCCESS, dot: DOT_SUCCESS },
  on_notice: { pill: PILL_WARNING, dot: DOT_WARNING },
  exited: { pill: PILL_NEUTRAL, dot: DOT_NEUTRAL },
};

const base =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap';

interface PillProps {
  className?: string;
}

export const AttendanceStatusPill: React.FC<PillProps & { status: AttendanceStatus | 'pending' }> = ({
  status,
  className = '',
}) => {
  const cfg = ATTENDANCE_STYLES[status] || ATTENDANCE_STYLES.pending;
  return (
    <span className={clsx(base, cfg.pill, className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
};

export const LiveAttendancePill: React.FC<PillProps & { status: LiveAttendanceState | RosterStatus }> = ({
  status,
  className = '',
}) => {
  const cfg = LIVE_STYLES[status] || LIVE_STYLES.not_checked_in;
  return (
    <span className={clsx(base, cfg.pill, className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
};

export const LeaveStatusPill: React.FC<PillProps & { status: LeaveRequestStatus }> = ({
  status,
  className = '',
}) => {
  const cfg = LEAVE_STYLES[status];
  return (
    <span className={clsx(base, cfg.pill, className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {LEAVE_STATUS_LABELS[status]}
    </span>
  );
};

export const EmployeeStatusPill: React.FC<PillProps & { status: EmployeeStatus }> = ({
  status,
  className = '',
}) => {
  const cfg = EMPLOYEE_STYLES[status];
  return (
    <span className={clsx(base, cfg.pill, className)}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {EMPLOYEE_STATUS_LABELS[status]}
    </span>
  );
};
