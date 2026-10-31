import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ShoppingCart, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { createRequisition } from '../../lib/procurementApi';
import { useInventoryItems } from '../../hooks/useInventory';

interface CreateRequisitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RequisitionLineInput {
  itemId: string;
  quantity: number;
  estimatedUnitPrice: number;
  uom: string;
  notes: string;
}

export const CreateRequisitionModal: React.FC<CreateRequisitionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { data: itemsData } = useInventoryItems({ activeOnly: 'true', limit: 100 });
  const items = itemsData?.items || [];

  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [requiredDate, setRequiredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitImmediately, setSubmitImmediately] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lines, setLines] = useState<RequisitionLineInput[]>([
    { itemId: '', quantity: 1, estimatedUnitPrice: 0, uom: 'PCS', notes: '' },
  ]);

  const handleLineChange = (index: number, field: keyof RequisitionLineInput, val: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };

      if (field === 'itemId') {
        const itemObj = items.find((it) => it._id === val);
        if (itemObj) {
          next[index].estimatedUnitPrice = itemObj.standardCost || 0;
          next[index].uom = itemObj.baseUom || 'PCS';
        }
      }
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { itemId: '', quantity: 1, estimatedUnitPrice: 0, uom: 'PCS', notes: '' },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const totalBudget = lines.reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.estimatedUnitPrice) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validLines = lines.filter((l) => l.itemId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one valid item with positive quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createRequisition({
        priority,
        requiredDate: requiredDate || undefined,
        notes,
        submitImmediately,
        items: validLines.map((l) => ({
          itemId: l.itemId,
          quantity: Number(l.quantity),
          estimatedUnitPrice: Number(l.estimatedUnitPrice),
          estimatedTotal: Math.round(Number(l.quantity) * Number(l.estimatedUnitPrice) * 100) / 100,
          uom: l.uom,
          notes: l.notes,
        })),
      });

      toast.success(
        submitImmediately
          ? 'Purchase Requisition submitted for 2-tier approval!'
          : 'Purchase Requisition saved as draft.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to create requisition');
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
          <div className="px-6 py-5 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">New Purchase Requisition</h3>
                <p className="text-xs text-slate-500">Initiate an internal stock or asset purchase request</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Top Config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Urgency / Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="normal">Normal (Standard SLA)</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent / Critical Stock Out</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Required By Date
                </label>
                <input
                  type="date"
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Requisition Items ({lines.length})
                </label>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Line Item
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-12 md:col-span-5">
                      <select
                        required
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      >
                        <option value="">-- Select Catalog SKU --</option>
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
                        placeholder="Qty"
                        required
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-center focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Est Price"
                          value={line.estimatedUnitPrice}
                          onChange={(e) =>
                            handleLineChange(idx, 'estimatedUnitPrice', Number(e.target.value))
                          }
                          className="w-full pl-5 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="col-span-3 md:col-span-2 text-right">
                      <span className="text-xs font-bold text-slate-800">
                        ${((line.quantity || 0) * (line.estimatedUnitPrice || 0)).toFixed(2)}
                      </span>
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

            {/* Total Budget Banner */}
            <div className="flex items-center justify-between p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <span className="text-sm font-semibold text-orange-950">
                Total Estimated Requisition Budget:
              </span>
              <span className="text-lg font-bold text-orange-600 font-mono">
                ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Business Justification & Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Specify departmental reason, project code, or vendor preference..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            {/* Immediate Submit Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="submitImmediately"
                checked={submitImmediately}
                onChange={(e) => setSubmitImmediately(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
              />
              <label htmlFor="submitImmediately" className="text-xs text-slate-700 cursor-pointer">
                Submit directly into the 2-tier approval workflow (Manager → Procurement)
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
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : submitImmediately ? 'Submit Requisition' : 'Save as Draft'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
