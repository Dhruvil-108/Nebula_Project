import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Calendar, CheckCircle2, XCircle, Plane } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../lib/apiClient';
import type { AttendanceSummary, AttendanceStatus } from '../../types/attendance';

export const PresentAbsentCardSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 animate-pulse shadow-sm">
    <div className="flex items-center justify-between">
      <div className="w-36 h-5 rounded bg-slate-100" />
      <div className="w-48 h-6 rounded-full bg-slate-100" />
    </div>
    <div className="h-44 rounded-xl bg-slate-50 border border-slate-100" />
  </div>
);

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

  const getStatusLabel = (status: AttendanceStatus, holidayName?: string | null) => {
    if (holidayName) return `Holiday: ${holidayName}`;
    switch (status) {
      case 'present':
        return 'Present';
      case 'half_day':
        return 'Half Day';
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

  const getCellStyles = (status: AttendanceStatus) => {
    switch (status) {
      case 'present':
      case 'half_day':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold';
      case 'absent':
        return 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 font-semibold';
      case 'on_leave':
        return 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 font-semibold';
      case 'holiday':
        return 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa] hover:bg-[#ffedd5] font-bold';
      case 'weekend':
        return 'bg-slate-50 text-slate-400 border-slate-100';
      case 'pending':
      default:
        return 'bg-white text-slate-300 border-dashed border-slate-200';
    }
  };

  // Calculate day-of-week offset for Monday-first 7-column calendar
  const breakdown = summary?.dailyBreakdown || [];
  let leadingBlanks = 0;
  if (breakdown.length > 0 && breakdown[0]?.date) {
    const d = new Date(breakdown[0].date);
    const day = d.getDay(); // 0 is Sunday, 1 is Monday ...
    leadingBlanks = day === 0 ? 6 : day - 1;
  }

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors"
    >
      <div>
        {/* Header with Title and Concise Metric Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#fff7ed] border border-[#fed7aa] flex items-center justify-center text-[#ea580c] shadow-2xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Monthly Attendance</h3>
              <p className="text-[11px] font-medium text-slate-500">{monthName}</p>
            </div>
          </div>

          {/* Concise Stats Row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Present:</span>
              <span className="font-bold font-mono">{summary?.totalPresentDays || 0}d</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Absent:</span>
              <span className="font-bold font-mono">{summary?.totalAbsentDays || 0}d</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
              <Plane className="w-3.5 h-3.5 text-sky-600" />
              <span>Leave:</span>
              <span className="font-bold font-mono">{summary?.totalLeaveDays || 0}d</span>
            </div>
          </div>
        </div>

        {/* 7-Column Real Calendar Grid */}
        <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100">
          {/* Weekday column headers */}
          <div className="grid grid-cols-7 gap-1 mb-1 text-center">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider py-0.5">
                {wd}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank offset pads before 1st of month */}
            {[...Array(leadingBlanks)].map((_, i) => (
              <div
                key={`pad-${i}`}
                className="h-7 sm:h-8 rounded-lg bg-slate-100/30 border border-transparent"
              />
            ))}

            {/* Actual Month Days */}
            {breakdown.map((day) => {
              const style = getCellStyles(day.status);
              const label = getStatusLabel(day.status, day.holidayName);
              const tooltip = `${day.date}: ${label}${day.workedHours > 0 ? ` (${day.workedHours}h)` : ''}`;

              return (
                <div
                  key={day.date}
                  title={tooltip}
                  className={clsx(
                    'h-7 sm:h-8 rounded-lg border flex items-center justify-center text-xs cursor-pointer transition-all duration-150',
                    style
                  )}
                >
                  <span>{day.dayOfMonth}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Concise Heatmap Legend & Work Days Summary */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500" />
            <span>Leave</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f97316]" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span>Weekend</span>
          </div>
        </div>

        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {summary?.expectedWorkingDays || 0} Work Days
        </span>
      </div>
    </motion.div>
  );
};
