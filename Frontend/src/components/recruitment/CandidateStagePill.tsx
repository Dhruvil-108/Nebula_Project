import React from 'react';
import { clsx } from 'clsx';
import { STAGE_LABELS, type CandidateStage } from '../../types/recruitment';

const STAGE_PILL_STYLES: Record<CandidateStage, string> = {
  applied: 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]',
  screening: 'bg-[#f5f3ff] text-[#7c3aed] border-[#ddd6fe]',
  interview_round_1: 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]',
  interview_round_2: 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]',
  technical_assessment: 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]',
  hr_round: 'bg-[#ecfeff] text-[#0891b2] border-[#a5f3fc]',
  offer_sent: 'bg-[#fff7ed] text-[#ea580c] border-[#fed7aa]',
  hired: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
  rejected: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  withdrawn: 'bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]',
};

const STAGE_DOT_STYLES: Record<CandidateStage, string> = {
  applied: 'bg-[#64748b]',
  screening: 'bg-[#7c3aed]',
  interview_round_1: 'bg-[#2563eb]',
  interview_round_2: 'bg-[#4338ca]',
  technical_assessment: 'bg-[#d97706]',
  hr_round: 'bg-[#0891b2]',
  offer_sent: 'bg-[#f97316]',
  hired: 'bg-[#059669]',
  rejected: 'bg-[#dc2626]',
  withdrawn: 'bg-[#94a3b8]',
};

interface CandidateStagePillProps {
  stage: CandidateStage;
  className?: string;
  size?: 'sm' | 'md';
}

export const CandidateStagePill: React.FC<CandidateStagePillProps> = ({
  stage,
  className = '',
  size = 'md',
}) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full font-semibold border whitespace-nowrap transition-colors',
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
      STAGE_PILL_STYLES[stage] || STAGE_PILL_STYLES.applied,
      className
    )}
  >
    <span
      className={clsx(
        'rounded-full flex-shrink-0',
        size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
        STAGE_DOT_STYLES[stage] || STAGE_DOT_STYLES.applied
      )}
    />
    {STAGE_LABELS[stage] || stage}
  </span>
);
