import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Palmtree, Plus, Umbrella } from 'lucide-react';
import clsx from 'clsx';
import { apiClient } from '../../lib/apiClient';
import type { LeaveBalance } from '../../types/attendance';
import { RequestLeaveModal } from './RequestLeaveModal';

export const LeaveBalanceCardSkeleton: React.FC = () => (
  <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 space-y-4 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="w-28 h-4 rounded bg-slate-800" />
      <div className="w-20 h-6 rounded-full bg-slate-800" />
    </div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between w-full">
            <div className="w-20 h-3 rounded bg-slate-800" />
            <div className="w-12 h-3 rounded bg-slate-800" />
          </div>
          <div className="w-full h-2 rounded bg-slate-800" />
        </div>
      ))}
    </div>
  </div>
);

export const LeaveBalanceCard: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: balances = [], isLoading } = useQuery<LeaveBalance[]>({
    queryKey: ['leaves', 'balance'],
    queryFn: async () => {
      const { data } = await apiClient.get<LeaveBalance[]>('/leaves/balance');
      return data;
    },
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return <LeaveBalanceCardSkeleton />;
  }

  const getProgressColor = (percent: number) => {
    if (percent > 60) return 'bg-[#c2540c]';
    if (percent > 25) return 'bg-[#f0512f]';
    return 'bg-[#c2540c]';
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 flex flex-col justify-between shadow-lg hover:border-slate-800 transition-colors"
      >
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Palmtree className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Leave Balances</h3>
                <p className="text-[11px] text-slate-400">Annual Quotas ({new Date().getFullYear()})</p>
              </div>
            </div>

            <button
              id="btn-open-request-leave"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#f0512f]/10 text-[#ff7a59] border border-[#f0512f]/20 hover:bg-[#f0512f]/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply</span>
            </button>
          </div>

          {/* Leave Rows */}
          <div className="space-y-4">
            {balances.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">No leave quotas configured.</p>
            ) : (
              balances.map((item) => {
                const remainingPercent =
                  item.allocated > 0
                    ? Math.min(100, Math.round((item.remaining / item.allocated) * 100))
                    : item.used > 0
                      ? 0
                      : 100;

                return (
                  <div key={item.id || item.leaveTypeId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{item.leaveType}</span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        <strong className="text-white font-semibold">{item.remaining}</strong>
                        {item.allocated > 0 ? ` / ${item.allocated} days` : ' days used: ' + item.used}
                      </span>
                    </div>

                    {/* Progress bar */}
                    {item.allocated > 0 ? (
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={clsx('h-full rounded-full transition-all duration-500', getProgressColor(remainingPercent))}
                          style={{ width: `${remainingPercent}%` }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-1.5 rounded-full bg-slate-800" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer tip */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Unused leaves carry-forward per company policy</span>
          <Umbrella className="w-3.5 h-3.5 text-slate-600" />
        </div>
      </motion.div>

      {/* Request Leave Modal */}
      <RequestLeaveModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        leaveBalances={balances}
      />
    </>
  );
};
