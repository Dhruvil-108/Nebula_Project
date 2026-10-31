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
  Plane,
  PackageCheck,
  Plus,
  Download,
  Check,
  X,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../../components/ui/FloatingDropdown';
import { ExpenseStatusPill } from '../../components/expenses/ExpenseStatusPill';
import { ExpenseClaimDrawer } from '../../components/expenses/ExpenseClaimDrawer';
import { ApproveClaimModal } from '../../components/expenses/ApproveClaimModal';
import { RejectClaimModal } from '../../components/expenses/RejectClaimModal';
import { ReimburseClaimModal } from '../../components/expenses/ReimburseClaimModal';
import { CreatePaymentBatchModal } from '../../components/expenses/CreatePaymentBatchModal';
import {
  useApprovalQueue,
  useExpenseClaims,
  useApproveExpenseClaim,
  useRejectExpenseClaim,
  useReimburseExpenseClaim,
  useTravelRequests,
  useApproveTravelRequest,
  useRejectTravelRequest,
  usePaymentBatches,
  useExecutePaymentBatch,
} from '../../hooks/useExpenses';
import { exportBankPaymentCsv, exportGlJournalCsv } from '../../lib/expenseApi';
import { useAuth } from '../../contexts/AuthContext';
import type { ExpenseClaim, PaymentMethod, TravelRequest, PaymentBatch } from '../../types/expenses';

