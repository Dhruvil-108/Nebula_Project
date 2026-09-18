import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { X, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import type { LeaveBalance } from '../../types/attendance';

interface RequestLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaveBalances: LeaveBalance[];
}

export const RequestLeaveModal: React.FC<RequestLeaveModalProps> = ({
  isOpen,
  onClose,
  leaveBalances,
}) => {
  const queryClient = useQueryClient();

  const [leaveTypeId, setLeaveTypeId] = useState<string>(
    leaveBalances[0]?.leaveTypeId || ''
  );
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [reason, setReason] = useState<string>('');

  // Selected leave type details
  const selectedBalance = leaveBalances.find(
    (b) => b.leaveTypeId === leaveTypeId || b.id === leaveTypeId
  );

  // Calculate total days
  const totalDays = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diff = end.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
  }, [startDate, endDate]);

  const hasSufficientBalance =
    !selectedBalance ||
    selectedBalance.allocated === 0 || // unpaid leave
    (selectedBalance.remaining >= totalDays && totalDays > 0);

  const requestLeaveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post('/leaves/requests', {
        leaveTypeId: selectedBalance?.leaveTypeId || leaveTypeId,
        startDate,
        endDate,
        reason,
      });
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Leave request submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      // Keep HRMS leave/summary views in sync
      queryClient.invalidateQueries({ queryKey: ['hrms', 'leaves'] });
      queryClient.invalidateQueries({ queryKey: ['hrms', 'summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to submit leave request.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId) {
      toast.error('Please select a leave type.');
      return;
    }
    if (totalDays <= 0) {
      toast.error('End date must be on or after start date.');
      return;
    }
    if (!hasSufficientBalance) {
      toast.error('Insufficient leave balance for this request.');
      return;
    }
    requestLeaveMutation.mutate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-10 space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Request Leave</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Submit a time-off request for manager approval
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Leave Type Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Leave Type
                </label>
                <select
                  id="leave-type-select"
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-[#f0512f] transition-colors"
                >
                  {leaveBalances.map((b) => (
                    <option key={b.id} value={b.leaveTypeId}>
                      {b.leaveType} ({b.remaining} remaining of {b.allocated})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="leave-start-date"
                    value={startDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-[#f0512f] transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="leave-end-date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 focus:outline-none focus:border-[#f0512f] transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Duration & Balance Preview */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Duration: <strong className="text-white font-bold">{totalDays} day{totalDays === 1 ? '' : 's'}</strong></span>
                </div>
                {selectedBalance && (
                  <div className="flex items-center gap-1.5">
                    {hasSufficientBalance ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Balance: {selectedBalance.remaining} days left
                      </span>
                    ) : (
                      <span className="text-rose-400 font-medium flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Insufficient balance ({selectedBalance.remaining} left)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Leave (Optional)
                </label>
                <textarea
                  id="leave-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="E.g., Family event, personal appointment, medical..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-[#f0512f] transition-colors resize-none"
                />
              </div>

              {/* Footer / Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-submit-leave-request"
                  disabled={requestLeaveMutation.isPending || !hasSufficientBalance || totalDays <= 0}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-[#f0512f] to-[#ff7a59] text-white hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {requestLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
