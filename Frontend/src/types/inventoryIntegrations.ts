export interface EquipmentKitItem {
  itemId: string | { _id: string; sku: string; name: string; baseUom?: string; standardCost?: number };
  quantity: number;
  isMandatory: boolean;
  notes?: string;
}

export interface EquipmentKit {
  _id: string;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: { _id: string; name: string } | null;
  designation?: string;
  isDefault: boolean;
  items: EquipmentKitItem[];
  active: boolean;
  createdAt: string;
}

export type AssetAssignmentStatus =
  | 'requested'
  | 'allocated'
  | 'issued'
  | 'returned_partial'
  | 'returned_full'
  | 'cancelled';

export interface AssignedAssetItem {
  _id?: string;
  itemId: string | { _id: string; sku: string; name: string; baseUom?: string; standardCost?: number };
  requestedQuantity: number;
  issuedQuantity: number;
  serialNumbers?: string[];
  batchNumber?: string;
  warehouseId?: string | { _id: string; name: string; code: string };
  binId?: string | null;
  issuedAt?: string;
  status: 'requested' | 'issued' | 'returned' | 'damaged' | 'lost';
  returnDate?: string;
  returnCondition?: 'good' | 'fair' | 'damaged' | 'unusable';
  notes?: string;
}

export interface ExitChecklist {
  initiatedAt?: string;
  exitDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  verifiedBy?: { _id: string; fullName: string };
  remarks?: string;
}

export interface EmployeeAssetAssignment {
  _id: string;
  organizationId: string;
  assignmentNumber: string;
  employeeId: {
    _id: string;
    fullName: string;
    email: string;
    employeeCode: string;
    designation?: string;
    departmentId?: string | { _id: string; name: string };
  };
  candidateId?: string;
  kitId?: { _id: string; name: string; code: string } | null;
  requestType: 'onboarding_kit' | 'ad_hoc_request' | 'replacement';
  status: AssetAssignmentStatus;
  assignedItems: AssignedAssetItem[];
  exitChecklist: ExitChecklist;
  stockLedgerPosted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface AccountingEvent {
  eventId: string;
  organizationId: string;
  eventType: string;
  timestamp: string;
  documentNumber: string;
  itemId?: string;
  warehouseId?: string;
  quantity: number;
  totalAmount: number;
  entries: JournalEntryLine[];
}

export interface InventoryNotification {
  id: string;
  organizationId: string;
  eventType: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: any;
  timestamp: string;
  read: boolean;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  registeredAt: string;
}
