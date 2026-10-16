import React from 'react';
import {
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUS_COLORS,
  type ExpenseClaimStatus,
} from '../../types/expenses';

interface ExpenseStatusPillProps {
  status: ExpenseClaimStatus;
  size?: 'sm' | 'md';
}

export const ExpenseStatusPill: React.FC<ExpenseStatusPillProps> = ({
  status,
  size = 'md',
}) => {
  const label = EXPENSE_STATUS_LABELS[status] || status;
  const colors =
    EXPENSE_STATUS_COLORS[status] || {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    };

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs gap-1.5'
      : 'px-2.5 py-1 text-xs font-medium gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-full border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      <span>{label}</span>
    </span>
  );
};
