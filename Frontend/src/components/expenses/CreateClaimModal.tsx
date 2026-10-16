import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Receipt,
  DollarSign,
  Calendar,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../ui/FloatingDropdown';
import { AiReceiptScanModal } from './AiReceiptScanModal';
import { useCreateExpenseClaim, useExpenseCategories } from '../../hooks/useExpenses';
import type { ExpenseCategory } from '../../types/expenses';

interface DepartmentOption {
  _id: string;
  name: string;
}

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: DepartmentOption[];
}

interface ClaimFormItem {
  id: string;
  categoryId: string;
  expenseDate: string;
  merchant: string;
  description: string;
  amount: string;
  taxAmount: string;
  isBillableToClient: boolean;
  clientName: string;
  receiptUrl?: string;
  receiptFileName?: string;
}

export const CreateClaimModal: React.FC<CreateClaimModalProps> = ({
  isOpen,
  onClose,
  departments,
}) => {
  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?._id || '');
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [isAiScanOpen, setIsAiScanOpen] = useState(false);

  const { data: categories = [] } = useExpenseCategories(true);
  const createMutation = useCreateExpenseClaim();

  const [items, setItems] = useState<ClaimFormItem[]>([
    {
      id: 'item-1',
      categoryId: categories[0]?._id || '',
      expenseDate: new Date().toISOString().split('T')[0],
      merchant: '',
      description: '',
      amount: '',
      taxAmount: '',
      isBillableToClient: false,
      clientName: '',
    },
  ]);

  // Department Dropdown Options
  const departmentOptions: DropdownOption[] = departments.map((d) => ({
    value: d._id,
    label: d.name,
    icon: <Building2 className="w-4 h-4 text-slate-400" />,
  }));

  // Category Dropdown Options
  const categoryOptions: DropdownOption[] = categories.map((c) => ({
    value: c._id,
    label: c.name,
    sublabel: c.glCode ? `GL: ${c.glCode}` : undefined,
    dotColor: c.color,
  }));

  // Currency Options
  const currencyOptions: DropdownOption[] = [
    { value: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
    { value: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
    { value: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
    { value: 'INR', label: 'INR (₹)', sublabel: 'Indian Rupee' },
  ];

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        categoryId: categories[0]?._id || '',
        expenseDate: new Date().toISOString().split('T')[0],
        merchant: '',
        description: '',
        amount: '',
        taxAmount: '',
        isBillableToClient: false,
        clientName: '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof ClaimFormItem, value: any) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  // Calculations
  const totalAmount = items.reduce(
    (sum, i) => sum + (parseFloat(i.amount) || 0),
    0
  );
  const totalTax = items.reduce(
    (sum, i) => sum + (parseFloat(i.taxAmount) || 0),
    0
  );

  const handleSubmit = async (submitNow: boolean) => {
    if (!title.trim()) return;

    const formattedItems = items
      .filter((i) => (parseFloat(i.amount) || 0) > 0)
      .map((i) => ({
        categoryId: i.categoryId || categories[0]?._id || '',
        expenseDate: i.expenseDate || new Date().toISOString().split('T')[0],
        merchant: i.merchant.trim() || 'General Expense',
        description: i.description.trim(),
        amount: parseFloat(i.amount) || 0,
        taxAmount: parseFloat(i.taxAmount) || 0,
        currency,
        receiptUrl: i.receiptUrl || '',
        receiptFileName: i.receiptFileName || '',
        isBillableToClient: i.isBillableToClient,
        clientName: i.clientName.trim(),
      }));

    if (formattedItems.length === 0) {
      alert('Please add at least one expense item with an amount greater than zero.');
      return;
    }

    await createMutation.mutateAsync({
      title: title.trim(),
      departmentId: departmentId || departments[0]?._id,
      currency,
      notes: notes.trim(),
      items: formattedItems,
      submitNow,
    });

    onClose();
  };

  const handleApplyAiItem = (aiItem: {
    merchant: string;
    expenseDate: string;
    amount: number;
    taxAmount: number;
    description: string;
    categoryId: string;
    receiptUrl?: string;
    receiptFileName?: string;
  }) => {
    // If the first item is blank, overwrite it, otherwise push new
    setItems((prev) => {
      const isFirstBlank =
        prev.length === 1 && !prev[0].merchant && !prev[0].amount;
      const newItem: ClaimFormItem = {
        id: `item-${Date.now()}`,
        categoryId: aiItem.categoryId || categories[0]?._id || '',
        expenseDate: aiItem.expenseDate,
        merchant: aiItem.merchant,
        description: aiItem.description,
        amount: aiItem.amount.toString(),
        taxAmount: aiItem.taxAmount.toString(),
        isBillableToClient: false,
        clientName: '',
        receiptUrl: aiItem.receiptUrl,
        receiptFileName: aiItem.receiptFileName,
      };

      if (isFirstBlank) return [newItem];
      return [...prev, newItem];
    });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={onClose}
            />

            {/* Modal Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] flex flex-col overflow-hidden z-10"
            >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/40 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  New Expense Reimbursement Claim
                </h2>
                <p className="text-xs text-slate-500">
                  Enter claim details, attach itemized expenses, or scan receipts with AI
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Top Row: Title, Department, Currency */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Claim Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Client Onsite Trip & Software Tools"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div className="md:col-span-4">
                <FloatingDropdown
                  label="Department"
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  size="md"
                />
              </div>

              <div className="md:col-span-2">
                <FloatingDropdown
                  label="Currency"
                  options={currencyOptions}
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  size="md"
                />
              </div>
            </div>

            {/* Line Items Section Header & AI Scanner Button */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Itemized Expenses</h3>
                  <p className="text-xs text-slate-500">
                    Add each receipt or invoice line item with its merchant and category
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAiScanOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                    <span>Scan Receipt with AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Category */}
                      <div className="md:col-span-4">
                        <FloatingDropdown
                          label="Category"
                          options={categoryOptions}
                          value={item.categoryId || categories[0]?._id}
                          onChange={(val) => handleUpdateItem(item.id, 'categoryId', val)}
                          size="sm"
                        />
                      </div>

                      {/* Date */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={item.expenseDate}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'expenseDate', e.target.value)
                          }
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                        />
                      </div>

                      {/* Merchant */}
                      <div className="md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Merchant / Vendor
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Uber, Delta, AWS"
                          value={item.merchant}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'merchant', e.target.value)
                          }
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-800"
                        />
                      </div>

                      {/* Amount */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Amount ({currency})
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.amount}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'amount', e.target.value)
                          }
                          className="w-full h-8 px-2.5 text-xs font-bold text-orange-600 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-right"
                        />
                      </div>

                      {/* Description */}
                      <div className="md:col-span-8">
                        <input
                          type="text"
                          placeholder="Description or business reason for expense..."
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'description', e.target.value)
                          }
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 placeholder-slate-400"
                        />
                      </div>

                      {/* Tax Amount */}
                      <div className="md:col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Tax ($)"
                          value={item.taxAmount}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'taxAmount', e.target.value)
                          }
                          className="w-full h-8 px-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 text-slate-700 text-right"
                        />
                      </div>

                      {/* Billable to Client Toggle */}
                      <div className="md:col-span-2 flex items-center justify-end">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-600 select-none">
                          <input
                            type="checkbox"
                            checked={item.isBillableToClient}
                            onChange={(e) =>
                              handleUpdateItem(
                                item.id,
                                'isBillableToClient',
                                e.target.checked
                              )
                            }
                            className="w-3.5 h-3.5 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <span>Client Billable</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                General Notes / Approver Instructions
              </label>
              <textarea
                rows={2}
                placeholder="Add any additional context for your department manager or finance team..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Footer with Live Totals */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Total Claim Amount</span>
                <span className="text-base font-bold text-slate-900">
                  {currency} ${totalAmount.toFixed(2)}
                </span>
              </div>
              {totalTax > 0 && (
                <div>
                  <span className="text-slate-400 block text-[11px]">Included Taxes</span>
                  <span className="text-sm font-semibold text-slate-700">
                    ${totalTax.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={createMutation.isPending || !title.trim()}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl shadow-2xs transition-colors disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={createMutation.isPending || !title.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Claim</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>

      {/* AI Receipt Scanner Sub-modal */}
      <AiReceiptScanModal
        isOpen={isAiScanOpen}
        onClose={() => setIsAiScanOpen(false)}
        categories={categories}
        onApplyExtractedItem={handleApplyAiItem}
      />
    </>
  );
};
