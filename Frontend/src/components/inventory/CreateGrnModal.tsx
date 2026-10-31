import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PackageCheck, AlertCircle, FileText, CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { createGoodsReceiptNote } from '../../lib/procurementApi';
import { useWarehouses, useWarehouseBins } from '../../hooks/useInventory';
import type { PurchaseOrder } from '../../types/procurement';

interface CreateGrnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseOrders: PurchaseOrder[];
  preselectedPoId?: string;
}

interface GrnLineInput {
  itemId: string;
  poItemId: string;
  name: string;
  sku: string;
  orderedQuantity: number;
  previouslyReceived: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason: string;
  unitCost: number;
  batchNumber: string;
  expiryDate: string;
  binId: string;
}

export const CreateGrnModal: React.FC<CreateGrnModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  purchaseOrders,
  preselectedPoId,
}) => {
  const [selectedPoId, setSelectedPoId] = useState(preselectedPoId || '');
  const [deliveryChallanNumber, setDeliveryChallanNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [postImmediately, setPostImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPo = purchaseOrders.find((p) => p._id === selectedPoId);
  const warehouseId = selectedPo?.warehouseId?._id || '';

  const { data: bins = [] } = useWarehouseBins(warehouseId);

  // Initialize lines based on selected PO
  const [lines, setLines] = useState<GrnLineInput[]>([]);

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    const po = purchaseOrders.find((p) => p._id === poId);
    if (!po) {
      setLines([]);
      return;
    }

    const initialLines: GrnLineInput[] = po.items.map((it) => {
      const remaining = Math.max(0, it.orderedQuantity - (it.receivedQuantity || 0));
      const itemObj = typeof it.itemId === 'object' ? it.itemId : null;
      return {
        itemId: itemObj?._id || (it.itemId as string),
        poItemId: it._id || '',
        name: itemObj?.name || it.description || 'Inventory Item',
        sku: itemObj?.sku || '',
        orderedQuantity: it.orderedQuantity,
        previouslyReceived: it.receivedQuantity || 0,
        receivedQuantity: remaining,
        acceptedQuantity: remaining,
        rejectedQuantity: 0,
        rejectionReason: '',
        unitCost: it.unitPrice,
        batchNumber: '',
        expiryDate: '',
        binId: '',
      };
    });
    setLines(initialLines);
  };

  const updateLine = (index: number, field: keyof GrnLineInput, val: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };

      if (field === 'receivedQuantity') {
        const rec = Number(val) || 0;
        next[index].acceptedQuantity = rec;
        next[index].rejectedQuantity = 0;
      } else if (field === 'acceptedQuantity') {
        const acc = Number(val) || 0;
        const rec = next[index].receivedQuantity || 0;
        next[index].rejectedQuantity = Math.max(0, rec - acc);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) {
      toast.error('Please select a Purchase Order.');
      return;
    }

    const validLines = lines.filter((l) => l.receivedQuantity > 0);
    if (validLines.length === 0) {
      toast.error('At least one item must have received quantity > 0.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createGoodsReceiptNote({
        poId: selectedPoId,
        warehouseId,
        deliveryChallanNumber,
        carrier,
        trackingNumber,
        postToLedgerImmediately: postImmediately,
        items: validLines.map((l) => ({
          itemId: l.itemId,
          poItemId: l.poItemId,
          receivedQuantity: Number(l.receivedQuantity),
          acceptedQuantity: Number(l.acceptedQuantity),
          rejectedQuantity: Number(l.rejectedQuantity),
          rejectionReason: l.rejectionReason,
          unitCost: Number(l.unitCost),
          batchNumber: l.batchNumber,
          expiryDate: l.expiryDate || null,
          binId: l.binId || null,
        })),
      });

      toast.success(
        postImmediately
          ? 'GRN created and stock successfully posted to Immutable Ledger!'
          : 'GRN created as draft.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to generate GRN');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

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
          <div className="px-6 py-5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Receive Goods (GRN Quality Inspection)</h3>
                <p className="text-xs text-slate-500">Record physical delivery, perform QA inspection, and post stock to ledger</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* PO Select & Delivery Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Purchase Order <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedPoId}
                  onChange={(e) => handlePoChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">-- Choose Open PO --</option>
                  {purchaseOrders
                    .filter((p) => ['ordered', 'partially_received', 'approved'].includes(p.status))
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.poNumber} — {p.supplierId?.name} ({p.status})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Vendor Challan / Packing Slip #
                </label>
                <input
                  type="text"
                  placeholder="e.g. DC-99881"
                  value={deliveryChallanNumber}
                  onChange={(e) => setDeliveryChallanNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transporter / Tracking #
                </label>
                <input
                  type="text"
                  placeholder="e.g. FedEx 77810"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Line Items Table */}
            {selectedPo && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Receiving Items & Inspection Breakdown
                </label>
                <div className="space-y-3">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            [{line.sku}] {line.name}
                          </span>
                          <span className="ml-2 text-xs text-slate-500">
                            (Ordered: {line.orderedQuantity} | Received so far: {line.previouslyReceived})
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-700">
                          Unit Cost: ${line.unitCost.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Received Qty</label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={line.receivedQuantity}
                            onChange={(e) => updateLine(idx, 'receivedQuantity', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-center font-bold focus:ring-emerald-500"
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-[10px] font-semibold text-emerald-600 uppercase">Accepted Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={line.receivedQuantity}
                            step="any"
                            value={line.acceptedQuantity}
                            onChange={(e) => updateLine(idx, 'acceptedQuantity', Number(e.target.value))}
                            className="w-full px-2 py-1 text-xs border border-emerald-300 rounded-lg bg-emerald-50/50 text-center font-bold text-emerald-700 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="col-span-4 md:col-span-2">
                          <label className="block text-[10px] font-semibold text-rose-600 uppercase">Rejected Qty</label>
                          <input
                            type="number"
                            readOnly
                            value={line.rejectedQuantity}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-slate-100 text-center font-bold text-rose-600"
                          />
                        </div>

                        <div className="col-span-6 md:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Batch # (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. BATCH-2026A"
                            value={line.batchNumber}
                            onChange={(e) => updateLine(idx, 'batchNumber', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white uppercase focus:ring-emerald-500"
                          />
                        </div>

                        <div className="col-span-6 md:col-span-3">
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Destination Bin</label>
                          <select
                            value={line.binId}
                            onChange={(e) => updateLine(idx, 'binId', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:ring-emerald-500"
                          >
                            <option value="">-- Floor / Default --</option>
                            {bins.map((b) => (
                              <option key={b._id} value={b._id}>
                                {b.binCode}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* If rejected > 0, show rejection reason field */}
                      {line.rejectedQuantity > 0 && (
                        <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                          <input
                            type="text"
                            required
                            placeholder="Specify rejection reason (e.g. Damaged in transit, incorrect spec)..."
                            value={line.rejectionReason}
                            onChange={(e) => updateLine(idx, 'rejectionReason', e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-rose-200 rounded bg-white text-rose-900 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Stock Ledger Posting Banner */}
            <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <input
                type="checkbox"
                id="postImmediately"
                checked={postImmediately}
                onChange={(e) => setPostImmediately(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="postImmediately" className="text-xs text-emerald-900 cursor-pointer font-medium">
                Immediately post accepted goods into the append-only <strong>Stock Ledger</strong> (increments live stock on hand & logs stock movement)
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedPoId}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Create & Receive GRN'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
