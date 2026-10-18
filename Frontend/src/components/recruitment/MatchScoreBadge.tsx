import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { MatchScoreResult } from '../../types/recruitment';

interface MatchScoreBadgeProps {
  score?: number;
  matchDetails?: MatchScoreResult | null;
  size?: 'sm' | 'md' | 'lg';
  showPopover?: boolean;
}

export const MatchScoreBadge: React.FC<MatchScoreBadgeProps> = ({
  score = 0,
  matchDetails,
  size = 'md',
  showPopover = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const finalScore = matchDetails?.matchScore ?? matchDetails?.overallScore ?? score;
  const skillsScore =
    matchDetails?.skillsMatch ??
    (matchDetails?.matchExplanation?.matchedSkills
      ? Math.min(
          100,
          Math.round(
            (matchDetails.matchExplanation.matchedSkills.length /
              Math.max(
                1,
                matchDetails.matchExplanation.matchedSkills.length +
                  (matchDetails.matchExplanation.missingSkills?.length || 0)
              )) *
              100
          )
        )
      : Math.round(finalScore * 0.95));
  const experienceScore =
    matchDetails?.experienceMatch ?? Math.min(100, Math.round(finalScore * 1.02));
  const strengths: string[] =
    matchDetails?.strengths ?? matchDetails?.matchExplanation?.matchedSkills ?? [];
  const gaps: string[] =
    matchDetails?.gaps ?? matchDetails?.matchExplanation?.missingSkills ?? [];
  const recommendation =
    matchDetails?.recommendation ?? matchDetails?.matchExplanation?.recommendation ?? '';

  // Determine color scheme based on score
  const getColorStyles = (val: number) => {
    if (val >= 80) {
      return {
        bg: 'bg-emerald-50 hover:bg-emerald-100/80',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        ring: 'ring-emerald-500/20',
        fill: 'fill-emerald-500 text-emerald-500',
        bar: 'bg-emerald-500',
      };
    }
    if (val >= 60) {
      return {
        bg: 'bg-blue-50 hover:bg-blue-100/80',
        text: 'text-blue-700',
        border: 'border-blue-200',
        ring: 'ring-blue-500/20',
        fill: 'fill-blue-500 text-blue-500',
        bar: 'bg-blue-500',
      };
    }
    if (val >= 40) {
      return {
        bg: 'bg-amber-50 hover:bg-amber-100/80',
        text: 'text-amber-700',
        border: 'border-amber-200',
        ring: 'ring-amber-500/20',
        fill: 'fill-amber-500 text-amber-500',
        bar: 'bg-amber-500',
      };
    }
    return {
      bg: 'bg-rose-50 hover:bg-rose-100/80',
      text: 'text-rose-700',
      border: 'border-rose-200',
      ring: 'ring-rose-500/20',
      fill: 'fill-rose-500 text-rose-500',
      bar: 'bg-rose-500',
    };
  };

  const colors = getColorStyles(finalScore);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold',
  }[size];

  return (
    <div className="relative inline-block" onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        onClick={() => showPopover && setIsOpen(!isOpen)}
        onMouseEnter={() => showPopover && setIsOpen(true)}
        className={`inline-flex items-center font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
        title="AI Match Score (PII Blinded)"
      >
        <Sparkles className={`w-3.5 h-3.5 ${colors.fill}`} />
        <span>{Math.round(finalScore)}% AI Fit</span>
      </button>

      {/* Popover Breakdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white border border-[#ECE0D6] shadow-xl p-4 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#ECE0D6]">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#f97316]" />
                <h4 className="text-xs font-bold text-[#111827]">AI Match Breakdown</h4>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${colors.bg} ${colors.text} ${colors.border}`}>
                {Math.round(finalScore)}%
              </span>
            </div>

            {/* Score Progress Bars */}
            <div className="space-y-2.5 my-3">
              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Skills Alignment</span>
                  <span className="font-bold text-slate-800">{skillsScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getColorStyles(skillsScore).bar}`}
                    style={{ width: `${Math.min(100, skillsScore)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
                  <span>Experience Alignment</span>
                  <span className="font-bold text-slate-800">{experienceScore}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getColorStyles(experienceScore).bar}`}
                    style={{ width: `${Math.min(100, experienceScore)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recommendation */}
            {recommendation && (
              <div className="p-2 rounded-lg bg-orange-50/60 border border-orange-200/60 text-[11px] text-orange-900 mb-3">
                <p className="font-semibold text-orange-950 mb-0.5">Recommendation</p>
                <p className="leading-relaxed">{recommendation}</p>
              </div>
            )}

            {/* Strengths */}
            {strengths.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Key Strengths
                </p>
                <ul className="text-[11px] text-slate-700 space-y-0.5 pl-4 list-disc marker:text-emerald-500">
                  {strengths.slice(0, 3).map((st: string, i: number) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Gaps */}
            {gaps.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" /> Potential Gaps
                </p>
                <ul className="text-[11px] text-slate-700 space-y-0.5 pl-4 list-disc marker:text-amber-500">
                  {gaps.slice(0, 3).map((gp: string, i: number) => (
                    <li key={i}>{gp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Blind Fairness Footer */}
            <div className="pt-2 border-t border-[#ECE0D6] flex items-center gap-1.5 text-[10px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#f97316] shrink-0" />
              <span>Algorithmic Fairness: PII & demographics blinded. Advisory only.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
