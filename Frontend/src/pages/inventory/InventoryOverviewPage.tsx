import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package,
  Building2,
  Truck,
  Layers,
  ArrowRight,
  TrendingUp,
  Download,
  UploadCloud,
  Plus,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  DollarSign,
  Boxes,
  ArrowLeftRight,
  ShoppingCart,
  Laptop,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  useInventoryItems,
  useWarehouses,
  useSuppliers,
  useItemCategories,
} from '../../hooks/useInventory';

export const InventoryOverviewPage: React.FC = () => {
  const { data: itemsResponse } = useInventoryItems({ limit: 5 });
  const { data: warehouses = [] } = useWarehouses();
  const { data: suppliersResponse } = useSuppliers({ limit: 5 });
  const { data: categories = [] } = useItemCategories();

  const items = itemsResponse?.items || [];
  const totalItems = itemsResponse?.pagination?.total || 0;
  const suppliers = suppliersResponse?.suppliers || [];
  const totalSuppliers = suppliersResponse?.pagination?.total || 0;

  const totalBins = warehouses.reduce((acc, wh) => acc + (wh.binCount || 0), 0);
  const totalStandardValue = items.reduce(
    (acc, item) => acc + (item.standardCost || 0) * (item.reorderPoint || 1),
    0
  );

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100/70 border border-orange-200/60 text-orange-700 text-[11px] font-bold">
              <Package className="w-3 h-3 text-orange-500" />
              Enterprise Inventory Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory & Supply Operations
          </h1>
          <p className="text-sm text-slate-500">
            Real-time multi-tenant stock ledger, master catalog, warehouse topology, and procurement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/dashboard/inventory/items"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            Manage Catalog
          </Link>
        </div>
      </motion.div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Catalog Items</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2 font-mono">
            {totalItems}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>Across {categories.length} categories</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Storage Facilities</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2 font-mono">
            {warehouses.length}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>{totalBins} tracked bin slots</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Approved Suppliers</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2 font-mono">
            {totalSuppliers}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>Verified vendor networks</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Standard Catalog Base</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight mt-2 font-mono">
            ${totalStandardValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
            <span>Weighted benchmark cost</span>
          </div>
        </div>
      </div>

      {/* ── Quick Jump Modules ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          to="/dashboard/inventory/items"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-orange-300 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-orange-100/70 border border-orange-200/60 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Package className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Items & Catalog</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Manage SKUs, variants, hierarchical categories, UoM conversions, and barcode labels.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/warehouses"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-100/70 border border-blue-200/60 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Warehouses & Bins</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Configure multi-location facilities, storage zones, rack/bin slots, and print shelf QR codes.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/movements"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100/70 border border-amber-200/60 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <ArrowLeftRight className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Stock & Movements</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Append-only double-entry ledger, GRN receipts, issues, inter-warehouse transfers, and batch traceability.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/procurement"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-purple-300 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-100/70 border border-purple-200/60 text-purple-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Procurement & POs</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Purchase Requisitions (PR), multi-currency POs, 3-Way Match validation, RTV, and PDF generation.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/assets"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-100/70 border border-indigo-200/60 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Laptop className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Equipment & HRMS Assets</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Role-based equipment kits, automated employee provisioning, serial-number tagging, and offboarding exit returns.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/ai"
          className="group p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-md hover:border-indigo-500 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">AI Copilot & Radar</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Gemini demand forecasting, invoice OCR line checks, shrinkage radar, and natural-language query assistant.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/analytics"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-indigo-400 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Analytics & Reports</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Pareto ABC/XYZ matrix, multi-warehouse valuation, stock aging, turnover & OTIF fulfillment metrics.
          </p>
        </Link>

        <Link
          to="/dashboard/inventory/suppliers"
          className="group p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100/70 border border-emerald-200/60 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
            <Truck className="w-6 h-6" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Suppliers & Rates</h3>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Maintain supplier credentials, payment terms, delivery lead times, and item contract rates.
          </p>
        </Link>
      </div>

      {/* ── Recent Items Snapshot ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Catalog Items</h3>
            <p className="text-xs text-slate-500">Newly registered SKUs in this tenant</p>
          </div>
          <Link
            to="/dashboard/inventory/items"
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            View All SKUs
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Base UoM</th>
                <th className="px-5 py-3">Standard Cost</th>
                <th className="px-5 py-3">Tracking</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">{item.sku}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{item.name}</td>
                  <td className="px-5 py-3 font-mono text-slate-600">{item.baseUom}</td>
                  <td className="px-5 py-3 font-mono text-slate-900 font-semibold">
                    ${(item.standardCost || 0).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 capitalize text-slate-600">{item.trackingType}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
