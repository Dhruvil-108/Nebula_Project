import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FileCheck, Building2, Truck, Calendar } from 'lucide-react';
import { toast } from 'react-toastify';
import { createPurchaseOrder } from '../../lib/procurementApi';
import { useInventoryItems, useWarehouses, useSuppliers } from '../../hooks/useInventory';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PoLineInput {
  itemId: string;
  orderedQuantity: number;
  unitPrice: number;
  taxRate: number;
  uom: string;
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
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
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'draft' | 'ordered'>('ordered');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lines, setLines] = useState<PoLineInput[]>([
    { itemId: '', orderedQuantity: 1, unitPrice: 0, taxRate: 0, uom: 'PCS' },
  ]);

  const handleLineChange = (index: number, field: keyof PoLineInput, val: any) => {
    setLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };

      if (field === 'itemId') {
        const itemObj = items.find((it) => it._id === val);
        if (itemObj) {
          next[index].unitPrice = itemObj.standardCost || 0;
          next[index].uom = itemObj.baseUom || 'PCS';
        }
      }
      return next;
    });
  };

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      { itemId: '', orderedQuantity: 1, unitPrice: 0, taxRate: 0, uom: 'PCS' },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  let subtotal = 0;
  let taxTotal = 0;
  lines.forEach((l) => {
    const q = Number(l.orderedQuantity) || 0;
    const p = Number(l.unitPrice) || 0;
    const t = Number(l.taxRate) || 0;
    const lineSub = q * p;
    const lineTax = lineSub * (t / 100);
    subtotal += lineSub;
    taxTotal += lineTax;
  });
  const grandTotal = subtotal + taxTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      toast.error('Please choose a supplier.');
      return;
    }
    if (!warehouseId) {
      toast.error('Please choose a destination warehouse.');
      return;
    }

    const validLines = lines.filter((l) => l.itemId && l.orderedQuantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one line item with positive quantity.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createPurchaseOrder({
        supplierId: supplierId as any,
        warehouseId: warehouseId as any,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        paymentTerms,
        status,
        notes,
        items: validLines.map((l) => ({
          itemId: l.itemId,
          orderedQuantity: Number(l.orderedQuantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
          taxAmount: Math.round(Number(l.orderedQuantity) * Number(l.unitPrice) * (Number(l.taxRate) / 100) * 100) / 100,
          lineTotal: Math.round(Number(l.orderedQuantity) * Number(l.unitPrice) * (1 + Number(l.taxRate) / 100) * 100) / 100,
          uom: l.uom,
          receivedQuantity: 0,
          invoicedQuantity: 0,
          returnedQuantity: 0,
        })),
      });

      toast.success(status === 'ordered' ? 'Purchase Order placed successfully!' : 'Purchase Order saved as draft.');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to create Purchase Order');
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
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Create Purchase Order (PO)</h3>
                <p className="text-xs text-slate-500">Generate an official commercial order for external suppliers</p>
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
                  Supplier / Vendor <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                  Ship-to Warehouse <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">-- Choose Receiving Facility --</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Date & Terms */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Expected Delivery
                </label>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Due on Receipt">Due on Receipt / COD</option>
                  <option value="100% Advance">100% Advance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PO Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="ordered">Ordered (Ready for GRN)</option>
                  <option value="draft">Draft (Review Needed)</option>
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Order Items ({lines.length})
                </label>
                <button
                  type="button"
                  onClick={addLine}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 hover:bg-orange-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </button>
              </div>

              <div className="space-y-3">
                {lines.map((line, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-12 md:col-span-4">
                      <select
                        required
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                        placeholder="Qty"
                        required
                        value={line.orderedQuantity}
                        onChange={(e) => handleLineChange(idx, 'orderedQuantity', Number(e.target.value))}
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
                          placeholder="Price"
                          value={line.unitPrice}
                          onChange={(e) => handleLineChange(idx, 'unitPrice', Number(e.target.value))}
                          className="w-full pl-5 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="col-span-3 md:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="Tax %"
                          value={line.taxRate}
                          onChange={(e) => handleLineChange(idx, 'taxRate', Number(e.target.value))}
                          className="w-full pr-5 pl-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-right focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                        <span className="absolute right-2 top-1.5 text-xs text-slate-400">%</span>
                      </div>
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

            {/* Calculations Breakdown */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Tax Total:</span>
                <span className="font-mono font-medium">${taxTotal.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Grand Total:</span>
                <span className="text-orange-600 font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Order Notes / Terms</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Shipping instructions, dock arrival instructions..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
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
                className="px-5 py-2 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Create Purchase Order'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
