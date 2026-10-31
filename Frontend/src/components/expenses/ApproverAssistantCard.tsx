import React from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Clock,
  History,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApproverSummary } from '../../hooks/useExpenses';
import type { AnomalyFlag } from '../../types/expenses';

interface ApproverAssistantCardProps {
  claimId: string;
  onApplyDraftComment?: (comment: string) => void;
}

export const ApproverAssistantCard: React.FC<ApproverAssistantCardProps> = ({
  claimId,
  onApplyDraftComment,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const { data: brief, isLoading } = useApproverSummary(claimId);

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-orange-200/70 bg-gradient-to-r from-orange-50/40 to-amber-50/30 animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 rounded-full bg-orange-200" />
          <div className="h-3 w-32 bg-orange-200 rounded" />
        </div>
        <div className="h-2.5 w-full bg-orange-100 rounded mb-1.5" />
        <div className="h-2.5 w-3/4 bg-orange-100 rounded" />
      </div>
    );
  }

  if (!brief) return null;

  return (
    <div className="rounded-xl border border-orange-200/80 bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-white shadow-2xs overflow-hidden">
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-orange-100/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-900">Approver Assistant Brief</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 border border-orange-200">
                AI Inspected
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
              brief.riskScore === 'high'
                ? 'bg-rose-100 text-rose-700'
                : brief.riskScore === 'medium'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {brief.riskScore} Risk
          </span>
          <button className="text-slate-400 hover:text-slate-600">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 space-y-3 text-xs border-t border-orange-100/60">
          {/* Executive Summary Paragraph */}
          <p className="text-slate-700 leading-relaxed text-[11px] bg-white/70 p-2.5 rounded-lg border border-orange-100">
            {brief.summaryParagraph}
          </p>

          {/* Budget Impact & Historical Stats */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-lg bg-white/60 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <TrendingUp className="w-3 h-3 text-orange-500" />
                <span className="font-semibold text-slate-700">Budget Impact</span>
              </div>
              <p className="text-slate-600 leading-snug">{brief.budgetImpact.text}</p>
            </div>

            <div className="p-2.5 rounded-lg bg-white/60 border border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <History className="w-3 h-3 text-sky-500" />
                <span className="font-semibold text-slate-700">90-Day History</span>
              </div>
              <p className="text-slate-600 leading-snug">
                {brief.historicalContext.pastClaimsCount} past claims (avg. $
                {brief.historicalContext.pastAverageAmount.toFixed(2)})
              </p>
            </div>
          </div>

          {/* Anomaly Flags (if any) */}
          {brief.anomalyFlags && brief.anomalyFlags.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Pattern Anomalies ({brief.anomalyFlags.length})
              </span>
              {brief.anomalyFlags.map((flag: AnomalyFlag, idx: number) => (
                <div
                  key={idx}
                  className={`p-2 rounded-lg border text-[11px] flex items-start gap-2 ${
                    flag.severity === 'high_risk'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : flag.severity === 'caution'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{flag.title}: </span>
                    <span>{flag.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recommendation & Draft Note Action */}
          <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950 block text-[11px]">
                  Recommendation: {brief.suggestedAction.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-[10px] text-emerald-700">{brief.suggestedReason}</span>
              </div>
            </div>

            {onApplyDraftComment && (
              <button
                type="button"
                onClick={() => onApplyDraftComment(brief.draftApprovalComment)}
                className="px-2.5 py-1 text-[10px] font-bold text-emerald-700 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-md transition-colors shrink-0 shadow-2xs"
              >
                Insert Note
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
