import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  Calendar,
  Eye,
  Filter,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../../components/ui/FloatingDropdown';
import { ExpenseStatusPill } from '../../components/expenses/ExpenseStatusPill';
import { ExpenseClaimDrawer } from '../../components/expenses/ExpenseClaimDrawer';
import { ApproveClaimModal } from '../../components/expenses/ApproveClaimModal';
import { RejectClaimModal } from '../../components/expenses/RejectClaimModal';
import { ReimburseClaimModal } from '../../components/expenses/ReimburseClaimModal';
import {
  useApprovalQueue,
  useExpenseClaims,
  useApproveExpenseClaim,
  useRejectExpenseClaim,
  useReimburseExpenseClaim,
} from '../../hooks/useExpenses';
import { useAuth } from '../../contexts/AuthContext';
import type { ExpenseClaim, PaymentMethod } from '../../types/expenses';

export const ExpenseApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Review Modals State
  const [approvingClaim, setApprovingClaim] = useState<ExpenseClaim | null>(null);
  const [rejectingClaim, setRejectingClaim] = useState<ExpenseClaim | null>(null);
  const [reimbursingClaim, setReimbursingClaim] = useState<ExpenseClaim | null>(null);

  const { data: queue = [], isLoading: isQueueLoading } = useApprovalQueue();
  const { data: historyData, isLoading: isHistoryLoading } = useExpenseClaims({
    status: activeTab === 'history' ? undefined : undefined,
  });

  const approveMutation = useApproveExpenseClaim();
  const rejectMutation = useRejectExpenseClaim();
  const reimburseMutation = useReimburseExpenseClaim();

  const isFinanceOrAdmin = ['super_admin', 'admin', 'finance'].includes(user?.role || '');
  const historyClaims = historyData?.claims || [];

  const handleConfirmApprove = async (comments: string) => {
    if (!approvingClaim) return;
    await approveMutation.mutateAsync({ id: approvingClaim._id, comments });
    setApprovingClaim(null);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingClaim) return;
    await rejectMutation.mutateAsync({ id: rejectingClaim._id, reason });
    setRejectingClaim(null);
  };

  const handleConfirmReimburse = async (data: {
    paymentMethod: PaymentMethod;
    transactionReference: string;
  }) => {
    if (!reimbursingClaim) return;
    await reimburseMutation.mutateAsync({
      id: reimbursingClaim._id,
      payload: data,
    });
    setReimbursingClaim(null);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Expense Approvals & Payouts
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Review pending team claims, enforce company spending policies, and authorize reimbursements.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review ({queue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>All Claims History</span>
          </button>
        </div>
      </motion.div>

      {/* ── Content View ── */}
      {activeTab === 'queue' ? (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
          {isQueueLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading approval queue...</div>
          ) : queue.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Review queue is empty!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All submitted employee expense claims have been reviewed and approved. Great work!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Claim #</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Title & Details</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Review Stage</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((claim) => (
                    <tr
                      key={claim._id}
                      className="hover:bg-orange-50/20 transition-colors cursor-pointer group"
                      onClick={() => setSelectedClaimId(claim._id)}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                        {claim.claimNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">
                          {claim.employeeId?.fullName}
                        </span>
                        <span className="text-[11px] text-slate-400">{claim.employeeId?.email}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{claim.departmentId?.name}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block line-clamp-1">
                          {claim.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {claim.items.length} item{claim.items.length !== 1 ? 's' : ''} · Submitted{' '}
                          {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono text-sm">
                        ${claim.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <ExpenseStatusPill status={claim.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedClaimId(claim._id)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectingClaim(claim)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => setApprovingClaim(claim)}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                          >
                            Approve
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Historical View */
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
          {isHistoryLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading claim records...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Claim #</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyClaims.map((claim) => (
                    <tr
                      key={claim._id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedClaimId(claim._id)}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{claim.claimNumber}</td>
                      <td className="py-3 px-4 text-slate-700">{claim.employeeId?.fullName}</td>
                      <td className="py-3 px-4 text-slate-500">{claim.departmentId?.name}</td>
                      <td className="py-3 px-4 font-medium text-slate-800 line-clamp-1">
                        {claim.title}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ${claim.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <ExpenseStatusPill status={claim.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        {claim.status === 'approved' && isFinanceOrAdmin ? (
                          <button
                            onClick={() => setReimbursingClaim(claim)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Reimburse</span>
                          </button>
                        ) : claim.status === 'reimbursed' ? (
                          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Paid Out
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Claim Inspection Drawer */}
      <ExpenseClaimDrawer
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
        onApprove={(id) => {
          const c = queue.find((item) => item._id === id) || historyClaims.find((item) => item._id === id);
          if (c) setApprovingClaim(c);
        }}
        onReject={(id) => {
          const c = queue.find((item) => item._id === id) || historyClaims.find((item) => item._id === id);
          if (c) setRejectingClaim(c);
        }}
        onReimburse={(id) => {
          const c = historyClaims.find((item) => item._id === id);
          if (c) setReimbursingClaim(c);
        }}
      />

      {/* Approve Confirmation Modal */}
      <ApproveClaimModal
        isOpen={Boolean(approvingClaim)}
        onClose={() => setApprovingClaim(null)}
        claimNumber={approvingClaim?.claimNumber}
        onConfirm={handleConfirmApprove}
        isLoading={approveMutation.isPending}
      />

      {/* Reject Confirmation Modal */}
      <RejectClaimModal
        isOpen={Boolean(rejectingClaim)}
        onClose={() => setRejectingClaim(null)}
        claimNumber={rejectingClaim?.claimNumber}
        onConfirm={handleConfirmReject}
        isLoading={rejectMutation.isPending}
      />

      {/* Reimburse Confirmation Modal */}
      <ReimburseClaimModal
        isOpen={Boolean(reimbursingClaim)}
        onClose={() => setReimbursingClaim(null)}
        claimNumber={reimbursingClaim?.claimNumber}
        totalAmount={reimbursingClaim?.totalAmount}
        currency={reimbursingClaim?.currency}
        onConfirm={handleConfirmReimburse}
        isLoading={reimburseMutation.isPending}
      />
    </div>
  );
};
