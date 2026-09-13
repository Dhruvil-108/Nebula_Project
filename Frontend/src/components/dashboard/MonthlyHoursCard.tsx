import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Clock, TrendingUp, CalendarDays } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { AttendanceSummary } from '../../types/attendance';

export const MonthlyHoursCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-32 h-4 rounded bg-slate-800" />
      <div className="w-16 h-6 rounded-full bg-slate-800" />
    </div>
    <div className="w-40 h-8 rounded bg-slate-800" />
    <div className="w-full h-24 rounded-xl bg-slate-800/60" />
  </div>
);

const CustomHoursTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: { date: string; workedHours: number; status: string; holidayName?: string } }>;
}) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 shadow-xl text-xs space-y-1">
      <p className="text-slate-400 font-mono">{data.date}</p>
      <p className="text-slate-100 font-semibold">
        {data.workedHours > 0 ? `${data.workedHours} hrs worked` : `Status: ${data.holidayName || data.status}`}
      </p>
    </div>
  );
};

export const MonthlyHoursCard: React.FC = () => {
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
    return <MonthlyHoursCardSkeleton />;
  }

  const workedHours = summary?.totalWorkedHours || 0;
  // 8 standard hours per expected working day
  const expectedHours = (summary?.expectedWorkingDays || 22) * 8;
  const completionPercent = Math.min(100, Math.round((workedHours / (expectedHours || 1)) * 100));

  // Chart data: daily breakdown
  const chartData = (summary?.dailyBreakdown || []).map((d) => ({
    date: d.date,
    day: d.dayOfMonth,
    workedHours: d.workedHours,
    status: d.status,
    holidayName: d.holidayName,
  }));

  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-between shadow-lg hover:border-slate-800 transition-colors"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#f0512f]/10 border border-[#f0512f]/20 flex items-center justify-center text-[#ff7a59]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Hours</h3>
              <p className="text-[11px] text-slate-400">{monthName} {currentYear}</p>
            </div>
          </div>

          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#f0512f]/10 text-[#ff7a59] border border-[#f0512f]/20">
            <TrendingUp className="w-3 h-3" />
            {completionPercent}%
          </span>
        </div>

        {/* Big stat & progress bar */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
              {workedHours}
            </span>
            <span className="text-slate-400 text-xs font-mono">
              / {expectedHours} hrs expected
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f0512f] to-[#ff7a59] transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>

        {/* Mini Daily Hours Bar Chart */}
        <div className="h-28 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <Tooltip content={<CustomHoursTooltip />} />
              <XAxis
                dataKey="day"
                tick={{ fill: '#64748b', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={4}
              />
              <Bar dataKey="workedHours" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.workedHours > 0 ? '#c2540c' : '#f6e8dc'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          {summary?.expectedWorkingDays || 0} Working Days this month
        </span>
        <span className="font-mono text-slate-400">Avg {summary?.expectedWorkingDays ? (workedHours / Math.max(1, summary.totalPresentDays || 1)).toFixed(1) : 0}h/day</span>
      </div>
    </motion.div>
  );
};