export const ExpenseApprovalsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'queue' | 'travel' | 'batches' | 'history'>('queue');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Review Modals State
  const [approvingClaim, setApprovingClaim] = useState<ExpenseClaim | null>(null);
  const [rejectingClaim, setRejectingClaim] = useState<ExpenseClaim | null>(null);
  const [reimbursingClaim, setReimbursingClaim] = useState<ExpenseClaim | null>(null);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);

  // Travel rejection modal state
  const [rejectingTravelId, setRejectingTravelId] = useState<string | null>(null);
  const [travelRejectReason, setTravelRejectReason] = useState('');

  const { data: queue = [], isLoading: isQueueLoading } = useApprovalQueue();
  const { data: historyData, isLoading: isHistoryLoading } = useExpenseClaims();
  const { data: travelRequests = [], isLoading: isTravelLoading } = useTravelRequests();
  const { data: batches = [], isLoading: isBatchesLoading } = usePaymentBatches();

  const approveClaimMutation = useApproveExpenseClaim();
  const rejectClaimMutation = useRejectExpenseClaim();
  const reimburseClaimMutation = useReimburseExpenseClaim();

  const approveTravelMutation = useApproveTravelRequest();
  const rejectTravelMutation = useRejectTravelRequest();
  const executeBatchMutation = useExecutePaymentBatch();

  const isFinanceOrAdmin = ['super_admin', 'admin', 'finance'].includes(user?.role || '');
  const historyClaims = historyData?.claims || [];

  const handleConfirmApprove = async (comments: string) => {
    if (!approvingClaim) return;
    await approveClaimMutation.mutateAsync({ id: approvingClaim._id, comments });
    setApprovingClaim(null);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectingClaim) return;
    await rejectClaimMutation.mutateAsync({ id: rejectingClaim._id, reason });
    setRejectingClaim(null);
  };

  const handleConfirmReimburse = async (data: {
    paymentMethod: PaymentMethod;
    transactionReference: string;
  }) => {
    if (!reimbursingClaim) return;
    await reimburseClaimMutation.mutateAsync({
      id: reimbursingClaim._id,
      payload: data,
    });
    setReimbursingClaim(null);
  };

  const handleApproveTravel = async (tr: TravelRequest) => {
    const claimant = tr.claimantId || tr.employeeId;
    const claimantUserId = typeof claimant === 'object' ? claimant?._id : claimant;
    if (claimantUserId === (user?.id || user?._id)) {
      alert('Anti-Self-Approval: You cannot approve your own travel request.');
      return;
    }
    await approveTravelMutation.mutateAsync({ id: tr._id });
  };

  const handleRejectTravel = async () => {
    if (!rejectingTravelId || !travelRejectReason.trim()) return;
    await rejectTravelMutation.mutateAsync({
      id: rejectingTravelId,
      reason: travelRejectReason.trim(),
    });
    setRejectingTravelId(null);
    setTravelRejectReason('');
  };

  const handleExecuteBatch = async (batchId: string) => {
    if (confirm('Are you sure you want to execute reimbursement for all claims in this batch? This will mark claims as reimbursed.')) {
      await executeBatchMutation.mutateAsync({ id: batchId });
    }
  };

  const handleDownloadBankCsv = async (batchId: string) => {
    try {
      await exportBankPaymentCsv(batchId);
    } catch (err) {
      alert('Failed to export bank CSV.');
    }
  };

  const handleDownloadGlCsv = async (batchId: string) => {
    try {
      await exportGlJournalCsv(batchId);
    } catch (err) {
      alert('Failed to export GL Journal CSV.');
    }
  };

  const pendingTravelCount = travelRequests.filter((t) => t.status === 'submitted').length;

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
            Review pending claims, authorize pre-trip travel, and process bulk ERP payment batches.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Claims ({queue.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('travel')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'travel'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Pre-Trip Authorizations ({pendingTravelCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'batches'
                ? 'bg-white text-orange-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Payment Batches & GL ({batches.length})</span>
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

      {/* ── Content Views ── */}

      {/* 1. Pending Claims Queue */}
      {activeTab === 'queue' && (
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
                        <div className="font-semibold text-slate-800">
                          {claim.employeeId?.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400">{claim.employeeId?.email}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{claim.departmentId?.name}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">{claim.title}</div>
                        <div className="text-[11px] text-slate-400">
                          {claim.items.length} items · {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : 'Draft'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ${claim.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <ExpenseStatusPill status={claim.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedClaimId(claim._id)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setApprovingClaim(claim)}
                            className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingClaim(claim)}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                          >
                            Reject
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
      )}

      {/* 2. Pre-Trip Travel Requests */}
      {activeTab === 'travel' && (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
          {isTravelLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading travel authorizations...</div>
          ) : travelRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Travel Authorizations</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No employees have currently submitted pre-trip travel requests.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Travel Dates</th>
                    <th className="py-3 px-4 text-right">Estimated Cost</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {travelRequests.map((tr) => {
                    const claimant = tr.claimantId || tr.employeeId;
                    const claimantUserId = typeof claimant === 'object' ? claimant?._id : claimant;
                    const claimantFullName = typeof claimant === 'object' ? claimant?.fullName : 'Employee';
                    const isSelf = claimantUserId === (user?.id || user?._id);
                    const deptName = typeof tr.departmentId === 'object' ? tr.departmentId?.name : (tr.departmentId || 'General');
                    const start = tr.departureDate || tr.startDate;
                    const end = tr.returnDate || tr.endDate;
                    const dateStr = start && end ? `${new Date(start).toLocaleDateString()} — ${new Date(end).toLocaleDateString()}` : 'Flexible';
                    const budget = tr.estimatedTotalCost || tr.totalEstimated || 0;
                    return (
                      <tr key={tr._id} className="hover:bg-sky-50/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {tr.requestNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {claimantFullName}
                          </div>
                          <div className="text-[11px] text-slate-400">{deptName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{tr.destination}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{tr.purpose}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {dateStr}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                          ${budget.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              tr.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : tr.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {tr.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tr.status === 'submitted' ? (
                            isSelf ? (
                              <span className="text-[11px] text-slate-400 italic">
                                Self-request (Cannot approve)
                              </span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleApproveTravel(tr)}
                                  disabled={approveTravelMutation.isPending}
                                  className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setRejectingTravelId(tr._id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Payment Batches & ERP Integration */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                ERP Settlement & Payment Batches
              </h2>
              <p className="text-xs text-slate-500">
                Execute approved employee claims in bulk and generate bank payment & balanced GL journals
              </p>
            </div>

            {isFinanceOrAdmin && (
              <button
                onClick={() => setShowCreateBatchModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Settlement Batch</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
            {isBatchesLoading ? (
              <div className="p-12 text-center text-sm text-slate-400">Loading payment batches...</div>
            ) : batches.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mx-auto text-purple-600">
                  <PackageCheck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No Payment Batches Created</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "+ Create New Settlement Batch" to group approved claims and export ERP files.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Batch #</th>
                      <th className="py-3 px-4">Title / Description</th>
                      <th className="py-3 px-4">Created Date</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4 text-center">Claims Count</th>
                      <th className="py-3 px-4 text-right">Net Payable Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">ERP Exports & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => (
                      <tr key={batch._id} className="hover:bg-purple-50/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                          {batch.batchNumber}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {batch.title || batch.name || 'Settlement Batch'}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(batch.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {batch.paymentMethod?.replace('_', ' ').toUpperCase()}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {batch.claimsCount || batch.claims?.length || (Array.isArray(batch.claimIds) ? batch.claimIds.length : 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-extrabold text-slate-900 font-mono">
                          ${(batch.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              batch.status === 'completed' || batch.status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {batch.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Bank CSV Download */}
                            <button
                              onClick={() => handleDownloadBankCsv(batch._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
                              title="Download Corporate Bank Payment CSV"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-500" />
                              <span>Bank CSV</span>
                            </button>

                            {/* GL Journal CSV Download */}
                            <button
                              onClick={() => handleDownloadGlCsv(batch._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg shadow-2xs transition-colors"
                              title="Download Balanced Double-Entry GL Journal CSV (QuickBooks/NetSuite)"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                              <span>GL Journal</span>
                            </button>

                            {/* Execute Payout if not completed */}
                            {batch.status !== 'completed' && batch.status !== 'paid' && isFinanceOrAdmin && (
                              <button
                                onClick={() => handleExecuteBatch(batch._id)}
                                disabled={executeBatchMutation.isPending}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Execute</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Claims History */}
      {activeTab === 'history' && (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
          {isHistoryLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading claim history...</div>
          ) : historyClaims.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">No claims recorded yet.</div>
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
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historyClaims.map((claim) => (
                    <tr
                      key={claim._id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedClaimId(claim._id)}
                    >
                      <td className="py-3 px-4 font-bold text-slate-900">{claim.claimNumber}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {claim.employeeId?.fullName}
                      </td>
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
        isLoading={approveClaimMutation.isPending}
      />

      {/* Reject Confirmation Modal */}
      <RejectClaimModal
        isOpen={Boolean(rejectingClaim)}
        onClose={() => setRejectingClaim(null)}
        claimNumber={rejectingClaim?.claimNumber}
        onConfirm={handleConfirmReject}
        isLoading={rejectClaimMutation.isPending}
      />

      {/* Reimburse Confirmation Modal */}
      <ReimburseClaimModal
        isOpen={Boolean(reimbursingClaim)}
        onClose={() => setReimbursingClaim(null)}
        claimNumber={reimbursingClaim?.claimNumber}
        totalAmount={reimbursingClaim?.totalAmount}
        currency={reimbursingClaim?.currency}
        onConfirm={handleConfirmReimburse}
        isLoading={reimburseClaimMutation.isPending}
      />

      {/* Create Payment Batch Modal */}
      <CreatePaymentBatchModal
        isOpen={showCreateBatchModal}
        onClose={() => setShowCreateBatchModal(false)}
      />

      {/* Travel Reject Dialog */}
      {rejectingTravelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Reject Pre-Trip Request</h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason for rejecting this travel authorization:
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Virtual meeting preferred, budget allocation exceeded for Q4"
              value={travelRejectReason}
              onChange={(e) => setTravelRejectReason(e.target.value)}
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-900"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setRejectingTravelId(null);
                  setTravelRejectReason('');
                }}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectTravel}
                disabled={rejectTravelMutation.isPending || !travelRejectReason.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
