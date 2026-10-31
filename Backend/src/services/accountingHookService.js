const EventEmitter = require('events');

/**
 * Enterprise Accounting Hook & Financial Event Bus
 * Generates double-entry General Ledger journal events for all inventory lifecycle changes:
 * Receipts, Issues, Internal Transfers, Cycle Count Adjustments, and Supplier Returns.
 */
class AccountingHookService extends EventEmitter {
  constructor() {
    super();
    // In-memory buffer of recent emitted accounting entries (accessible for GL sync or audit exports)
    this.eventBuffer = [];
  }

  /**
   * Emits a financial event with double-entry journal items
   */
  emitInventoryEvent(organizationId, eventType, data = {}) {
    const eventId = `JE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const timestamp = new Date();
    const amount = Number(data.totalCost || data.amount || (data.quantity * (data.unitCost || 0))) || 0;

    let entries = [];

    switch (eventType) {
      case 'INVENTORY.RECEIPT':
        // Debit: Inventory Asset, Credit: Accounts Payable / Goods Received Not Invoiced
        entries = [
          { accountCode: '1300', accountName: 'Inventory Asset', debit: amount, credit: 0 },
          { accountCode: '2110', accountName: 'GRNI / Accrued Purchases', debit: 0, credit: amount },
        ];
        break;

      case 'INVENTORY.ISSUE':
        // Debit: COGS or Department Expense, Credit: Inventory Asset
        entries = [
          {
            accountCode: data.reason === 'employee_equipment_issue' ? '1500' : '5000',
            accountName: data.reason === 'employee_equipment_issue' ? 'Company Equipment Assets' : 'Cost of Goods Sold (COGS)',
            debit: amount,
            credit: 0,
          },
          { accountCode: '1300', accountName: 'Inventory Asset', debit: 0, credit: amount },
        ];
        break;

      case 'INVENTORY.TRANSFER':
        // Debit: In-Transit / Dest Warehouse, Credit: Source Warehouse
        entries = [
          { accountCode: '1310', accountName: 'Inventory In-Transit', debit: amount, credit: 0 },
          { accountCode: '1300', accountName: 'Inventory Asset (Source)', debit: 0, credit: amount },
        ];
        break;

      case 'INVENTORY.ADJUSTMENT':
        // Variance adjustments: shrinkage or surplus
        if (amount >= 0) {
          entries = [
            { accountCode: '1300', accountName: 'Inventory Asset', debit: amount, credit: 0 },
            { accountCode: '5200', accountName: 'Inventory Variance / Surplus', debit: 0, credit: amount },
          ];
        } else {
          const absAmt = Math.abs(amount);
          entries = [
            { accountCode: '5200', accountName: 'Inventory Shrinkage Expense', debit: absAmt, credit: 0 },
            { accountCode: '1300', accountName: 'Inventory Asset', debit: 0, credit: absAmt },
          ];
        }
        break;

      case 'INVENTORY.RETURN_TO_VENDOR':
        // Debit: Accounts Payable Clearing, Credit: Inventory Asset
        entries = [
          { accountCode: '2110', accountName: 'Accounts Payable / Supplier Debit', debit: amount, credit: 0 },
          { accountCode: '1300', accountName: 'Inventory Asset', debit: 0, credit: amount },
        ];
        break;

      default:
        entries = [
          { accountCode: '9999', accountName: 'Suspense Clearing', debit: amount, credit: amount },
        ];
    }

    const journalRecord = {
      eventId,
      organizationId: organizationId.toString(),
      eventType,
      timestamp,
      documentNumber: data.documentNumber || data.referenceDoc || 'DOC-GEN',
      itemId: data.itemId ? data.itemId.toString() : null,
      warehouseId: data.warehouseId ? data.warehouseId.toString() : null,
      quantity: data.quantity || 0,
      totalAmount: Math.abs(amount),
      entries,
      metadata: data,
    };

    this.eventBuffer.unshift(journalRecord);
    if (this.eventBuffer.length > 1000) {
      this.eventBuffer.pop();
    }

    // Emit event to node event listeners
    this.emit('inventory_event', journalRecord);
    this.emit(eventType, journalRecord);

    return journalRecord;
  }

  /**
   * Query recent journal events for audit or general ledger integration
   */
  getAccountingEvents(organizationId, filter = {}) {
    const orgIdStr = organizationId.toString();
    return this.eventBuffer.filter((ev) => {
      if (ev.organizationId !== orgIdStr) return false;
      if (filter.eventType && ev.eventType !== filter.eventType) return false;
      return true;
    });
  }
}

module.exports = new AccountingHookService();
