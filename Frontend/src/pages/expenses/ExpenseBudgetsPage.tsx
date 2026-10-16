import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PieChart,
  Plus,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../../components/ui/FloatingDropdown';
import { BudgetProgressBar } from '../../components/expenses/BudgetProgressBar';
import {
  useDepartmentBudgets,
  useSaveDepartmentBudget,
  useDeleteDepartmentBudget,
} from '../../hooks/useExpenses';
import type { DepartmentBudget } from '../../types/expenses';

export const ExpenseBudgetsPage: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<DepartmentBudget | null>(null);

  const { data: budgets = [], isLoading } = useDepartmentBudgets({
    fiscalYear: selectedYear,
  });

  const saveMutation = useSaveDepartmentBudget();
  const deleteMutation = useDeleteDepartmentBudget();

  // Form states for allocation modal
  const [departmentId, setDepartmentId] = useState('');
  const [allocatedAmount, setAllocatedAmount] = useState('');
  const [alertThreshold, setAlertThreshold] = useState('80');
  const [period, setPeriod] = useState<'annual' | 'q1' | 'q2' | 'q3' | 'q4' | 'monthly'>('annual');
  const [notes, setNotes] = useState('');

  // Aggregates
  const totalAllocated = budgets.reduce((sum, b) => sum + (b.allocatedAmount || 0), 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  const totalPending = budgets.reduce((sum, b) => sum + (b.pendingAmount || 0), 0);
  const overallUsedPercent = totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0;

  const handleOpenAllocate = (budget?: DepartmentBudget) => {
    if (budget) {
      setEditingBudget(budget);
      setDepartmentId(budget.departmentId?._id || '');
      setAllocatedAmount(budget.allocatedAmount.toString());
      setAlertThreshold((budget.alertThresholdPercent || 80).toString());
      setPeriod(budget.period || 'annual');
      setNotes(budget.notes || '');
    } else {
      setEditingBudget(null);
      setDepartmentId(budgets[0]?.departmentId?._id || '');
      setAllocatedAmount('');
      setAlertThreshold('80');
      setPeriod('annual');
      setNotes('');
    }
    setShowAllocateModal(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentId || !allocatedAmount) return;

    await saveMutation.mutateAsync({
      departmentId,
      fiscalYear: selectedYear,
      period,
      allocatedAmount: parseFloat(allocatedAmount) || 0,
      alertThresholdPercent: parseInt(alertThreshold, 10) || 80,
      notes: notes.trim(),
    });

    setShowAllocateModal(false);
  };

  // Department options for FloatingDropdown
  const departmentOptions: DropdownOption[] = budgets.map((b) => ({
    value: b.departmentId?._id,
    label: b.departmentId?.name,
    icon: <Building2 className="w-4 h-4 text-slate-400" />,
  }));

  const periodOptions: DropdownOption<'annual' | 'q1' | 'q2' | 'q3' | 'q4' | 'monthly'>[] = [
    { value: 'annual', label: 'Annual (Full Year)' },
    { value: 'q1', label: 'Q1 (Jan - Mar)' },
    { value: 'q2', label: 'Q2 (Apr - Jun)' },
    { value: 'q3', label: 'Q3 (Jul - Sep)' },
    { value: 'q4', label: 'Q4 (Oct - Dec)' },
  ];

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
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Departmental Budgets
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Allocate spending ceilings and safeguard financial health with automated threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleOpenAllocate()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Allocate Budget</span>
          </button>
        </div>
      </motion.div>

      {/* ── High-Level Budget Health Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-[#64748b]">Total Allocated Budget</span>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            ${totalAllocated.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">
            Fiscal Year {selectedYear} · {budgets.length} departments
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-[#64748b]">Actual Spend (Approved)</span>
          <p className="text-2xl font-extrabold text-emerald-600 font-mono">
            ${totalSpent.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-700 block pt-1">
            {overallUsedPercent}% of total ceiling consumed
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-[#64748b]">Pending in Review</span>
          <p className="text-2xl font-extrabold text-amber-600 font-mono">
            ${totalPending.toLocaleString()}
          </p>
          <span className="text-[11px] text-amber-700 block pt-1">Awaiting approval actions</span>
        </div>

        <div className="p-4 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-[#64748b]">Remaining Liquidity</span>
          <p className="text-2xl font-extrabold text-[#111827] font-mono">
            ${Math.max(0, totalAllocated - totalSpent).toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">Available for allocation</span>
        </div>
      </div>

      {/* ── Department Budget Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-sm text-slate-400">
            Loading departmental budgets...
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-2 p-12 text-center space-y-3 bg-white rounded-2xl border border-[#ECE0D6]">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No departmental budgets found</h3>
            <p className="text-xs text-slate-500">
              Set up your first department budget to begin tracking spending limits.
            </p>
            <button
              onClick={() => handleOpenAllocate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Allocate Budget</span>
            </button>
          </div>
        ) : (
          budgets.map((b) => (
            <motion.div
              key={b._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs space-y-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {b.departmentId?.name}
                    </h3>
                    {b.isOverBudget && (
                      <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Over Budget
                      </span>
                    )}
                    {b.isAlert && !b.isOverBudget && (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Warning ({b.percentUsed}%)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {b.departmentId?.description || 'Department Spending Pool'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenAllocate(b)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Edit allocation"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(b._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete allocation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <BudgetProgressBar
                spent={b.spentAmount}
                allocated={b.allocatedAmount}
                pending={b.pendingAmount}
                currency={b.currency}
                alertThreshold={b.alertThresholdPercent}
              />

              {/* 3 Metric Mini Cards */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Spent</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${b.spentAmount.toFixed(0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Pending</span>
                  <span className="font-semibold text-amber-600 font-mono">
                    ${b.pendingAmount.toFixed(0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-medium">Remaining</span>
                  <span className="font-bold text-slate-900 font-mono">
                    ${b.remainingAmount.toFixed(0)}
                  </span>
                </div>
              </div>

              {b.notes && (
                <p className="text-xs text-slate-500 italic bg-orange-50/30 p-2.5 rounded-lg border border-orange-100">
                  "{b.notes}"
                </p>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* ── Allocate Budget Modal ── */}
      <AnimatePresence>
        {showAllocateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowAllocateModal(false)}
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] overflow-hidden z-10"
            >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-orange-50/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {editingBudget ? 'Edit Department Budget' : 'Allocate Department Budget'}
                  </h3>
                  <p className="text-xs text-slate-500">Fiscal Year {selectedYear}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="p-6 space-y-4">
              <div>
                <FloatingDropdown
                  label="Department"
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  size="md"
                />
              </div>

              <div>
                <FloatingDropdown<'annual' | 'q1' | 'q2' | 'q3' | 'q4' | 'monthly'>
                  label="Fiscal Period"
                  options={periodOptions}
                  value={period}
                  onChange={(val) => setPeriod(val)}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Allocated Budget Amount ($) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="e.g. 50000"
                  value={allocatedAmount}
                  onChange={(e) => setAllocatedAmount(e.target.value)}
                  className="w-full h-9 px-3 text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alert Warning Threshold (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={alertThreshold}
                  onChange={(e) => setAlertThreshold(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Triggers an amber alert indicator when spending reaches this percent.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Budget Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes allocated training allowances and SaaS tools"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending || !departmentId || !allocatedAmount}
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Budget'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
};
