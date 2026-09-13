import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  LogIn,
  LogOut,
  Coffee,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../lib/apiClient';
import type { AttendanceToday } from '../../types/attendance';

export const AttendanceCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-5 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-28 h-4 rounded bg-slate-800" />
      <div className="w-24 h-6 rounded-full bg-slate-800" />
    </div>
    <div className="space-y-2">
      <div className="w-48 h-10 rounded-lg bg-slate-800" />
      <div className="w-32 h-4 rounded bg-slate-800" />
    </div>
    <div className="h-12 w-full rounded-xl bg-slate-800" />
  </div>
);

export const AttendanceCard: React.FC = () => {
  const queryClient = useQueryClient();
  const [now, setNow] = useState<Date>(new Date());

  // Live wall clock timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch today's attendance state
  const { data: attendance, isLoading } = useQuery<AttendanceToday>({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const { data } = await apiClient.get<AttendanceToday>('/attendance/today');
      return data;
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  // ── Mutations with Optimistic Updates ──
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/attendance/check-in');
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today'] });
      const previousData = queryClient.getQueryData<AttendanceToday>(['attendance', 'today']);
      queryClient.setQueryData<AttendanceToday>(['attendance', 'today'], (old) => ({
        currentStatus: 'checked_in',
        checkInAt: new Date().toISOString(),
        checkOutAt: null,
        totalWorkedMinutes: 0,
        breaks: [],
        isLate: false,
        shiftStartTime: old?.shiftStartTime || '09:30',
      }));
      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['attendance', 'today'], context.previousData);
      }
      toast.error(err.response?.data?.error || 'Failed to check in.');
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Checked in successfully!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/attendance/check-out');
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today'] });
      const previousData = queryClient.getQueryData<AttendanceToday>(['attendance', 'today']);
      queryClient.setQueryData<AttendanceToday>(['attendance', 'today'], (old) => {
        if (!old) return old;
        return {
          ...old,
          currentStatus: 'checked_out',
          checkOutAt: new Date().toISOString(),
        };
      });
      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['attendance', 'today'], context.previousData);
      }
      toast.error(err.response?.data?.error || 'Failed to check out.');
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Checked out successfully. Have a great day!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const breakInMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/attendance/break-in');
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today'] });
      const previousData = queryClient.getQueryData<AttendanceToday>(['attendance', 'today']);
      queryClient.setQueryData<AttendanceToday>(['attendance', 'today'], (old) => {
        if (!old) return old;
        return {
          ...old,
          currentStatus: 'on_break',
          breaks: [...(old.breaks || []), { breakInAt: new Date().toISOString(), breakOutAt: null }],
        };
      });
      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['attendance', 'today'], context.previousData);
      }
      toast.error(err.response?.data?.error || 'Failed to start break.');
    },
    onSuccess: () => {
      toast.info('Break started. Enjoy your break!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  const breakOutMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/attendance/break-out');
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today'] });
      const previousData = queryClient.getQueryData<AttendanceToday>(['attendance', 'today']);
      queryClient.setQueryData<AttendanceToday>(['attendance', 'today'], (old) => {
        if (!old) return old;
        return {
          ...old,
          currentStatus: 'checked_in',
        };
      });
      return { previousData };
    },
    onError: (err: any, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['attendance', 'today'], context.previousData);
      }
      toast.error(err.response?.data?.error || 'Failed to end break.');
    },
    onSuccess: () => {
      toast.success('Break ended. Welcome back to work!');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  // ── Compute live elapsed seconds worked ──
  const liveElapsedSeconds = useMemo(() => {
    if (!attendance || !attendance.checkInAt) return 0;

    const checkInMs = new Date(attendance.checkInAt).getTime();
    const checkOutMs = attendance.checkOutAt
      ? new Date(attendance.checkOutAt).getTime()
      : now.getTime();

    let totalBreakMs = 0;
    if (attendance.breaks && Array.isArray(attendance.breaks)) {
      for (const brk of attendance.breaks) {
        if (!brk.breakInAt) continue;
        const bIn = new Date(brk.breakInAt).getTime();
        const bOut = brk.breakOutAt ? new Date(brk.breakOutAt).getTime() : now.getTime();
        if (bOut > bIn) {
          totalBreakMs += bOut - bIn;
        }
      }
    }

    const netMs = Math.max(0, checkOutMs - checkInMs - totalBreakMs);
    return Math.floor(netMs / 1000);
  }, [attendance, now]);

  if (isLoading) {
    return <AttendanceCardSkeleton />;
  }

  const currentStatus = attendance?.currentStatus || 'not_checked_in';
  const isCheckedIn = currentStatus === 'checked_in';
  const isOnBreak = currentStatus === 'on_break';
  const isCheckedOut = currentStatus === 'checked_out';
  const isNotCheckedIn = currentStatus === 'not_checked_in';

  const formatHoursMinutes = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const formatTimeLabel = (isoDateString: string | null | undefined) => {
    if (!isoDateString) return null;
    return new Date(isoDateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isPendingMutation =
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    breakInMutation.isPending ||
    breakOutMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={clsx(
        'relative overflow-hidden p-6 rounded-2xl border transition-all duration-300 shadow-lg flex flex-col justify-between',
        isCheckedIn && 'bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-emerald-950/20 border-emerald-500/30 ring-1 ring-emerald-500/20',
        isOnBreak && 'bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-amber-950/20 border-amber-500/30 ring-1 ring-amber-500/20',
        isCheckedOut && 'bg-slate-900/70 border-slate-800/80',
        isNotCheckedIn && 'bg-slate-900/60 border-slate-800/60 hover:border-slate-700/80'
      )}
    >
      {/* Background ambient glow when checked in */}
      {isCheckedIn && (
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      )}
      {isOnBreak && (
        <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Top row: Live wall clock & status badge */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-4 h-4 text-[#f0512f]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Time & Attendance
            </span>
          </div>

          {/* Status Badge */}
          {isCheckedIn && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Working
            </span>
          )}
          {isOnBreak && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Coffee className="w-3.5 h-3.5" />
              On Break
            </span>
          )}
          {isCheckedOut && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              Checked Out
            </span>
          )}
          {isNotCheckedIn && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Not Checked In
            </span>
          )}
        </div>

        {/* Big digital clock & Date */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </h1>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
              {now.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2] || ''}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Live Elapsed Worked Time Display */}
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-slate-400">Total Worked Today</p>
            <p className="text-lg font-mono font-bold text-slate-100 tracking-wide">
              {formatHoursMinutes(liveElapsedSeconds)}
            </p>
          </div>
          <div className="text-right text-xs">
            {attendance?.checkInAt ? (
              <div className="space-y-0.5">
                <p className="text-slate-300 font-medium flex items-center justify-end gap-1">
                  In: {formatTimeLabel(attendance.checkInAt)}
                  {attendance.isLate && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Late
                    </span>
                  )}
                </p>
                {attendance.checkOutAt && (
                  <p className="text-slate-400 text-[11px]">
                    Out: {formatTimeLabel(attendance.checkOutAt)}
                  </p>
                )}
              </div>
            ) : (
              <span className="text-slate-500 text-xs italic">Shift starts at {attendance?.shiftStartTime || '09:30'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5">
        {/* Primary Check-In / Check-Out Toggle */}
        {isNotCheckedIn && (
          <button
            id="btn-attendance-checkin"
            onClick={() => checkInMutation.mutate()}
            disabled={isPendingMutation}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-[#c2540c] text-white hover:bg-[#d06b28] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-[#c2540c]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>Check In</span>
          </button>
        )}

        {(isCheckedIn || isOnBreak) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Break Toggle Button */}
            {isCheckedIn ? (
              <button
                id="btn-attendance-break-in"
                onClick={() => breakInMutation.mutate()}
                disabled={isPendingMutation}
                className="py-2.5 px-3 rounded-xl font-medium text-xs bg-[#fbeae0] text-[#7a2f05] border border-[#de7a3d] hover:bg-[#f6e8dc] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Coffee className="w-4 h-4" />
                <span>Start Break</span>
              </button>
            ) : (
              <button
                id="btn-attendance-break-out"
                onClick={() => breakOutMutation.mutate()}
                disabled={isPendingMutation}
                className="py-2.5 px-3 rounded-xl font-medium text-xs bg-[#fbeae0] text-[#7a2f05] border border-[#de7a3d] hover:bg-[#f6e8dc] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>End Break</span>
              </button>
            )}

            {/* Check Out Button */}
            <button
              id="btn-attendance-checkout"
              onClick={() => checkOutMutation.mutate()}
              disabled={isPendingMutation || isOnBreak}
              title={isOnBreak ? 'Please end your break before checking out' : 'Check out for today'}
              className="py-2.5 px-3 rounded-xl font-medium text-xs bg-[#fbeae0] text-[#7a2f05] border border-[#de7a3d] hover:bg-[#f6e8dc] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <LogOut className="w-4 h-4" />
              <span>Check Out</span>
            </button>
          </div>
        )}

        {isCheckedOut && (
          <div className="py-2.5 px-4 rounded-xl bg-[#fbeae0] border border-[#de7a3d] text-center">
            <p className="text-xs text-[#7a2f05] font-medium flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#c2540c]" />
              Day completed · Total {formatHoursMinutes(liveElapsedSeconds)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
