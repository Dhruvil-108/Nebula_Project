import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  ShieldCheck,
  Award,
  Sparkles,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import {
  useSubmitPanelScorecard,
  useScorecardTemplates,
  useInterviewScorecards,
} from '../../hooks/useRecruitment';
import type {
  Interview,
  ScorecardRecommendation,
  CompetencyRating,
} from '../../types/recruitment';
import { SCORECARD_RECOMMENDATION_LABELS } from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';

interface ScorecardModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
}

const DEFAULT_COMPETENCIES: CompetencyRating[] = [
  { name: 'Core Technical Competence & Architecture', weight: 40, rating: 4, evidence: '' },
  { name: 'Problem Solving & System Design', weight: 30, rating: 4, evidence: '' },
  { name: 'Communication, Articulation & Collaboration', weight: 15, rating: 4, evidence: '' },
  { name: 'Values, Ownership & Nebula Culture Fit', weight: 15, rating: 4, evidence: '' },
];

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  open,
  onClose,
  interview,
}) => {
  const submitScorecardMutation = useSubmitPanelScorecard();
  const { data: templatesData } = useScorecardTemplates();
  const { data: existingScorecardsData } = useInterviewScorecards(interview?._id || null);

  const [competencies, setCompetencies] = useState<CompetencyRating[]>(DEFAULT_COMPETENCIES);
  const [overallRating, setOverallRating] = useState(4);
  const [recommendation, setRecommendation] = useState<ScorecardRecommendation>('hire');
  const [strengths, setStrengths] = useState('');
  const [areasOfConcern, setAreasOfConcern] = useState('');
  const [sealScorecard, setSealScorecard] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Check if current user already has a sealed scorecard for this interview
  const isAlreadySealed = (existingScorecardsData?.scorecards || []).some(
    (sc) => sc.isSealed
  );

  useEffect(() => {
    if (selectedTemplateId && templatesData?.templates) {
      const tmpl = templatesData.templates.find((t) => t._id === selectedTemplateId);
      if (tmpl && tmpl.competencies.length > 0) {
        setCompetencies(
          tmpl.competencies.map((c) => ({
            name: c.name,
            weight: c.weight || 20,
            rating: 3,
            evidence: '',
          }))
        );
      }
    }
  }, [selectedTemplateId, templatesData]);

  if (!open || !interview) return null;

  const candidateName =
    interview && typeof interview.candidateId === 'object' && interview.candidateId
      ? interview.candidateId.fullName
      : 'Candidate';

  const handleRatingChange = (index: number, newRating: number) => {
    setCompetencies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], rating: newRating };
      return next;
    });
  };

  const handleEvidenceChange = (index: number, evidence: string) => {
    setCompetencies((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], evidence };
      return next;
    });
  };

  const handleAddCompetency = () => {
    setCompetencies((prev) => [
      ...prev,
      { name: 'New Competency Metric', weight: 10, rating: 3, evidence: '' },
    ]);
  };

  const handleRemoveCompetency = (index: number) => {
    if (competencies.length <= 1) return;
    setCompetencies((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interview || isAlreadySealed) return;

    submitScorecardMutation.mutate(
      {
        interviewId: interview._id,
        input: {
          competencyRatings: competencies,
          overallRating,
          recommendation,
          strengths: strengths.trim(),
          areasOfConcern: areasOfConcern.trim(),
          seal: sealScorecard,
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
            className="relative w-full max-w-2xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Structured Evaluation Scorecard</h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    {interview.title} · Candidate: <strong className="text-[#1A1A1A]">{candidateName}</strong>
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

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Template Pre-loader */}
              {templatesData?.templates && templatesData.templates.length > 0 && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/50 border border-orange-200/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-semibold text-orange-950">
                      Standardized Competency Template:
                    </span>
                  </div>
                  <div className="w-64">
                    <FloatingDropdown
                      label="Template"
                      value={selectedTemplateId}
                      onChange={(val) => setSelectedTemplateId(val)}
                      options={[
                        { value: '', label: 'Default Engineering Rubric' },
                        ...templatesData.templates.map((t) => ({
                          value: t._id,
                          label: t.name,
                        })),
                      ]}
                    />
                  </div>
                </div>
              )}

              {/* Overall Rating & Recommendation */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6] text-center">
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-2">
                    Overall Evaluator Score
                  </label>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setOverallRating(star)}
                        className="p-1 transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= overallRating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-amber-600 mt-1.5">
                    {overallRating} / 5 Rating Score
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6] flex flex-col justify-center">
                  <FloatingDropdown
                    label="Hiring Recommendation"
                    value={recommendation}
                    onChange={(val) => setRecommendation(val as ScorecardRecommendation)}
                    options={[
                      {
                        value: 'strong_hire',
                        label: 'Strong Hire — Exceeds Expectations',
                        dotColor: '#10b981',
                      },
                      {
                        value: 'hire',
                        label: 'Hire — Meets Requirements',
                        dotColor: '#22c55e',
                      },
                      {
                        value: 'neutral',
                        label: 'Neutral — Borderline / Split',
                        dotColor: '#f59e0b',
                      },
                      {
                        value: 'no_hire',
                        label: 'No Hire — Gaps in Competency',
                        dotColor: '#f43f5e',
                      },
                      {
                        value: 'strong_no_hire',
                        label: 'Strong No Hire — Critical Mismatch',
                        dotColor: '#b91c1c',
                      },
                    ]}
                  />
                </div>
              </div>

              {/* Competency Ratings Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#f97316]" />
                    Competency Rubrics (1 to 5)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCompetency}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Competency
                  </button>
                </div>

                <div className="space-y-3">
                  {competencies.map((comp, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-[#ECE0D6] bg-white space-y-2 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={comp.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCompetencies((prev) => {
                              const n = [...prev];
                              n[idx] = { ...n[idx], name: val };
                              return n;
                            });
                          }}
                          className="font-semibold text-xs text-[#1A1A1A] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#f97316] focus:outline-none flex-1"
                        />
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((score) => (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleRatingChange(idx, score)}
                              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                                comp.rating === score
                                  ? 'bg-[#f97316] text-white shadow-2xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {score}
                            </button>
                          ))}
                        </div>
                        {competencies.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCompetency(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Observable evidence & candidate quotes (e.g., explained Paxos vs Raft trade-offs clearly)..."
                        value={comp.evidence || ''}
                        onChange={(e) => handleEvidenceChange(idx, e.target.value)}
                        className="w-full text-[11px] text-[#4A4A4A] bg-[#FAF7F2] border border-[#ECE0D6] rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#f97316]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Areas of Concern */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Key Strengths & Evidence
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Clear system level thinking, excellent communication of async job patterns..."
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Areas of Concern / Red Flags
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Limited exposure to container networking or multi-region failovers..."
                    value={areasOfConcern}
                    onChange={(e) => setAreasOfConcern(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Sealed Scorecard Checkbox */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="sealCheckbox"
                  checked={sealScorecard}
                  onChange={(e) => setSealScorecard(e.target.checked)}
                  className="mt-0.5 rounded text-[#f97316] focus:ring-[#f97316]"
                />
                <label htmlFor="sealCheckbox" className="text-xs text-amber-950 cursor-pointer">
                  <span className="font-bold flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-700" />
                    Seal Scorecard upon submission
                  </span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    Sealing permanently locks your rating to ensure unbiased calibration before the debrief synthesis.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitScorecardMutation.isPending || isAlreadySealed}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  {submitScorecardMutation.isPending
                    ? 'Submitting...'
                    : sealScorecard
                    ? 'Seal & Submit Scorecard'
                    : 'Save Scorecard Draft'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
