import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, X } from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../ui/FloatingDropdown';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from '../../types/expenses';

interface ReimburseClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  claimNumber?: string;
  totalAmount?: number;
  currency?: string;
  onConfirm: (data: { paymentMethod: PaymentMethod; transactionReference: string }) => Promise<void>;
  isLoading?: boolean;
}

export const ReimburseClaimModal: React.FC<ReimburseClaimModalProps> = ({
  isOpen,
  onClose,
  claimNumber,
  totalAmount = 0,
  currency = 'USD',
  onConfirm,
  isLoading,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [transactionReference, setTransactionReference] = useState('');

  const paymentOptions: DropdownOption<PaymentMethod>[] = PAYMENT_METHODS.map((method) => ({
    value: method,
    label: PAYMENT_METHOD_LABELS[method],
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm({
      paymentMethod,
      transactionReference: transactionReference.trim(),
    });
    setTransactionReference('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#ECE0D6] overflow-hidden z-10"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Mark Claim as Reimbursed</h3>
                  <p className="text-xs text-slate-500">
                    {claimNumber} · ${totalAmount.toFixed(2)} {currency}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <FloatingDropdown<PaymentMethod>
                  label="Disbursement Method"
                  options={paymentOptions}
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val)}
                  size="md"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / Wire Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-98214251, Check #402, Payroll-OCT26"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Processing...' : 'Confirm Reimbursement'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
