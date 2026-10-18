import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Copy,
  Users,
  FileText,
  Bot,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useRecruiterCopilot, useCandidates, useJobs } from '../../hooks/useRecruitment';
import type { RecruiterCopilotSynthesis } from '../../types/recruitment';

interface RecruiterCopilotDrawerProps {
  open: boolean;
  onClose: () => void;
  initialCandidateId?: string;
  initialJobId?: string;
}

export const RecruiterCopilotDrawer: React.FC<RecruiterCopilotDrawerProps> = ({
  open,
  onClose,
  initialCandidateId,
  initialJobId,
}) => {
  const [action, setAction] = useState<'summarize_dossier' | 'compare_candidates' | 'briefing_notes'>('summarize_dossier');
  const [selectedCandidateId, setSelectedCandidateId] = useState(initialCandidateId || '');
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || '');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<RecruiterCopilotSynthesis | null>(null);

  const { data: candidates } = useCandidates();
  const { data: jobs } = useJobs();
  const copilotMutation = useRecruiterCopilot();

  if (!open) return null;

  const handleSynthesize = () => {
    copilotMutation.mutate(
      {
        action,
        candidateId: selectedCandidateId || undefined,
        jobOpeningId: selectedJobId || undefined,
        notes: notes.trim(),
      },
      {
        onSuccess: (data) => {
          setResult(data.synthesis);
          toast.success('✨ Recruiter Copilot synthesis generated!');
        },
      }
    );
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-2xs"
          onClick={onClose}
        />

        {/* Drawer Panel */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-screen max-w-lg bg-white border-l border-[#ECE0D6] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">Recruiter AI Copilot</h3>
                    <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      Phase 5
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B]">Dossier synthesis, candidate comparison & debrief advisor</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Action Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#FBF8F4] p-1 rounded-xl border border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setAction('summarize_dossier')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    action === 'summarize_dossier'
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Dossier Summary
                </button>
                <button
                  type="button"
                  onClick={() => setAction('compare_candidates')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    action === 'compare_candidates'
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Compare Finalists
                </button>
                <button
                  type="button"
                  onClick={() => setAction('briefing_notes')}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all ${
                    action === 'briefing_notes'
                      ? 'bg-white text-orange-600 shadow-2xs font-bold'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Debrief Briefing
                </button>
              </div>

              {/* Input Selectors */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Target Candidate</label>
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                  >
                    <option value="">Select candidate to analyze...</option>
                    {(candidates || []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.fullName} ({c.candidateCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Target Job Vacancy (Optional)</label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                  >
                    <option value="">All Job Vacancies</option>
                    {(jobs || []).map((j) => (
                      <option key={j._id} value={j._id}>
                        {j.title} ({j.jobCode})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                    Recruiter Specific Context / Focus Area
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Focus on system architecture depth and team leadership readiness..."
                    className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSynthesize}
                  disabled={copilotMutation.isPending}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {copilotMutation.isPending ? 'Analyzing Scorecards & Dossiers...' : 'Synthesize with Copilot'}
                </button>
              </div>

              {/* Results View */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-[#ECE0D6] rounded-2xl p-4 bg-white shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-2">
                    <h4 className="text-xs font-bold text-[#1A1A1A]">{result.title}</h4>
                    <button
                      onClick={() =>
                        handleCopy(
                          `${result.title}\n\n${result.executiveSummary}\n\nRecommendation:\n${result.overallRecommendation}`
                        )
                      }
                      className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      Copy Summary
                    </button>
                  </div>

                  {/* Summary */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-1">
                      Executive Summary
                    </p>
                    <p className="text-xs text-[#374151] leading-relaxed bg-[#FBF8F4] p-3 rounded-xl border border-[#ECE0D6]">
                      {result.executiveSummary}
                    </p>
                  </div>

                  {/* Recommendation Badge */}
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Calibrated Hiring Recommendation
                    </p>
                    <p className="text-xs font-bold mt-0.5">{result.overallRecommendation}</p>
                  </div>

                  {/* Strengths */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Panel Strengths
                    </p>
                    <ul className="space-y-1">
                      {result.keyStrengths.map((s, idx) => (
                        <li key={idx} className="text-xs text-[#374151] flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Concerns */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Areas of Concern / Score Divergence
                    </p>
                    <ul className="space-y-1">
                      {result.areasOfConcern.map((c, idx) => (
                        <li key={idx} className="text-xs text-[#374151] flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggested Next Steps */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Committee Action Items
                    </p>
                    <ul className="space-y-1">
                      {result.suggestedNextSteps.map((step, idx) => (
                        <li key={idx} className="text-xs text-[#374151] flex items-start gap-1.5">
                          <span className="text-blue-500 font-bold">→</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
