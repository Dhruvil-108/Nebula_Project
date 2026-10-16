import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, X } from 'lucide-react';

interface ApproveClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimNumber?: string;
  onConfirm: (comments: string) => Promise<void>;
  isLoading?: boolean;
}

export const ApproveClaimModal: React.FC<ApproveClaimModalProps> = ({
  isOpen,
  onClose,
  claimNumber,
  onConfirm,
  isLoading,
}) => {
  const [comments, setComments] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(comments.trim());
    setComments('');
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
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Approve Expense Claim</h3>
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
                Are you sure you want to approve this expense claim? The claim will transition to the next review tier or be cleared for payment.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reviewer Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Verified business purpose and receipts. Approved."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400"
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
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Approving...' : 'Confirm Approval'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
