import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, RotateCcw, AlertTriangle, Building2, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { createReturnToVendor } from '../../lib/procurementApi';
import { useInventoryItems, useWarehouses, useSuppliers } from '../../hooks/useInventory';

interface CreateReturnToVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RtvLineInput {
  itemId: string;
  quantity: number;
  unitCost: number;
  batchNumber: string;
  reasonCode: 'defective' | 'excess' | 'damaged_in_transit' | 'wrong_specification' | 'expired' | 'other';
  notes: string;
}

export const CreateReturnToVendorModal: React.FC<CreateReturnToVendorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: itemsData } = useInventoryItems({ activeOnly: 'true', limit: 100 });
  const { data: warehouses = [] } = useWarehouses();
  const { data: suppliersData } = useSuppliers({ activeOnly: 'true', limit: 100 });

  const items = itemsData?.items || [];
  const suppliers = suppliersData?.suppliers || [];

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lines, setLines] = useState<RtvLineInput[]>([
    { itemId: '', quantity: 1, unitCost: 0, batchNumber: '', reasonCode: 'defective', notes: '' },
  ]);

  const handleLineChange = (index: number, field: keyof RtvLineInput, val: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };

      if (field === 'itemId') {
        const itemObj = items.find((it) => it._id === val);
        if (itemObj) {
          next[index].unitCost = itemObj.standardCost || 0;
        }
      }
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { itemId: '', quantity: 1, unitCost: 0, batchNumber: '', reasonCode: 'defective', notes: '' },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.unitCost) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error('Please choose a supplier.');
      return;
    }
    if (!warehouseId) {
      toast.error('Please choose the issuing warehouse.');
      return;
    }

    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one line item with positive quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      const rtv = await createReturnToVendor({
        supplierId,
        warehouseId,
        notes,
        items: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
          batchNumber: l.batchNumber,
          reasonCode: l.reasonCode,
          notes: l.notes,
        })),
      });

      toast.success(
        `Return dispatched & Debit Note ${rtv.debitNoteNumber} issued ($${totalDebit.toFixed(2)})!`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to dispatch return');
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
          className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Return to Vendor & Debit Note (RTV)</h3>
                <p className="text-xs text-slate-500">Return defective or excess stock to vendor and post debit note</p>
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
            {/* Vendor & Warehouse */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-slate-400" />
                  Return To Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.supplierCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Issuing Warehouse <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">-- Choose Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Returning Items ({lines.length})
                </label>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <select
                        required
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      >
                        <option value="">-- Choose Item --</option>
                        {items.map((it) => (
                          <option key={it._id} value={it._id}>
                            [{it.sku}] {it.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <input
                        type="number"
                        min="1"
                        step="any"
                        placeholder="Return Qty"
                        required
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-center font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <select
                        value={line.reasonCode}
                        onChange={(e) => handleLineChange(idx, 'reasonCode', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      >
                        <option value="defective">Defective / QA Fail</option>
                        <option value="damaged_in_transit">Damaged in Transit</option>
                        <option value="wrong_specification">Wrong Specification</option>
                        <option value="excess">Excess Quantity</option>
                        <option value="expired">Expired Stock</option>
                      </select>
                    </div>

                    <div className="col-span-3 md:col-span-3">
                      <input
                        type="text"
                        placeholder="Batch # (Optional)"
                        value={line.batchNumber}
                        onChange={(e) => handleLineChange(idx, 'batchNumber', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                      />
                    </div>

                    <div className="col-span-1 md:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        disabled={lines.length === 1}
                        className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Debit Amount Banner */}
            <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-sm font-semibold text-rose-950">
                Total Supplier Debit Note Amount:
              </span>
              <span className="text-lg font-bold text-rose-600 font-mono">
                ${totalDebit.toFixed(2)}
              </span>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transporter / Return Dispatch Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="RMA number from vendor, carrier details..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
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
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Dispatching...' : 'Dispatch Return & Issue Debit Note'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
