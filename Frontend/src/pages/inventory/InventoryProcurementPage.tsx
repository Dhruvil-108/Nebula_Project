import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  FileCheck,
  PackageCheck,
  FileText,
  RotateCcw,
  Plus,
  Search,
  Filter,
  Download,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Truck,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'react-toastify';
import {
  getPurchaseOrders,
  getRequisitions,
  getGoodsReceiptNotes,
  getSupplierInvoices,
  getReturnToVendors,
  submitRequisition,
  approveRequisition,
  rejectRequisition,
  convertRequisitionToPo,
  postGrnToLedger,
  downloadPoPdf,
  downloadGrnPdf,
  emailPoToSupplier,
  closePurchaseOrder,
} from '../../lib/procurementApi';
import { useWarehouses, useSuppliers } from '../../hooks/useInventory';
import { CreateRequisitionModal } from '../../components/inventory/CreateRequisitionModal';
import { CreatePurchaseOrderModal } from '../../components/inventory/CreatePurchaseOrderModal';
import { CreateGrnModal } from '../../components/inventory/CreateGrnModal';
import { ThreeWayMatchModal } from '../../components/inventory/ThreeWayMatchModal';
import { CreateReturnToVendorModal } from '../../components/inventory/CreateReturnToVendorModal';
import type {
  PurchaseOrder,
  PurchaseRequisition,
  GoodsReceiptNote,
  SupplierInvoice,
  ReturnToVendor,
} from '../../types/procurement';

type ProcurementTab = 'orders' | 'requisitions' | 'grns' | 'invoices' | 'returns';

