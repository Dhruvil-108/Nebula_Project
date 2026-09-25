import React from 'react';
import { clsx } from 'clsx';
import { STAGE_LABELS, type PipelineStage } from '../../types/crm';

// Pipeline stage → color mapping (design-system Section 5, used EVERYWHERE for consistency)
const STAGE_PILL_STYLES: Record<PipelineStage, string> = {
  // Neutral — not yet engaged
  new: 'bg-[#fff7ed] text-[#6B6B6B] border-[#ECE0D6]',
  // Info blue-gray — introduced only for the pipeline stage system
  contacted: 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/25',
  // Orange progression
  qualified: 'bg-[#fff7ed] text-[#f97316] border-[#fed7aa]',
  proposal: 'bg-[#f97316] text-white border-[#c2410c]',
  // Warning tint
  negotiation: 'bg-[#B45309]/10 text-[#B45309] border-[#B45309]/25',
  // Success tint
  won: 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/25',
  // Danger tint
  lost: 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/25',
};

interface StagePillProps {
  stage: PipelineStage;
  className?: string;
}

export const StagePill: React.FC<StagePillProps> = ({ stage, className = '' }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap',
      STAGE_PILL_STYLES[stage],
      className
    )}
  >
    <span className={clsx('w-1.5 h-1.5 rounded-full', STAGE_DOT_STYLES[stage])} />
    {STAGE_LABELS[stage]}
  </span>
);

const STAGE_DOT_STYLES: Record<PipelineStage, string> = {
  new: 'bg-[#6B6B6B]',
  contacted: 'bg-[#3B82F6]',
  qualified: 'bg-[#f97316]',
  proposal: 'bg-white',
  negotiation: 'bg-[#B45309]',
  won: 'bg-[#16A34A]',
  lost: 'bg-[#DC2626]',
};
