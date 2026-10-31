import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Search,
  Download,
  Mail,
  Phone,
  Clock,
  Star,
  DollarSign,
  Tag,
  Building2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  useSuppliers,
  useCreateSupplier,
  useUpdateSupplierPrice,
} from '../../hooks/useInventory';
import { exportSuppliersCsv } from '../../lib/inventoryApi';
import type { Supplier } from '../../types/inventory';
import { CreateSupplierModal } from '../../components/inventory/CreateSupplierModal';

export const InventorySuppliersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);

  const { data: suppliersResponse, isLoading } = useSuppliers({
    search,
    page,
    limit: 25,
  });

  const createSupplierMutation = useCreateSupplier();
  const updatePriceMutation = useUpdateSupplierPrice();

  const suppliers = suppliersResponse?.suppliers || [];
  const pagination = suppliersResponse?.pagination;

  const handleExportCsv = async () => {
    try {
      await exportSuppliersCsv();
    } catch (err) {
      console.error('Failed to export suppliers:', err);
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
              <Truck className="w-3 h-3 text-orange-500" />
              Procurement & Vendor Master
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total Vendors: {pagination?.total || 0}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Suppliers & Price Lists</h1>
          <p className="text-sm text-slate-500">
            Vendor master profiles, lead times, tax registrations, payment terms, and negotiated contract prices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-all"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            New Supplier
          </button>
        </div>
      </motion.div>

      {/* ── Search Bar ── */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by name, code, email, tax ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      {/* ── Suppliers Grid ── */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-mono">
          Loading suppliers...
        </div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <Truck className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-700">No Suppliers Found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Click "New Supplier" to register your first vendor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((s) => (
            <div
              key={s._id}
              className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 border border-orange-200/60 px-2 py-0.5 rounded-lg">
                    {s.supplierCode}
                  </span>
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{(s.rating?.score || 5.0).toFixed(1)}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 tracking-tight mt-2">
                  {s.name}
                </h3>

                {s.contactPerson?.name && (
                  <p className="text-xs text-slate-600 mt-1">
                    Contact: <strong>{s.contactPerson.name}</strong>
                  </p>
                )}

                <div className="space-y-1 mt-3 text-xs text-slate-500">
                  {s.contactPerson?.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.contactPerson.email}</span>
                    </div>
                  )}
                  {s.contactPerson?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.contactPerson.phone}</span>
                    </div>
                  )}
                  {s.taxDetails?.taxId && (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-mono text-[11px]">Tax: {s.taxDetails.taxId}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Price list & terms badge */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lead: {s.leadTimeDays || 7}d</span>
                </div>

                <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase font-mono text-[10px]">
                  {s.paymentTerms?.paymentMethod?.replace('_', ' ') || 'NET 30'}
                </span>

                <span className="font-bold text-orange-600 font-mono text-xs">
                  {s.itemPriceList?.length || 0} priced items
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateSupplierModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (data) => {
          await createSupplierMutation.mutateAsync(data);
        }}
        isSubmitting={createSupplierMutation.isPending}
      />
    </div>
  );
};
