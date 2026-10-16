import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Receipt,
  Building2,
  User,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Ban,
  Send,
} from 'lucide-react';
import { ExpenseStatusPill } from './ExpenseStatusPill';
import { useExpenseClaim } from '../../hooks/useExpenses';
import { useAuth } from '../../contexts/AuthContext';
import { PAYMENT_METHOD_LABELS } from '../../types/expenses';

interface ExpenseClaimDrawerProps {
  claimId: string | null;
  onClose: () => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onReimburse?: (id: string) => void;
  onSubmit?: (id: string) => void;
  onCancel?: (id: string) => void;
}

export const ExpenseClaimDrawer: React.FC<ExpenseClaimDrawerProps> = ({
  claimId,
  onClose,
  onApprove,
  onReject,
  onReimburse,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const { data, isLoading } = useExpenseClaim(claimId || undefined);

  const claim = data?.claim;
  const activities = data?.activities || [];

  const isFinanceOrAdmin = ['super_admin', 'admin', 'finance'].includes(user?.role || '');
  const isManager = user?.role === 'manager';

  const canApprove =
    claim &&
    ((claim.status === 'submitted' && (isManager || isFinanceOrAdmin)) ||
      (claim.status === 'manager_approved' && isFinanceOrAdmin));

  const canReject =
    claim &&
    ['submitted', 'manager_approved'].includes(claim.status) &&
    (isManager || isFinanceOrAdmin);

  const canReimburse = claim && claim.status === 'approved' && isFinanceOrAdmin;
  const canSubmit = claim && ['draft', 'rejected'].includes(claim.status);
  const canCancel = claim && ['submitted', 'manager_approved'].includes(claim.status);

  return (
    <AnimatePresence>
      {Boolean(claimId) && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Drawer Window */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-[#ECE0D6] z-10"
          >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">
                  {claim?.claimNumber || 'Loading...'}
                </span>
                {claim && <ExpenseStatusPill status={claim.status} size="sm" />}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{claim?.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading || !claim ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Loading claim details...
            </div>
          ) : (
            <>
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Total Claim</span>
                  <span className="text-lg font-bold text-orange-600">
                    ${claim.totalAmount.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {claim.currency} · {claim.items.length} items
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Department</span>
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {claim.departmentId?.name || 'Unassigned'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Submitted By</span>
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {claim.employeeId?.fullName}
                  </span>
                  <span className="text-[10px] text-slate-400 block line-clamp-1">
                    {claim.employeeId?.email}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[11px] text-slate-400 font-medium block">Submitted Date</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {claim.submittedAt
                      ? new Date(claim.submittedAt).toLocaleDateString()
                      : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Rejection Alert if rejected */}
              {claim.status === 'rejected' && claim.rejection && (
                <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-900">
                      Claim Rejected ({claim.rejection.stage === 'finance' ? 'Finance' : 'Manager'} Review)
                    </h4>
                    <p className="text-xs text-rose-700 mt-1">{claim.rejection.reason}</p>
                    <span className="text-[11px] text-rose-500 block mt-1.5">
                      Rejected by {claim.rejection.rejectedById?.fullName || 'Reviewer'} on{' '}
                      {claim.rejection.rejectedAt
                        ? new Date(claim.rejection.rejectedAt).toLocaleDateString()
                        : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Reimbursement Details if reimbursed */}
              {claim.status === 'reimbursed' && claim.reimbursement && (
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/60 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-teal-900">Reimbursement Complete</h4>
                    <p className="text-xs text-teal-800 mt-0.5">
                      Paid via{' '}
                      <span className="font-semibold">
                        {PAYMENT_METHOD_LABELS[claim.reimbursement.paymentMethod!] ||
                          claim.reimbursement.paymentMethod}
                      </span>
                      {claim.reimbursement.transactionReference && (
                        <span> (Ref: {claim.reimbursement.transactionReference})</span>
                      )}
                    </p>
                    <span className="text-[11px] text-teal-600 block mt-1">
                      Processed on{' '}
                      {new Date(claim.reimbursement.reimbursedAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Line Items Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Itemized Expenses ({claim.items.length})
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                  {claim.items.map((item, idx) => {
                    const cat = typeof item.categoryId === 'object' ? item.categoryId : null;
                    return (
                      <div key={idx} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                              style={{ backgroundColor: cat?.color || '#f97316' }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-900">
                                  {item.merchant}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                                  {cat?.name || 'Expense'}
                                </span>
                                {item.isBillableToClient && (
                                  <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                    Client Billable
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5">
                                <span>
                                  Date: {new Date(item.expenseDate).toLocaleDateString()}
                                </span>
                                {item.receiptUrl && (
                                  <a
                                    href={item.receiptUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-orange-600 hover:underline font-medium"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    <span>View Receipt</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-slate-900">
                              ${item.amount.toFixed(2)}
                            </span>
                            {item.taxAmount && item.taxAmount > 0 ? (
                              <span className="text-[10px] text-slate-400 block">
                                Tax: ${item.taxAmount.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Approval Stages Cards */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Approval Hierarchy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Tier 1: Line Manager */}
                  <div
                    className={`p-3.5 rounded-xl border ${
                      claim.managerApproval?.approvedAt
                        ? 'border-indigo-200 bg-indigo-50/40'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-800">1. Line Manager</span>
                      {claim.managerApproval?.approvedAt ? (
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    {claim.managerApproval?.approvedAt ? (
                      <div>
                        <p className="text-[11px] text-slate-600">
                          Approved by {claim.managerApproval.approverId?.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(claim.managerApproval.approvedAt).toLocaleString()}
                        </p>
                        {claim.managerApproval.comments && (
                          <p className="text-xs italic text-slate-700 mt-1">
                            "{claim.managerApproval.comments}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px]">Pending manager review</p>
                    )}
                  </div>

                  {/* Tier 2: Finance Review */}
                  <div
                    className={`p-3.5 rounded-xl border ${
                      claim.financeApproval?.approvedAt
                        ? 'border-emerald-200 bg-emerald-50/40'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-800">2. Finance Controller</span>
                      {claim.financeApproval?.approvedAt ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    {claim.financeApproval?.approvedAt ? (
                      <div>
                        <p className="text-[11px] text-slate-600">
                          Approved by {claim.financeApproval.approverId?.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(claim.financeApproval.approvedAt).toLocaleString()}
                        </p>
                        {claim.financeApproval.comments && (
                          <p className="text-xs italic text-slate-700 mt-1">
                            "{claim.financeApproval.comments}"
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-[11px]">Pending finance review</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {claim.notes && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-700 block mb-1">
                    Claim Notes
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">{claim.notes}</p>
                </div>
              )}

              {/* Timeline Activities */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Audit History
                </h4>
                <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-3">
                  {activities.map((act) => (
                    <div key={act._id} className="text-xs relative">
                      <div className="absolute -left-[19px] top-1 w-2 h-2 rounded-full bg-slate-300 border-2 border-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 capitalize">
                          {act.action.replace('_', ' ')}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          by {act.actorId?.fullName} ·{' '}
                          {new Date(act.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {act.comment && (
                        <p className="text-slate-600 text-[11px] mt-0.5">{act.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {claim && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {canCancel && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(claim._id)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel Claim
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {canReject && onReject && (
                <button
                  type="button"
                  onClick={() => onReject(claim._id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                >
                  Reject
                </button>
              )}

              {canApprove && onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(claim._id)}
                  className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    {claim.status === 'manager_approved' ? 'Finance Approve' : 'Approve Claim'}
                  </span>
                </button>
              )}

              {canReimburse && onReimburse && (
                <button
                  type="button"
                  onClick={() => onReimburse(claim._id)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Issue Reimbursement</span>
                </button>
              )}

              {canSubmit && onSubmit && (
                <button
                  type="button"
                  onClick={() => onSubmit(claim._id)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Claim</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )}
</AnimatePresence>
);
};
