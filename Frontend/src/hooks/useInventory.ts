import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import * as inventoryApi from '../lib/inventoryApi';
import type {
  InventoryItem,
  ItemCategory,
  Warehouse,
  WarehouseZone,
  WarehouseBin,
  Supplier,
} from '../types/inventory';

export const inventoryKeys = {
  all: ['inventory'] as const,
  items: (params?: inventoryApi.ItemsFilterParams) => ['inventory', 'items', params] as const,
  item: (id: string) => ['inventory', 'item', id] as const,
  itemQr: (id: string) => ['inventory', 'item-qr', id] as const,
  categories: (activeOnly?: boolean) => ['inventory', 'categories', activeOnly] as const,
  warehouses: (activeOnly?: boolean) => ['inventory', 'warehouses', activeOnly] as const,
  zones: (warehouseId: string) => ['inventory', 'zones', warehouseId] as const,
  bins: (warehouseId: string, zoneId?: string) => ['inventory', 'bins', warehouseId, zoneId] as const,
  binQr: (binId: string) => ['inventory', 'bin-qr', binId] as const,
  suppliers: (params?: inventoryApi.SuppliersFilterParams) => ['inventory', 'suppliers', params] as const,
  supplier: (id: string) => ['inventory', 'supplier', id] as const,
};

// ── Categories ──────────────────────────────────────────────────────────
export function useItemCategories(activeOnly = true) {
  return useQuery({
    queryKey: inventoryKeys.categories(activeOnly),
    queryFn: () => inventoryApi.getCategories(activeOnly),
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ItemCategory>) => inventoryApi.createCategory(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
      toast.success('Category created successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create category.');
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ItemCategory> }) =>
      inventoryApi.updateCategory(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
      toast.success('Category updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update category.');
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.categories() });
      toast.success('Category deactivated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to deactivate category.');
    },
  });
}

// ── Items ───────────────────────────────────────────────────────────────
export function useInventoryItems(params: inventoryApi.ItemsFilterParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.items(params),
    queryFn: () => inventoryApi.getItems(params),
  });
}

export function useInventoryItem(id: string | null) {
  return useQuery({
    queryKey: inventoryKeys.item(id || ''),
    queryFn: () => inventoryApi.getItemById(id!),
    enabled: Boolean(id),
  });
}

export function useItemQrCode(id: string | null) {
  return useQuery({
    queryKey: inventoryKeys.itemQr(id || ''),
    queryFn: () => inventoryApi.getItemQrCode(id!),
    enabled: Boolean(id),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<InventoryItem>) => inventoryApi.createItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
      toast.success('Item added to catalog successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create item.');
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<InventoryItem> }) =>
      inventoryApi.updateItem(id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.item(variables.id) });
      toast.success('Item updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update item.');
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
      toast.success('Item deactivated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to deactivate item.');
    },
  });
}

export function useCommitCsvImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: any[]) => inventoryApi.commitCsvImport(items),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'items'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'categories'] });
      toast.success(`Successfully imported ${data.importedCount} items.`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to commit import.');
    },
  });
}

// ── Warehouses, Zones & Bins ───────────────────────────────────────────
export function useWarehouses(activeOnly = true) {
  return useQuery({
    queryKey: inventoryKeys.warehouses(activeOnly),
    queryFn: () => inventoryApi.getWarehouses(activeOnly),
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Warehouse>) => inventoryApi.createWarehouse(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
      toast.success('Warehouse created successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create warehouse.');
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Warehouse> }) =>
      inventoryApi.updateWarehouse(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
      toast.success('Warehouse updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update warehouse.');
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
      toast.success('Warehouse deactivated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to deactivate warehouse.');
    },
  });
}

export function useWarehouseZones(warehouseId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.zones(warehouseId || ''),
    queryFn: () => inventoryApi.getWarehouseZones(warehouseId!),
    enabled: Boolean(warehouseId),
  });
}

export function useCreateWarehouseZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, payload }: { warehouseId: string; payload: Partial<WarehouseZone> }) =>
      inventoryApi.createWarehouseZone(warehouseId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.zones(variables.warehouseId) });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
      toast.success('Zone created successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create zone.');
    },
  });
}

export function useWarehouseBins(warehouseId: string | null, zoneId?: string) {
  return useQuery({
    queryKey: inventoryKeys.bins(warehouseId || '', zoneId),
    queryFn: () => inventoryApi.getWarehouseBins(warehouseId!, zoneId),
    enabled: Boolean(warehouseId),
  });
}

