import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Receipt,
  DollarSign,
  Clock,
  CheckCircle2,
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  Download,
  Plus,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Building2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  useExpenseSummary,
  useDepartmentBudgets,
} from '../../hooks/useExpenses';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { ExpenseStatusPill } from '../../components/expenses/ExpenseStatusPill';
import { CreateClaimModal } from '../../components/expenses/CreateClaimModal';
import { ExpenseClaimDrawer } from '../../components/expenses/ExpenseClaimDrawer';
import { BudgetProgressBar } from '../../components/expenses/BudgetProgressBar';
import { exportExpensesCsv } from '../../lib/expenseApi';

export const ExpensesOverviewPage: React.FC = () => {
  const { can } = useModuleAccess('expenses');
  const canCreate = can('create');

  const { data: summary, isLoading } = useExpenseSummary();
  const { data: budgets = [] } = useDepartmentBudgets();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  const metrics = summary?.metrics || {
    totalClaimed: 0,
    totalApproved: 0,
    totalPending: 0,
    totalReimbursed: 0,
    pendingCount: 0,
    overallBudgetUsedPercent: 0,
    totalBudgetAllocated: 0,
  };

  const monthlyTrend = summary?.monthlyTrend || [];
  const categoryBreakdown = summary?.categoryBreakdown || [];
  const recentClaims = summary?.recentClaims || [];

  const handleExportCsv = async () => {
    try {
      await exportExpensesCsv();
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/70 border border-orange-200/60 text-orange-700 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-orange-500" />
              Financial Controls & Reimbursements
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Expense Management Hub
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Track claims, policy enforcement, multi-tier approvals, and departmental budgets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#ECE0D6] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          {canCreate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Claim</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* ── KPI Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Claimed */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Total Claimed</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/50">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            ${isLoading ? '...' : metrics.totalClaimed.toLocaleString()}
          </p>
          <Link
            to="/dashboard/expenses/my-claims"
            className="text-[11px] font-semibold text-[#f97316] hover:underline inline-flex items-center gap-1 pt-1"
          >
            View all claims <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Pending Review */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Pending Approval</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/50">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            ${isLoading ? '...' : metrics.totalPending.toLocaleString()}
          </p>
          <Link
            to="/dashboard/expenses/approvals"
            className="text-[11px] font-semibold text-amber-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            {metrics.pendingCount} in queue <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Approved (Unpaid) */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Approved (Unpaid)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/50">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            ${isLoading ? '...' : metrics.totalApproved.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">Ready for disbursement</span>
        </div>

        {/* Reimbursed */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Reimbursed</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/50">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            ${isLoading ? '...' : metrics.totalReimbursed.toLocaleString()}
          </p>
          <span className="text-[11px] text-teal-600 block pt-1 font-medium">Fully paid out</span>
        </div>

        {/* Overall Budget Utilization */}
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-2 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Budget Consumed</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/50">
              <PieChartIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            {isLoading ? '...' : `${metrics.overallBudgetUsedPercent}%`}
          </p>
          <Link
            to="/dashboard/expenses/budgets"
            className="text-[11px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1 pt-1"
          >
            Manage budgets <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── Visual Analytics Section: Trends & Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Spend Trend Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Monthly Spend Trends</h3>
              <p className="text-xs text-[#64748b]">
                Historical 6-month claim volume versus approved and reimbursed payouts
              </p>
            </div>
            <span className="text-xs font-semibold text-[#f97316] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200/60">
              Last 6 Months
            </span>
          </div>

          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${val.toLocaleString()}`, '']}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#ECE0D6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="total" name="Claimed ($)" fill="#fed7aa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="approved" name="Approved ($)" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reimbursed" name="Reimbursed ($)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#111827]">Spend by Category</h3>
              <Link
                to="/dashboard/expenses/categories"
                className="text-xs font-semibold text-[#f97316] hover:underline"
              >
                Policies
              </Link>
            </div>
            <p className="text-xs text-[#64748b]">Top spending categories across the organization</p>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#f97316'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`$${val.toLocaleString()}`, 'Amount']}
                  contentStyle={{
                    borderRadius: '12px',
                    borderColor: '#ECE0D6',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 max-h-[110px] overflow-y-auto">
            {categoryBreakdown.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium text-slate-700">{cat.name}</span>
                </div>
                <span className="font-bold text-slate-900">${cat.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Department Budgets Snapshot & Recent Claims ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Budgets Quick View */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Department Budgets</h3>
              <p className="text-xs text-[#64748b]">Real-time consumption progress</p>
            </div>
            <Link
              to="/dashboard/expenses/budgets"
              className="text-xs font-semibold text-[#f97316] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-4 pt-1">
            {budgets.slice(0, 4).map((b) => (
              <div key={b._id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {b.departmentId?.name}
                  </span>
                  {b.isOverBudget && (
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                      Exceeded
                    </span>
                  )}
                  {b.isAlert && !b.isOverBudget && (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Warning
                    </span>
                  )}
                </div>
                <BudgetProgressBar
                  spent={b.spentAmount}
                  allocated={b.allocatedAmount}
                  pending={b.pendingAmount}
                  currency={b.currency}
                  alertThreshold={b.alertThresholdPercent}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Claims Table */}
        <div className="lg:col-span-7 p-6 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111827]">Recent Expense Claims</h3>
              <p className="text-xs text-[#64748b]">Latest reports submitted by employees</p>
            </div>
            <Link
              to="/dashboard/expenses/my-claims"
              className="text-xs font-semibold text-[#f97316] hover:underline"
            >
              Full list
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Claim</th>
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentClaims.map((claim) => (
                  <tr
                    key={claim._id}
                    className="hover:bg-orange-50/20 transition-colors cursor-pointer group"
                    onClick={() => setSelectedClaimId(claim._id)}
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {claim.claimNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{claim.employeeId?.fullName}</td>
                    <td className="py-2.5 px-3 text-slate-500">{claim.departmentId?.name}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                      ${claim.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <ExpenseStatusPill status={claim.status} size="sm" />
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClaimId(claim._id);
                        }}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
      />
    </div>
  );
};
