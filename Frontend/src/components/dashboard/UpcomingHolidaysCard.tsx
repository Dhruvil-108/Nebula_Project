import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles, PartyPopper } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../lib/apiClient';
import type { Holiday } from '../../types/attendance';

export const UpcomingHolidaysCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 animate-pulse shadow-sm">
    <div className="flex items-center justify-between">
      <div className="w-32 h-4 rounded bg-slate-100" />
      <div className="w-16 h-5 rounded-full bg-slate-100" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="w-36 h-3 rounded bg-slate-100" />
          <div className="w-16 h-3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  </div>
);

export const UpcomingHolidaysCard: React.FC = () => {
  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ['holidays', 'upcoming'],
    queryFn: async () => {
      const { data } = await apiClient.get<Holiday[]>('/holidays/upcoming?limit=5');
      return data;
    },
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <UpcomingHolidaysCardSkeleton />;
  }

  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(now.getDate() + 7);

  const formatHolidayDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const isWithinNext7Days = (dateStr: string) => {
    const d = new Date(dateStr);
    return d >= now && d <= sevenDaysFromNow;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-colors"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shadow-2xs">
              <PartyPopper className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upcoming Holidays</h3>
              <p className="text-[11px] font-medium text-slate-500">Official company calendar</p>
            </div>
          </div>

          <span className="text-[11px] font-mono text-slate-600 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
            {holidays.length} Next
          </span>
        </div>

        {/* Holiday list */}
        <div className="space-y-2.5">
          {holidays.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-6 text-center">
              No upcoming holidays scheduled.
            </p>
          ) : (
            holidays.map((h) => {
              const isNear = isWithinNext7Days(h.date);
              return (
                <div
                  key={h.id}
                  className={clsx(
                    'p-3 rounded-xl border transition-all flex items-center justify-between text-xs',
                    isNear
                      ? 'bg-purple-50/70 border-purple-200 text-purple-900 shadow-2xs'
                      : 'bg-slate-50/80 border-slate-200/80 text-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <Calendar
                      className={clsx(
                        'w-4 h-4 flex-shrink-0',
                        isNear ? 'text-purple-600' : 'text-slate-400'
                      )}
                    />
                    <div className="truncate">
                      <p className="font-semibold text-slate-900 truncate text-xs">
                        {h.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {formatHolidayDate(h.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isNear && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Soon
                      </span>
                    )}
                    {h.isOptional && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Optional
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Paid holidays per org policy</span>
        <span className="text-purple-600 font-semibold">All Branches</span>
      </div>
    </motion.div>
  );
};
