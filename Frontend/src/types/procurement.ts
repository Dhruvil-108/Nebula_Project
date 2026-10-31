export type RequisitionPriority = 'low' | 'normal' | 'high' | 'urgent';

export type RequisitionStatus =
  | 'draft'
  | 'pending_approval'
  | 'manager_approved'
  | 'approved'
  | 'rejected'
  | 'converted_to_po'
  | 'cancelled';

export interface PurchaseRequisitionItem {
  _id?: string;
  itemId: string | { _id: string; sku: string; name: string; baseUom?: string };
  description?: string;
  quantity: number;
  uom: string;
  estimatedUnitPrice: number;
  estimatedTotal: number;
  notes?: string;
}

export interface PurchaseRequisition {
  _id: string;
  organizationId: string;
  requisitionNumber: string;
  requestedBy: { _id: string; fullName: string; email: string };
  departmentId?: { _id: string; name: string } | null;
  requiredDate?: string;
  priority: RequisitionPriority;
  status: RequisitionStatus;
  items: PurchaseRequisitionItem[];
  totalEstimatedAmount: number;
  currency: string;
  managerApproval?: {
    approverId?: string;
    approvedAt?: string;
    comments?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  procurementApproval?: {
    approverId?: string;
    approvedAt?: string;
    comments?: string;
    status: 'pending' | 'approved' | 'rejected';
  };
  rejectionReason?: string;
  convertedPoId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ordered'
  | 'partially_received'
  | 'received'
  | 'billed'
  | 'closed'
  | 'cancelled';

export interface PurchaseOrderItem {
  _id?: string;
  itemId: string | { _id: string; sku: string; name: string; baseUom?: string };
  description?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  invoicedQuantity: number;
  returnedQuantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  uom: string;
}

export interface PoAmendment {
  version: number;
  amendedBy: { _id: string; fullName: string; email: string };
  amendedAt: string;
  changesSummary: string;
  previousGrandTotal: number;
}

export interface PurchaseOrder {
  _id: string;
  organizationId: string;
  poNumber: string;
  requisitionId?: string | { _id: string; requisitionNumber: string };
  supplierId: { _id: string; name: string; contactEmail?: string; contactPhone?: string; currency?: string };
  warehouseId: { _id: string; name: string; code: string };
  orderDate: string;
  expectedDeliveryDate?: string;
  paymentTerms: string;
  currency: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  version: number;
  amendments: PoAmendment[];
  emailedToSupplierAt?: string;
  closureReason?: string;
  notes?: string;
  termsAndConditions?: string;
  createdAt: string;
  updatedAt: string;
}

export type GrnStatus = 'draft' | 'inspected' | 'posted_to_ledger' | 'cancelled';

export interface GrnItem {
  _id?: string;
  itemId: string | { _id: string; sku: string; name: string; baseUom?: string };
  poItemId?: string;
  orderedQuantity: number;
  receivedQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity: number;
  rejectionReason?: string;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
  serialNumbers?: string[];
  binId?: string | { _id: string; binCode: string };
  notes?: string;
}

export interface GoodsReceiptNote {
  _id: string;
  organizationId: string;
  grnNumber: string;
  poId: { _id: string; poNumber: string; status: string; grandTotal?: number };
  supplierId: { _id: string; name: string };
  warehouseId: { _id: string; name: string; code: string };
  receivedDate: string;
  receivedBy: { _id: string; fullName: string; email: string };
  deliveryChallanNumber?: string;
  deliveryChallanDate?: string;
  carrier?: string;
  trackingNumber?: string;
  status: GrnStatus;
  items: GrnItem[];
  stockLedgerPosted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MatchingStatus =
  | 'pending'
  | 'matched'
  | 'variance_detected'
  | 'approved_with_variance'
  | 'rejected';

export interface MatchDetail {
  itemId: string | { _id: string; sku: string; name: string };
  itemCode: string;
  poQty: number;
  grnQty: number;
  invQty: number;
  poPrice: number;
  invPrice: number;
  priceVariancePercent: number;
  qtyVariancePercent: number;
  varianceAmount: number;
  status: 'match' | 'qty_mismatch' | 'price_mismatch' | 'tolerance_exceeded';
}

export interface SupplierInvoice {
  _id: string;
  organizationId: string;
  invoiceNumber: string;
  supplierInvoiceRef: string;
  supplierId: { _id: string; name: string; contactEmail?: string };
  poId: { _id: string; poNumber: string; grandTotal: number; status: string };
  grnIds: string[];
  invoiceDate: string;
  dueDate?: string;
  currency: string;
  items: {
    _id?: string;
    itemId: string | { _id: string; sku: string; name: string };
    description?: string;
    billedQuantity: number;
    unitPrice: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  matchingStatus: MatchingStatus;
  threeWayMatch?: {
    poMatches: boolean;
    grnMatches: boolean;
    priceVariance: number;
    quantityVariance: number;
    toleranceExceeded: boolean;
    details: MatchDetail[];
  };
  varianceApprovedBy?: { _id: string; fullName: string };
  varianceApprovedAt?: string;
  varianceApprovalNotes?: string;
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReturnToVendor {
  _id: string;
  organizationId: string;
  returnNumber: string;
  debitNoteNumber: string;
  supplierId: { _id: string; name: string; contactEmail?: string };
  warehouseId: { _id: string; name: string; code: string };
  poId?: { _id: string; poNumber: string };
  status: 'draft' | 'approved' | 'dispatched' | 'completed' | 'cancelled';
  items: {
    _id?: string;
    itemId: string | { _id: string; sku: string; name: string };
    quantity: number;
    uom: string;
    unitCost: number;
    totalAmount: number;
    batchNumber?: string;
    serialNumbers?: string[];
    reasonCode: 'defective' | 'excess' | 'damaged_in_transit' | 'wrong_specification' | 'expired' | 'other';
    notes?: string;
  }[];
  totalDebitAmount: number;
  stockLedgerPosted: boolean;
  dispatchedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
