import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Layers, CheckCircle2 } from 'lucide-react';
import type { WarehouseBin, WarehouseZone } from '../../types/inventory';

interface CreateBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string;
  zones: WarehouseZone[];
  onSubmit: (data: Partial<WarehouseBin>) => Promise<void>;
  isSubmitting?: boolean;
}

export const CreateBinModal: React.FC<CreateBinModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  zones,
  onSubmit,
  isSubmitting = false,
}) => {
  const [binCode, setBinCode] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [maxWeightKg, setMaxWeightKg] = useState(0);
  const [maxVolumeCubicM, setMaxVolumeCubicM] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      binCode: binCode.trim() || undefined,
      zoneId: (zoneId || null) as any,
      barcode: barcode.trim() || undefined,
      capacity: {
        maxWeightKg: Number(maxWeightKg) || 0,
        maxVolumeCubicM: Number(maxVolumeCubicM) || 0,
      },
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
          className="relative w-full max-w-md rounded-2xl bg-white border border-slate-200/90 shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100/70 border border-orange-200/60 text-orange-600 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">New Bin Location</h3>
                <p className="text-xs text-slate-500">Add an aisle, rack, shelf or floor storage slot</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bin Code <span className="text-slate-400 font-normal">(Leave empty to auto-generate)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. RACK-A1-04"
                value={binCode}
                onChange={(e) => setBinCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zone Assignment</label>
              <select
                value={zoneId}
                onChange={(e) => setZoneId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              >
                <option value="">No Zone (General Storage)</option>
                {zones.map((z) => (
                  <option key={z._id} value={z._id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Barcode / Identifier
              </label>
              <input
                type="text"
                placeholder="Defaults to bin code"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Weight (kg)</label>
                <input
                  type="number"
                  min="0"
                  value={maxWeightKg}
                  onChange={(e) => setMaxWeightKg(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Volume (m³)</label>
                <input
                  type="number"
                  min="0"
                  value={maxVolumeCubicM}
                  onChange={(e) => setMaxVolumeCubicM(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-800"
                />
              </div>
            </div>

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
                {isSubmitting ? 'Saving...' : 'Create Bin'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
