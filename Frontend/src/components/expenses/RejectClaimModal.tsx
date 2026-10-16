import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface RejectClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimNumber?: string;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export const RejectClaimModal: React.FC<RejectClaimModalProps> = ({
  isOpen,
  onClose,
  claimNumber,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    await onConfirm(reason.trim());
    setReason('');
    onClose();
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] overflow-hidden z-10"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Reject Expense Claim</h3>
                  <p className="text-xs text-slate-500">{claimNumber}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Please provide a constructive reason for rejecting this claim. The employee will be notified and can edit or clarify their claim.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Missing detailed tax invoice for meals. Please attach the itemized receipt."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !reason.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Rejecting...' : 'Reject Claim'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
