import React from 'react';
import { clsx } from 'clsx';
import { JOB_STATUS_LABELS, type JobStatus } from '../../types/recruitment';

const JOB_STATUS_STYLES: Record<JobStatus, string> = {
  draft: 'bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]',
  published: 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]',
  on_hold: 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]',
  closed: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
};

const JOB_STATUS_DOTS: Record<JobStatus, string> = {
  draft: 'bg-[#64748b]',
  published: 'bg-[#10b981]',
  on_hold: 'bg-[#f59e0b]',
  closed: 'bg-[#ef4444]',
};

interface JobStatusPillProps {
  status: JobStatus;
  className?: string;
}

export const JobStatusPill: React.FC<JobStatusPillProps> = ({ status, className = '' }) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap',
      JOB_STATUS_STYLES[status] || JOB_STATUS_STYLES.published,
      className
    )}
  >
    <span className={clsx('w-1.5 h-1.5 rounded-full', JOB_STATUS_DOTS[status] || JOB_STATUS_DOTS.published)} />
    {JOB_STATUS_LABELS[status] || status}
  </span>
);
