import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Calendar,
  Layers,
  Building2,
  DollarSign,
  FileText,
} from 'lucide-react';
import {
  useInventoryItems,
  useWarehouses,
  useWarehouseBins,
  usePostGoodsReceipt,
  usePostStockIssue,
  usePostTransferDispatch,
  usePostStockAdjustment,
} from '../../hooks/useInventory';
import type { InventoryItem, Warehouse, WarehouseBin } from '../../types/inventory';

export type MovementTab = 'receipt' | 'issue' | 'transfer' | 'adjustment';

interface PostMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: MovementTab;
  initialItemId?: string;
  initialWarehouseId?: string;
}

export const PostMovementModal: React.FC<PostMovementModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'receipt',
  initialItemId,
  initialWarehouseId,
}) => {
  const [activeTab, setActiveTab] = useState<MovementTab>(defaultTab);

  // Common Form State
  const [itemId, setItemId] = useState(initialItemId || '');
  const [warehouseId, setWarehouseId] = useState(initialWarehouseId || '');
  const [binId, setBinId] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [serialsText, setSerialsText] = useState('');

  // Transfer specific
  const [destinationWarehouseId, setDestinationWarehouseId] = useState('');

  // Issue & Adjustment specific
  const [reasonCode, setReasonCode] = useState('internal_use');
  const [adjustmentType, setAdjustmentType] = useState<'in' | 'out'>('in');

  // Hooks
  const { data: itemsData } = useInventoryItems({ limit: 100 });
  const items: InventoryItem[] = itemsData?.items || [];
  const { data: warehouses = [] } = useWarehouses(true);
  const { data: bins = [] } = useWarehouseBins(warehouseId || null);

  const receiptMutation = usePostGoodsReceipt();
  const issueMutation = usePostStockIssue();
  const transferMutation = usePostTransferDispatch();
  const adjustmentMutation = usePostStockAdjustment();

  const isSubmitting =
    receiptMutation.isPending ||
    issueMutation.isPending ||
    transferMutation.isPending ||
    adjustmentMutation.isPending;

  const selectedItem = items.find((i) => i._id === itemId);

  const resetForm = () => {
    setItemId(initialItemId || '');
    setWarehouseId(initialWarehouseId || '');
    setBinId('');
    setQuantity('');
    setUnitCost('');
    setDocumentNumber('');
    setNotes('');
    setBatchNumber('');
    setManufactureDate('');
    setExpiryDate('');
    setSerialsText('');
    setDestinationWarehouseId('');
    setReasonCode('internal_use');
    setAdjustmentType('in');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const parseSerials = (): string[] => {
    return serialsText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !warehouseId || !quantity || Number(quantity) <= 0) return;

    const serials = parseSerials();
    const numQty = Number(quantity);
    const numCost = unitCost !== '' ? Number(unitCost) : undefined;

    try {
      if (activeTab === 'receipt') {
        await receiptMutation.mutateAsync({
          documentNumber: documentNumber.trim() || undefined,
          itemId,
          warehouseId,
          binId: binId || undefined,
          quantity: numQty,
          unitCost: numCost,
          batchNumber: batchNumber.trim() || undefined,
          manufactureDate: manufactureDate || undefined,
          expiryDate: expiryDate || undefined,
          serialNumbers: serials.length > 0 ? serials : undefined,
          notes: notes.trim() || undefined,
        });
      } else if (activeTab === 'issue') {
        await issueMutation.mutateAsync({
          documentNumber: documentNumber.trim() || undefined,
          itemId,
          warehouseId,
          binId: binId || undefined,
          quantity: numQty,
          reasonCode: reasonCode || 'internal_use',
          batchNumber: batchNumber.trim() || undefined,
          serialNumbers: serials.length > 0 ? serials : undefined,
          notes: notes.trim() || undefined,
        });
      } else if (activeTab === 'transfer') {
        if (!destinationWarehouseId || destinationWarehouseId === warehouseId) return;
        await transferMutation.mutateAsync({
          sourceWarehouseId: warehouseId,
          destinationWarehouseId,
          lines: [
            {
              itemId,
              actualQty: numQty,
              unitCost: numCost,
              sourceBinId: binId || undefined,
              batchNumber: batchNumber.trim() || undefined,
              serialNumbers: serials.length > 0 ? serials : undefined,
            },
          ],
          notes: notes.trim() || undefined,
        });
      } else if (activeTab === 'adjustment') {
        await adjustmentMutation.mutateAsync({
          documentNumber: documentNumber.trim() || undefined,
          itemId,
          warehouseId,
          binId: binId || undefined,
          quantity: numQty,
          unitCost: numCost,
          adjustmentType,
          reasonCode: reasonCode || 'inventory_count_discrepancy',
          batchNumber: batchNumber.trim() || undefined,
          serialNumbers: serials.length > 0 ? serials : undefined,
          notes: notes.trim() || undefined,
        });
      }
      handleClose();
    } catch {
      // toast is handled in useInventory mutations
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          onClick={handleClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Post Inventory Movement</h2>
                <p className="text-xs text-slate-500">Atomic updates with full double-entry ledger tracking</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Movement Type Tabs */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 border-b border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('receipt')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'receipt'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Goods Receipt (GRN)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('issue')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'issue'
                  ? 'bg-white text-rose-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
              <span>Stock Issue</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'transfer'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Inter-Warehouse</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('adjustment')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg transition-all ${
                activeTab === 'adjustment'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
              <span>Adjustment</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Primary Item Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Item <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={itemId}
                onChange={(e) => {
                  setItemId(e.target.value);
                  const it = items.find((x) => x._id === e.target.value);
                  if (it && activeTab === 'receipt') {
                    setUnitCost(it.standardCost || '');
                  }
                }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">-- Choose Inventory Item --</option>
                {items.map((it) => (
                  <option key={it._id} value={it._id}>
                    [{it.sku}] {it.name} ({it.baseUom})
                  </option>
                ))}
              </select>
              {selectedItem && (
                <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <span>
                    Tracking:{' '}
                    <strong className="text-slate-700 capitalize">{selectedItem.trackingType}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Base UoM: <strong className="text-slate-700">{selectedItem.baseUom}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Std Cost:{' '}
                    <strong className="text-slate-700">${selectedItem.standardCost?.toFixed(2)}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Warehouse Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'transfer' ? 'Source Warehouse' : 'Warehouse'}{' '}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={warehouseId}
                  onChange={(e) => {
                    setWarehouseId(e.target.value);
                    setBinId('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                >
                  <option value="">-- Select Warehouse --</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'transfer' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Warehouse <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={destinationWarehouseId}
                    onChange={(e) => setDestinationWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    <option value="">-- Select Destination --</option>
                    {warehouses
                      .filter((w) => w._id !== warehouseId)
                      .map((w) => (
                        <option key={w._id} value={w._id}>
                          {w.name} ({w.code})
                        </option>
                      ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Storage Slot / Bin (Optional)
                  </label>
                  <select
                    value={binId}
                    onChange={(e) => setBinId(e.target.value)}
                    disabled={!warehouseId || bins.length === 0}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">-- Direct Floor / Default --</option>
                    {bins.map((b) => {
                      const zoneLabel = b.zoneId && typeof b.zoneId === 'object'
                        ? (b.zoneId.name || b.zoneId.code)
                        : '';
                      return (
                        <option key={b._id} value={b._id}>
                          {b.binCode} {zoneLabel ? `(Zone: ${zoneLabel})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Quantity and Cost */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity ({selectedItem?.baseUom || 'Units'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.0001"
                  required
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {(activeTab === 'receipt' || activeTab === 'adjustment') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Unit Cost ($) {activeTab === 'receipt' && <span className="text-rose-500">*</span>}
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={unitCost}
                      onChange={(e) => setUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'adjustment' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adjustment Direction <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('in')}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                        adjustmentType === 'in'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      + Add Stock (In)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustmentType('out')}
                      className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${
                        adjustmentType === 'out'
                          ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      - Deduct Stock (Out)
                    </button>
                  </div>
                </div>
              )}

              {(activeTab === 'issue' || activeTab === 'adjustment') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  >
                    {activeTab === 'issue' ? (
                      <>
                        <option value="internal_use">Internal Dept Issue</option>
                        <option value="customer_order">Sales Order Fulfillment</option>
                        <option value="damaged">Damaged Goods Scrap</option>
                        <option value="sample">Customer Sample</option>
                        <option value="vendor_return">Return to Supplier</option>
                      </>
                    ) : (
                      <>
                        <option value="inventory_count_discrepancy">Count Discrepancy Reconciliation</option>
                        <option value="found_stock">Found Untracked Stock</option>
                        <option value="damage_writeoff">Damaged in Handling</option>
                        <option value="spoilage">Expired / Spoiled</option>
                        <option value="reclassification">SKU Reclassification</option>
                      </>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* Document Number & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference Document # (PO / Challan / Requisition)
                </label>
                <input
                  type="text"
                  placeholder="Auto-generated if blank"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="Optional operational remarks"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Batch & Lot Tracking Section */}
            {(selectedItem?.trackingType === 'batch' || activeTab === 'receipt') && (
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Batch & Expiry Controls</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Batch / Lot #</label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-2026-A1"
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                  {activeTab === 'receipt' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Mfg Date</label>
                        <input
                          type="date"
                          value={manufactureDate}
                          onChange={(e) => setManufactureDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-600 mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Serial Numbers Section */}
            {(selectedItem?.trackingType === 'serial' || serialsText.trim().length > 0) && (
              <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Serial Numbers (Comma or newline separated)</span>
                  </div>
                  <span className="text-[11px] text-blue-600 font-medium">
                    Count: {parseSerials().length} / {quantity || 0}
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="SN-1001, SN-1002, SN-1003..."
                  value={serialsText}
                  onChange={(e) => setSerialsText(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !itemId || !warehouseId || !quantity || Number(quantity) <= 0}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-orange-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Posting to Ledger...'
                    : activeTab === 'receipt'
                    ? 'Post Goods Receipt'
                    : activeTab === 'issue'
                    ? 'Post Stock Issue'
                    : activeTab === 'transfer'
                    ? 'Dispatch Transfer'
                    : 'Post Stock Adjustment'}
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
