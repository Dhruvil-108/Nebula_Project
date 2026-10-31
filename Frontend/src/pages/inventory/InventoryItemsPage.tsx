import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  UploadCloud,
  QrCode,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Tag,
  Building2,
  Barcode,
} from 'lucide-react';
import {
  useInventoryItems,
  useItemCategories,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
} from '../../hooks/useInventory';
import { exportItemsCsv, getItemQrCode } from '../../lib/inventoryApi';
import type { InventoryItem } from '../../types/inventory';
import { CreateItemModal } from '../../components/inventory/CreateItemModal';
import { ItemQrModal } from '../../components/inventory/ItemQrModal';
import { CsvImportModal } from '../../components/inventory/CsvImportModal';

export const InventoryItemsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTracking, setSelectedTracking] = useState('all');
  const [page, setPage] = useState(1);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    isOpen: boolean;
    title: string;
    code: string;
    subtitle?: string;
    qrDataUrl?: string;
  }>({
    isOpen: false,
    title: '',
    code: '',
  });

  const { data: categories = [] } = useItemCategories();
  const { data: itemsResponse, isLoading } = useInventoryItems({
    search,
    categoryId: selectedCategory || undefined,
    trackingType: selectedTracking !== 'all' ? selectedTracking : undefined,
    page,
    limit: 25,
  });

  const createMutation = useCreateItem();
  const updateMutation = useUpdateItem();
  const deleteMutation = useDeleteItem();

  const items = itemsResponse?.items || [];
  const pagination = itemsResponse?.pagination;

  const handleOpenQr = async (item: InventoryItem) => {
    try {
      const res = await getItemQrCode(item._id);
      setQrModalData({
        isOpen: true,
        title: item.name,
        code: item.sku,
        subtitle: `UoM: ${item.baseUom} | Tracking: ${item.trackingType.toUpperCase()}`,
        qrDataUrl: res.qrDataUrl,
      });
    } catch (err) {
      console.error('Failed to get QR:', err);
    }
  };

  const handleExportCsv = async () => {
    try {
      await exportItemsCsv();
    } catch (err) {
      console.error('Failed to export items CSV:', err);
    }
  };

  const handleSaveItem = async (data: Partial<InventoryItem>) => {
    if (editingItem) {
      await updateMutation.mutateAsync({ id: editingItem._id, payload: data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate item "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
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
              Inventory Master Data
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total SKUs: {pagination?.total || 0}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Items & Catalog</h1>
          <p className="text-sm text-slate-500">
            Maintain your multi-warehouse item catalog, UoM conversions, and tracking rules.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
            Bulk Import CSV
          </button>

          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            New Item
          </button>
        </div>
      </motion.div>

      {/* ── Filters & Search Bar ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by SKU, item name, barcode, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tracking:</span>
            <select
              value={selectedTracking}
              onChange={(e) => setSelectedTracking(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="all">All Types</option>
              <option value="none">Standard (None)</option>
              <option value="batch">Batch / Lot</option>
              <option value="serial">Serial Number</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Items Table ── */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">SKU & Barcode</th>
                <th className="px-5 py-3.5">Item Name & Specs</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">UoM</th>
                <th className="px-5 py-3.5">Standard Cost</th>
                <th className="px-5 py-3.5">Reorder Point</th>
                <th className="px-5 py-3.5">Tracking</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <div className="inline-flex items-center gap-2 text-xs font-mono">
                      <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      Loading catalog items...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No catalog items found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Create your first SKU or bulk import via CSV.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">{item.sku}</span>
                        {item.barcode && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                            <Barcode className="w-3 h-3" />
                            {item.barcode}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-900">{item.name}</div>
                      {item.brand && <div className="text-[11px] text-slate-400">{item.brand}</div>}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {typeof item.categoryId === 'object' && item.categoryId ? item.categoryId.name : 'Uncategorized'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-slate-700">{item.baseUom}</span>
                      {item.uomConversions && item.uomConversions.length > 0 && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          +{item.uomConversions.length} conversions
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-slate-900 font-semibold">
                      ${(item.standardCost || 0).toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="font-mono text-slate-700">
                        {item.reorderPoint || 0} {item.baseUom}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Qty: {item.reorderQuantity || 1}
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold capitalize ${
                          item.trackingType === 'serial'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : item.trackingType === 'batch'
                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.trackingType}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                          item.active
                            ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/60'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {item.active ? 'Active' : 'Archived'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenQr(item)}
                          title="Generate QR / Print Label"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setShowCreateModal(true);
                          }}
                          title="Edit Item"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item._id, item.name)}
                          title="Deactivate"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateItemModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingItem(null);
        }}
        onSubmit={handleSaveItem}
        initialData={editingItem}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      <ItemQrModal
        isOpen={qrModalData.isOpen}
        onClose={() => setQrModalData((prev) => ({ ...prev, isOpen: false }))}
        title={qrModalData.title}
        code={qrModalData.code}
        subtitle={qrModalData.subtitle}
        qrDataUrl={qrModalData.qrDataUrl}
      />
    </div>
  );
};
