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
          <div className="pointer-events-auto flex items-center justify-between gap-4 sm:gap-6 px-5 py-3.5 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/80 ring-1 ring-white/10 max-w-2xl w-full">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#f0512f]/20 border border-[#f0512f]/40 flex items-center justify-center text-[#ff7a59] flex-shrink-0">
                <AlertCircle className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate">
                  You have unsaved changes
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  {dirtyCount} {dirtyCount === 1 ? 'module rule' : 'module rules'} modified
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-shrink-0">
              <button
                type="button"
                onClick={onDiscard}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all duration-150 disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </button>

              <button
                type="button"
                onClick={onSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#f0512f] to-[#ff7a59] hover:brightness-110 active:scale-95 shadow-md shadow-[#f0512f]/30 border border-white/10 transition-all duration-150 disabled:opacity-50"
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
