import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  BarChart3,
  PieChart,
  Grid,
  Clock,
  TrendingUp,
  Download,
  RefreshCw,
  DollarSign,
  Package,
  Layers,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Truck,
  Sparkles,
  ArrowUpRight,
  Filter,
  Info,
} from 'lucide-react';

import {
  getAnalyticsOverview,
  getStockValuationReport,
  getAbcXyzAnalysis,
  getStockAgingReport,
  getInventoryTurnover,
  getFulfillmentOtif,
  exportAnalyticsCsv,
} from '../../lib/inventoryAnalyticsApi';
import type { MatrixCell } from '../../types/inventoryAnalytics';

export const InventoryAnalyticsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'valuation' | 'matrix' | 'aging' | 'turnover'>('overview');
  const [selectedCellKey, setSelectedCellKey] = useState<string>('AX');
  const [exportingType, setExportingType] = useState<string | null>(null);

  // ── Queries ──
  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
    queryKey: ['inventory-analytics-overview'],
    queryFn: getAnalyticsOverview,
  });

  const { data: valuation, isLoading: valLoading } = useQuery({
    queryKey: ['inventory-analytics-valuation'],
    queryFn: getStockValuationReport,
    enabled: activeTab === 'valuation' || activeTab === 'overview',
  });

  const { data: abcXyzData, isLoading: matrixLoading } = useQuery({
    queryKey: ['inventory-analytics-abcxyz'],
    queryFn: () => getAbcXyzAnalysis(180),
    enabled: activeTab === 'matrix',
  });

  const { data: agingData, isLoading: agingLoading } = useQuery({
    queryKey: ['inventory-analytics-aging'],
    queryFn: getStockAgingReport,
    enabled: activeTab === 'aging',
  });

  const { data: turnoverData, isLoading: turnoverLoading } = useQuery({
    queryKey: ['inventory-analytics-turnover'],
    queryFn: () => getInventoryTurnover(365),
    enabled: activeTab === 'turnover',
  });

  const { data: otifData, isLoading: otifLoading } = useQuery({
    queryKey: ['inventory-analytics-otif'],
    queryFn: getFulfillmentOtif,
    enabled: activeTab === 'turnover',
  });

  // ── CSV Export Handler ──
  const handleExport = async (type: 'valuation' | 'abc' | 'aging') => {
    try {
      setExportingType(type);
      await exportAnalyticsCsv(type);
      toast.success(`${type.toUpperCase()} Report downloaded successfully!`);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to export ${type} report: ${err.message || 'Error'}`);
    } finally {
      setExportingType(null);
    }
  };

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-analytics'] });
    refetchOverview();
    toast.info('Refreshing real-time analytics...');
  };

  const kpis = overview?.kpis;

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Inventory Analytics & Reports
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Pareto ABC/XYZ matrix, multi-warehouse valuation, stock aging, turnover & OTIF fulfillment metrics.
          </p>
        </div>

        {/* Global Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick CSV Dropdown / Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => handleExport('valuation')}
              disabled={!!exportingType}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              {exportingType === 'valuation' ? 'Valuation...' : 'Valuation CSV'}
            </button>
            <button
              onClick={() => handleExport('abc')}
              disabled={!!exportingType}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              {exportingType === 'abc' ? 'ABC...' : 'ABC CSV'}
            </button>
            <button
              onClick={() => handleExport('aging')}
              disabled={!!exportingType}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              {exportingType === 'aging' ? 'Aging...' : 'Aging CSV'}
            </button>
          </div>

          <button
            onClick={handleRefreshAll}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
            title="Refresh All Analytics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Executive KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Valuation */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Valuation</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              ${kpis?.totalValuation?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Across {kpis?.totalStockUnits?.toLocaleString() || 0} units
          </div>
        </div>

        {/* KPI 2: Active Catalog */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Catalog</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis?.totalActiveSkus || 0}
            </span>
            <span className="text-xs text-slate-500">Active SKUs</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> In-stock portfolio
          </div>
        </div>

        {/* KPI 3: Turnover Ratio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Turnover / DSI</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {kpis?.turnoverRatio || 0}x
            </span>
            <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              {kpis?.efficiencyRating || 'Optimal'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            DSI: {kpis?.daysSalesOfInventory || 0} days
          </div>
        </div>

        {/* KPI 4: Stagnant Capital */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Dead Stock (&gt;90d)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              ${kpis?.totalStagnantCapital?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 flex items-center gap-1">
            {Number(kpis?.totalStagnantCapital || 0) > 0 ? (
              <span className="text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Capital tied up
              </span>
            ) : (
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Zero stagnant stock
              </span>
            )}
          </div>
        </div>

        {/* KPI 5: Supplier OTIF */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">OTIF Fill-Rate</span>
            <Truck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {kpis?.otifRate || 0}%
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            On-Time: {kpis?.onTimeRate || 0}% | In-Full: {kpis?.inFullRate || 0}%
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'valuation'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Valuation & Warehouses
        </button>
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'matrix'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Grid className="w-4 h-4" />
          9-Cell ABC-XYZ Matrix
        </button>
        <button
          onClick={() => setActiveTab('aging')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'aging'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Stock Aging & Dead Stock
        </button>
        <button
          onClick={() => setActiveTab('turnover')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors whitespace-nowrap ${
            activeTab === 'turnover'
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Turnover & OTIF Fulfillment
        </button>
      </div>

      {/* ── Tab 1: Executive Overview ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warehouse Allocation Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Warehouse Valuation Share</h3>
                </div>
                <span className="text-xs text-slate-500">{overview?.warehouseBreakdown?.length || 0} Facilities</span>
              </div>
              <div className="space-y-4">
                {overview?.warehouseBreakdown?.map((wh) => (
                  <div key={wh._id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {wh.name} <span className="text-xs text-slate-400">({wh.code})</span>
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${wh.valuation.toLocaleString()} ({wh.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, wh.percentage)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>{wh.skuCount} active SKUs</span>
                      <span>{wh.units.toLocaleString()} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Allocation Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Category Allocation Share</h3>
                </div>
                <span className="text-xs text-slate-500">{overview?.categoryBreakdown?.length || 0} Categories</span>
              </div>
              <div className="space-y-4">
                {overview?.categoryBreakdown?.map((cat) => (
                  <div key={cat._id} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {cat.name} <span className="text-xs text-slate-400">({cat.code})</span>
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        ${cat.valuation.toLocaleString()} ({cat.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 flex justify-between">
                      <span>{cat.skuCount} active SKUs</span>
                      <span>{cat.units.toLocaleString()} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Valuation Deep Dive ── */}
      {activeTab === 'valuation' && (
        <div className="space-y-6">
          {/* Valuation Method Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Stock Assets</span>
              <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                ${valuation?.summary.totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">Aggregated inventory balance sheet value</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">FIFO Cost Layering</span>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${valuation?.summary.fifoValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">Valued via first-in, first-out cost tranches</p>
            </div>
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Weighted Average (WAC)</span>
              <div className="mt-2 text-2xl font-bold text-purple-600 dark:text-purple-400">
                ${valuation?.summary.wacValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">Moving average unit cost items</p>
            </div>
          </div>

          {/* Full Warehouse Detail Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Warehouse Valuation Ledger</h3>
              <button
                onClick={() => handleExport('valuation')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Export Table
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Warehouse</th>
                    <th className="px-6 py-3">Code</th>
                    <th className="px-6 py-3 text-right">SKU Count</th>
                    <th className="px-6 py-3 text-right">Physical Units</th>
                    <th className="px-6 py-3 text-right">Valuation</th>
                    <th className="px-6 py-3 text-right">% Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {valuation?.warehouseBreakdown.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{row.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{row.code}</td>
                      <td className="px-6 py-4 text-right">{row.skuCount}</td>
                      <td className="px-6 py-4 text-right font-medium">{row.units.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                        ${row.valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">{row.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: 9-Cell ABC-XYZ Strategy Matrix ── */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Header Explanation */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-sm text-indigo-900 dark:text-indigo-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold">The 9-Cell ABC-XYZ Strategy Matrix:</span>
              <p className="mt-0.5 text-xs text-indigo-800 dark:text-indigo-300">
                Categorizes SKUs by <strong>Consumption Value (A = top 80%, B = next 15%, C = 5%)</strong> against{' '}
                <strong>Demand Predictability (X = constant, Y = fluctuating, Z = irregular/lumpy)</strong>. Click any cell to view
                recommended replenishment policies and assigned items.
              </p>
            </div>
          </div>

          {/* 3x3 Grid Display */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="grid grid-cols-4 gap-3 text-center">
              {/* Header Corner */}
              <div className="p-3 font-semibold text-xs text-slate-400 uppercase tracking-wider flex items-center justify-center">
                ABC \ XYZ
              </div>
              <div className="p-3 font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 rounded-xl">
                X (Constant)
              </div>
              <div className="p-3 font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 rounded-xl">
                Y (Fluctuating)
              </div>
              <div className="p-3 font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 rounded-xl">
                Z (Lumpy / Irregular)
              </div>

              {/* Row A */}
              <div className="p-3 font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                A (High Value)
              </div>
              {['AX', 'AY', 'AZ'].map((cellKey) => {
                const cell = abcXyzData?.matrix.cells[cellKey];
                const isSelected = selectedCellKey === cellKey;
                return (
                  <button
                    key={cellKey}
                    onClick={() => setSelectedCellKey(cellKey)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{cellKey}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                        {cell?.count || 0} SKUs
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{cell?.strategy || 'Replenishment policy'}</p>
                  </button>
                );
              })}

              {/* Row B */}
              <div className="p-3 font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                B (Medium Value)
              </div>
              {['BX', 'BY', 'BZ'].map((cellKey) => {
                const cell = abcXyzData?.matrix.cells[cellKey];
                const isSelected = selectedCellKey === cellKey;
                return (
                  <button
                    key={cellKey}
                    onClick={() => setSelectedCellKey(cellKey)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{cellKey}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                        {cell?.count || 0} SKUs
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{cell?.strategy || 'Replenishment policy'}</p>
                  </button>
                );
              })}

              {/* Row C */}
              <div className="p-3 font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                C (Low Value)
              </div>
              {['CX', 'CY', 'CZ'].map((cellKey) => {
                const cell = abcXyzData?.matrix.cells[cellKey];
                const isSelected = selectedCellKey === cellKey;
                return (
                  <button
                    key={cellKey}
                    onClick={() => setSelectedCellKey(cellKey)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{cellKey}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {cell?.count || 0} SKUs
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{cell?.strategy || 'Replenishment policy'}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Cell Items Breakdown */}
          {selectedCellKey && (
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Cell [{selectedCellKey}] Strategy & Items</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                      {abcXyzData?.matrix.cells[selectedCellKey]?.count || 0} Items
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                    <strong>Recommended Strategy:</strong> {abcXyzData?.matrix.cells[selectedCellKey]?.strategy}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">SKU</th>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3 text-right">Standard Cost</th>
                      <th className="px-6 py-3 text-right">Consumption Value</th>
                      <th className="px-6 py-3 text-center">Class</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {abcXyzData?.matrix.cells[selectedCellKey]?.items.length ? (
                      abcXyzData.matrix.cells[selectedCellKey].items.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 font-medium">{item.name}</td>
                          <td className="px-6 py-4 text-right">${item.standardCost?.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">
                            ${(item.consumptionValue || item.valuation || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-2 py-1 text-xs rounded-md font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                              {selectedCellKey}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                          No items currently classified under matrix cell {selectedCellKey}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 4: Stock Aging & Dead Stock ── */}
      {activeTab === 'aging' && (
        <div className="space-y-6">
          {/* Aging Buckets Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* 0-30d */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">0 - 30 Days (Fresh)</span>
              <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                ${agingData?.buckets.under30.valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {agingData?.buckets.under30.units.toLocaleString()} units ({agingData?.buckets.under30.items.length} SKUs)
              </p>
            </div>

            {/* 31-60d */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">31 - 60 Days (Normal)</span>
              <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                ${agingData?.buckets.thirtyToSixty.valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {agingData?.buckets.thirtyToSixty.units.toLocaleString()} units ({agingData?.buckets.thirtyToSixty.items.length} SKUs)
              </p>
            </div>

            {/* 61-90d */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">61 - 90 Days (Slow)</span>
              <div className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                ${agingData?.buckets.sixtyToNinety.valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {agingData?.buckets.sixtyToNinety.units.toLocaleString()} units ({agingData?.buckets.sixtyToNinety.items.length} SKUs)
              </p>
            </div>

            {/* >90d */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 shadow-sm bg-amber-50/20 dark:bg-amber-950/20">
              <span className="text-xs text-amber-700 dark:text-amber-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> &gt; 90 Days (Dead Stock)
              </span>
              <div className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
                ${agingData?.buckets.over90.valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {agingData?.buckets.over90.units.toLocaleString()} units ({agingData?.buckets.over90.items.length} SKUs)
              </p>
            </div>
          </div>

          {/* Stagnant & Aging Stock Details Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-white">Detailed Aging Item Inventory</h3>
              <button
                onClick={() => handleExport('aging')}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Export Aging CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Item Name</th>
                    <th className="px-6 py-3 text-right">Current Stock</th>
                    <th className="px-6 py-3 text-right">Standard Cost</th>
                    <th className="px-6 py-3 text-right">Valuation</th>
                    <th className="px-6 py-3 text-right">Age (Days)</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {agingData ? (
                    [
                      ...agingData.buckets.over90.items,
                      ...agingData.buckets.sixtyToNinety.items,
                      ...agingData.buckets.thirtyToSixty.items,
                      ...agingData.buckets.under30.items,
                    ].map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="px-6 py-4 text-right">{item.currentStock}</td>
                        <td className="px-6 py-4 text-right">${item.standardCost.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                          ${item.valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">{item.ageDays} d</td>
                        <td className="px-6 py-4 text-center">
                          {item.ageDays > 90 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                              Dead Stock
                            </span>
                          ) : item.ageDays > 60 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Slow
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                              Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Loading aging data...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 5: Turnover & OTIF Fulfillment ── */}
      {activeTab === 'turnover' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Turnover & Efficiency */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Inventory Velocity & DSI</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  {turnoverData?.efficiencyRating || 'Optimal'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase">Turnover Ratio</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {turnoverData?.turnoverRatio || 0}x
                  </div>
                  <span className="text-xs text-slate-500">Times stock cycled / year</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-xs text-slate-400 font-medium uppercase">Days Sales of Inv (DSI)</span>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {turnoverData?.daysSalesOfInventory || 0} days
                  </div>
                  <span className="text-xs text-slate-500">Days to liquidate on-hand stock</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Annualized Cost of Goods Sold (COGS):</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    ${turnoverData?.totalCogs.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Inventory Valuation:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    ${turnoverData?.avgInventory.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Supplier OTIF Fulfillment */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Supplier OTIF Fulfillment</h3>
                </div>
                <span className="text-xs text-slate-500">365-Day Window</span>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/40">
                  <span className="text-xs text-purple-600 dark:text-purple-300 font-semibold">Composite OTIF</span>
                  <div className="text-xl font-bold text-purple-700 dark:text-purple-400 mt-1">
                    {otifData?.metrics.otifRate || 0}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-xs text-slate-500 font-semibold">On-Time</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {otifData?.metrics.onTimeRate || 0}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-xs text-slate-500 font-semibold">In-Full</span>
                  <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                    {otifData?.metrics.inFullRate || 0}%
                  </div>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Evaluated Purchase Orders:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{otifData?.totalEvaluatedPos || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fully Received POs:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{otifData?.fullyReceivedPos || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>On-Time Receipt POs:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{otifData?.onTimePos || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryAnalyticsPage;