export const InventoryProcurementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProcurementTab>('orders');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isPrModalOpen, setIsPrModalOpen] = useState(false);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isGrnModalOpen, setIsGrnModalOpen] = useState(false);
  const [isRtvModalOpen, setIsRtvModalOpen] = useState(false);
  const [selectedInvoiceForMatch, setSelectedInvoiceForMatch] = useState<SupplierInvoice | null>(null);

  // Queries
  const { data: posData, isLoading: posLoading } = useQuery({
    queryKey: ['purchaseOrders', statusFilter, searchTerm],
    queryFn: () => getPurchaseOrders({ status: statusFilter || undefined, search: searchTerm || undefined }),
  });

  const { data: prsData, isLoading: prsLoading } = useQuery({
    queryKey: ['purchaseRequisitions', statusFilter],
    queryFn: () => getRequisitions({ status: statusFilter || undefined }),
  });

  const { data: grnsData, isLoading: grnsLoading } = useQuery({
    queryKey: ['goodsReceiptNotes', statusFilter],
    queryFn: () => getGoodsReceiptNotes({ status: statusFilter || undefined }),
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['supplierInvoices'],
    queryFn: () => getSupplierInvoices(),
  });

  const { data: returnsData, isLoading: returnsLoading } = useQuery({
    queryKey: ['returnToVendors'],
    queryFn: () => getReturnToVendors(),
  });

  const { data: suppliersData } = useSuppliers({ activeOnly: 'true' });
  const { data: warehouses = [] } = useWarehouses();

  const purchaseOrders = posData?.purchaseOrders || [];
  const requisitions = prsData?.requisitions || [];
  const grns = grnsData?.goodsReceiptNotes || [];
  const invoices = invoicesData?.invoices || [];
  const returns = returnsData?.returns || [];

  // Summary Metrics
  const totalPoSpend = purchaseOrders.reduce((acc, p) => acc + (p.grandTotal || 0), 0);
  const pendingApprovalsCount = requisitions.filter(
    (r) => r.status === 'pending_approval' || r.status === 'manager_approved'
  ).length;
  const unpostedGrnCount = grns.filter((g) => !g.stockLedgerPosted).length;
  const varianceInvoicesCount = invoices.filter((i) => i.matchingStatus === 'variance_detected').length;

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
    queryClient.invalidateQueries({ queryKey: ['goodsReceiptNotes'] });
    queryClient.invalidateQueries({ queryKey: ['supplierInvoices'] });
    queryClient.invalidateQueries({ queryKey: ['returnToVendors'] });
  };

  // Actions
  const handleDownloadPo = async (po: PurchaseOrder) => {
    try {
      await downloadPoPdf(po._id, po.poNumber);
      toast.success(`Downloaded ${po.poNumber}.pdf`);
    } catch {
      toast.error('Failed to download PO PDF');
    }
  };

  const handleEmailPo = async (po: PurchaseOrder) => {
    try {
      const res = await emailPoToSupplier(po._id);
      toast.success(res.message);
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to email PO');
    }
  };

  const handlePostGrn = async (grnId: string) => {
    try {
      await postGrnToLedger(grnId);
      toast.success('GRN successfully posted to Stock Ledger!');
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to post GRN to ledger');
    }
  };

  const handleApprovePr = async (prId: string) => {
    try {
      await approveRequisition(prId, 'Approved from Procurement Hub');
      toast.success('Requisition approved!');
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Failed to approve requisition');
    }
  };

  const handleConvertPr = async (pr: PurchaseRequisition) => {
    const suppliers = suppliersData?.suppliers || [];
    if (suppliers.length === 0) {
      toast.error('No suppliers registered. Please add a supplier first.');
      return;
    }
    if (warehouses.length === 0) {
      toast.error('No warehouses found.');
      return;
    }

    try {
      await convertRequisitionToPo(pr._id, {
        supplierId: suppliers[0]._id,
        warehouseId: warehouses[0]._id,
        defaultTaxRate: 10,
      });
      toast.success(`PR #${pr.requisitionNumber} converted to PO!`);
      setActiveTab('orders');
      refreshAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Conversion failed');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-orange-500" />
            Procurement & Purchase-to-Stock
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Requisitions, 2-Tier Approvals, Purchase Orders, GRN Ledger Posting, and 3-Way Match
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'orders' && (
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> New Purchase Order
            </button>
          )}
          {activeTab === 'requisitions' && (
            <button
              onClick={() => setIsPrModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Create Requisition
            </button>
          )}
          {activeTab === 'grns' && (
            <button
              onClick={() => setIsGrnModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Receive Goods (GRN)
            </button>
          )}
          {activeTab === 'returns' && (
            <button
              onClick={() => setIsRtvModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Return to Vendor
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-slate-500">Active PO Spend</span>
            <span className="text-xl font-bold text-slate-900 font-mono">
              ${totalPoSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">{purchaseOrders.length} Purchase Orders</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-slate-500">Pending PR Approvals</span>
            <span className="text-xl font-bold text-amber-600">{pendingApprovalsCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">2-Tier Workflow Queue</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-slate-500">GRNs Awaiting Post</span>
            <span className="text-xl font-bold text-emerald-600">{unpostedGrnCount}</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Physical Dock Receipts</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-medium text-slate-500">3-Way Match Variances</span>
            <span className={`text-xl font-bold ${varianceInvoicesCount > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {varianceInvoicesCount}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Exceeding Tolerance</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold text-slate-600">
        <button
          onClick={() => {
            setActiveTab('orders');
            setStatusFilter('');
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileCheck className="w-4 h-4" /> Purchase Orders ({purchaseOrders.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('requisitions');
            setStatusFilter('');
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'requisitions'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShoppingCart className="w-4 h-4" /> Requisitions ({requisitions.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('grns');
            setStatusFilter('');
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'grns'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Goods Receipt (GRN) ({grns.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('invoices');
            setStatusFilter('');
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'invoices'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" /> 3-Way Match & Invoices ({invoices.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('returns');
            setStatusFilter('');
          }}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'returns'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent hover:text-slate-900'
          }`}
        >
          <RotateCcw className="w-4 h-4" /> Return to Vendor ({returns.length})
        </button>
      </div>

      {/* Content for Tabs */}

      {/* ── TAB 1: PURCHASE ORDERS ── */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-center bg-slate-50/50">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by PO Number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ordered">Ordered</option>
                <option value="partially_received">Partially Received</option>
                <option value="received">Received</option>
                <option value="billed">Billed</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Destination Dock</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4 text-center">Items</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No purchase orders found. Click "New Purchase Order" to begin.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {po.poNumber}
                        {po.version > 1 && (
                          <span className="ml-1 text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-mono font-normal">
                            v{po.version}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-semibold">{po.supplierId?.name || 'N/A'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{po.warehouseId?.name}</td>
                      <td className="py-3 px-4 text-slate-500">{new Date(po.orderDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{po.items.length}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        ${Number(po.grandTotal).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            po.status === 'received'
                              ? 'bg-emerald-100 text-emerald-800'
                              : po.status === 'partially_received'
                              ? 'bg-amber-100 text-amber-800'
                              : po.status === 'ordered'
                              ? 'bg-blue-100 text-blue-800'
                              : po.status === 'billed'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleDownloadPo(po)}
                            title="Download Official PO PDF"
                            className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEmailPo(po)}
                            title="Email PO to Supplier"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: REQUISITIONS ── */}
      {activeTab === 'requisitions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Requisition #</th>
                  <th className="py-3 px-4">Requested By</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Est. Budget</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requisitions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No purchase requisitions found. Click "Create Requisition" to begin.
                    </td>
                  </tr>
                ) : (
                  requisitions.map((pr) => (
                    <tr key={pr._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {pr.requisitionNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {pr.requestedBy?.fullName}
                        <span className="block text-[10px] text-slate-400">{pr.requestedBy?.email}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            pr.priority === 'urgent'
                              ? 'bg-rose-100 text-rose-800'
                              : pr.priority === 'high'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {pr.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(pr.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        ${Number(pr.totalEstimatedAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            pr.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pr.status === 'manager_approved'
                              ? 'bg-blue-100 text-blue-800'
                              : pr.status === 'converted_to_po'
                              ? 'bg-purple-100 text-purple-800'
                              : pr.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pr.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(pr.status === 'pending_approval' || pr.status === 'manager_approved') && (
                            <button
                              onClick={() => handleApprovePr(pr._id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Approve Tier
                            </button>
                          )}
                          {pr.status === 'approved' && (
                            <button
                              onClick={() => handleConvertPr(pr)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors"
                            >
                              Convert to PO
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: GOODS RECEIPT (GRN) ── */}
      {activeTab === 'grns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">GRN Number</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Dock Facility</th>
                  <th className="py-3 px-4">Received Date</th>
                  <th className="py-3 px-4 text-center">Ledger Posted</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No Goods Receipt Notes found. Click "Receive Goods (GRN)" to log deliveries.
                    </td>
                  </tr>
                ) : (
                  grns.map((grn) => (
                    <tr key={grn._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {grn.grnNumber}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">
                        {grn.poId?.poNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {grn.supplierId?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{grn.warehouseId?.name}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(grn.receivedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {grn.stockLedgerPosted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> POSTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" /> PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!grn.stockLedgerPosted && (
                            <button
                              onClick={() => handlePostGrn(grn._id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                            >
                              Post to Ledger
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                await downloadGrnPdf(grn._id, grn.grnNumber);
                                toast.success(`Downloaded ${grn.grnNumber}.pdf`);
                              } catch {
                                toast.error('Failed to download GRN PDF');
                              }
                            }}
                            title="Download GRN PDF"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: 3-WAY MATCH & INVOICES ── */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Vendor Bill Ref</th>
                  <th className="py-3 px-4">PO Reference</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4 text-right">Billed Amount</th>
                  <th className="py-3 px-4 text-center">3-Way Match Status</th>
                  <th className="py-3 px-4 text-right">Reconciliation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No supplier invoices logged yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {inv.supplierInvoiceRef}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {inv.poId?.poNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{inv.supplierId?.name}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900">
                        ${Number(inv.totalAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            inv.matchingStatus === 'matched'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.matchingStatus === 'approved_with_variance'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.matchingStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedInvoiceForMatch(inv)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View Match Matrix
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 5: RETURNS & DEBIT NOTES ── */}
      {activeTab === 'returns' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Return #</th>
                  <th className="py-3 px-4">Debit Note #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 text-center">Items Returned</th>
                  <th className="py-3 px-4 text-right">Debit Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {returns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No returns recorded.
                    </td>
                  </tr>
                ) : (
                  returns.map((rtv) => (
                    <tr key={rtv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {rtv.returnNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-600 font-mono">
                        {rtv.debitNoteNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {rtv.supplierId?.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rtv.warehouseId?.name}</td>
                      <td className="py-3 px-4 text-center font-mono font-medium">{rtv.items.length}</td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-rose-600">
                        ${Number(rtv.totalDebitAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                          {rtv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateRequisitionModal
        isOpen={isPrModalOpen}
        onClose={() => setIsPrModalOpen(false)}
        onSuccess={refreshAll}
      />

      <CreatePurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        onSuccess={refreshAll}
      />

      <CreateGrnModal
        isOpen={isGrnModalOpen}
        onClose={() => setIsGrnModalOpen(false)}
        onSuccess={refreshAll}
        purchaseOrders={purchaseOrders}
      />

      <CreateReturnToVendorModal
        isOpen={isRtvModalOpen}
        onClose={() => setIsRtvModalOpen(false)}
        onSuccess={refreshAll}
      />

      <ThreeWayMatchModal
        isOpen={Boolean(selectedInvoiceForMatch)}
        onClose={() => setSelectedInvoiceForMatch(null)}
        invoice={selectedInvoiceForMatch}
        onSuccess={refreshAll}
      />
    </div>
  );
};
