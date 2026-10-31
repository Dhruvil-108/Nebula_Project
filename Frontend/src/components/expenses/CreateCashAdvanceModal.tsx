import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Coins,
  Building2,
  Calendar,
  DollarSign,
  AlertCircle,
  Check,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../ui/FloatingDropdown';
import { useCreateCashAdvance } from '../../hooks/useExpenses';
import type { DepartmentBudget } from '../../types/expenses';

interface CreateCashAdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Array<{ _id: string; name: string }>;
}

export const CreateCashAdvanceModal: React.FC<CreateCashAdvanceModalProps> = ({
  isOpen,
  onClose,
  departments,
}) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [purpose, setPurpose] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [departmentId, setDepartmentId] = useState(departments[0]?._id || '');
  const [notes, setNotes] = useState('');

  const createMutation = useCreateCashAdvance();

  const numAmount = parseFloat(amount) || 0;

  const departmentOptions: DropdownOption[] = departments.map((d) => ({
    value: d._id,
    label: d.name,
    icon: <Building2 className="w-4 h-4 text-slate-400" />,
  }));

  const currencyOptions: DropdownOption[] = [
    { value: 'USD', label: 'USD ($)', sublabel: 'US Dollar' },
    { value: 'EUR', label: 'EUR (€)', sublabel: 'Euro' },
    { value: 'GBP', label: 'GBP (£)', sublabel: 'British Pound' },
    { value: 'INR', label: 'INR (₹)', sublabel: 'Indian Rupee' },
  ];

  const handleSubmit = async () => {
    if (numAmount <= 0) {
      alert('Please enter a cash advance amount greater than zero.');
      return;
    }
    if (!purpose.trim() || !requiredByDate) {
      alert('Please provide a purpose and the date by which funds are needed.');
      return;
    }

    await createMutation.mutateAsync({
      amount: numAmount,
      currency,
      purpose: purpose.trim(),
      requiredByDate,
      departmentId: departmentId || departments[0]?._id,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="relative w-full max-w-lg bg-white border border-[#ECE0D6] rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/60 to-orange-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Request Cash Advance
                  </h2>
                  <p className="text-xs text-slate-500">
                    Pre-funded disbursement for business travel or emergency operational expenses
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

            {/* Form Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Advance Amount <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                <FloatingDropdown
                  label="Currency"
                  options={currencyOptions}
                  value={currency}
                  onChange={(val) => setCurrency(val)}
                  size="md"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Funds Needed By <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800"
                  />
                </div>

                <FloatingDropdown
                  label="Department"
                  options={departmentOptions}
                  value={departmentId}
                  onChange={(val) => setDepartmentId(val)}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Business Justification / Purpose <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field research supplier payment, Client site per diem"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-900 placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Disbursement banking preferences or vendor details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Settlement Notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Net-Pay Settlement Policy:</strong> Once disbursed by Finance, this cash advance will be deducted automatically from your next expense claim(s) until fully settled.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createMutation.isPending || numAmount <= 0 || !purpose.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Submit Advance Request</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
