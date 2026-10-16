import React from 'react';

interface BudgetProgressBarProps {
  spent: number;
  allocated: number;
  pending?: number;
  currency?: string;
  alertThreshold?: number;
  showLabels?: boolean;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  allocated,
  pending = 0,
  currency = 'USD',
  alertThreshold = 80,
  showLabels = true,
}) => {
  const percentSpent = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const percentPending = allocated > 0 ? Math.round((pending / allocated) * 100) : 0;
  const isOverBudget = spent > allocated;
  const isAlert = percentSpent >= alertThreshold && !isOverBudget;

  let barColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (isOverBudget) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (isAlert) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900">{formatAmount(spent)}</span>
            <span className="text-slate-400">of {formatAmount(allocated)}</span>
            {pending > 0 && (
              <span className="text-amber-600 font-medium">
                (+{formatAmount(pending)} pending)
              </span>
            )}
          </div>
          <span
            className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border ${badgeColor}`}
          >
            {percentSpent}% Used
          </span>
        </div>
      )}

      {/* Track */}
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex relative">
        {/* Spent portion */}
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, percentSpent)}%` }}
        />
        {/* Pending portion */}
        {percentPending > 0 && percentSpent < 100 && (
          <div
            className="h-full bg-amber-300 opacity-80 transition-all duration-500"
            style={{ width: `${Math.min(100 - percentSpent, percentPending)}%` }}
          />
        )}
      </div>

      {isOverBudget && (
        <p className="text-[11px] font-medium text-rose-600 mt-1 flex items-center gap-1">
          Budget exceeded by {formatAmount(spent - allocated)}
        </p>
      )}
    </div>
  );
};
