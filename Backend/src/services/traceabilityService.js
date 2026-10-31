const StockLedger = require('../models/StockLedger');
const StockBatch = require('../models/StockBatch');
const StockSerial = require('../models/StockSerial');
const Item = require('../models/Item');

/**
 * Traceability & Genealogy Engine
 * Traces items forward and backward across batches, serial numbers, and ledger entries.
 */
class TraceabilityService {
  /**
   * Forward and backward trace for a Batch / Lot
   * @param {string|ObjectId} organizationId
   * @param {string} batchNumber
   */
  async traceBatch(organizationId, batchNumber) {
    if (!batchNumber || !batchNumber.trim()) {
      throw new Error('Batch number is required for traceability lookup.');
    }

    const cleanBatch = batchNumber.trim().toUpperCase();

    // 1. Find Batch master documents across warehouses
    const batches = await StockBatch.find({ organizationId, batchNumber: cleanBatch })
      .populate('itemId', 'sku name baseUom standardCost brand trackingType')
      .populate('warehouseId', 'code name')
      .populate('binId', 'binCode')
      .populate('supplierId', 'name supplierCode')
      .lean();

    if (batches.length === 0) {
      return {
        found: false,
        batchNumber: cleanBatch,
        message: 'No batch records found with this lot/batch number.',
      };
    }

    // 2. Fetch full chronological ledger entries referencing this batch
    const ledgerHistory = await StockLedger.find({
      organizationId,
      batchNumber: cleanBatch,
      isReversed: false,
    })
      .populate('warehouseId', 'code name')
      .populate('binId', 'binCode')
      .populate('actorId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    const receipts = ledgerHistory.filter((l) => l.transactionType === 'receipt');
    const transfers = ledgerHistory.filter((l) =>
      ['transfer_out', 'transfer_in'].includes(l.transactionType)
    );
    const issues = ledgerHistory.filter((l) =>
      ['issue', 'adjustment_out'].includes(l.transactionType)
    );

    const totalInbound = receipts.reduce((sum, r) => sum + r.quantity, 0);
    const totalOutbound = Math.abs(issues.reduce((sum, i) => sum + i.quantity, 0));
    const currentRemaining = batches.reduce((sum, b) => sum + b.remainingQuantity, 0);

    const primaryItem = batches[0].itemId;
    const expiryDate = batches[0].expiryDate;
    const isExpired = expiryDate ? new Date(expiryDate) < new Date() : false;

    return {
      found: true,
      batchNumber: cleanBatch,
      item: primaryItem,
      status: isExpired ? 'expired' : batches[0].status,
      manufactureDate: batches[0].manufactureDate,
      expiryDate,
      isExpired,
      supplier: batches[0].supplierId || null,
      summary: {
        totalInbound,
        totalOutbound,
        currentRemaining,
      },
      warehouses: batches.map((b) => ({
        warehouse: b.warehouseId,
        bin: b.binId,
        remainingQty: b.remainingQuantity,
        status: b.status,
      })),
      timeline: ledgerHistory.map((l) => ({
        date: l.createdAt,
        type: l.transactionType,
        documentNumber: l.documentNumber,
        warehouse: l.warehouseId?.name,
        bin: l.binId?.binCode,
        quantity: l.quantity,
        unitCost: l.unitCost,
        actor: l.actorId?.name,
        notes: l.notes,
      })),
    };
  }

  /**
   * Forward and backward trace for an individual Serial Number
   * @param {string|ObjectId} organizationId
   * @param {string} serialNumber
   */
  async traceSerial(organizationId, serialNumber) {
    if (!serialNumber || !serialNumber.trim()) {
      throw new Error('Serial number is required for traceability lookup.');
    }

    const cleanSerial = serialNumber.trim().toUpperCase();

    // 1. Fetch Serial master record
    const serial = await StockSerial.findOne({ organizationId, serialNumber: cleanSerial })
      .populate('itemId', 'sku name baseUom standardCost brand trackingType')
      .populate('currentWarehouseId', 'code name address')
      .populate('currentBinId', 'binCode')
      .populate('issuedToUser', 'name email department')
      .populate('issuedToDepartment', 'name')
      .lean();

    if (!serial) {
      return {
        found: false,
        serialNumber: cleanSerial,
        message: 'No asset serial record found with this identifier.',
      };
    }

    // 2. Fetch full ledger history referencing this serial number
    const ledgerHistory = await StockLedger.find({
      organizationId,
      serialNumber: cleanSerial,
      isReversed: false,
    })
      .populate('warehouseId', 'code name')
      .populate('binId', 'binCode')
      .populate('actorId', 'name email')
      .sort({ createdAt: 1 })
      .lean();

    return {
      found: true,
      serialNumber: cleanSerial,
      item: serial.itemId,
      status: serial.status,
      cost: serial.cost,
      batchNumber: serial.batchNumber,
      currentLocation: {
        warehouse: serial.currentWarehouseId,
        bin: serial.currentBinId,
      },
      issuedTo: {
        user: serial.issuedToUser,
        department: serial.issuedToDepartment,
      },
      timeline: ledgerHistory.map((l) => ({
        date: l.createdAt,
        type: l.transactionType,
        documentNumber: l.documentNumber,
        warehouse: l.warehouseId?.name,
        bin: l.binId?.binCode,
        quantity: l.quantity,
        unitCost: l.unitCost,
        actor: l.actorId?.name,
        notes: l.notes,
      })),
    };
  }
}

module.exports = new TraceabilityService();
