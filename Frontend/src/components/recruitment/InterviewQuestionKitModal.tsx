import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  HelpCircle,
  Copy,
  Check,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useGenerateInterviewQuestionKit } from '../../hooks/useRecruitment';
import type {
  Interview,
  InterviewQuestionKit,
  InterviewQuestionItem,
} from '../../types/recruitment';

interface InterviewQuestionKitModalProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
}

export const InterviewQuestionKitModal: React.FC<InterviewQuestionKitModalProps> = ({
  open,
  onClose,
  interview,
}) => {
  const questionKitMutation = useGenerateInterviewQuestionKit();
  const [kit, setKit] = useState<InterviewQuestionKit | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (open && interview) {
      handleGenerate();
    }
  }, [open, interview?._id]);

  if (!open || !interview) return null;

  const candidateName =
    typeof interview.candidateId === 'object' && interview.candidateId
      ? interview.candidateId.fullName
      : 'Candidate';

  const jobTitle =
    typeof interview.jobOpeningId === 'object' && interview.jobOpeningId
      ? interview.jobOpeningId.title
      : 'Position';

  const handleGenerate = () => {
    questionKitMutation.mutate(
      { interviewId: interview._id },
      {
        onSuccess: (res) => {
          setKit(res.kit);
        },
      }
    );
  };

  const handleCopyQuestion = (q: InterviewQuestionItem, idx: number) => {
    const text = [
      `Competency: ${q.competency}`,
      `Question: ${q.question}`,
      `Follow-up Probe: ${q.probeFollowUp}`,
      `What to Look For: ${q.whatToLookFor}`,
      `Red Flags: ${q.redFlags}`,
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    toast.success('Question copied to clipboard.');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!kit) return;
    const all = kit.questions
      .map(
        (q, i) =>
          `Q${i + 1} [${q.competency}]:\n${q.question}\nFollow-up: ${q.probeFollowUp}\nLook For: ${q.whatToLookFor}\nRed Flags: ${q.redFlags}\n`
      )
      .join('\n---\n\n');
    navigator.clipboard.writeText(all);
    toast.success('All questions copied to clipboard.');
  };

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
            className="relative w-full max-w-3xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">
                    AI Structured Interview Question Kit
                  </h3>
                  <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                    Tailored for <strong className="text-[#1A1A1A]">{candidateName}</strong> ·{' '}
                    {jobTitle} ({interview.roundType})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={questionKitMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors shadow-2xs disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      questionKitMutation.isPending ? 'animate-spin' : ''
                    }`}
                  />
                  Regenerate
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {questionKitMutation.isPending ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">
                    Synthesizing interview questions tailored to candidate strengths & gaps...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Applying behavioral rubrics and scenario-based probe techniques.
                  </p>
                </div>
              ) : kit && kit.questions && kit.questions.length > 0 ? (
                <>
                  {/* Interviewer Pro Tips Banner */}
                  {kit.interviewerTips && kit.interviewerTips.length > 0 && (
                    <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-orange-950">
                        <Lightbulb className="w-4 h-4 text-orange-600" />
                        Interviewer Guidelines & Probe Strategy
                      </div>
                      <ul className="text-[11px] text-orange-900 list-disc list-inside space-y-0.5 leading-relaxed">
                        {kit.interviewerTips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Question Cards */}
                  <div className="space-y-4">
                    {kit.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3 shadow-2xs hover:border-orange-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            Competency: {q.competency}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyQuestion(q, idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-orange-600 transition-colors"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Question
                              </>
                            )}
                          </button>
                        </div>

                        {/* Main Question */}
                        <div>
                          <p className="text-xs font-bold text-[#1A1A1A] leading-relaxed">
                            {idx + 1}. {q.question}
                          </p>
                        </div>

                        {/* Probe Follow-up */}
                        {q.probeFollowUp && (
                          <div className="p-2.5 rounded-lg bg-[#FAF7F2] border border-[#ECE0D6] text-[11px] text-slate-700">
                            <span className="font-bold text-[#f97316]">Follow-up Probe: </span>
                            {q.probeFollowUp}
                          </div>
                        )}

                        {/* Evaluation Rubrics: Green Signs vs Red Flags */}
                        <div className="grid grid-cols-2 gap-3 pt-1">
                          <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60">
                            <p className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1 mb-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              What to Look For (Strong Answer)
                            </p>
                            <p className="text-[11px] text-emerald-950 leading-relaxed">
                              {q.whatToLookFor}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200/60">
                            <p className="text-[10px] font-bold uppercase text-rose-800 flex items-center gap-1 mb-1">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              Red Flags (Superficial Knowledge)
                            </p>
                            <p className="text-[11px] text-rose-950 leading-relaxed">
                              {q.redFlags}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-xs text-[#6B6B6B]">
                  Click "Regenerate" to create a structured question kit.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                AI Kit calibrated against role senior level and resume skill verification.
              </p>
              <div className="flex items-center gap-2">
                {kit && (
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-[#ECE0D6] hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    Copy All Questions
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] text-white hover:bg-[#ea580c] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
