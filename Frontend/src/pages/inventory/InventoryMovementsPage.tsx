import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftRight,
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Building2,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Package,
  TrendingDown,
  TrendingUp,
  Boxes,
} from 'lucide-react';
import {
  useStockLedger,
  useStockBalances,
  useWarehouses,
  useReverseLedgerEntry,
  useBatchTrace,
  useSerialTrace,
} from '../../hooks/useInventory';
import type { StockTransactionType } from '../../types/inventory';
import { PostMovementModal, MovementTab } from '../../components/inventory/PostMovementModal';
import { TraceabilityModal } from '../../components/inventory/TraceabilityModal';

export const InventoryMovementsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'balances' | 'traceability'>('ledger');

  // Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [selectedTxType, setSelectedTxType] = useState<string>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [ledgerPage, setLedgerPage] = useState(1);

  // Balances Filters
  const [balanceSearch, setBalanceSearch] = useState('');
  const [balanceWarehouseId, setBalanceWarehouseId] = useState<string>('');

  // Traceability Quick Explorer
  const [traceIdentifier, setTraceIdentifier] = useState('BATCH-2026-001');
  const [traceType, setTraceType] = useState<'batch' | 'serial'>('batch');

  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postModalTab, setPostModalTab] = useState<MovementTab>('receipt');
  const [postModalItemId, setPostModalItemId] = useState<string | undefined>(undefined);
  const [postModalWarehouseId, setPostModalWarehouseId] = useState<string | undefined>(undefined);

  const [showTraceModal, setShowTraceModal] = useState(false);
  const [traceModalIdentifier, setTraceModalIdentifier] = useState('');
  const [traceModalType, setTraceModalType] = useState<'batch' | 'serial'>('batch');

  // Reversal Dialog State
  const [reversalTargetId, setReversalTargetId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState('');

  // Queries
  const { data: warehouses = [] } = useWarehouses(true);

  const { data: ledgerData, isLoading: loadingLedger } = useStockLedger({
    search: ledgerSearch.trim() || undefined,
    transactionType: (selectedTxType as StockTransactionType) || undefined,
    warehouseId: selectedWarehouseId || undefined,
    page: ledgerPage,
    limit: 25,
  });

  const { data: balances = [], isLoading: loadingBalances } = useStockBalances({
    search: balanceSearch.trim() || undefined,
    warehouseId: balanceWarehouseId || undefined,
  });

  const { data: batchTraceData } = useBatchTrace(
    traceType === 'batch' && traceIdentifier ? traceIdentifier : null
  );
  const { data: serialTraceData } = useSerialTrace(
    traceType === 'serial' && traceIdentifier ? traceIdentifier : null
  );

  const reverseLedgerMutation = useReverseLedgerEntry();

  const handleOpenPostModal = (tab: MovementTab, itId?: string, wId?: string) => {
    setPostModalTab(tab);
    setPostModalItemId(itId);
    setPostModalWarehouseId(wId);
    setShowPostModal(true);
  };

  const handleOpenTrace = (id: string, type: 'batch' | 'serial') => {
    setTraceModalIdentifier(id);
    setTraceModalType(type);
    setShowTraceModal(true);
  };

  const handleConfirmReversal = async () => {
    if (!reversalTargetId || !reversalReason.trim()) return;
    await reverseLedgerMutation.mutateAsync({
      ledgerId: reversalTargetId,
      reason: reversalReason.trim(),
    });
    setReversalTargetId(null);
    setReversalReason('');
  };

  // Balances Metrics Aggregates
  const totalValuation = balances.reduce((sum, b) => sum + (b.totalValuation || 0), 0);
  const totalOnHandUnits = balances.reduce((sum, b) => sum + (b.onHand || 0), 0);
  const totalReservedUnits = balances.reduce((sum, b) => sum + (b.reserved || 0), 0);
  const totalInTransitUnits = balances.reduce((sum, b) => sum + (b.inTransit || 0), 0);

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'receipt':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
            Receipt (GRN)
          </span>
        );
      case 'issue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <ArrowUpRight className="w-3 h-3 text-rose-600" />
            Issue
          </span>
        );
      case 'transfer_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <ArrowLeftRight className="w-3 h-3 text-blue-600" />
            Transfer Out
          </span>
        );
      case 'transfer_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">
            <ArrowLeftRight className="w-3 h-3 text-sky-600" />
            Transfer In
          </span>
        );
      case 'adjustment_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
            <SlidersHorizontal className="w-3 h-3 text-teal-600" />
            Adj In (+)
          </span>
        );
      case 'adjustment_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <SlidersHorizontal className="w-3 h-3 text-orange-600" />
            Adj Out (-)
          </span>
        );
      case 'cycle_count_variance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <RotateCcw className="w-3 h-3 text-purple-600" />
            Cycle Count
          </span>
        );
      case 'reversal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <RotateCcw className="w-3 h-3 text-amber-600" />
            Reversal
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
            {type.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-wider mb-1">
            <span>Inventory Management</span>
            <span>•</span>
            <span>Core Stock Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Stock Ledger & Movements
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable append-only stock audit ledger with live balance valuation and batch/serial traceability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleOpenTrace('', 'batch')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Traceability Inspector</span>
          </button>
          <button
            onClick={() => handleOpenPostModal('receipt')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-xs hover:shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post Movement</span>
          </button>
        </div>
      </div>

      {/* ── Metrics Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Valuation</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Real-time asset valuation across warehouses</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Units On-Hand</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalOnHandUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Physical stock physically present</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Allocated / Reserved</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalReservedUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Committed against open requisitions</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">In-Transit Stock</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {totalInTransitUnits.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Inter-warehouse transfer pipeline</p>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'ledger'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Stock Ledger (Audit Trail)</span>
        </button>

        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'balances'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Live Stock Balances ({balances.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'traceability'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Genealogy & Traceability</span>
        </button>
      </div>

      {/* ── TAB 1: STOCK LEDGER ── */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search doc #, SKU, notes..."
                value={ledgerSearch}
                onChange={(e) => {
                  setLedgerSearch(e.target.value);
                  setLedgerPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedTxType}
                onChange={(e) => {
                  setSelectedTxType(e.target.value);
                  setLedgerPage(1);
                }}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">All Movement Types</option>
                <option value="receipt">Goods Receipt (GRN)</option>
                <option value="issue">Stock Issue</option>
                <option value="transfer_out">Transfer Out</option>
                <option value="transfer_in">Transfer In</option>
                <option value="adjustment_in">Adjustment (+)</option>
                <option value="adjustment_out">Adjustment (-)</option>
                <option value="cycle_count_variance">Cycle Count Variance</option>
                <option value="reversal">Reversal</option>
              </select>

              <select
                value={selectedWarehouseId}
                onChange={(e) => {
                  setSelectedWarehouseId(e.target.value);
                  setLedgerPage(1);
                }}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                <option value="">All Warehouses</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Doc #</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Item Details</th>
                    <th className="py-3 px-4">Warehouse / Bin</th>
                    <th className="py-3 px-4">Batch / Serial</th>
                    <th className="py-3 px-4 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Total Cost</th>
                    <th className="py-3 px-4 text-right">Balance Qty</th>
                    <th className="py-3 px-4 text-right">Valuation</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingLedger ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading immutable ledger stream...
                      </td>
                    </tr>
                  ) : !ledgerData?.entries || ledgerData.entries.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        No stock ledger transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.entries.map((entry) => {
                      const isPositive = Number(entry.quantity) > 0;
                      return (
                        <tr
                          key={entry._id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            entry.isReversed ? 'bg-slate-50/60 opacity-60 line-through' : ''
                          }`}
                        >
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                            {new Date(entry.createdAt).toLocaleString(undefined, {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {entry.documentNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {getTxTypeBadge(entry.transactionType)}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{entry.itemId?.name || 'N/A'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              SKU: {entry.itemId?.sku || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                            <div>{entry.warehouseId?.name || 'N/A'}</div>
                            {entry.binId && (
                              <div className="text-[11px] text-slate-400">Bin: {entry.binId.binCode}</div>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {entry.batchNumber && (
                              <button
                                onClick={() => handleOpenTrace(entry.batchNumber!, 'batch')}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100"
                              >
                                <Layers className="w-3 h-3" />
                                {entry.batchNumber}
                              </button>
                            )}
                            {entry.serialNumber && (
                              <button
                                onClick={() => handleOpenTrace(entry.serialNumber!, 'serial')}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 ml-1"
                              >
                                <FileText className="w-3 h-3" />
                                {entry.serialNumber}
                              </button>
                            )}
                            {!entry.batchNumber && !entry.serialNumber && (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-bold">
                            <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                              {isPositive ? `+${entry.quantity}` : entry.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right text-slate-600">
                            ${Number(entry.unitCost || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-semibold text-slate-800">
                            ${Number(entry.totalCost || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-slate-900">
                            {entry.runningBalanceQty}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right font-bold text-slate-900">
                            ${Number(entry.runningValuation || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-center">
                            {!entry.isReversed && entry.transactionType !== 'reversal' ? (
                              <button
                                title="Post compensating reversal entry"
                                onClick={() => setReversalTargetId(entry._id)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">
                                {entry.isReversed ? 'Reversed' : 'Reversal Entry'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {ledgerData && ledgerData.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
                <span>
                  Showing page {ledgerData.pagination.page} of {ledgerData.pagination.totalPages} (Total{' '}
                  {ledgerData.pagination.total} entries)
                </span>
                <div className="flex gap-1">
                  <button
                    disabled={ledgerPage <= 1}
                    onClick={() => setLedgerPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    disabled={ledgerPage >= ledgerData.pagination.totalPages}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE STOCK BALANCES ── */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search stock balances by SKU / item name..."
                value={balanceSearch}
                onChange={(e) => setBalanceSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <select
              value={balanceWarehouseId}
              onChange={(e) => setBalanceWarehouseId(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 w-full sm:w-auto"
            >
              <option value="">Aggregate All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Balances Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Item SKU & Name</th>
                    <th className="py-3 px-4">Tracking</th>
                    <th className="py-3 px-4 text-right">On-Hand</th>
                    <th className="py-3 px-4 text-right">Reserved</th>
                    <th className="py-3 px-4 text-right">Available</th>
                    <th className="py-3 px-4 text-right">In-Transit</th>
                    <th className="py-3 px-4 text-right">Unit Cost</th>
                    <th className="py-3 px-4 text-right">Valuation</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loadingBalances ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Calculating multi-warehouse balance layers...
                      </td>
                    </tr>
                  ) : balances.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        No inventory items found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    balances.map((b) => {
                      const isLowStock =
                        b.item.reorderPoint > 0 && b.available <= b.item.reorderPoint;
                      const isOutOfStock = b.available <= 0;

                      return (
                        <tr key={b.itemId} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{b.item.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              SKU: {b.item.sku} • {b.item.baseUom}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] px-2 py-0.5 rounded-full capitalize font-semibold bg-slate-100 text-slate-700">
                              {b.item.trackingType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">
                            {b.onHand}
                          </td>
                          <td className="py-3 px-4 text-right text-amber-600 font-medium">
                            {b.reserved > 0 ? b.reserved : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span
                              className={
                                isOutOfStock
                                  ? 'text-rose-600 font-extrabold'
                                  : isLowStock
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }
                            >
                              {b.available}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-indigo-600 font-medium">
                            {b.inTransit > 0 ? b.inTransit : '—'}
                          </td>
                          <td className="py-3 px-4 text-right text-slate-600">
                            ${Number(b.unitCost || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            ${Number(b.totalValuation || 0).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                                OUT OF STOCK
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                                LOW STOCK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                HEALTHY
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  handleOpenPostModal('issue', b.itemId, balanceWarehouseId || undefined)
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                              >
                                Issue
                              </button>
                              <button
                                onClick={() =>
                                  handleOpenPostModal(
                                    'adjustment',
                                    b.itemId,
                                    balanceWarehouseId || undefined
                                  )
                                }
                                className="px-2.5 py-1 text-[11px] font-semibold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                              >
                                Adjust
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: TRACEABILITY EXPLORER ── */}
      {activeTab === 'traceability' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Search and Known Identifiers */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Traceability Query</h3>
                  <p className="text-[11px] text-slate-400">Search lot or unit custody history</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTraceType('batch');
                    setTraceIdentifier('BATCH-2026-001');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    traceType === 'batch'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Batch / Lot
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTraceType('serial');
                    setTraceIdentifier('SN-MAC-001');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    traceType === 'serial'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Serial Number
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Identifier Code
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={traceIdentifier}
                    onChange={(e) => setTraceIdentifier(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Enter code..."
                  />
                </div>
              </div>

              {/* Sample Quick Chips */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Sample Identifiers
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setTraceType('batch');
                      setTraceIdentifier('BATCH-2026-001');
                    }}
                    className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 border border-slate-200 transition-colors"
                  >
                    BATCH-2026-001
                  </button>
                  <button
                    onClick={() => {
                      setTraceType('serial');
                      setTraceIdentifier('SN-MAC-001');
                    }}
                    className="px-2 py-1 text-xs font-mono bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg text-slate-600 border border-slate-200 transition-colors"
                  >
                    SN-MAC-001
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trace Results View */}
          <div className="lg:col-span-2 space-y-4">
            {traceType === 'batch' && batchTraceData?.found && (
              <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
                        {batchTraceData.batchNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                        {batchTraceData.status || 'Active'}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {batchTraceData.item?.name}
                    </h2>
                    <p className="text-xs text-slate-400">
                      SKU: {batchTraceData.item?.sku} • Base UoM: {batchTraceData.item?.baseUom}
                    </p>
                  </div>

                  {batchTraceData.summary && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Remaining Balance</span>
                      <span className="text-2xl font-extrabold text-emerald-600">
                        {batchTraceData.summary.currentRemaining}
                      </span>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Genealogy Timeline</span>
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {batchTraceData.timeline?.map((step: any, idx: number) => {
                      const isPositive = Number(step.quantity) > 0;
                      return (
                        <div key={idx} className="relative group">
                          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-indigo-500 border-2 border-white shadow-xs" />
                          <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold capitalize text-slate-900">
                                {step.type.replace(/_/g, ' ')} ({step.documentNumber})
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {new Date(step.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-600">
                              <span>Warehouse: {step.warehouse}</span>
                              <span>
                                Qty:{' '}
                                <strong className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                                  {isPositive ? `+${step.quantity}` : step.quantity}
                                </strong>
                              </span>
                              {step.unitCost && <span>Cost: ${Number(step.unitCost).toFixed(2)}</span>}
                            </div>
                            {step.notes && (
                              <p className="mt-1 text-[11px] text-slate-500 italic">“{step.notes}”</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {traceType === 'serial' && serialTraceData?.found && (
              <div className="p-6 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                        {serialTraceData.serialNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 capitalize">
                        {serialTraceData.status || 'Active'}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {serialTraceData.item?.name}
                    </h2>
                    <p className="text-xs text-slate-400">SKU: {serialTraceData.item?.sku}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lifecycle Timeline</span>
                  </h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {serialTraceData.timeline?.map((step: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white shadow-xs" />
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold capitalize text-slate-900">
                              {step.type.replace(/_/g, ' ')} ({step.documentNumber})
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(step.date).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-600">
                            <span>Warehouse: {step.warehouse}</span>
                            {step.actor && <span>Operator: {step.actor}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {((traceType === 'batch' && !batchTraceData?.found) ||
              (traceType === 'serial' && !serialTraceData?.found)) && (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 text-slate-400">
                <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No Trace Record Found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Enter an existing batch or serial number to inspect its chain of custody.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Compensating Reversal Dialog ── */}
      <AnimatePresence>
        {reversalTargetId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setReversalTargetId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-6 z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Post Compensating Reversal</h3>
                  <p className="text-xs text-slate-500">Immutable correction entry with opposite sign</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Audit Reversal Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Wrong quantity entered on original GRN by operator..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReversalTargetId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!reversalReason.trim() || reverseLedgerMutation.isPending}
                  onClick={handleConfirmReversal}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {reverseLedgerMutation.isPending ? 'Posting Reversal...' : 'Confirm Reversal'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Post Movement Modal ── */}
      <PostMovementModal
        isOpen={showPostModal}
        onClose={() => setShowPostModal(false)}
        defaultTab={postModalTab}
        initialItemId={postModalItemId}
        initialWarehouseId={postModalWarehouseId}
      />

      {/* ── Traceability Modal ── */}
      <TraceabilityModal
        isOpen={showTraceModal}
        onClose={() => setShowTraceModal(false)}
        initialIdentifier={traceModalIdentifier}
        initialType={traceModalType}
      />
    </div>
  );
};
