import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Lock,
  UserCheck,
  TrendingUp,
  FileSpreadsheet,
  Award,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  useInterviewDebrief,
  useRecordConsensus,
} from '../../hooks/useRecruitment';
import type {
  Interview,
  ConsensusDecision,
  ScorecardRecommendation,
} from '../../types/recruitment';
import {
  SCORECARD_RECOMMENDATION_LABELS,
  CONSENSUS_DECISION_LABELS,
} from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface InterviewDebriefModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
}

const RECOMMENDATION_COLORS: Record<ScorecardRecommendation, { bg: string; text: string; border: string }> = {
  strong_hire: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  hire: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  neutral: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  no_hire: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  strong_no_hire: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export const InterviewDebriefModal: React.FC<InterviewDebriefModalProps> = ({
  open,
  onClose,
  interview,
}) => {
  const { data: debriefData, isLoading } = useInterviewDebrief(interview?._id || null);
  const consensusMutation = useRecordConsensus();

  const [decision, setDecision] = useState<ConsensusDecision>('advance_to_next_round');
  const [notes, setNotes] = useState('');
  const [advanceStage, setAdvanceStage] = useState(true);

  if (!open || !interview) return null;

  const candidateName =
    typeof interview.candidateId === 'object' && interview.candidateId
      ? interview.candidateId.fullName
      : 'Candidate';

  const jobTitle =
    typeof interview.jobOpeningId === 'object' && interview.jobOpeningId
      ? interview.jobOpeningId.title
      : 'Position';

  const handleRecordConsensus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview) return;

    let targetStage = 'interview';
    if (decision === 'offer_recommended') targetStage = 'offer';
    if (decision === 'reject') targetStage = 'rejected';

    consensusMutation.mutate(
      {
        interviewId: interview._id,
        input: {
          decision,
          notes: notes.trim(),
          advanceStage,
          targetStage: advanceStage ? targetStage : undefined,
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

  const scorecards = debriefData?.scorecards || [];
  const varianceAlert = debriefData?.varianceAlert ?? false;
  const avgRating = debriefData?.averageOverallRating ?? 0;
  const ratingSpread = debriefData?.ratingSpread ?? 0;

  return (
    <AnimatePresence>
      {open && interview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto">
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
            exit={{ opacity: 0, scale: 1, y: 0 }}
            className="relative w-full max-w-4xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">
                    Interviewer Calibration & Debrief Synthesis
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    {candidateName} · {jobTitle} ({interview.roundType})
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Calibration Stats Row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6]">
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">Submitted Scorecards</p>
                  <p className="text-xl font-black text-[#1A1A1A] mt-1">
                    {debriefData?.totalScorecards || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6]">
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">Avg Evaluator Score</p>
                  <p className="text-xl font-black text-amber-600 mt-1">
                    {avgRating > 0 ? `${avgRating} / 5` : '—'}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6]">
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">Score Spread</p>
                  <p className="text-xl font-black text-[#1A1A1A] mt-1">
                    ±{ratingSpread} Stars
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6]">
                  <p className="text-[10px] uppercase font-bold text-[#6B6B6B]">Consensus Status</p>
                  <p className="text-xs font-bold text-[#f97316] mt-1.5 truncate">
                    {interview.consensusOutcome?.decision
                      ? CONSENSUS_DECISION_LABELS[interview.consensusOutcome.decision]
                      : 'Pending Calibration'}
                  </p>
                </div>
              </div>

              {/* Variance Alert Banner */}
              {varianceAlert && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 shadow-2xs">
                  <div className="p-1 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Evaluator Score Divergence Detected (Variance Alert)
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Panel members disagree on candidate proficiency with a spread of {ratingSpread} points.
                      A live debrief alignment discussion is strongly recommended before finalizing the hiring decision.
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-Side Evaluator Scorecards */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#f97316]" />
                  Evaluator Scorecard Comparison ({scorecards.length})
                </h4>

                {scorecards.length === 0 ? (
                  <div className="p-8 text-center rounded-xl bg-[#FAF7F2] border border-dashed border-[#ECE0D6]">
                    <p className="text-xs text-[#6B6B6B]">
                      No individual scorecards submitted yet for this interview.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {scorecards.map((sc) => {
                      const recStyle =
                        RECOMMENDATION_COLORS[sc.recommendation] || {
                          bg: 'bg-slate-50',
                          text: 'text-slate-700',
                          border: 'border-slate-200',
                        };
                      const interviewerName =
                        sc.interviewerId?.fullName ||
                        `${sc.interviewerId?.firstName || ''} ${sc.interviewerId?.lastName || ''}`.trim() ||
                        'Interviewer';

                      return (
                        <div
                          key={sc._id}
                          className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-[#1A1A1A]">
                                {interviewerName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {sc.interviewerId?.email || 'Evaluator'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {sc.isSealed && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  <Lock className="w-2.5 h-2.5" />
                                  Sealed
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${recStyle.bg} ${recStyle.text} ${recStyle.border}`}
                              >
                                {SCORECARD_RECOMMENDATION_LABELS[sc.recommendation]}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-lg bg-[#FAF7F2] border border-[#ECE0D6]">
                            <span className="font-semibold text-slate-700">Overall Rating:</span>
                            <span className="font-bold text-amber-600">
                              ★ {sc.overallRating} / 5
                            </span>
                          </div>

                          {/* Competency breakdown */}
                          {sc.competencyRatings && sc.competencyRatings.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-bold uppercase text-slate-400">
                                Competency Scores
                              </p>
                              <div className="space-y-1">
                                {sc.competencyRatings.map((cr, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between text-[11px] text-slate-600"
                                  >
                                    <span className="truncate pr-2">{cr.name}</span>
                                    <span className="font-bold text-[#1A1A1A]">
                                      {cr.rating} / 5
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {sc.strengths && (
                            <div className="pt-1">
                              <p className="text-[10px] font-bold uppercase text-emerald-700">
                                Strengths
                              </p>
                              <p className="text-[11px] text-slate-600 italic mt-0.5">
                                "{sc.strengths}"
                              </p>
                            </div>
                          )}

                          {sc.areasOfConcern && (
                            <div className="pt-1">
                              <p className="text-[10px] font-bold uppercase text-rose-700">
                                Areas of Concern
                              </p>
                              <p className="text-[11px] text-slate-600 italic mt-0.5">
                                "{sc.areasOfConcern}"
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Hiring Manager Consensus Recording Form */}
              <form
                onSubmit={handleRecordConsensus}
                className="p-5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#f97316]" />
                    Record Hiring Manager Consensus Decision
                  </h4>
                  {interview.consensusOutcome?.decision && (
                    <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Recorded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FloatingDropdown
                      label="Consensus Outcome"
                      value={decision}
                      onChange={(val) => setDecision(val as ConsensusDecision)}
                      options={[
                        {
                          value: 'advance_to_next_round',
                          label: 'Advance to Next Round',
                          dotColor: '#3b82f6',
                        },
                        {
                          value: 'offer_recommended',
                          label: 'Recommend Job Offer',
                          dotColor: '#10b981',
                        },
                        {
                          value: 'schedule_followup',
                          label: 'Schedule Follow-up Round',
                          dotColor: '#f59e0b',
                        },
                        {
                          value: 'reject',
                          label: 'Decline / Reject Candidate',
                          dotColor: '#ef4444',
                        },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                      Debrief Rationale / Synthesis Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Unanimous hire on system design; follow up on lead experience..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1A1A1A]">
                    <input
                      type="checkbox"
                      checked={advanceStage}
                      onChange={(e) => setAdvanceStage(e.target.checked)}
                      className="rounded text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span>Automatically synchronize candidate ATS pipeline stage</span>
                  </label>

                  <button
                    type="submit"
                    disabled={consensusMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {consensusMutation.isPending ? 'Recording...' : 'Record Consensus Decision'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
