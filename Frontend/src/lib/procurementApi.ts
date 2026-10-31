import { apiClient } from './apiClient';
import type {
  PurchaseRequisition,
  PurchaseOrder,
  GoodsReceiptNote,
  SupplierInvoice,
  ReturnToVendor,
} from '../types/procurement';

// ── Purchase Requisitions (PR) ──────────────────────────────────────────

export async function getRequisitions(params: { status?: string; priority?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.priority) query.append('priority', params.priority);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<{
    success: boolean;
    requisitions: PurchaseRequisition[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/inventory/procurement/requisitions?${query.toString()}`);

  return data;
}

export async function createRequisition(payload: Partial<PurchaseRequisition> & { submitImmediately?: boolean }) {
  const { data } = await apiClient.post<{ success: boolean; requisition: PurchaseRequisition }>(
    '/inventory/procurement/requisitions',
    payload
  );
  return data.requisition;
}

export async function submitRequisition(id: string) {
  const { data } = await apiClient.post<{ success: boolean; requisition: PurchaseRequisition }>(
    `/inventory/procurement/requisitions/${id}/submit`
  );
  return data.requisition;
}

export async function approveRequisition(id: string, comments = '') {
  const { data } = await apiClient.post<{ success: boolean; requisition: PurchaseRequisition }>(
    `/inventory/procurement/requisitions/${id}/approve`,
    { comments }
  );
  return data.requisition;
}

export async function rejectRequisition(id: string, reason: string) {
  const { data } = await apiClient.post<{ success: boolean; requisition: PurchaseRequisition }>(
    `/inventory/procurement/requisitions/${id}/reject`,
    { reason }
  );
  return data.requisition;
}

export async function convertRequisitionToPo(id: string, poPayload: { supplierId: string; warehouseId: string; defaultTaxRate?: number; expectedDeliveryDate?: string; paymentTerms?: string }) {
  const { data } = await apiClient.post<{ success: boolean; po: PurchaseOrder }>(
    `/inventory/procurement/requisitions/${id}/convert-to-po`,
    poPayload
  );
  return data.po;
}

// ── Purchase Orders (PO) ─────────────────────────────────────────────────

export async function getPurchaseOrders(params: { status?: string; supplierId?: string; warehouseId?: string; search?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.append('status', params.status);
  if (params.supplierId) query.append('supplierId', params.supplierId);
  if (params.warehouseId) query.append('warehouseId', params.warehouseId);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<{
    success: boolean;
    purchaseOrders: PurchaseOrder[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/inventory/procurement/orders?${query.toString()}`);

  return data;
}

export async function getPurchaseOrderById(id: string) {
  const { data } = await apiClient.get<{ success: boolean; purchaseOrder: PurchaseOrder }>(
    `/inventory/procurement/orders/${id}`
  );
  return data.purchaseOrder;
}

export async function createPurchaseOrder(payload: Partial<PurchaseOrder>) {
  const { data } = await apiClient.post<{ success: boolean; purchaseOrder: PurchaseOrder }>(
    '/inventory/procurement/orders',
    payload
  );
  return data.purchaseOrder;
}

export async function amendPurchaseOrder(id: string, payload: { items: any[]; changesSummary: string; expectedDeliveryDate?: string; paymentTerms?: string; notes?: string }) {
  const { data } = await apiClient.put<{ success: boolean; purchaseOrder: PurchaseOrder }>(
    `/inventory/procurement/orders/${id}/amend`,
    payload
  );
  return data.purchaseOrder;
}

export async function closePurchaseOrder(id: string, reason: string) {
  const { data } = await apiClient.post<{ success: boolean; purchaseOrder: PurchaseOrder }>(
    `/inventory/procurement/orders/${id}/close`,
    { reason }
  );
  return data.purchaseOrder;
}

export async function downloadPoPdf(id: string, poNumber: string) {
  const response = await apiClient.get(`/inventory/procurement/orders/${id}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${poNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export async function emailPoToSupplier(id: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string; emailedAt: string }>(
    `/inventory/procurement/orders/${id}/email`
  );
  return data;
}

// ── Goods Receipt Notes (GRN) ─────────────────────────────────────────────

export async function getGoodsReceiptNotes(params: { poId?: string; supplierId?: string; status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.poId) query.append('poId', params.poId);
  if (params.supplierId) query.append('supplierId', params.supplierId);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<{
    success: boolean;
    goodsReceiptNotes: GoodsReceiptNote[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/inventory/procurement/grns?${query.toString()}`);

  return data;
}

export async function createGoodsReceiptNote(payload: any) {
  const { data } = await apiClient.post<{ success: boolean; goodsReceiptNote: GoodsReceiptNote }>(
    '/inventory/procurement/grns',
    payload
  );
  return data.goodsReceiptNote;
}

export async function postGrnToLedger(id: string) {
  const { data } = await apiClient.post<{ success: boolean; message: string; goodsReceiptNote: GoodsReceiptNote }>(
    `/inventory/procurement/grns/${id}/post-ledger`
  );
  return data;
}

export async function downloadGrnPdf(id: string, grnNumber: string) {
  const response = await apiClient.get(`/inventory/procurement/grns/${id}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${grnNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

// ── Supplier Invoices & 3-Way Match ───────────────────────────────────────

export async function getSupplierInvoices(params: { poId?: string; matchingStatus?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.poId) query.append('poId', params.poId);
  if (params.matchingStatus) query.append('matchingStatus', params.matchingStatus);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<{
    success: boolean;
    invoices: SupplierInvoice[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/inventory/procurement/invoices?${query.toString()}`);

  return data;
}

export async function createSupplierInvoice(payload: any) {
  const { data } = await apiClient.post<{ success: boolean; invoice: SupplierInvoice }>(
    '/inventory/procurement/invoices',
    payload
  );
  return data.invoice;
}

export async function runThreeWayMatch(id: string, tolerance: { priceTolerancePct?: number; qtyTolerancePct?: number } = {}) {
  const { data } = await apiClient.post<{ success: boolean; invoice: SupplierInvoice }>(
    `/inventory/procurement/invoices/${id}/three-way-match`,
    tolerance
  );
  return data.invoice;
}

export async function approveInvoiceVariance(id: string, comments = '') {
  const { data } = await apiClient.post<{ success: boolean; invoice: SupplierInvoice }>(
    `/inventory/procurement/invoices/${id}/approve-variance`,
    { comments }
  );
  return data.invoice;
}

// ── Return to Vendor (RTV) & Debit Notes ───────────────────────────────────

export async function getReturnToVendors(params: { supplierId?: string; warehouseId?: string; status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.supplierId) query.append('supplierId', params.supplierId);
  if (params.warehouseId) query.append('warehouseId', params.warehouseId);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<{
    success: boolean;
    returns: ReturnToVendor[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/inventory/procurement/returns?${query.toString()}`);

  return data;
}

export async function createReturnToVendor(payload: any) {
  const { data } = await apiClient.post<{ success: boolean; returnToVendor: ReturnToVendor }>(
    '/inventory/procurement/returns',
    payload
  );
  return data.returnToVendor;
}
