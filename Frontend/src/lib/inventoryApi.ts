import { apiClient } from './apiClient';
import type {
  InventoryItem,
  ItemCategory,
  Warehouse,
  WarehouseZone,
  WarehouseBin,
  Supplier,
  CsvImportPreviewResponse,
} from '../types/inventory';

export interface ItemsFilterParams {
  search?: string;
  categoryId?: string;
  trackingType?: string;
  activeOnly?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ItemsListResponse {
  success: boolean;
  items: InventoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SuppliersFilterParams {
  search?: string;
  activeOnly?: string;
  page?: number;
  limit?: number;
}

export interface SuppliersListResponse {
  success: boolean;
  suppliers: Supplier[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ── Categories ──────────────────────────────────────────────────────────
export async function getCategories(activeOnly = true): Promise<ItemCategory[]> {
  const { data } = await apiClient.get<{ success: boolean; categories: ItemCategory[] }>(
    `/inventory/categories?activeOnly=${activeOnly}`
  );
  return data.categories || [];
}

export async function createCategory(payload: Partial<ItemCategory>): Promise<ItemCategory> {
  const { data } = await apiClient.post<{ success: boolean; category: ItemCategory }>(
    '/inventory/categories',
    payload
  );
  return data.category;
}

export async function updateCategory(id: string, payload: Partial<ItemCategory>): Promise<ItemCategory> {
  const { data } = await apiClient.put<{ success: boolean; category: ItemCategory }>(
    `/inventory/categories/${id}`,
    payload
  );
  return data.category;
}

export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/inventory/categories/${id}`);
}

// ── Items ───────────────────────────────────────────────────────────────
export async function getItems(params: ItemsFilterParams = {}): Promise<ItemsListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.categoryId) query.append('categoryId', params.categoryId);
  if (params.trackingType) query.append('trackingType', params.trackingType);
  if (params.activeOnly !== undefined) query.append('activeOnly', params.activeOnly);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.sortBy) query.append('sortBy', params.sortBy);
  if (params.sortOrder) query.append('sortOrder', params.sortOrder);

  const { data } = await apiClient.get<ItemsListResponse>(`/inventory/items?${query.toString()}`);
  return data;
}

export async function getItemById(id: string): Promise<InventoryItem> {
  const { data } = await apiClient.get<{ success: boolean; item: InventoryItem }>(
    `/inventory/items/${id}`
  );
  return data.item;
}

export async function createItem(payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data } = await apiClient.post<{ success: boolean; item: InventoryItem }>(
    '/inventory/items',
    payload
  );
  return data.item;
}

export async function updateItem(id: string, payload: Partial<InventoryItem>): Promise<InventoryItem> {
  const { data } = await apiClient.put<{ success: boolean; item: InventoryItem }>(
    `/inventory/items/${id}`,
    payload
  );
  return data.item;
}

export async function deleteItem(id: string): Promise<void> {
  await apiClient.delete(`/inventory/items/${id}`);
}

export async function getItemQrCode(id: string): Promise<{ sku: string; name: string; qrDataUrl: string }> {
  const { data } = await apiClient.get<{ success: boolean; sku: string; name: string; qrDataUrl: string }>(
    `/inventory/items/${id}/qrcode`
  );
  return data;
}

export async function previewCsvImport(csvContent: string): Promise<CsvImportPreviewResponse> {
  const { data } = await apiClient.post<CsvImportPreviewResponse>('/inventory/items/import/preview', {
    csvContent,
  });
  return data;
}

export async function commitCsvImport(items: any[]): Promise<{ success: boolean; importedCount: number }> {
  const { data } = await apiClient.post<{ success: boolean; importedCount: number }>(
    '/inventory/items/import/commit',
    { items }
  );
  return data;
}

export async function exportItemsCsv(): Promise<void> {
  const response = await apiClient.get('/inventory/items/export', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-items-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── Warehouses, Zones & Bins ───────────────────────────────────────────
export async function getWarehouses(activeOnly = true): Promise<Warehouse[]> {
  const { data } = await apiClient.get<{ success: boolean; warehouses: Warehouse[] }>(
    `/inventory/warehouses?activeOnly=${activeOnly}`
  );
  return data.warehouses || [];
}

export async function createWarehouse(payload: Partial<Warehouse>): Promise<Warehouse> {
  const { data } = await apiClient.post<{ success: boolean; warehouse: Warehouse }>(
    '/inventory/warehouses',
    payload
  );
  return data.warehouse;
}

export async function updateWarehouse(id: string, payload: Partial<Warehouse>): Promise<Warehouse> {
  const { data } = await apiClient.put<{ success: boolean; warehouse: Warehouse }>(
    `/inventory/warehouses/${id}`,
    payload
  );
  return data.warehouse;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await apiClient.delete(`/inventory/warehouses/${id}`);
}

export async function getWarehouseZones(warehouseId: string): Promise<WarehouseZone[]> {
  const { data } = await apiClient.get<{ success: boolean; zones: WarehouseZone[] }>(
    `/inventory/warehouses/${warehouseId}/zones`
  );
  return data.zones || [];
}

export async function createWarehouseZone(warehouseId: string, payload: Partial<WarehouseZone>): Promise<WarehouseZone> {
  const { data } = await apiClient.post<{ success: boolean; zone: WarehouseZone }>(
    `/inventory/warehouses/${warehouseId}/zones`,
    payload
  );
  return data.zone;
}

export async function getWarehouseBins(warehouseId: string, zoneId?: string): Promise<WarehouseBin[]> {
  const url = zoneId
    ? `/inventory/warehouses/${warehouseId}/bins?zoneId=${zoneId}`
    : `/inventory/warehouses/${warehouseId}/bins`;
  const { data } = await apiClient.get<{ success: boolean; bins: WarehouseBin[] }>(url);
  return data.bins || [];
}

export async function createWarehouseBin(warehouseId: string, payload: Partial<WarehouseBin>): Promise<WarehouseBin> {
  const { data } = await apiClient.post<{ success: boolean; bin: WarehouseBin }>(
    `/inventory/warehouses/${warehouseId}/bins`,
    payload
  );
  return data.bin;
}

export async function getBinQrCode(binId: string): Promise<{ binCode: string; warehouseName?: string; qrDataUrl: string }> {
  const { data } = await apiClient.get<{ success: boolean; binCode: string; warehouseName?: string; qrDataUrl: string }>(
    `/inventory/bins/${binId}/qrcode`
  );
  return data;
}

// ── Suppliers ──────────────────────────────────────────────────────────
export async function getSuppliers(params: SuppliersFilterParams = {}): Promise<SuppliersListResponse> {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.activeOnly !== undefined) query.append('activeOnly', params.activeOnly);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<SuppliersListResponse>(`/inventory/suppliers?${query.toString()}`);
  return data;
}

export async function getSupplierById(id: string): Promise<Supplier> {
  const { data } = await apiClient.get<{ success: boolean; supplier: Supplier }>(
    `/inventory/suppliers/${id}`
  );
  return data.supplier;
}

export async function createSupplier(payload: Partial<Supplier>): Promise<Supplier> {
  const { data } = await apiClient.post<{ success: boolean; supplier: Supplier }>(
    '/inventory/suppliers',
    payload
  );
  return data.supplier;
}

export async function updateSupplier(id: string, payload: Partial<Supplier>): Promise<Supplier> {
  const { data } = await apiClient.put<{ success: boolean; supplier: Supplier }>(
    `/inventory/suppliers/${id}`,
    payload
  );
  return data.supplier;
}

export async function deleteSupplier(id: string): Promise<void> {
  await apiClient.delete(`/inventory/suppliers/${id}`);
}

export async function updateSupplierPrice(
  supplierId: string,
  payload: {
    itemId: string;
    supplierPartNumber?: string;
    unitPrice: number;
    currency?: string;
    minOrderQty?: number;
    leadTimeDays?: number;
  }
): Promise<void> {
  await apiClient.post(`/inventory/suppliers/${supplierId}/prices`, payload);
}

export async function exportSuppliersCsv(): Promise<void> {
  const response = await apiClient.get('/inventory/suppliers/export', { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `inventory-suppliers-${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

// ── Stock Ledger, Movements & Traceability ─────────────────────────────
export interface LedgerFilterParams {
  itemId?: string;
  warehouseId?: string;
  transactionType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface LedgerListResponse {
  success: boolean;
  entries: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getLedgerEntries(params: LedgerFilterParams = {}): Promise<LedgerListResponse> {
  const query = new URLSearchParams();
  if (params.itemId) query.append('itemId', params.itemId);
  if (params.warehouseId) query.append('warehouseId', params.warehouseId);
  if (params.transactionType) query.append('transactionType', params.transactionType);
  if (params.search) query.append('search', params.search);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<LedgerListResponse>(`/inventory/ledger?${query.toString()}`);
  return data;
}

export async function getStockBalances(params: { warehouseId?: string; search?: string; categoryId?: string } = {}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params.warehouseId) query.append('warehouseId', params.warehouseId);
  if (params.search) query.append('search', params.search);
  if (params.categoryId) query.append('categoryId', params.categoryId);

  const { data } = await apiClient.get<{ success: boolean; balances: any[] }>(`/inventory/stock-balances?${query.toString()}`);
  return data.balances || [];
}

export async function postGoodsReceipt(payload: {
  documentNumber?: string;
  itemId: string;
  warehouseId: string;
  binId?: string;
  quantity: number;
  unitCost?: number;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  serialNumbers?: string[];
  notes?: string;
}): Promise<any> {
  const { data } = await apiClient.post('/inventory/movements/receipt', payload);
  return data;
}

export async function postStockIssue(payload: {
  documentNumber?: string;
  itemId: string;
  warehouseId: string;
  binId?: string;
  quantity: number;
  reasonCode?: string;
  batchNumber?: string;
  serialNumbers?: string[];
  notes?: string;
}): Promise<any> {
  const { data } = await apiClient.post('/inventory/movements/issue', payload);
  return data;
}

export async function postTransferDispatch(payload: {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  lines: {
    itemId: string;
    actualQty: number;
    unitCost?: number;
    sourceBinId?: string;
    batchNumber?: string;
    serialNumbers?: string[];
  }[];
  notes?: string;
}): Promise<any> {
  const { data } = await apiClient.post('/inventory/movements/transfer', payload);
  return data;
}

export async function postTransferReceive(movementId: string, destinationBinId?: string): Promise<any> {
  const { data } = await apiClient.post(`/inventory/movements/transfer/${movementId}/receive`, {
    destinationBinId,
  });
  return data;
}

export async function postStockAdjustment(payload: {
  documentNumber?: string;
  itemId: string;
  warehouseId: string;
  binId?: string;
  quantity: number;
  unitCost?: number;
  adjustmentType?: 'in' | 'out';
  reasonCode?: string;
  batchNumber?: string;
  serialNumbers?: string[];
  notes?: string;
}): Promise<any> {
  const { data } = await apiClient.post('/inventory/movements/adjustment', payload);
  return data;
}

export async function postCycleCount(payload: {
  warehouseId: string;
  counts: {
    itemId: string;
    binId?: string;
    countedQty: number;
    batchNumber?: string;
  }[];
  notes?: string;
}): Promise<any> {
  const { data } = await apiClient.post('/inventory/movements/cycle-count', payload);
  return data;
}

export async function reverseLedgerEntry(ledgerId: string, reason: string): Promise<any> {
  const { data } = await apiClient.post(`/inventory/ledger/${ledgerId}/reverse`, { reason });
  return data;
}

export async function getBatchTrace(batchNumber: string): Promise<any> {
  const { data } = await apiClient.get(`/inventory/traceability/batch/${encodeURIComponent(batchNumber)}`);
  return data.trace;
}

export async function getSerialTrace(serialNumber: string): Promise<any> {
  const { data } = await apiClient.get(`/inventory/traceability/serial/${encodeURIComponent(serialNumber)}`);
  return data.trace;
}
