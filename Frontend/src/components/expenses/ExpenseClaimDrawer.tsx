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
  Check,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Briefcase,
  Layers,
  Car,
  Utensils,
  ShieldCheck,
  Plane,
  Coins,
  PackageCheck,
} from 'lucide-react';
import { ExpenseStatusPill } from './ExpenseStatusPill';
import { ApproverAssistantCard } from './ApproverAssistantCard';
import {
  useExpenseClaim,
  useSendBackExpenseClaim,
  useLineDecisionExpenseClaim,
} from '../../hooks/useExpenses';
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
  const sendBackMutation = useSendBackExpenseClaim();
  const lineDecisionMutation = useLineDecisionExpenseClaim();

  const [showSendBackDialog, setShowSendBackDialog] = React.useState(false);
  const [sendBackComment, setSendBackComment] = React.useState('');
  const [rejectingItemId, setRejectingItemId] = React.useState<string | null>(null);
  const [itemRejectReason, setItemRejectReason] = React.useState('');

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

  const canSendBack =
    claim &&
    ['submitted', 'manager_approved'].includes(claim.status) &&
    (isManager || isFinanceOrAdmin);

  const canReimburse = claim && claim.status === 'approved' && isFinanceOrAdmin;
  const canSubmit = claim && ['draft', 'rejected', 'sent_back'].includes(claim.status);
  const canCancel = claim && ['submitted', 'manager_approved'].includes(claim.status);

  const handleSendBack = async () => {
    if (!claim || !sendBackComment.trim()) return;
    await sendBackMutation.mutateAsync({ id: claim._id, comments: sendBackComment.trim() });
    setShowSendBackDialog(false);
    setSendBackComment('');
  };

  const handleLineDecision = async (itemId: string, decision: 'approved' | 'rejected') => {
    if (!claim) return;
    await lineDecisionMutation.mutateAsync({
      id: claim._id,
      itemId,
      decision,
      reason: decision === 'rejected' ? itemRejectReason.trim() : undefined,
    });
    setRejectingItemId(null);
    setItemRejectReason('');
  };

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

              {/* Project, Cost Center, Travel Request & Batch Linkages */}
              {(claim.projectId || claim.costCenterId || claim.travelRequestId || claim.paymentBatchId) && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {claim.projectId && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 font-medium">
                      <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                      <span>
                        Project: {typeof claim.projectId === 'object' ? claim.projectId.name : claim.projectId}
                      </span>
                    </div>
                  )}
                  {claim.costCenterId && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                      <Layers className="w-3.5 h-3.5 text-slate-500" />
                      <span>
                        Cost Center: {typeof claim.costCenterId === 'object' ? claim.costCenterId.name : claim.costCenterId}
                      </span>
                    </div>
                  )}
                  {claim.travelRequestId && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 font-medium">
                      <Plane className="w-3.5 h-3.5 text-sky-600" />
                      <span>
                        Pre-Trip Auth:{' '}
                        {typeof claim.travelRequestId === 'object'
                          ? `${claim.travelRequestId.requestNumber} (${claim.travelRequestId.destination})`
                          : claim.travelRequestId}
                      </span>
                    </div>
                  )}
                  {claim.paymentBatchId && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 border border-purple-200 text-purple-800 font-medium">
                      <PackageCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>
                        Payment Batch:{' '}
                        {typeof claim.paymentBatchId === 'object'
                          ? claim.paymentBatchId.batchNumber
                          : claim.paymentBatchId}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Cash Advance & Net-Pay Settlement Banner */}
              {((claim.advanceDeductedAmount && claim.advanceDeductedAmount > 0) || claim.cashAdvanceId) && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <h4 className="text-xs font-bold text-amber-900">
                        Cash Advance Net-Pay Settlement
                      </h4>
                    </div>
                    {claim.cashAdvanceId && (
                      <span className="text-[11px] font-semibold text-amber-800">
                        Ref: {typeof claim.cashAdvanceId === 'object' ? claim.cashAdvanceId.advanceNumber : 'Linked Advance'}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-white/80 p-2.5 rounded-lg border border-amber-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Gross Claim</span>
                      <span className="text-xs font-bold text-slate-900">${claim.totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-700 block">Advance Deducted</span>
                      <span className="text-xs font-bold text-amber-700">-${(claim.advanceDeductedAmount || 0).toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-700 block">Net Reimbursement</span>
                      <span className="text-xs font-bold text-emerald-700">
                        ${(claim.netReimbursableAmount !== undefined ? claim.netReimbursableAmount : (claim.totalAmount - (claim.advanceDeductedAmount || 0))).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Approver Assistant Brief */}
              <ApproverAssistantCard claimId={claim._id} />

              {/* Policy Violations Alert */}
              {claim.violations && claim.violations.length > 0 && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-900">
                      Policy Flags ({claim.violations.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {claim.violations.map((v, i) => (
                      <div key={i} className="text-xs bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-800">{v.policyName}</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              v.severity === 'block'
                                ? 'bg-rose-100 text-rose-700'
                                : v.severity === 'warn'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{v.message}</p>
                        {v.userJustification && (
                          <div className="mt-1.5 text-[11px] bg-amber-50 p-1.5 rounded border border-amber-100 text-amber-900">
                            <span className="font-medium">Claimant note:</span> {v.userJustification}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

              {/* Line Items Table with Phase 1 Line-Level Decisions */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Itemized Expenses ({claim.items.length})
                </h4>
                <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 bg-white">
                  {claim.items.map((item, idx) => {
                    const cat = typeof item.categoryId === 'object' ? item.categoryId : null;
                    const isRejectingThis = rejectingItemId === item._id;

                    return (
                      <div key={idx} className="p-3.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                              style={{ backgroundColor: cat?.color || '#f97316' }}
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-slate-900">
                                  {item.merchant}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md">
                                  {cat?.name || 'Expense'}
                                </span>
                                {item.expenseType === 'mileage' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    <Car className="w-3 h-3" /> Mileage
                                  </span>
                                )}
                                {item.expenseType === 'per_diem' && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                    <Utensils className="w-3 h-3" /> Per-Diem
                                  </span>
                                )}
                                {item.isBillableToClient && (
                                  <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                                    Client Billable
                                  </span>
                                )}
                                {item.lineStatus === 'approved' && (
                                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                    Approved
                                  </span>
                                )}
                                {item.lineStatus === 'rejected' && (
                                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Rejected{item.rejectionReason ? `: ${item.rejectionReason}` : ''}
                                  </span>
                                )}
                              </div>

                              {/* Special Spend Details */}
                              {item.expenseType === 'mileage' && item.mileageDetails && (
                                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-800">
                                  <span className="font-medium">
                                    {item.mileageDetails.vehicleType?.toUpperCase() || 'VEHICLE'}: {item.mileageDetails.distance}{' '}
                                    {item.mileageDetails.unit} @ ${item.mileageDetails.ratePerUnit?.toFixed(2)}/{item.mileageDetails.unit}
                                  </span>
                                </div>
                              )}

                              {item.expenseType === 'per_diem' && item.perDiemDetails && (
                                <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-blue-800">
                                  <span className="font-medium">
                                    {item.perDiemDetails.destination} — {item.perDiemDetails.days}{' '}
                                    {item.perDiemDetails.days === 1 ? 'day' : 'days'} @ ${item.perDiemDetails.ratePerDay}/day
                                  </span>
                                  {(item.perDiemDetails.breakfastProvided ||
                                    item.perDiemDetails.lunchProvided ||
                                    item.perDiemDetails.dinnerProvided) && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      Meals provided:{' '}
                                      {[
                                        item.perDiemDetails.breakfastProvided && 'Breakfast',
                                        item.perDiemDetails.lunchProvided && 'Lunch',
                                        item.perDiemDetails.dinnerProvided && 'Dinner',
                                      ]
                                        .filter(Boolean)
                                        .join(', ')}
                                    </span>
                                  )}
                                </div>
                              )}

                              {item.description && (
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1.5 flex-wrap">
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
                                {item.receiptHash && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200 font-mono"
                                    title={`SHA-256: ${item.receiptHash}`}
                                  >
                                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                    <span>SHA-256: {item.receiptHash.slice(0, 8)}...</span>
                                  </span>
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

                            {/* Line-level reviewer controls */}
                            {canApprove && item._id && item.lineStatus === 'pending' && (
                              <div className="flex items-center gap-1.5 mt-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleLineDecision(item._id!, 'approved')}
                                  title="Approve line item"
                                  className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingItemId(item._id!)}
                                  title="Reject line item"
                                  className="p-1 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Inline line rejection reason form */}
                        {isRejectingThis && (
                          <div className="mt-2.5 p-2 bg-rose-50/60 rounded-lg border border-rose-200 text-xs">
                            <p className="text-[11px] font-medium text-rose-900 mb-1">
                              Reason for rejecting "{item.merchant}":
                            </p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={itemRejectReason}
                                onChange={(e) => setItemRejectReason(e.target.value)}
                                placeholder="e.g. Non-compliant merchant or missing receipt"
                                className="flex-1 px-2 py-1 border border-rose-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleLineDecision(item._id!, 'rejected')}
                                className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingItemId(null);
                                  setItemRejectReason('');
                                }}
                                className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs hover:bg-slate-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Approval Route or Standard 2-Tier Fallback */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  Approval Hierarchy
                </h4>
                {claim.approvalRoute && claim.approvalRoute.length > 0 ? (
                  <div className="space-y-2">
                    {claim.approvalRoute.map((step, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                          step.status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : step.status === 'rejected'
                            ? 'border-rose-200 bg-rose-50/40'
                            : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {step.stepOrder}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-800 capitalize">
                              {step.approverType.replace('_', ' ')} Review
                            </span>
                            {step.comment && (
                              <p className="text-[11px] italic text-slate-600 mt-0.5">
                                "{step.comment}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {step.status === 'approved' && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          )}
                          {step.status === 'rejected' && (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          )}
                          {step.status === 'pending' && (
                            <Clock className="w-4 h-4 text-slate-400" />
                          )}
                          <span className="text-[11px] capitalize font-medium text-slate-600">
                            {step.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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
              {canSendBack && (
                <button
                  type="button"
                  onClick={() => setShowSendBackDialog(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Send Back</span>
                </button>
              )}

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

        {/* Send Back Dialog Modal */}
        {showSendBackDialog && (
          <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-amber-200">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Send Back for Clarification
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Return this claim to draft status so the employee can revise details or attach missing receipts.
              </p>
              <textarea
                rows={3}
                value={sendBackComment}
                onChange={(e) => setSendBackComment(e.target.value)}
                placeholder="Explain what needs to be clarified or updated..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSendBackDialog(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendBack}
                  disabled={!sendBackComment.trim() || sendBackMutation.isPending}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg disabled:opacity-50"
                >
                  {sendBackMutation.isPending ? 'Sending...' : 'Confirm Send Back'}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )}
</AnimatePresence>
);
};
