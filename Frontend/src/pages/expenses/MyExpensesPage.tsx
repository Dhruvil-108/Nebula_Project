import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  Building2,
  DollarSign,
  Send,
  Trash2,
  XCircle,
  Eye,
  Plane,
  Coins,
  CreditCard,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../../components/ui/FloatingDropdown';
import { ExpenseStatusPill } from '../../components/expenses/ExpenseStatusPill';
import { CreateClaimModal } from '../../components/expenses/CreateClaimModal';
import { ExpenseClaimDrawer } from '../../components/expenses/ExpenseClaimDrawer';
import { CreateTravelRequestModal } from '../../components/expenses/CreateTravelRequestModal';
import { CreateCashAdvanceModal } from '../../components/expenses/CreateCashAdvanceModal';
import {
  useExpenseClaims,
  useSubmitExpenseClaim,
  useCancelExpenseClaim,
  useDeleteExpenseClaim,
  useDepartmentBudgets,
  useTravelRequests,
  useCashAdvances,
  useProjects,
} from '../../hooks/useExpenses';
import { exportExpensesCsv } from '../../lib/expenseApi';
import { useAuth } from '../../contexts/AuthContext';
import {
  EXPENSE_STATUSES,
  EXPENSE_STATUS_LABELS,
} from '../../types/expenses';

