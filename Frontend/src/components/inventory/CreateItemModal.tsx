import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Package,
  Plus,
  Trash2,
  Layers,
  Building2,
  Truck,
  CheckCircle2,
} from 'lucide-react';
import type { InventoryItem, TrackingType, ValuationMethod } from '../../types/inventory';
import { useItemCategories, useWarehouses, useWarehouseBins, useSuppliers } from '../../hooks/useInventory';

interface CreateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (itemData: Partial<InventoryItem>) => Promise<void>;
  initialData?: InventoryItem | null;
  isSubmitting?: boolean;
}

export const CreateItemModal: React.FC<CreateItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting = false,
}) => {
  const { data: categories = [] } = useItemCategories();
  const { data: warehouses = [] } = useWarehouses();
  const { data: suppliersData } = useSuppliers({ limit: 100 });
  const suppliers = suppliersData?.suppliers || [];

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [baseUom, setBaseUom] = useState('PCS');
  const [uomConversions, setUomConversions] = useState<{ uom: string; conversionFactor: number }[]>([]);
  const [trackingType, setTrackingType] = useState<TrackingType>('none');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [shelfLifeDays, setShelfLifeDays] = useState(0);
  const [minStockLevel, setMinStockLevel] = useState(0);
  const [maxStockLevel, setMaxStockLevel] = useState(0);
  const [reorderPoint, setReorderPoint] = useState(0);
  const [reorderQuantity, setReorderQuantity] = useState(1);
  const [standardCost, setStandardCost] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [valuationMethod, setValuationMethod] = useState<ValuationMethod>('fifo');
  const [defaultWarehouseId, setDefaultWarehouseId] = useState('');
  const [defaultBinId, setDefaultBinId] = useState('');
  const [preferredSupplierId, setPreferredSupplierId] = useState('');

  const { data: bins = [] } = useWarehouseBins(defaultWarehouseId || null);

  useEffect(() => {
    if (initialData) {
      setSku(initialData.sku || '');
      setName(initialData.name || '');
      setBarcode(initialData.barcode || '');
      setDescription(initialData.description || '');
      setCategoryId(typeof initialData.categoryId === 'object' ? initialData.categoryId?._id || '' : initialData.categoryId || '');
      setBrand(initialData.brand || '');
      setBaseUom(initialData.baseUom || 'PCS');
      setUomConversions(initialData.uomConversions || []);
      setTrackingType(initialData.trackingType || 'none');
      setHasExpiry(Boolean(initialData.hasExpiry));
      setShelfLifeDays(initialData.shelfLifeDays || 0);
      setMinStockLevel(initialData.minStockLevel || 0);
      setMaxStockLevel(initialData.maxStockLevel || 0);
      setReorderPoint(initialData.reorderPoint || 0);
      setReorderQuantity(initialData.reorderQuantity || 1);
      setStandardCost(initialData.standardCost || 0);
      setCurrency(initialData.currency || 'USD');
      setValuationMethod(initialData.valuationMethod || 'fifo');
      setDefaultWarehouseId(typeof initialData.defaultWarehouseId === 'object' ? initialData.defaultWarehouseId?._id || '' : initialData.defaultWarehouseId || '');
      setDefaultBinId(typeof initialData.defaultBinId === 'object' ? initialData.defaultBinId?._id || '' : initialData.defaultBinId || '');
      setPreferredSupplierId(typeof initialData.preferredSupplierId === 'object' ? initialData.preferredSupplierId?._id || '' : initialData.preferredSupplierId || '');
    } else {
      setSku('');
      setName('');
      setBarcode('');
      setDescription('');
      setCategoryId('');
      setBrand('');
      setBaseUom('PCS');
      setUomConversions([]);
      setTrackingType('none');
      setHasExpiry(false);
      setShelfLifeDays(0);
      setMinStockLevel(0);
      setMaxStockLevel(0);
      setReorderPoint(0);
      setReorderQuantity(1);
      setStandardCost(0);
      setCurrency('USD');
      setValuationMethod('fifo');
      setDefaultWarehouseId('');
      setDefaultBinId('');
      setPreferredSupplierId('');
    }
  }, [initialData, isOpen]);

  const handleAddUom = () => {
    setUomConversions([...uomConversions, { uom: '', conversionFactor: 1 }]);
  };

  const handleRemoveUom = (index: number) => {
    setUomConversions(uomConversions.filter((_, i) => i !== index));
  };

  const handleUomChange = (index: number, field: 'uom' | 'conversionFactor', val: any) => {
    const updated = [...uomConversions];
    updated[index] = { ...updated[index], [field]: val };
    setUomConversions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      sku: sku.trim() || undefined,
      name: name.trim(),
      barcode: barcode.trim() || undefined,
      description: description.trim(),
      categoryId: (categoryId || null) as any,
      brand: brand.trim(),
      baseUom: baseUom.toUpperCase(),
      uomConversions: uomConversions.filter((u) => u.uom.trim().length > 0),
      trackingType,
      hasExpiry,
      shelfLifeDays: Number(shelfLifeDays) || 0,
      minStockLevel: Number(minStockLevel) || 0,
      maxStockLevel: Number(maxStockLevel) || 0,
      reorderPoint: Number(reorderPoint) || 0,
      reorderQuantity: Number(reorderQuantity) || 1,
      standardCost: Number(standardCost) || 0,
      currency,
      valuationMethod,
      defaultWarehouseId: (defaultWarehouseId || null) as any,
      defaultBinId: (defaultBinId || null) as any,
      preferredSupplierId: (preferredSupplierId || null) as any,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white border border-slate-200/90 shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200/60 text-orange-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {initialData ? 'Edit Catalog Item' : 'New Catalog Item'}
                </h3>
                <p className="text-xs text-slate-500">
                  {initialData ? `Update SKU ${initialData.sku}` : 'Register a new stock keeping unit (SKU)'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-5 space-y-6 flex-1">
            {/* Primary Details */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                1. General Identification
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dell PowerEdge R750 2U Server"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    SKU / Code <span className="text-slate-400 font-normal">(Leave empty to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-SRV-R750"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400 uppercase focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select Category...</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name} ({cat.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Brand / Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dell, Cisco, Samsung"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Specifications
                </label>
                <textarea
                  rows={2}
                  placeholder="Detailed technical specifications, part specs, notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                />
              </div>
            </div>

            {/* Units & Conversions */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  2. Units of Measure (UoM) & Tracking
                </h4>
                <button
                  type="button"
                  onClick={handleAddUom}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Conversion
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Base UoM <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="PCS, BOX, KG, LITER"
                    value={baseUom}
                    onChange={(e) => setBaseUom(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tracking Type
                  </label>
                  <select
                    value={trackingType}
                    onChange={(e) => setTrackingType(e.target.value as TrackingType)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="none">Standard (No Tracking)</option>
                    <option value="batch">Batch / Lot Tracking</option>
                    <option value="serial">Serial Number Traceability</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valuation Method
                  </label>
                  <select
                    value={valuationMethod}
                    onChange={(e) => setValuationMethod(e.target.value as ValuationMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="fifo">FIFO (First-In, First-Out)</option>
                    <option value="weighted_average">Weighted Average Cost (WAC)</option>
                  </select>
                </div>
              </div>

              {/* UoM conversion list */}
              {uomConversions.map((conv, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block mb-0.5">1 Foreign UoM (e.g. BOX)</span>
                    <input
                      type="text"
                      placeholder="e.g. BOX, PALLET, TRAY"
                      value={conv.uom}
                      onChange={(e) => handleUomChange(idx, 'uom', e.target.value.toUpperCase())}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono uppercase"
                    />
                  </div>
                  <span className="text-slate-400 text-xs pt-4">=</span>
                  <div className="flex-1">
                    <span className="text-[10px] text-slate-500 block mb-0.5">Factor ({baseUom})</span>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={conv.conversionFactor}
                      onChange={(e) => handleUomChange(idx, 'conversionFactor', parseFloat(e.target.value) || 1)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveUom(idx)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors mt-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Expiry settings */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={hasExpiry}
                    onChange={(e) => setHasExpiry(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                  />
                  Has Shelf Life / Expiration Date
                </label>

                {hasExpiry && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Shelf life:</span>
                    <input
                      type="number"
                      min="0"
                      value={shelfLifeDays}
                      onChange={(e) => setShelfLifeDays(parseInt(e.target.value, 10) || 0)}
                      className="w-20 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-center"
                    />
                    <span className="text-xs text-slate-500">days</span>
                  </div>
                )}
              </div>
            </div>

            {/* Inventory Controls & Reorder Rules */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                3. Costing & Stock Thresholds
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Standard Cost ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={standardCost}
                    onChange={(e) => setStandardCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Reorder Point
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={reorderQuantity}
                    onChange={(e) => setReorderQuantity(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Min / Max Level
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(parseFloat(e.target.value) || 0)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-center"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={maxStockLevel}
                      onChange={(e) => setMaxStockLevel(parseFloat(e.target.value) || 0)}
                      className="w-1/2 px-2 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse & Supplier Defaults */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                4. Location & Supplier Defaults
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Warehouse
                  </label>
                  <select
                    value={defaultWarehouseId}
                    onChange={(e) => {
                      setDefaultWarehouseId(e.target.value);
                      setDefaultBinId('');
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select Warehouse...</option>
                    {warehouses.map((wh) => (
                      <option key={wh._id} value={wh._id}>
                        {wh.name} ({wh.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Default Bin Location
                  </label>
                  <select
                    value={defaultBinId}
                    disabled={!defaultWarehouseId}
                    onChange={(e) => setDefaultBinId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50"
                  >
                    <option value="">Select Bin...</option>
                    {bins.map((bin) => (
                      <option key={bin._id} value={bin._id}>
                        {bin.binCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Supplier
                  </label>
                  <select
                    value={preferredSupplierId}
                    onChange={(e) => setPreferredSupplierId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.supplierCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : initialData ? 'Update Item' : 'Create Catalog Item'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