export function useCreateWarehouseBin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, payload }: { warehouseId: string; payload: Partial<WarehouseBin> }) =>
      inventoryApi.createWarehouseBin(warehouseId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'bins', variables.warehouseId] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'warehouses'] });
      toast.success('Bin created successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create bin.');
    },
  });
}

export function useBinQrCode(binId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.binQr(binId || ''),
    queryFn: () => inventoryApi.getBinQrCode(binId!),
    enabled: Boolean(binId),
  });
}

// ── Suppliers ──────────────────────────────────────────────────────────
export function useSuppliers(params: inventoryApi.SuppliersFilterParams = {}) {
  return useQuery({
    queryKey: inventoryKeys.suppliers(params),
    queryFn: () => inventoryApi.getSuppliers(params),
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: inventoryKeys.supplier(id || ''),
    queryFn: () => inventoryApi.getSupplierById(id!),
    enabled: Boolean(id),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Supplier>) => inventoryApi.createSupplier(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
      toast.success('Supplier added successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to create supplier.');
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Supplier> }) =>
      inventoryApi.updateSupplier(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
      toast.success('Supplier updated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update supplier.');
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
      toast.success('Supplier deactivated successfully.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to deactivate supplier.');
    },
  });
}

export function useUpdateSupplierPrice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      supplierId,
      payload,
    }: {
      supplierId: string;
      payload: {
        itemId: string;
        supplierPartNumber?: string;
        unitPrice: number;
        currency?: string;
        minOrderQty?: number;
        leadTimeDays?: number;
      };
    }) => inventoryApi.updateSupplierPrice(supplierId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'suppliers'] });
      toast.success('Supplier price list updated.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to update price list.');
    },
  });
}

// ── Stock Ledger, Movements & Traceability Hooks ───────────────────────
export function useStockLedger(params: inventoryApi.LedgerFilterParams = {}) {
  return useQuery({
    queryKey: ['inventory', 'ledger', params],
    queryFn: () => inventoryApi.getLedgerEntries(params),
  });
}

export function useStockBalances(params: { warehouseId?: string; search?: string; categoryId?: string } = {}) {
  return useQuery({
    queryKey: ['inventory', 'balances', params],
    queryFn: () => inventoryApi.getStockBalances(params),
  });
}

export function usePostGoodsReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof inventoryApi.postGoodsReceipt>[0]) =>
      inventoryApi.postGoodsReceipt(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success('Goods Receipt Note (GRN) posted to ledger.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to post goods receipt.');
    },
  });
}

export function usePostStockIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof inventoryApi.postStockIssue>[0]) =>
      inventoryApi.postStockIssue(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success('Stock issue posted to ledger.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to post stock issue.');
    },
  });
}

export function usePostTransferDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof inventoryApi.postTransferDispatch>[0]) =>
      inventoryApi.postTransferDispatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success('Inter-warehouse transfer dispatched (in-transit).');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to dispatch transfer.');
    },
  });
}

export function usePostTransferReceive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ movementId, destinationBinId }: { movementId: string; destinationBinId?: string }) =>
      inventoryApi.postTransferReceive(movementId, destinationBinId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success('Transfer received at destination warehouse.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to receive transfer.');
    },
  });
}

export function usePostStockAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof inventoryApi.postStockAdjustment>[0]) =>
      inventoryApi.postStockAdjustment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success('Stock adjustment posted to ledger.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to post stock adjustment.');
    },
  });
}

export function usePostCycleCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof inventoryApi.postCycleCount>[0]) =>
      inventoryApi.postCycleCount(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success(`Cycle count posted (${data.varianceAdjustmentsCount} variances reconciled).`);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to post cycle count.');
    },
  });
}

export function useReverseLedgerEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ledgerId, reason }: { ledgerId: string; reason: string }) =>
      inventoryApi.reverseLedgerEntry(ledgerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'ledger'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'balances'] });
      toast.success('Compensating reversal posted to ledger.');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error || 'Failed to reverse entry.');
    },
  });
}

export function useBatchTrace(batchNumber: string | null) {
  return useQuery({
    queryKey: ['inventory', 'trace-batch', batchNumber],
    queryFn: () => inventoryApi.getBatchTrace(batchNumber!),
    enabled: Boolean(batchNumber),
  });
}

export function useSerialTrace(serialNumber: string | null) {
  return useQuery({
    queryKey: ['inventory', 'trace-serial', serialNumber],
    queryFn: () => inventoryApi.getSerialTrace(serialNumber!),
    enabled: Boolean(serialNumber),
  });
}