export const MyExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'claims' | 'travel' | 'advances'>('claims');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Modals state
  const [showCreateClaimModal, setShowCreateClaimModal] = useState(false);
  const [showCreateTravelModal, setShowCreateTravelModal] = useState(false);
  const [showCreateAdvanceModal, setShowCreateAdvanceModal] = useState(false);

  const { data: claimsData, isLoading: isClaimsLoading } = useExpenseClaims({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    search: searchQuery || undefined,
  });

  const { data: budgets = [] } = useDepartmentBudgets();
  const { data: projects = [] } = useProjects();
  const { data: travelRequests = [], isLoading: isTravelLoading } = useTravelRequests();
  const { data: cashAdvances = [], isLoading: isAdvancesLoading } = useCashAdvances();

  const submitMutation = useSubmitExpenseClaim();
  const cancelMutation = useCancelExpenseClaim();
  const deleteMutation = useDeleteExpenseClaim();

  const claims = claimsData?.claims || [];

  // Filter only user's travel requests & cash advances
  const currentUserId = user?.id || user?._id;
  const myTravelRequests = travelRequests.filter((tr) => {
    const claimant = tr.claimantId || tr.employeeId;
    const cid = typeof claimant === 'object' ? claimant?._id : claimant;
    return !cid || cid === currentUserId;
  });
  const myCashAdvances = cashAdvances.filter((adv) => {
    const eid = typeof adv.employeeId === 'object' ? adv.employeeId?._id : adv.employeeId;
    return !eid || eid === currentUserId;
  });

  // Dropdown options for status filter
  const statusFilterOptions: DropdownOption[] = [
    { value: 'all', label: 'All Claim Statuses' },
    ...EXPENSE_STATUSES.map((st) => ({
      value: st,
      label: EXPENSE_STATUS_LABELS[st],
    })),
  ];

  const handleExport = async () => {
    try {
      await exportExpensesCsv({
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      });
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const departmentList = budgets
    .filter((b) => Boolean(b.departmentId))
    .map((b) => ({
      _id: typeof b.departmentId === 'object' ? b.departmentId?._id : b.departmentId,
      name: typeof b.departmentId === 'object' ? b.departmentId?.name : 'Department',
    }));

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
            My Expenses & Travel Hub
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Submit expense claims, request pre-trip travel authorizations, and track active cash advances.
          </p>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'claims' && (
            <>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#ECE0D6] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setShowCreateClaimModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Expense Claim</span>
              </button>
            </>
          )}

          {activeTab === 'travel' && (
            <button
              onClick={() => setShowCreateTravelModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Request Pre-Trip Authorization</span>
            </button>
          )}

          {activeTab === 'advances' && (
            <button
              onClick={() => setShowCreateAdvanceModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Request Cash Advance</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Tab Bar Navigation ── */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'claims'
              ? 'bg-white text-orange-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>My Claims ({claims.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('travel')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'travel'
              ? 'bg-white text-sky-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plane className="w-3.5 h-3.5" />
          <span>Travel Authorizations ({myTravelRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'advances'
              ? 'bg-white text-amber-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          <span>Cash Advances ({myCashAdvances.length})</span>
        </button>
      </div>

      {/* ── Content View 1: Claims ── */}
      {activeTab === 'claims' && (
        <div className="space-y-4">
          {/* Filter & Search Toolbar */}
          <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="w-full md:w-72 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search claim #, title, or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="w-full md:w-64">
              <FloatingDropdown
                options={statusFilterOptions}
                value={selectedStatus}
                onChange={(val) => setSelectedStatus(val)}
                size="sm"
              />
            </div>
          </div>

          {/* Claims Data Table */}
          <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
            {isClaimsLoading ? (
              <div className="p-12 text-center text-sm text-slate-400">Loading expense claims...</div>
            ) : claims.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto text-orange-500">
                  <Receipt className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No expense claims found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You haven't submitted any expense claims matching your search criteria.
                </p>
                <button
                  onClick={() => setShowCreateClaimModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create your first claim</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Claim #</th>
                      <th className="py-3 px-4">Claim Title</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4 text-right">Total Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {claims.map((claim) => (
                      <tr
                        key={claim._id}
                        className="hover:bg-orange-50/20 transition-colors cursor-pointer group"
                        onClick={() => setSelectedClaimId(claim._id)}
                      >
                        <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                          {claim.claimNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 block line-clamp-1">
                            {claim.title}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Submitted {claim.submittedAt ? new Date(claim.submittedAt).toLocaleDateString() : 'Draft'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {claim.departmentId?.name || 'Unassigned'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{claim.items.length}</td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                          {claim.currency} ${claim.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <ExpenseStatusPill status={claim.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedClaimId(claim._id)}
                              className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {['draft', 'rejected'].includes(claim.status) && (
                              <button
                                onClick={() => submitMutation.mutate(claim._id)}
                                disabled={submitMutation.isPending}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                                title="Submit for Approval"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                            )}

                            {claim.status === 'draft' && (
                              <button
                                onClick={() => deleteMutation.mutate(claim._id)}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Delete Draft"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}

                            {['submitted', 'manager_approved'].includes(claim.status) && (
                              <button
                                onClick={() => cancelMutation.mutate(claim._id)}
                                disabled={cancelMutation.isPending}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Cancel Claim"
                              >
                                <XCircle className="w-4 h-4" />
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

      {/* ── Content View 2: Travel Authorizations ── */}
      {activeTab === 'travel' && (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
          {isTravelLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading travel requests...</div>
          ) : myTravelRequests.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Travel Authorizations Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Planning an upcoming business trip? Submit a pre-trip request to authorize flight, hotel, and meal budgets in advance.
              </p>
              <button
                onClick={() => setShowCreateTravelModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Travel Authorization</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Request #</th>
                    <th className="py-3 px-4">Destination</th>
                    <th className="py-3 px-4">Dates</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4 text-right">Estimated Budget</th>
                    <th className="py-3 px-4 text-right">Actual Spent</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myTravelRequests.map((tr) => (
                    <tr key={tr._id} className="hover:bg-sky-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {tr.requestNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {tr.destination}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {tr.departureDate || tr.startDate
                          ? `${new Date(tr.departureDate || tr.startDate || '').toLocaleDateString()} — ${new Date(tr.returnDate || tr.endDate || '').toLocaleDateString()}`
                          : 'Flexible'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {tr.purpose}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ${(tr.estimatedTotalCost || tr.totalEstimated || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-700 font-mono">
                        ${(tr.actualTotalCost || tr.spentAmount || 0).toFixed(2)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Content View 3: Cash Advances ── */}
      {activeTab === 'advances' && (
        <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
          {isAdvancesLoading ? (
            <div className="p-12 text-center text-sm text-slate-400">Loading cash advances...</div>
          ) : myCashAdvances.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                <Coins className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Cash Advances on Record</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Need upfront operational funding for an on-site assignment? Request a cash advance with net-pay claim offset.
              </p>
              <button
                onClick={() => setShowCreateAdvanceModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Request Cash Advance</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Advance #</th>
                    <th className="py-3 px-4">Purpose</th>
                    <th className="py-3 px-4">Required Date</th>
                    <th className="py-3 px-4 text-right">Original Amount</th>
                    <th className="py-3 px-4 text-right">Settled Amount</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myCashAdvances.map((adv) => (
                    <tr key={adv._id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {adv.advanceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {adv.purpose}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {adv.requiredByDate ? new Date(adv.requiredByDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        ${(adv.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-amber-700 font-mono">
                        ${(adv.settledAmount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700 font-mono">
                        ${(adv.balanceAmount !== undefined ? adv.balanceAmount : (adv.remainingBalance || 0)).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            adv.status === 'settled'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : adv.status === 'disbursed' || adv.status === 'partially_settled'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : adv.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {adv.status?.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals & Drawers ── */}
      <CreateClaimModal
        isOpen={showCreateClaimModal}
        onClose={() => setShowCreateClaimModal(false)}
        departments={departmentList}
      />

      <CreateTravelRequestModal
        isOpen={showCreateTravelModal}
        onClose={() => setShowCreateTravelModal(false)}
        departments={departmentList}
        projects={projects}
      />

      <CreateCashAdvanceModal
        isOpen={showCreateAdvanceModal}
        onClose={() => setShowCreateAdvanceModal(false)}
        departments={departmentList}
      />

      <ExpenseClaimDrawer
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
        onSubmit={(id) => submitMutation.mutate(id)}
        onCancel={(id) => cancelMutation.mutate(id)}
      />
    </div>
  );
};
