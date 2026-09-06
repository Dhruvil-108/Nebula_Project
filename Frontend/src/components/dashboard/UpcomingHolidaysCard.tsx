import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Sparkles, PartyPopper } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../lib/apiClient';
import type { Holiday } from '../../types/attendance';

export const UpcomingHolidaysCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-32 h-4 rounded bg-slate-800" />
      <div className="w-16 h-5 rounded-full bg-slate-800" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="w-36 h-3 rounded bg-slate-800" />
          <div className="w-16 h-3 rounded bg-slate-800" />
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
      className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-between shadow-lg hover:border-slate-800 transition-colors"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <PartyPopper className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Upcoming Holidays</h3>
              <p className="text-[11px] text-slate-400">Official company calendar</p>
            </div>
          </div>

          <span className="text-[11px] font-medium text-slate-400 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/60">
            {holidays.length} Next
          </span>
        </div>

        {/* Holiday list */}
        <div className="space-y-2.5">
          {holidays.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-4 text-center">
              No upcoming holidays scheduled.
            </p>
          ) : (
            holidays.map((h) => {
              const isNear = isWithinNext7Days(h.date);
              return (
                <div
                  key={h.id}
                  className={clsx(
                    'p-2.5 rounded-xl border transition-all flex items-center justify-between text-xs',
                    isNear
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-200 shadow-sm'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <Calendar
                      className={clsx(
                        'w-4 h-4 flex-shrink-0',
                        isNear ? 'text-purple-400' : 'text-slate-500'
                      )}
                    />
                    <div className="truncate">
                      <p className="font-semibold text-slate-100 truncate text-xs">
                        {h.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatHolidayDate(h.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isNear && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Soon
                      </span>
                    )}
                    {h.isOptional && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
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
      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Paid holidays per org policy</span>
        <span className="text-purple-400 font-medium">All Branches</span>
      </div>
    </motion.div>
  );
};
