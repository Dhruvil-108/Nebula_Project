import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  ArrowRight,
  XCircle,
  X,
  Loader2,
  Tag,
} from 'lucide-react';
import { CANDIDATE_STAGES, STAGE_LABELS, type CandidateStage } from '../../types/recruitment';
import { useBulkMoveApplications } from '../../hooks/useRecruitment';
import { BulkRejectModal } from './BulkRejectModal';

interface BulkActionBarProps {
  selectedIds: string[]; // These can be candidate IDs or application IDs
  applicationIds?: string[];
  onClear: () => void;
  onRefresh?: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedIds,
  applicationIds = [],
  onClear,
  onRefresh,
}) => {
  const bulkMove = useBulkMoveApplications();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [targetStage, setTargetStage] = useState<string>('');

  if (selectedIds.length === 0) return null;

  // Use applicationIds if provided, otherwise fallback to selectedIds
  const targetApplicationIds = applicationIds.length > 0 ? applicationIds : selectedIds;

  const handleStageMove = async (newStage: string) => {
    if (!newStage) return;
    if (newStage === 'rejected') {
      setShowRejectModal(true);
      return;
    }

    if (
      confirm(
        `Move ${selectedIds.length} candidate${
          selectedIds.length === 1 ? '' : 's'
        } to "${STAGE_LABELS[newStage as CandidateStage] || newStage}"?`
      )
    ) {
      try {
        await bulkMove.mutateAsync({
          applicationIds: targetApplicationIds,
          targetStage: newStage,
          note: `Bulk transitioned via ATS directory bar`,
        });
        setTargetStage('');
        onClear();
        if (onRefresh) onRefresh();
      } catch (err: any) {
        alert(err?.response?.data?.message || err?.message || 'Failed to move candidates');
      }
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-6 inset-x-0 mx-auto w-full max-w-2xl px-4 z-40 pointer-events-none"
        >
          <div className="pointer-events-auto bg-[#1A1A1A] text-white rounded-2xl shadow-2xl border border-white/10 px-5 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md">
            {/* Left: Selection Counter */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#f97316] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {selectedIds.length}
              </div>
              <div>
                <span className="text-xs font-bold text-white tracking-wide">
                  {selectedIds.length} selected
                </span>
                <p className="text-[10px] text-white/60">Batch ERP Operations</p>
              </div>
            </div>

            {/* Middle: Actions */}
            <div className="flex items-center gap-2">
              {/* Stage Move Dropdown */}
              <div className="relative">
                <select
                  value={targetStage}
                  onChange={(e) => {
                    setTargetStage(e.target.value);
                    handleStageMove(e.target.value);
                  }}
                  disabled={bulkMove.isPending}
                  className="rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#f97316] transition-all cursor-pointer"
                >
                  <option value="" className="text-slate-800">
                    Move Stage...
                  </option>
                  {CANDIDATE_STAGES.filter((s) => s !== 'rejected').map((stg) => (
                    <option key={stg} value={stg} className="text-slate-800">
                      {STAGE_LABELS[stg]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Reject Button */}
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Reject
              </button>
            </div>

            {/* Right: Clear Button */}
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {showRejectModal && (
        <BulkRejectModal
          isOpen={showRejectModal}
          onClose={() => setShowRejectModal(false)}
          applicationIds={targetApplicationIds}
          onSuccess={() => {
            onClear();
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </>
  );
};
