import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, AlertCircle, FileCheck, ShieldAlert, Check } from 'lucide-react';
import { toast } from 'react-toastify';
import { approveInvoiceVariance, runThreeWayMatch } from '../../lib/procurementApi';
import type { SupplierInvoice } from '../../types/procurement';

interface ThreeWayMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: SupplierInvoice | null;
  onSuccess: () => void;
}

export const ThreeWayMatchModal: React.FC<ThreeWayMatchModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSuccess,
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isReevaluating, setIsReevaluating] = useState(false);

  if (!isOpen || !invoice) return null;

  const twm = invoice.threeWayMatch;
  const isMatched = invoice.matchingStatus === 'matched';
  const isApprovedWithVariance = invoice.matchingStatus === 'approved_with_variance';
  const hasVariance = invoice.matchingStatus === 'variance_detected';

  const handleApproveVariance = async () => {
    try {
      setIsApproving(true);
      await approveInvoiceVariance(invoice._id, approvalNotes || 'Approved by procurement officer');
      toast.success('Invoice variance approved successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to approve variance');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReevaluate = async () => {
    try {
      setIsReevaluating(true);
      await runThreeWayMatch(invoice._id);
      toast.success('3-Way Match re-evaluated successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to re-evaluate match');
    } finally {
      setIsReevaluating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="module-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  3-Way Match Reconciliation: {invoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  PO #{invoice.poId?.poNumber} vs Received GRNs vs Vendor Bill #{invoice.supplierInvoiceRef}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Status Summary Banner */}
            {isMatched ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">100% 3-Way Match Verified</h4>
                  <p className="text-xs text-emerald-700">
                    Billed quantities and unit prices match Purchase Order and Goods Receipt Notes within tolerance limits. Ready for payment settlement.
                  </p>
                </div>
              </div>
            ) : isApprovedWithVariance ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-900">
                <Check className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Variance Approved</h4>
                  <p className="text-xs text-amber-700">
                    Discrepancy was authorized by {invoice.varianceApprovedBy?.fullName || 'Procurement Officer'}. Notes: "{invoice.varianceApprovalNotes}"
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-900">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold">Tolerance Mismatch Detected</h4>
                  <p className="text-xs text-rose-700">
                    Discrepancies found between invoiced amounts and accepted goods receipts. Review the line-by-line comparison below before proceeding.
                  </p>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">PO Status</span>
                <span className="text-xs font-bold text-slate-800">{invoice.poId?.status || 'Active'}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Billed Total</span>
                <span className="text-xs font-bold text-slate-800 font-mono">
                  ${Number(invoice.totalAmount).toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Price Variance</span>
                <span className={`text-xs font-bold font-mono ${twm?.priceVariance ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ${Number(twm?.priceVariance || 0).toFixed(2)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="block text-[11px] font-semibold text-slate-500 uppercase">Qty Variance</span>
                <span className={`text-xs font-bold font-mono ${twm?.quantityVariance ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {Number(twm?.quantityVariance || 0)} Units
                </span>
              </div>
            </div>

            {/* Comparison Matrix Table */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Detailed Line-by-Line Match Matrix
              </label>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item / SKU</th>
                      <th className="py-2.5 px-3 text-center">PO Qty</th>
                      <th className="py-2.5 px-3 text-center">GRN Qty</th>
                      <th className="py-2.5 px-3 text-center">Inv Qty</th>
                      <th className="py-2.5 px-3 text-right">PO Price</th>
                      <th className="py-2.5 px-3 text-right">Inv Price</th>
                      <th className="py-2.5 px-3 text-right">Variance</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {twm?.details?.map((detail, idx) => {
                      const isLineMatch = detail.status === 'match';
                      return (
                        <tr key={idx} className={isLineMatch ? 'hover:bg-slate-50' : 'bg-rose-50/40'}>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {detail.itemCode || 'Item'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono">{detail.poQty}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-emerald-700">
                            {detail.grnQty}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-900">
                            {detail.invQty}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">${detail.poPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono">${detail.invPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {detail.varianceAmount !== 0 ? (
                              <span className="text-rose-600">
                                {detail.varianceAmount > 0 ? '+' : ''}${detail.varianceAmount.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-emerald-600">$0.00</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isLineMatch ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                MATCH
                              </span>
                            ) : detail.status === 'tolerance_exceeded' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                TOLERANCE EXCEEDED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                                {detail.status.replace('_', ' ')}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approval of Variance Form (if variance exists) */}
            {hasVariance && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <label className="block text-xs font-semibold text-slate-800">
                  Managerial Variance Override & Approval
                </label>
                <input
                  type="text"
                  placeholder="Provide commercial rationale (e.g. Approved price index adjustment per contract clause)..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleReevaluate}
                    disabled={isReevaluating}
                    className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {isReevaluating ? 'Re-checking...' : 'Re-run 3-Way Match'}
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveVariance}
                    disabled={isApproving}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isApproving ? 'Authorizing...' : 'Authorize Variance & Approve Invoice'}
                  </button>
                </div>
              </div>
            )}

            {/* Footer Close */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
