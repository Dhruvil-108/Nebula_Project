const StockLedger = require('../models/StockLedger');
const StockMovement = require('../models/StockMovement');
const StockBatch = require('../models/StockBatch');
const StockSerial = require('../models/StockSerial');
const StockReservation = require('../models/StockReservation');
const Item = require('../models/Item');
const counterService = require('./counterService');
const stockValuationService = require('./stockValuationService');

/**
 * Stock Ledger Engine
 * Append-only transactional core of the ERP Inventory module.
 */
class StockLedgerService {
  /**
   * Derive live stock balance for an item in a specific warehouse or across all warehouses
   * @param {string|ObjectId} organizationId
   * @param {string|ObjectId} itemId
   * @param {string|ObjectId} [warehouseId]
   */
  async getStockBalance(organizationId, itemId, warehouseId = null) {
    const filter = { organizationId, itemId };
    if (warehouseId) {
      filter.warehouseId = warehouseId;
    }

    // 1. Sum up all ledger entries
    const ledgerAgg = await StockLedger.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          onHandQty: { $sum: '$quantity' },
          totalValuation: { $sum: '$totalCost' },
        },
      },
    ]);

    const onHand = ledgerAgg[0]?.onHandQty || 0;
    const totalValuation = Math.max(0, ledgerAgg[0]?.totalValuation || 0);

    // 2. Sum active reservations
    const resFilter = { organizationId, itemId, status: 'active' };
    if (warehouseId) {
      resFilter.warehouseId = warehouseId;
    }

    const reservationAgg = await StockReservation.aggregate([
      { $match: resFilter },
      { $group: { _id: null, reservedQty: { $sum: '$reservedQty' } } },
    ]);

    const reserved = reservationAgg[0]?.reservedQty || 0;
    const available = Math.max(0, onHand - reserved);

    // 3. Sum in-transit quantities from transfers
    const transferFilter = {
      organizationId,
      movementType: 'transfer',
      status: 'in_transit',
      'lines.itemId': itemId,
    };
    if (warehouseId) {
      transferFilter.destinationWarehouseId = warehouseId;
    }

    const inTransitMovements = await StockMovement.find(transferFilter).lean();
    let inTransit = 0;
    inTransitMovements.forEach((mov) => {
      mov.lines.forEach((line) => {
        if (line.itemId.toString() === itemId.toString()) {
          inTransit += line.actualQty;
        }
      });
    });

    const averageUnitCost = onHand > 0 ? totalValuation / onHand : 0;

    return {
      itemId,
      warehouseId,
      onHand,
      reserved,
      available,
      inTransit,
      totalValuation: Math.round(totalValuation * 100) / 100,
      unitCost: Math.round(averageUnitCost * 100) / 100,
    };
  }

  /**
   * Post Goods Receipt Note (GRN) into ledger
   */
  async postReceipt({
    organizationId,
    documentNumber,
    movementId = null,
    itemId,
    warehouseId,
    binId = null,
    quantity,
    unitCost,
    batchNumber = '',
    manufactureDate = null,
    expiryDate = null,
    serialNumbers = [],
    notes = '',
    actorId = null,
  }) {
    if (quantity <= 0) {
      throw new Error('Receipt quantity must be greater than zero.');
    }

    const item = await Item.findOne({ _id: itemId, organizationId });
    if (!item) {
      throw new Error('Item not found in this organization.');
    }

    const cleanDocNum =
      documentNumber || (await counterService.generateGrnNumber(organizationId));
    const effectiveCost = typeof unitCost === 'number' && unitCost >= 0 ? unitCost : item.standardCost || 0;
    const totalCost = Math.round(quantity * effectiveCost * 100) / 100;

    // Get current balance before insert to populate running values
    const prevBalance = await this.getStockBalance(organizationId, itemId, warehouseId);
    const newRunningQty = prevBalance.onHand + quantity;
    const newRunningValuation = prevBalance.totalValuation + totalCost;

    // 1. Append immutable StockLedger entry
    const ledgerEntry = await StockLedger.create({
      organizationId,
      transactionType: 'receipt',
      documentNumber: cleanDocNum,
      movementId,
      itemId,
      warehouseId,
      binId,
      batchNumber: batchNumber.trim().toUpperCase(),
      serialNumber: serialNumbers.length === 1 ? serialNumbers[0] : '',
      quantity, // Positive for receipt
      unitCost: effectiveCost,
      totalCost,
      valuationMethod: item.valuationMethod || 'fifo',
      runningBalanceQty: newRunningQty,
      runningValuation: newRunningValuation,
      actorId,
      notes: notes.trim(),
    });

    // 2. Batch tracking updates
    if (item.trackingType === 'batch' && batchNumber.trim()) {
      const cleanBatch = batchNumber.trim().toUpperCase();
      await StockBatch.findOneAndUpdate(
        { organizationId, itemId, batchNumber: cleanBatch, warehouseId },
        {
          $inc: { remainingQuantity: quantity },
          $setOnInsert: {
            initialQuantity: quantity,
            binId,
            manufactureDate,
            expiryDate,
            costPerUnit: effectiveCost,
            status: 'active',
          },
        },
        { upsert: true, new: true }
      );
    }

    // 3. Serial tracking updates
    if (item.trackingType === 'serial' && Array.isArray(serialNumbers) && serialNumbers.length > 0) {
      for (const sn of serialNumbers) {
        const cleanSn = String(sn).trim().toUpperCase();
        if (!cleanSn) continue;

        await StockSerial.findOneAndUpdate(
          { organizationId, itemId, serialNumber: cleanSn },
          {
            $set: {
              currentWarehouseId: warehouseId,
              currentBinId: binId,
              status: 'in_stock',
              cost: effectiveCost,
              batchNumber: batchNumber.trim().toUpperCase(),
            },
          },
          { upsert: true }
        );
      }
    }

    return ledgerEntry;
  }

  /**
   * Post Stock Issue from ledger with concurrency & negative stock guard
   */
  async postIssue({
    organizationId,
    documentNumber,
    movementId = null,
    itemId,
    warehouseId,
    binId = null,
    quantity,
    reasonCode = 'internal_use',
    batchNumber = '',
    serialNumbers = [],
    notes = '',
    actorId = null,
    allowNegativeStock = false,
  }) {
    if (quantity <= 0) {
      throw new Error('Issue quantity must be greater than zero.');
    }

    const item = await Item.findOne({ _id: itemId, organizationId });
    if (!item) {
      throw new Error('Item not found in this organization.');
    }

    // 1. Concurrency Safety: Check on-hand and available balance
    const balance = await this.getStockBalance(organizationId, itemId, warehouseId);
    if (!allowNegativeStock && balance.available < quantity) {
      throw new Error(
        `Insufficient available stock for item "${item.name}" (${item.sku}). Available: ${balance.available}, Requested: ${quantity}.`
      );
    }

    // 2. Valuation calculation
    let valuationResult;
    if (item.valuationMethod === 'weighted_average') {
      const wac = await stockValuationService.getCurrentWeightedAverageCost({
        organizationId,
        itemId,
        warehouseId,
      });
      valuationResult = {
        unitCost: wac.unitCost,
        totalCost: Math.round(quantity * wac.unitCost * 100) / 100,
      };
    } else {
      // Default: FIFO layer consumption
      valuationResult = await stockValuationService.calculateFifoCost({
        organizationId,
        itemId,
        warehouseId,
        quantityToIssue: quantity,
      });
    }

    const cleanDocNum =
      documentNumber || (await counterService.generateFormattedCode(organizationId, 'stock_issue', 'ISS-'));

    const newRunningQty = balance.onHand - quantity;
    const newRunningValuation = Math.max(0, balance.totalValuation - valuationResult.totalCost);

    // 3. Append immutable StockLedger entry (negative quantity & negative total cost)
    const ledgerEntry = await StockLedger.create({
      organizationId,
      transactionType: 'issue',
      documentNumber: cleanDocNum,
      movementId,
      itemId,
      warehouseId,
      binId,
      batchNumber: batchNumber.trim().toUpperCase(),
      serialNumber: serialNumbers.length === 1 ? serialNumbers[0] : '',
      quantity: -quantity, // Negative for outflow
      unitCost: valuationResult.unitCost,
      totalCost: -valuationResult.totalCost,
      valuationMethod: item.valuationMethod || 'fifo',
      runningBalanceQty: newRunningQty,
      runningValuation: newRunningValuation,
      actorId,
      notes: `${reasonCode}: ${notes}`.trim(),
    });

    // 4. Batch decrement
    if (item.trackingType === 'batch' && batchNumber.trim()) {
      const cleanBatch = batchNumber.trim().toUpperCase();
      const batchDoc = await StockBatch.findOne({ organizationId, itemId, batchNumber: cleanBatch, warehouseId });
      if (batchDoc) {
        batchDoc.remainingQuantity = Math.max(0, batchDoc.remainingQuantity - quantity);
        if (batchDoc.remainingQuantity === 0) {
          batchDoc.status = 'depleted';
        }
        await batchDoc.save();
      }
    }

    // 5. Serial number status transition
    if (item.trackingType === 'serial' && Array.isArray(serialNumbers) && serialNumbers.length > 0) {
      await StockSerial.updateMany(
        {
          organizationId,
          itemId,
          serialNumber: { $in: serialNumbers.map((sn) => String(sn).trim().toUpperCase()) },
        },
        {
          $set: {
            status: 'issued',
            currentWarehouseId: null,
            currentBinId: null,
          },
        }
      );
    }

    return ledgerEntry;
  }

  /**
   * Post Inter-Warehouse Transfer Dispatch (Step 1: Out of source warehouse into in-transit)
   */
  async postTransferDispatch({
    organizationId,
    sourceWarehouseId,
    destinationWarehouseId,
    lines = [],
    notes = '',
    actorId = null,
  }) {
    if (!sourceWarehouseId || !destinationWarehouseId) {
      throw new Error('Source and destination warehouses are required.');
    }
    if (sourceWarehouseId.toString() === destinationWarehouseId.toString()) {
      throw new Error('Source and destination warehouse cannot be the same.');
    }
    if (!lines || lines.length === 0) {
      throw new Error('At least one item line is required for transfer dispatch.');
    }

    const transferNumber = await counterService.generateStockTransferNumber(organizationId);

    // Validate stock availability for all lines first
    for (const line of lines) {
      const bal = await this.getStockBalance(organizationId, line.itemId, sourceWarehouseId);
      if (bal.available < line.actualQty) {
        const item = await Item.findById(line.itemId);
        throw new Error(
          `Insufficient stock at source warehouse for "${item?.name || line.itemId}". Available: ${bal.available}, Requested: ${line.actualQty}`
        );
      }
    }

    // 1. Create StockMovement in 'in_transit' status
    const movement = await StockMovement.create({
      organizationId,
      movementNumber: transferNumber,
      movementType: 'transfer',
      status: 'in_transit',
      sourceWarehouseId,
      destinationWarehouseId,
      requestedBy: actorId,
      reasonCode: 'warehouse_transfer',
      lines: lines.map((l) => ({
        itemId: l.itemId,
        requestedQty: l.actualQty,
        actualQty: l.actualQty,
        unitCost: l.unitCost || 0,
        totalCost: Math.round((l.actualQty * (l.unitCost || 0)) * 100) / 100,
        sourceBinId: l.sourceBinId || null,
        batchNumber: l.batchNumber || '',
        serialNumbers: l.serialNumbers || [],
      })),
      totalQuantity: lines.reduce((sum, l) => sum + l.actualQty, 0),
      notes: notes.trim(),
    });

    // 2. Post 'transfer_out' from source warehouse for each line
    for (const line of lines) {
      const item = await Item.findById(line.itemId);
      const valuation = await stockValuationService.calculateFifoCost({
        organizationId,
        itemId: line.itemId,
        warehouseId: sourceWarehouseId,
        quantityToIssue: line.actualQty,
      });

      const balance = await this.getStockBalance(organizationId, line.itemId, sourceWarehouseId);

      await StockLedger.create({
        organizationId,
        transactionType: 'transfer_out',
        documentNumber: transferNumber,
        movementId: movement._id,
        itemId: line.itemId,
        warehouseId: sourceWarehouseId,
        binId: line.sourceBinId || null,
        batchNumber: line.batchNumber || '',
        serialNumber: line.serialNumbers?.[0] || '',
        quantity: -line.actualQty, // Outbound
        unitCost: valuation.unitCost,
        totalCost: -valuation.totalCost,
        valuationMethod: item?.valuationMethod || 'fifo',
        runningBalanceQty: balance.onHand - line.actualQty,
        runningValuation: Math.max(0, balance.totalValuation - valuation.totalCost),
        actorId,
        notes: `Transfer dispatched to destination warehouse`,
      });

      // Update serial status to in_transit
      if (line.serialNumbers?.length > 0) {
        await StockSerial.updateMany(
          {
            organizationId,
            itemId: line.itemId,
            serialNumber: { $in: line.serialNumbers },
          },
          {
            $set: { status: 'in_transit' },
          }
        );
      }
    }

    return movement;
  }

  /**
   * Post Inter-Warehouse Transfer Receipt (Step 2: Into destination warehouse from in-transit)
   */
  async postTransferReceive({ organizationId, movementId, destinationBinId = null, actorId = null }) {
    const movement = await StockMovement.findOne({
      _id: movementId,
      organizationId,
      movementType: 'transfer',
    });

    if (!movement) {
      throw new Error('Transfer movement not found.');
    }
    if (movement.status !== 'in_transit') {
      throw new Error(`Transfer cannot be received. Current status is "${movement.status}".`);
    }

    // Post 'transfer_in' for each line into destination warehouse
    for (const line of movement.lines) {
      const item = await Item.findById(line.itemId);
      const prevBal = await this.getStockBalance(
        organizationId,
        line.itemId,
        movement.destinationWarehouseId
      );

      const totalCost = Math.round(line.actualQty * line.unitCost * 100) / 100;

      await StockLedger.create({
        organizationId,
        transactionType: 'transfer_in',
        documentNumber: movement.movementNumber,
        movementId: movement._id,
        itemId: line.itemId,
        warehouseId: movement.destinationWarehouseId,
        binId: destinationBinId || line.destinationBinId || null,
        batchNumber: line.batchNumber || '',
        serialNumber: line.serialNumbers?.[0] || '',
        quantity: line.actualQty, // Inbound
        unitCost: line.unitCost,
        totalCost,
        valuationMethod: item?.valuationMethod || 'fifo',
        runningBalanceQty: prevBal.onHand + line.actualQty,
        runningValuation: prevBal.totalValuation + totalCost,
        actorId,
        notes: `Transfer received from source warehouse`,
      });

      // Update serials to in_stock at destination warehouse
      if (line.serialNumbers?.length > 0) {
        await StockSerial.updateMany(
          {
            organizationId,
            itemId: line.itemId,
            serialNumber: { $in: line.serialNumbers },
          },
          {
            $set: {
              status: 'in_stock',
              currentWarehouseId: movement.destinationWarehouseId,
              currentBinId: destinationBinId || line.destinationBinId || null,
            },
          }
        );
      }
    }

    movement.status = 'completed';
    movement.approvedBy = actorId;
    movement.approvalDate = new Date();
    await movement.save();

    return movement;
  }

  /**
   * Post Stock Adjustment (Write-offs, count surpluses, shrinkage) with approval reason codes
   */
  async postAdjustment({
    organizationId,
    documentNumber,
    itemId,
    warehouseId,
    binId = null,
    quantity,
    unitCost,
    adjustmentType = 'out', // 'in' or 'out'
    reasonCode = 'damaged',
    batchNumber = '',
    serialNumbers = [],
    notes = '',
    actorId = null,
  }) {
    if (quantity <= 0) {
      throw new Error('Adjustment quantity must be greater than zero.');
    }

    const item = await Item.findOne({ _id: itemId, organizationId });
    if (!item) {
      throw new Error('Item not found in this organization.');
    }

    const cleanDocNum =
      documentNumber || (await counterService.generateAdjustmentNumber(organizationId));

    if (adjustmentType === 'in') {
      const effectiveCost = unitCost !== undefined ? unitCost : item.standardCost || 0;
      return this.postReceipt({
        organizationId,
        documentNumber: cleanDocNum,
        itemId,
        warehouseId,
        binId,
        quantity,
        unitCost: effectiveCost,
        batchNumber,
        serialNumbers,
        notes: `Adjustment (In) [${reasonCode}]: ${notes}`,
        actorId,
      });
    } else {
      return this.postIssue({
        organizationId,
        documentNumber: cleanDocNum,
        itemId,
        warehouseId,
        binId,
        quantity,
        reasonCode,
        batchNumber,
        serialNumbers,
        notes: `Adjustment (Out) [${reasonCode}]: ${notes}`,
        actorId,
        allowNegativeStock: false,
      });
    }
  }

  /**
   * Compensating Reversal of an erroneous ledger entry (Maintains append-only audit guarantee)
   */
  async reverseLedgerEntry({ organizationId, ledgerId, reason = '', actorId = null }) {
    const originalEntry = await StockLedger.findOne({ _id: ledgerId, organizationId });
    if (!originalEntry) {
      throw new Error('Stock ledger entry not found.');
    }
    if (originalEntry.isReversed) {
      throw new Error('This ledger entry has already been reversed.');
    }

    const currentBal = await this.getStockBalance(
      organizationId,
      originalEntry.itemId,
      originalEntry.warehouseId
    );

    const reversedQty = -originalEntry.quantity;
    const reversedTotalCost = -originalEntry.totalCost;

    // Check if reversing an inbound would cause negative stock
    if (reversedQty < 0 && currentBal.available < Math.abs(reversedQty)) {
      throw new Error(
        `Cannot reverse entry: resulting stock balance would be negative (Available: ${currentBal.available}, Reversal deduction: ${Math.abs(reversedQty)}).`
      );
    }

    // 1. Mark original entry as reversed
    originalEntry.isReversed = true;
    await originalEntry.save();

    // 2. Append new compensating reversal ledger entry
    const reversalEntry = await StockLedger.create({
      organizationId,
      transactionType: 'reversal',
      documentNumber: `REV-${originalEntry.documentNumber}`,
      movementId: originalEntry.movementId,
      itemId: originalEntry.itemId,
      warehouseId: originalEntry.warehouseId,
      binId: originalEntry.binId,
      batchNumber: originalEntry.batchNumber,
      serialNumber: originalEntry.serialNumber,
      quantity: reversedQty,
      unitCost: originalEntry.unitCost,
      totalCost: reversedTotalCost,
      valuationMethod: originalEntry.valuationMethod,
      runningBalanceQty: currentBal.onHand + reversedQty,
      runningValuation: Math.max(0, currentBal.totalValuation + reversedTotalCost),
      reversalOfLedgerId: originalEntry._id,
      actorId,
      notes: `Compensating reversal of ${originalEntry.documentNumber}. Reason: ${reason}`.trim(),
    });

    // 3. Batch adjustment if applicable
    if (originalEntry.batchNumber) {
      await StockBatch.findOneAndUpdate(
        {
          organizationId,
          itemId: originalEntry.itemId,
          warehouseId: originalEntry.warehouseId,
          batchNumber: originalEntry.batchNumber,
        },
        {
          $inc: { remainingQuantity: reversedQty },
        }
      );
    }

    return reversalEntry;
  }
}

module.exports = new StockLedgerService();
