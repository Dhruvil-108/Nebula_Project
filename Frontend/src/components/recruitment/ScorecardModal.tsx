import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { useSubmitScorecard } from '../../hooks/useRecruitment';
import type { Interview } from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface ScorecardModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  open,
  onClose,
  interview,
}) => {
  const submitScorecardMutation = useSubmitScorecard();

  const [rating, setRating] = useState(4);
  const [decision, setDecision] = useState('hire');
  const [technicalSkillScore, setTechnicalSkillScore] = useState(4);
  const [communicationScore, setCommunicationScore] = useState(4);
  const [cultureFitScore, setCultureFitScore] = useState(4);
  const [notes, setNotes] = useState('');

  const candidateName =
    interview && typeof interview.candidateId === 'object' && interview.candidateId
      ? interview.candidateId.fullName
      : 'Candidate';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    submitScorecardMutation.mutate(
      {
        id: interview._id,
        scorecard: {
          rating,
          decision,
          technicalSkillScore,
          communicationScore,
          cultureFitScore,
          notes: notes.trim(),
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const inputCls =
    'w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <AnimatePresence>
      {open && interview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          className="relative w-full max-w-lg bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#1A1A1A]">Submit Interview Scorecard</h3>
              <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                {interview.title} · <strong className="text-[#1A1A1A]">{candidateName}</strong>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Overall Rating Stars */}
            <div className="text-center p-4 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6]">
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                Overall Candidate Rating
              </label>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-2xl transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-amber-600 mt-1">{rating} out of 5 stars</p>
            </div>

            <div>
              <FloatingDropdown
                label="Recommendation Decision"
                value={decision}
                onChange={(val) => setDecision(val)}
                options={[
                  {
                    value: 'strong_hire',
                    label: 'Strong Hire — Exceeds all criteria',
                    dotColor: '#10b981',
                  },
                  {
                    value: 'hire',
                    label: 'Hire — Solid candidate',
                    dotColor: '#22c55e',
                  },
                  {
                    value: 'neutral',
                    label: 'Neutral — Needs further review',
                    dotColor: '#f59e0b',
                  },
                  {
                    value: 'do_not_hire',
                    label: 'Do Not Hire — Does not meet expectations',
                    dotColor: '#ef4444',
                  },
                  {
                    value: 'strong_do_not_hire',
                    label: 'Strong Do Not Hire — Misaligned',
                    dotColor: '#b91c1c',
                  },
                ]}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#1A1A1A] mb-1">
                  Technical (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={technicalSkillScore}
                  onChange={(e) => setTechnicalSkillScore(Number(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1A1A] mb-1">
                  Communication (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(Number(e.target.value))}
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#1A1A1A] mb-1">
                  Culture Fit (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={cultureFitScore}
                  onChange={(e) => setCultureFitScore(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                Evaluation Notes & Key Observations
              </label>
              <textarea
                rows={3}
                placeholder="Candidate demonstrated deep knowledge of concurrency and distributed patterns..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#ECE0D6]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitScorecardMutation.isPending}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50"
              >
                {submitScorecardMutation.isPending ? 'Submitting...' : 'Submit Scorecard'}
              </button>
            </div>
          </form>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
