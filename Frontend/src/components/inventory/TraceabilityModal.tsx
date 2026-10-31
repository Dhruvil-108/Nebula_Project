import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Layers,
  FileText,
  Calendar,
  Building2,
  User,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Boxes,
} from 'lucide-react';
import { useBatchTrace, useSerialTrace } from '../../hooks/useInventory';

interface TraceabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  initialType?: 'batch' | 'serial';
}

export const TraceabilityModal: React.FC<TraceabilityModalProps> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  initialType = 'batch',
}) => {
  const [traceType, setTraceType] = useState<'batch' | 'serial'>(initialType);
  const [searchInput, setSearchInput] = useState(initialIdentifier);
  const [activeIdentifier, setActiveIdentifier] = useState(initialIdentifier);

  const { data: batchData, isLoading: loadingBatch } = useBatchTrace(
    traceType === 'batch' && activeIdentifier ? activeIdentifier : null
  );

  const { data: serialData, isLoading: loadingSerial } = useSerialTrace(
    traceType === 'serial' && activeIdentifier ? activeIdentifier : null
  );

  const isLoading = traceType === 'batch' ? loadingBatch : loadingSerial;
  const currentData = traceType === 'batch' ? batchData : serialData;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setActiveIdentifier(searchInput.trim());
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
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Traceability & Genealogy Inspector</h2>
                <p className="text-xs text-slate-500">Track full historical custody and movement lifecycle</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar & Switcher */}
          <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTraceType('batch');
                  setActiveIdentifier('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  traceType === 'batch'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Batch / Lot Number</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTraceType('serial');
                  setActiveIdentifier('');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  traceType === 'serial'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Serial Number</span>
              </button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    traceType === 'batch'
                      ? 'Enter batch / lot number (e.g. BATCH-2026-001)...'
                      : 'Enter unit serial number (e.g. SN-MAC-001)...'
                  }
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!searchInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-xs transition-all disabled:opacity-50"
              >
                Trace
              </button>
            </form>
          </div>

          {/* Results Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs">Querying blockchain-style audit ledger...</p>
              </div>
            )}

            {!isLoading && (!currentData || !currentData.found) && (
              <div className="text-center py-12 text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-700">No Trace Record Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  {activeIdentifier
                    ? `No registered ${traceType} history found for "${activeIdentifier}". Try searching another identifier.`
                    : `Enter a valid ${traceType} code above to query full genealogy.`}
                </p>
              </div>
            )}

            {!isLoading && currentData && currentData.found && (
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200 text-indigo-700">
                          {traceType === 'batch' ? batchData?.batchNumber : serialData?.serialNumber}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                            currentData.status === 'active' || currentData.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : currentData.status === 'issued'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {currentData.status || 'Active'}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1">
                        {currentData.item?.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        SKU: {currentData.item?.sku} • Base UoM: {currentData.item?.baseUom}
                      </p>
                    </div>

                    {traceType === 'batch' && batchData?.summary && (
                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Total Received</span>
                          <span className="font-bold text-slate-800">
                            +{batchData.summary.totalInbound}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 block text-[11px]">Total Issued</span>
                          <span className="font-bold text-rose-600">
                            -{batchData.summary.totalOutbound}
                          </span>
                        </div>
                        <div className="text-right pl-3 border-l border-slate-200">
                          <span className="text-slate-400 block text-[11px]">Current Remaining</span>
                          <span className="font-bold text-emerald-600 text-sm">
                            {batchData.summary.currentRemaining}
                          </span>
                        </div>
                      </div>
                    )}

                    {traceType === 'serial' && serialData && (
                      <div className="text-right text-xs">
                        {serialData.currentLocation?.warehouse && (
                          <div className="flex items-center gap-1 text-slate-700 justify-end">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>{serialData.currentLocation.warehouse.name}</span>
                          </div>
                        )}
                        {serialData.issuedTo?.user && (
                          <div className="flex items-center gap-1 text-blue-700 justify-end mt-1">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            <span>Issued to: {serialData.issuedTo.user.name}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Batch Dates or Serial Details */}
                  {traceType === 'batch' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Manufacture Date</span>
                        <span className="font-medium text-slate-700">
                          {batchData?.manufactureDate
                            ? new Date(batchData.manufactureDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Expiry Date</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">
                            {batchData?.expiryDate
                              ? new Date(batchData.expiryDate).toLocaleDateString()
                              : 'No Expiry Set'}
                          </span>
                          {batchData?.isExpired && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold rounded">
                              EXPIRED
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Supplier / Origin</span>
                        <span className="font-medium text-slate-700">
                          {batchData?.supplier?.name || 'In-house / Standard'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timeline Stepper */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Audit Movement Timeline</span>
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {currentData.timeline?.map((step: any, idx: number) => {
                      const isPositive = Number(step.quantity) > 0;
                      return (
                        <div key={idx} className="relative group">
                          {/* Dot icon */}
                          <div
                            className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px] shadow-xs ${
                              step.type.includes('receipt')
                                ? 'bg-emerald-500'
                                : step.type.includes('issue')
                                ? 'bg-rose-500'
                                : step.type.includes('transfer')
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold capitalize text-slate-900">
                                  {step.type.replace(/_/g, ' ')}
                                </span>
                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {step.documentNumber}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {new Date(step.date).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  {step.warehouse || 'Warehouse'} {step.bin ? `(Bin: ${step.bin})` : ''}
                                </span>
                              </div>
                              <div>
                                Quantity:{' '}
                                <strong
                                  className={isPositive ? 'text-emerald-600' : 'text-rose-600'}
                                >
                                  {isPositive ? `+${step.quantity}` : step.quantity}
                                </strong>
                              </div>
                              {step.unitCost !== undefined && (
                                <div>
                                  Cost:{' '}
                                  <strong className="text-slate-800">
                                    ${Number(step.unitCost).toFixed(2)}
                                  </strong>
                                </div>
                              )}
                              {step.actor && (
                                <div className="flex items-center gap-1 text-slate-500">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{step.actor}</span>
                                </div>
                              )}
                            </div>

                            {step.notes && (
                              <p className="mt-2 text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                                “{step.notes}”
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
