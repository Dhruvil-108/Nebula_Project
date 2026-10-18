import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { useRejectionReasons, useBulkRejectApplications } from '../../hooks/useRecruitment';

interface BulkRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationIds: string[];
  onSuccess?: () => void;
}

export const BulkRejectModal: React.FC<BulkRejectModalProps> = ({
  isOpen,
  onClose,
  applicationIds,
  onSuccess,
}) => {
  const { data: reasons, isLoading: reasonsLoading } = useRejectionReasons();
  const bulkReject = useBulkRejectApplications();

  const [reasonId, setReasonId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonId) {
      setError('Please select a rejection reason code from the catalog.');
      return;
    }
    setError(null);

    try {
      await bulkReject.mutateAsync({
        applicationIds,
        rejectionReasonId: reasonId,
        rejectionNotes: notes.trim() || undefined,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reject applications');
    }
  };

  const inputCls =
    'w-full rounded-xl border border-[#ECE0D6] bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg rounded-2xl bg-white border border-[#ECE0D6] shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4]">
            <div className="flex items-center gap-2 text-rose-700">
              <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-[#111827]">
                  Bulk Reject {applicationIds.length} Application{applicationIds.length === 1 ? '' : 's'}
                </h3>
                <p className="text-[11px] text-[#64748b]">
                  Move candidates to Rejected stage with audit taxonomy
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <strong>Audit Notice:</strong> This action will mark all selected candidates as "Rejected", recording the reason and optional notes in each candidate's timeline and activity ledger.
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason <span className="text-rose-500">*</span>
              </label>
              <select
                value={reasonId}
                onChange={(e) => setReasonId(e.target.value)}
                className={inputCls}
                disabled={reasonsLoading}
                required
              >
                <option value="">Select a reason...</option>
                {reasons?.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.label} ({r.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Internal Disposition Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specific feedback or evaluation summary for team record..."
                rows={3}
                className={inputCls}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bulkReject.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-60"
              >
                {bulkReject.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    Confirm Bulk Rejection
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
