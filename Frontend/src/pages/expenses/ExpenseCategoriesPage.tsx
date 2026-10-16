import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags,
  Plus,
  ShieldCheck,
  Receipt,
  Edit2,
  Trash2,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  useExpenseCategories,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '../../hooks/useExpenses';
import type { ExpenseCategory, CategoryPayload } from '../../types/expenses';

const PRESET_COLORS = [
  '#f97316', // Orange
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#eab308', // Amber
];

export const ExpenseCategoriesPage: React.FC = () => {
  const { data: categories = [], isLoading } = useExpenseCategories();
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();

  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [glCode, setGlCode] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [maxClaimLimit, setMaxClaimLimit] = useState('');
  const [isReceiptMandatory, setIsReceiptMandatory] = useState(true);
  const [receiptThreshold, setReceiptThreshold] = useState('25');
  const [description, setDescription] = useState('');

  const handleOpenModal = (cat?: ExpenseCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setCode(cat.code);
      setGlCode(cat.glCode || '');
      setColor(cat.color || PRESET_COLORS[0]);
      setMaxClaimLimit(cat.maxClaimLimit ? cat.maxClaimLimit.toString() : '');
      setIsReceiptMandatory(cat.isReceiptMandatory);
      setReceiptThreshold((cat.receiptThresholdAmount || 25).toString());
      setDescription(cat.description || '');
    } else {
      setEditingCategory(null);
      setName('');
      setCode('');
      setGlCode('');
      setColor(PRESET_COLORS[0]);
      setMaxClaimLimit('');
      setIsReceiptMandatory(true);
      setReceiptThreshold('25');
      setDescription('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;

    const payload: CategoryPayload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      glCode: glCode.trim(),
      color,
      maxClaimLimit: parseFloat(maxClaimLimit) || 0,
      isReceiptMandatory,
      receiptThresholdAmount: parseFloat(receiptThreshold) || 0,
      description: description.trim(),
    };

    if (editingCategory) {
      await updateMutation.mutateAsync({
        id: editingCategory._id,
        payload,
      });
    } else {
      await createMutation.mutateAsync(payload);
    }

    setShowModal(false);
  };

  const handleToggleActive = async (cat: ExpenseCategory) => {
    await updateMutation.mutateAsync({
      id: cat._id,
      payload: { isActive: !cat.isActive },
    });
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
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Expense Categories & Spending Policies
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Configure General Ledger (GL) account codes, receipt mandatory rules, and per-claim thresholds.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </motion.div>

      {/* ── Policy Guidance Banner ── */}
      <div className="p-4 rounded-2xl border border-orange-200/80 bg-orange-50/40 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900 block mb-0.5">Automated Policy Enforcement</span>
          Categories marked with <span className="font-semibold text-orange-700">Receipt Mandatory</span> will automatically prompt employees for a receipt attachment whenever the item amount exceeds the defined threshold. General Ledger (GL) codes are synchronized into CSV exports for bookkeeping.
        </div>
      </div>

      {/* ── Categories Table ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-400">Loading categories...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Category Code</th>
                  <th className="py-3 px-4">GL Account</th>
                  <th className="py-3 px-4">Receipt Policy</th>
                  <th className="py-3 px-4 text-right">Max Limit</th>
                  <th className="py-3 px-4 text-center">Claims Used</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{cat.name}</span>
                          {cat.description && (
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {cat.code}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {cat.glCode || '—'}
                    </td>
                    <td className="py-3 px-4">
                      {cat.isReceiptMandatory ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mandatory &gt; ${cat.receiptThresholdAmount}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Optional</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                      {cat.maxClaimLimit && cat.maxClaimLimit > 0
                        ? `$${cat.maxClaimLimit}`
                        : 'Unlimited'}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      {cat.claimCount || 0}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(cat)}
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-colors ${
                          cat.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(cat)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(cat._id)}
                          disabled={Boolean(cat.claimCount && cat.claimCount > 0)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            cat.claimCount && cat.claimCount > 0
                              ? 'Cannot delete category with associated claims'
                              : 'Delete category'
                          }
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* ── Category Modal ── */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowModal(false)}
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] overflow-hidden z-10"
            >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-orange-50/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                  <Tags className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {editingCategory ? 'Edit Expense Category' : 'Create Expense Category'}
                  </h3>
                  <p className="text-xs text-slate-500">Configure category policies and GL codes</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Travel & Lodging"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CAT-TRAVEL"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full h-9 px-3 text-xs font-mono uppercase bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GL Account Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GL-60100"
                    value={glCode}
                    onChange={(e) => setGlCode(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Max Per-Item Limit ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = Unlimited"
                    value={maxClaimLimit}
                    onChange={(e) => setMaxClaimLimit(e.target.value)}
                    className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Color Swatch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Tag Color
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                        color === c ? 'scale-115 ring-2 ring-orange-500 ring-offset-2' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Receipt Mandatory Policy */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Receipt Mandatory Policy
                  </span>
                  <input
                    type="checkbox"
                    checked={isReceiptMandatory}
                    onChange={(e) => setIsReceiptMandatory(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                </div>

                {isReceiptMandatory && (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      Receipt required for transactions greater than ($):
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={receiptThreshold}
                      onChange={(e) => setReceiptThreshold(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-mono"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Employee Guidance
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes flights, cabs, trains, and hotel accommodations..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending || !name.trim() || !code.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Category'}
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
