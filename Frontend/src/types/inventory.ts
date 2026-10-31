export type TrackingType = 'none' | 'batch' | 'serial';
export type ValuationMethod = 'fifo' | 'weighted_average';
export type ZoneType = 'storage' | 'receiving' | 'shipping' | 'quarantine' | 'picking';
export type PaymentMethod = 'net_30' | 'net_15' | 'net_60' | 'due_on_receipt' | 'advance' | 'eom';
export type StockTransactionType =
  | 'receipt'
  | 'issue'
  | 'transfer_out'
  | 'transfer_in'
  | 'adjustment_in'
  | 'adjustment_out'
  | 'cycle_count_variance'
  | 'reversal';

export interface UomConversion {
  uom: string;
  conversionFactor: number;
}

export interface ItemVariant {
  name: string;
  options: string[];
}

export interface ItemCategory {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  parentId?: { _id: string; name: string; code: string } | string | null;
  description?: string;
  active: boolean;
  itemCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  _id: string;
  organizationId: string;
  code: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  contactPerson?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  isDefault: boolean;
  active: boolean;
  zoneCount?: number;
  binCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseZone {
  _id: string;
  organizationId: string;
  warehouseId: string;
  code: string;
  name: string;
  zoneType: ZoneType;
  active: boolean;
  binCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseBin {
  _id: string;
  organizationId: string;
  warehouseId: string | Warehouse;
  zoneId?: { _id: string; code: string; name: string; zoneType: ZoneType } | string | null;
  binCode: string;
  barcode?: string;
  capacity?: {
    maxWeightKg?: number;
    maxVolumeCubicM?: number;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierItemPrice {
  itemId: string | { _id: string; sku: string; name: string; baseUom: string; standardCost: number; brand?: string };
  supplierPartNumber?: string;
  unitPrice: number;
  currency: string;
  minOrderQty: number;
  leadTimeDays: number;
  effectiveFrom: string;
}

export interface Supplier {
  _id: string;
  organizationId: string;
  supplierCode: string;
  name: string;
  contactPerson?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  taxDetails?: {
    taxId?: string;
    panNumber?: string;
    vatNumber?: string;
  };
  paymentTerms?: {
    paymentTermDays: number;
    paymentMethod: PaymentMethod;
  };
  leadTimeDays: number;
  currency: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  itemPriceList: SupplierItemPrice[];
  rating?: {
    score: number;
    totalOrders: number;
    onTimeDeliveryRate: number;
    rejectionRate: number;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  _id: string;
  organizationId: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId?: ItemCategory | null;
  brand?: string;
  baseUom: string;
  uomConversions: UomConversion[];
  trackingType: TrackingType;
  hasExpiry: boolean;
  shelfLifeDays?: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  reorderQuantity: number;
  standardCost: number;
  currency: string;
  valuationMethod: ValuationMethod;
  images?: { url: string; isPrimary: boolean }[];
  variants?: ItemVariant[];
  attributes?: Record<string, string>;
  defaultWarehouseId?: Warehouse | null;
  defaultBinId?: WarehouseBin | null;
  preferredSupplierId?: Supplier | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  qrDataUrl?: string;
}

export interface StockLedgerEntry {
  _id: string;
  organizationId: string;
  transactionType: StockTransactionType;
  documentNumber: string;
  movementId?: string | null;
  itemId: { _id: string; sku: string; name: string; baseUom: string };
  warehouseId: { _id: string; code: string; name: string };
  binId?: { _id: string; binCode: string } | null;
  batchNumber?: string;
  serialNumber?: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  valuationMethod: ValuationMethod;
  runningBalanceQty: number;
  runningValuation: number;
  reversalOfLedgerId?: string | null;
  isReversed: boolean;
  actorId?: { _id: string; name: string; email: string } | null;
  notes?: string;
  createdAt: string;
}

export interface StockBalanceItem {
  item: {
    _id: string;
    sku: string;
    name: string;
    baseUom: string;
    category?: string;
    minStockLevel: number;
    maxStockLevel: number;
    reorderPoint: number;
    standardCost: number;
    trackingType: TrackingType;
  };
  itemId: string;
  warehouseId?: string | null;
  onHand: number;
  reserved: number;
  available: number;
  inTransit: number;
  totalValuation: number;
  unitCost: number;
}

export interface BatchTraceResponse {
  found: boolean;
  batchNumber: string;
  item?: InventoryItem;
  status?: string;
  manufactureDate?: string;
  expiryDate?: string;
  isExpired?: boolean;
  supplier?: Supplier | null;
  summary?: {
    totalInbound: number;
    totalOutbound: number;
    currentRemaining: number;
  };
  warehouses?: {
    warehouse: Warehouse;
    bin?: WarehouseBin;
    remainingQty: number;
    status: string;
  }[];
  timeline?: {
    date: string;
    type: string;
    documentNumber: string;
    warehouse?: string;
    bin?: string;
    quantity: number;
    unitCost: number;
    actor?: string;
    notes?: string;
  }[];
  message?: string;
}

export interface SerialTraceResponse {
  found: boolean;
  serialNumber: string;
  item?: InventoryItem;
  status?: string;
  cost?: number;
  batchNumber?: string;
  currentLocation?: {
    warehouse?: Warehouse;
    bin?: WarehouseBin;
  };
  issuedTo?: {
    user?: { name: string; email: string };
    department?: { name: string };
  };
  timeline?: {
    date: string;
    type: string;
    documentNumber: string;
    warehouse?: string;
    bin?: string;
    quantity: number;
    unitCost: number;
    actor?: string;
    notes?: string;
  }[];
  message?: string;
}

export interface CsvImportPreviewResponse {
  success: boolean;
  totalRows: number;
  validCount: number;
  errorCount: number;
  errors: {
    row: number;
    errors: string[];
    data: Record<string, string>;
  }[];
  previewRows: {
    sku: string;
    name: string;
    categoryName?: string;
    brand?: string;
    baseUom: string;
    standardCost: number;
    minStockLevel: number;
    maxStockLevel: number;
    reorderPoint: number;
    reorderQuantity: number;
    trackingType: TrackingType;
    description?: string;
  }[];
  canCommit: boolean;
}
