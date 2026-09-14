import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw, Check, Loader2 } from 'lucide-react';

interface UnsavedChangesBarProps {
  dirtyCount: number;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}

export const UnsavedChangesBar: React.FC<UnsavedChangesBarProps> = ({
  dirtyCount,
  isSaving,
  onSave,
  onDiscard,
}) => {
  return (
    <AnimatePresence>
      {dirtyCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center justify-between gap-4 sm:gap-6 px-5 py-3 rounded-2xl bg-white/95 backdrop-blur-md border border-[#de7a3d]/60 shadow-xl shadow-[#7a2f05]/15 ring-1 ring-[#f0512f]/20 max-w-2xl w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#fbeae0] border border-[#de7a3d]/40 flex items-center justify-center text-[#c2540c] flex-shrink-0 shadow-2xs">
                <AlertCircle className="w-4 h-4 animate-pulse text-[#c2540c]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#1a1a1a] truncate leading-tight">
                  You have unsaved changes
                </p>
                <p className="text-xs text-[#6b6b6b] font-mono mt-0.5">
                  {dirtyCount} {dirtyCount === 1 ? 'module rule' : 'module rules'} modified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onDiscard}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1a1a1a] hover:bg-[#fbf0e7] border border-[#ece0d6] transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6b6b6b]" />
                Discard
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#d06b28] to-[#f0512f] hover:from-[#c2540c] hover:to-[#d63f1e] active:scale-95 shadow-md shadow-[#d06b28]/30 border border-[#de7a3d] transition-all duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
