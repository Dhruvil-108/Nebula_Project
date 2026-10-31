import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  PackageCheck,
  Check,
  DollarSign,
  Receipt,
  User,
  Calendar,
  Layers,
  Coins,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { FloatingDropdown, type DropdownOption } from '../ui/FloatingDropdown';
import { useExpenseClaims, useCreatePaymentBatch } from '../../hooks/useExpenses';
import type { PaymentMethod } from '../../types/expenses';

interface CreatePaymentBatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreatePaymentBatchModal: React.FC<CreatePaymentBatchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [bankAccount, setBankAccount] = useState('Operating Checking ···· 4491');
  const [notes, setNotes] = useState('');
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);

  // Query all approved claims waiting for payout
  const { data: claimsData, isLoading } = useExpenseClaims({
    status: 'approved',
  });

  const createBatchMutation = useCreatePaymentBatch();

  const availableClaims = (claimsData?.claims || []).filter((c) => !c.paymentBatchId);

  const toggleClaim = (id: string) => {
    setSelectedClaimIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedClaimIds.length === availableClaims.length) {
      setSelectedClaimIds([]);
    } else {
      setSelectedClaimIds(availableClaims.map((c) => c._id));
    }
  };

  const selectedClaims = availableClaims.filter((c) => selectedClaimIds.includes(c._id));

  const totalGross = selectedClaims.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
  const totalAdvanceDeductions = selectedClaims.reduce(
    (sum, c) => sum + (c.advanceDeductedAmount || 0),
    0
  );
  const totalNetPayable = Math.max(0, totalGross - totalAdvanceDeductions);

  const paymentMethodOptions: DropdownOption[] = [
    { value: 'bank_transfer', label: 'Corporate Bank Transfer (ACH / SEPA)', icon: <CreditCard className="w-4 h-4 text-slate-500" /> },
    { value: 'direct_deposit', label: 'Direct Deposit / Payroll Offset', icon: <DollarSign className="w-4 h-4 text-emerald-500" /> },
    { value: 'corporate_card', label: 'Corporate Card Settlement', icon: <CreditCard className="w-4 h-4 text-orange-500" /> },
    { value: 'cheque', label: 'Physical Cheque Payout', icon: <Receipt className="w-4 h-4 text-slate-400" /> },
  ];

  const handleSubmit = async () => {
    if (selectedClaimIds.length === 0) {
      alert('Please select at least one approved claim to batch.');
      return;
    }

    await createBatchMutation.mutateAsync({
      title: title.trim() || undefined,
      claimIds: selectedClaimIds,
      paymentMethod,
      bankAccount,
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
            className="relative w-full max-w-3xl bg-white border border-[#ECE0D6] rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/60 to-orange-50/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Create Multi-Claim Settlement Batch
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bundle approved expense claims into a single execution batch for bulk bank payout & GL posting
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

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Batch Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Batch Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mid-Month Payout Cycle #1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-slate-900"
                  />
                </div>

                <FloatingDropdown
                  label="Payment Execution Method"
                  options={paymentMethodOptions}
                  value={paymentMethod}
                  onChange={(val) => setPaymentMethod(val as PaymentMethod)}
                  size="md"
                />
              </div>

              {/* Claims Selection Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={
                        availableClaims.length > 0 &&
                        selectedClaimIds.length === availableClaims.length
                      }
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Select Approved Claims ({selectedClaimIds.length} of {availableClaims.length})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Only fully approved claims are eligible
                  </span>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {isLoading ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Loading approved claims...
                    </div>
                  ) : availableClaims.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No approved claims currently awaiting batch reimbursement.
                    </div>
                  ) : (
                    availableClaims.map((claim) => {
                      const isSelected = selectedClaimIds.includes(claim._id);
                      const netPay = Math.max(
                        0,
                        (claim.totalAmount || 0) - (claim.advanceDeductedAmount || 0)
                      );

                      return (
                        <div
                          key={claim._id}
                          onClick={() => toggleClaim(claim._id)}
                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-purple-50/50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">
                                  {claim.claimNumber}
                                </span>
                                <span className="text-xs text-slate-700 truncate max-w-xs">
                                  {claim.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span>{claim.employeeId?.fullName}</span>
                                <span>·</span>
                                <span>{claim.items?.length || 0} items</span>
                                {claim.advanceDeductedAmount && claim.advanceDeductedAmount > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="text-amber-600 font-medium">
                                      Adv Offset: -${claim.advanceDeductedAmount.toFixed(2)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-900">
                              ${netPay.toFixed(2)}
                            </div>
                            {claim.advanceDeductedAmount && claim.advanceDeductedAmount > 0 && (
                              <div className="text-[10px] text-slate-400 line-through">
                                Gross ${claim.totalAmount.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Batch Notes / Audit Log
                </label>
                <input
                  type="text"
                  placeholder="Optional notes for bank statement or GL posting..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Live Batch Metric Summary */}
              <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-semibold">
                    Claims Selected
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedClaims.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 uppercase block font-semibold">
                    Advance Deductions
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    -${totalAdvanceDeductions.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-700 uppercase block font-semibold">
                    Net Batch Payable
                  </span>
                  <span className="text-base font-extrabold text-purple-900">
                    ${totalNetPayable.toFixed(2)}
                  </span>
                </div>
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
                disabled={createBatchMutation.isPending || selectedClaimIds.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Create Settlement Batch ({selectedClaims.length})</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
