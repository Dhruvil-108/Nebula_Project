import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Plane, Calendar, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../lib/apiClient';
import type { AttendanceSummary, AttendanceStatus } from '../../types/attendance';

export const PresentAbsentCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-32 h-4 rounded bg-slate-800" />
      <div className="w-16 h-6 rounded-full bg-slate-800" />
    </div>
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-slate-800/60" />
      ))}
    </div>
    <div className="h-16 rounded-xl bg-slate-800/40" />
  </div>
);

export const PresentAbsentCard: React.FC = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: summary, isLoading } = useQuery<AttendanceSummary>({
    queryKey: ['attendance', 'summary', currentMonth, currentYear],
    queryFn: async () => {
      const { data } = await apiClient.get<AttendanceSummary>(
        `/attendance/summary?month=${currentMonth}&year=${currentYear}`
      );
      return data;
    },
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <PresentAbsentCardSkeleton />;
  }

  const getCellColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
      case 'half_day':
        return 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold';
      case 'absent':
        return 'bg-rose-500/80 hover:bg-rose-400 text-white';
      case 'on_leave':
        return 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold';
      case 'holiday':
        return 'bg-purple-500/70 hover:bg-purple-400 text-white';
      case 'weekend':
        return 'bg-slate-800/70 text-slate-500';
      case 'pending':
      default:
        return 'bg-slate-800/30 text-slate-600 border border-slate-800/50';
    }
  };

  const getStatusLabel = (status: AttendanceStatus, holidayName?: string | null) => {
    if (holidayName) return `Holiday: ${holidayName}`;
    switch (status) {
      case 'present':
        return 'Present';
      case 'absent':
        return 'Absent';
      case 'on_leave':
        return 'Approved Leave';
      case 'holiday':
        return 'Holiday';
      case 'weekend':
        return 'Weekend';
      case 'pending':
        return 'Upcoming Day';
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-between shadow-lg hover:border-slate-800 transition-colors"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Attendance</h3>
              <p className="text-[11px] text-slate-400">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-400 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60">
            {summary?.expectedWorkingDays || 0} Total Work Days
          </span>
        </div>

        {/* 3 Stat blocks side by side */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {/* Present */}
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] font-semibold">Present</span>
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-300">
                {summary?.totalPresentDays || 0}
              </span>
              <span className="text-[10px] text-emerald-400/80 ml-1">days</span>
            </div>
          </div>

          {/* Absent */}
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-rose-400">
              <span className="text-[11px] font-semibold">Absent</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-rose-300">
                {summary?.totalAbsentDays || 0}
              </span>
              <span className="text-[10px] text-rose-400/80 ml-1">days</span>
            </div>
          </div>

          {/* Leave */}
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between text-sky-400">
              <span className="text-[11px] font-semibold">Leave</span>
              <Plane className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-sky-300">
                {summary?.totalLeaveDays || 0}
              </span>
              <span className="text-[10px] text-sky-400/80 ml-1">days</span>
            </div>
          </div>
        </div>

        {/* Heatmap Matrix Grid */}
        <div>
          <p className="text-[11px] font-medium text-slate-400 mb-2">Monthly Calendar Grid</p>
          <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-11 gap-1.5">
            {(summary?.dailyBreakdown || []).map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${getStatusLabel(day.status, day.holidayName)} (${day.workedHours}h)`}
                className={clsx(
                  'aspect-square rounded-lg flex items-center justify-center text-[10px] cursor-pointer transition-all duration-150',
                  getCellColor(day.status)
                )}
              >
                {day.dayOfMonth}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Heatmap Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-emerald-500" />
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-rose-500" />
          <span>Absent</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-sky-500" />
          <span>Leave</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-purple-500" />
          <span>Holiday</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded bg-slate-800" />
          <span>Weekend</span>
        </div>
      </div>
    </motion.div>
  );
};
