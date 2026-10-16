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
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../../components/ui/FloatingDropdown';
import { ExpenseStatusPill } from '../../components/expenses/ExpenseStatusPill';
import { CreateClaimModal } from '../../components/expenses/CreateClaimModal';
import { ExpenseClaimDrawer } from '../../components/expenses/ExpenseClaimDrawer';
import {
  useExpenseClaims,
  useSubmitExpenseClaim,
  useCancelExpenseClaim,
  useDeleteExpenseClaim,
  useDepartmentBudgets,
} from '../../hooks/useExpenses';
import { exportExpensesCsv } from '../../lib/expenseApi';
import {
  EXPENSE_STATUSES,
  EXPENSE_STATUS_LABELS,
  type ExpenseClaimStatus,
} from '../../types/expenses';

export const MyExpensesPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useExpenseClaims({
    status: selectedStatus === 'all' ? undefined : selectedStatus,
    search: searchQuery || undefined,
  });

  const { data: budgets = [] } = useDepartmentBudgets();
  const submitMutation = useSubmitExpenseClaim();
  const cancelMutation = useCancelExpenseClaim();
  const deleteMutation = useDeleteExpenseClaim();

  const claims = data?.claims || [];

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
            My Expense Claims
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Create, track, and manage your reimbursable business expenses and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#ECE0D6] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Expense Claim</span>
          </button>
        </div>
      </motion.div>

      {/* ── Filter & Search Toolbar ── */}
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

      {/* ── Claims Data Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
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
              onClick={() => setShowCreateModal(true)}
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
                        {claim.submittedAt
                          ? `Submitted on ${new Date(claim.submittedAt).toLocaleDateString()}`
                          : `Draft created on ${new Date(claim.createdAt).toLocaleDateString()}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{claim.departmentId?.name}</td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {claim.items.length} item{claim.items.length !== 1 ? 's' : ''}
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

      {/* Create Claim Modal */}
      <CreateClaimModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        departments={budgets.map((b) => ({
          _id: b.departmentId?._id,
          name: b.departmentId?.name,
        }))}
      />

      {/* Claim Inspection Drawer */}
      <ExpenseClaimDrawer
        claimId={selectedClaimId}
        onClose={() => setSelectedClaimId(null)}
        onSubmit={(id) => submitMutation.mutate(id)}
        onCancel={(id) => cancelMutation.mutate(id)}
      />
    </div>
  );
};
