const StockLedger = require('../models/StockLedger');
const StockMovement = require('../models/StockMovement');
const StockBatch = require('../models/StockBatch');
const StockSerial = require('../models/StockSerial');
const Item = require('../models/Item');
const Warehouse = require('../models/Warehouse');
const AuditLog = require('../models/AuditLog');
const stockLedgerService = require('../services/stockLedgerService');
const traceabilityService = require('../services/traceabilityService');
const counterService = require('../services/counterService');

/**
 * Get paginated Stock Ledger entries
 */
exports.getLedgerEntries = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      itemId,
      warehouseId,
      transactionType,
      search,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = { organizationId: orgId };

    if (itemId) filter.itemId = itemId;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { documentNumber: { $regex: q, $options: 'i' } },
        { batchNumber: { $regex: q, $options: 'i' } },
        { serialNumber: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [entries, total] = await Promise.all([
      StockLedger.find(filter)
        .populate('itemId', 'sku name baseUom')
        .populate('warehouseId', 'code name')
        .populate('binId', 'binCode')
        .populate('actorId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      StockLedger.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      entries,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getLedgerEntries:', error);
    return res.status(500).json({ error: 'Failed to fetch stock ledger entries.' });
  }
};

/**
 * Get live stock balances across items and warehouses
 */
exports.getStockBalances = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { warehouseId, search, categoryId } = req.query;

    const itemFilter = { organizationId: orgId, active: true };
    if (categoryId) itemFilter.categoryId = categoryId;
    if (search && search.trim()) {
      const q = search.trim();
      itemFilter.$or = [
        { sku: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ];
    }

    const items = await Item.find(itemFilter)
      .populate('categoryId', 'name code')
      .populate('defaultWarehouseId', 'name code')
      .lean();

    const balances = await Promise.all(
      items.map(async (item) => {
        const bal = await stockLedgerService.getStockBalance(orgId, item._id, warehouseId || null);
        return {
          item: {
            _id: item._id,
            sku: item.sku,
            name: item.name,
            baseUom: item.baseUom,
            category: item.categoryId?.name,
            minStockLevel: item.minStockLevel,
            maxStockLevel: item.maxStockLevel,
            reorderPoint: item.reorderPoint,
            standardCost: item.standardCost,
            trackingType: item.trackingType,
          },
          ...bal,
        };
      })
    );

    return res.json({ success: true, balances });
  } catch (error) {
    console.error('Error in getStockBalances:', error);
    return res.status(500).json({ error: 'Failed to calculate stock balances.' });
  }
};

/**
 * Post Goods Receipt Note (GRN)
 */
exports.postGoodsReceipt = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      documentNumber,
      itemId,
      warehouseId,
      binId,
      quantity,
      unitCost,
      batchNumber,
      manufactureDate,
      expiryDate,
      serialNumbers = [],
      notes = '',
    } = req.body;

    if (!itemId || !warehouseId || !quantity) {
      return res.status(400).json({ error: 'itemId, warehouseId, and quantity are required.' });
    }

    const ledgerEntry = await stockLedgerService.postReceipt({
      organizationId: orgId,
      documentNumber,
      itemId,
      warehouseId,
      binId: binId || null,
      quantity: Number(quantity),
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      batchNumber,
      manufactureDate,
      expiryDate,
      serialNumbers,
      notes,
      actorId: req.user._id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'stock_receipt_posted',
      entity: 'StockLedger',
      entityId: ledgerEntry._id,
      metadata: {
        documentNumber: ledgerEntry.documentNumber,
        itemId,
        quantity,
      },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, ledgerEntry });
  } catch (error) {
    console.error('Error in postGoodsReceipt:', error);
    return res.status(400).json({ error: error.message || 'Failed to post goods receipt.' });
  }
};

/**
 * Post Stock Issue
 */
exports.postStockIssue = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      documentNumber,
      itemId,
      warehouseId,
      binId,
      quantity,
      reasonCode = 'internal_use',
      batchNumber,
      serialNumbers = [],
      notes = '',
    } = req.body;

    if (!itemId || !warehouseId || !quantity) {
      return res.status(400).json({ error: 'itemId, warehouseId, and quantity are required.' });
    }

    const ledgerEntry = await stockLedgerService.postIssue({
      organizationId: orgId,
      documentNumber,
      itemId,
      warehouseId,
      binId: binId || null,
      quantity: Number(quantity),
      reasonCode,
      batchNumber,
      serialNumbers,
      notes,
      actorId: req.user._id,
      allowNegativeStock: false,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'stock_issue_posted',
      entity: 'StockLedger',
      entityId: ledgerEntry._id,
      metadata: {
        documentNumber: ledgerEntry.documentNumber,
        itemId,
        quantity,
        reasonCode,
      },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, ledgerEntry });
  } catch (error) {
    console.error('Error in postStockIssue:', error);
    return res.status(400).json({ error: error.message || 'Failed to post stock issue.' });
  }
};

/**
 * Post Inter-Warehouse Transfer Dispatch
 */
exports.postTransferDispatch = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { sourceWarehouseId, destinationWarehouseId, lines = [], notes = '' } = req.body;

    const movement = await stockLedgerService.postTransferDispatch({
      organizationId: orgId,
      sourceWarehouseId,
      destinationWarehouseId,
      lines,
      notes,
      actorId: req.user._id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'stock_transfer_dispatched',
      entity: 'StockMovement',
      entityId: movement._id,
      metadata: {
        movementNumber: movement.movementNumber,
        sourceWarehouseId,
        destinationWarehouseId,
      },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, movement });
  } catch (error) {
    console.error('Error in postTransferDispatch:', error);
    return res.status(400).json({ error: error.message || 'Failed to dispatch transfer.' });
  }
};

/**
 * Receive Inter-Warehouse Transfer at Destination
 */
exports.postTransferReceive = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { movementId } = req.params;
    const { destinationBinId } = req.body;

    const movement = await stockLedgerService.postTransferReceive({
      organizationId: orgId,
      movementId,
      destinationBinId,
      actorId: req.user._id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'stock_transfer_received',
      entity: 'StockMovement',
      entityId: movement._id,
      metadata: { movementNumber: movement.movementNumber },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, movement });
  } catch (error) {
    console.error('Error in postTransferReceive:', error);
    return res.status(400).json({ error: error.message || 'Failed to receive transfer.' });
  }
};

/**
 * Post Stock Adjustment
 */
exports.postStockAdjustment = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      documentNumber,
      itemId,
      warehouseId,
      binId,
      quantity,
      unitCost,
      adjustmentType = 'out',
      reasonCode = 'damaged',
      batchNumber,
      serialNumbers = [],
      notes = '',
    } = req.body;

    const ledgerEntry = await stockLedgerService.postAdjustment({
      organizationId: orgId,
      documentNumber,
      itemId,
      warehouseId,
      binId: binId || null,
      quantity: Number(quantity),
      unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
      adjustmentType,
      reasonCode,
      batchNumber,
      serialNumbers,
      notes,
      actorId: req.user._id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'stock_adjustment_posted',
      entity: 'StockLedger',
      entityId: ledgerEntry._id,
      metadata: {
        documentNumber: ledgerEntry.documentNumber,
        itemId,
        quantity,
        adjustmentType,
        reasonCode,
      },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, ledgerEntry });
  } catch (error) {
    console.error('Error in postStockAdjustment:', error);
    return res.status(400).json({ error: error.message || 'Failed to post stock adjustment.' });
  }
};

/**
 * Post Cycle Count Physical Audit Reconciliation
 */
exports.postCycleCount = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { warehouseId, counts = [], notes = '' } = req.body;

    if (!warehouseId || !Array.isArray(counts) || counts.length === 0) {
      return res.status(400).json({ error: 'warehouseId and counts array are required.' });
    }

    const countDocNum = await counterService.generateCycleCountNumber(orgId);
    const adjustmentsCreated = [];

    for (const count of counts) {
      const balance = await stockLedgerService.getStockBalance(orgId, count.itemId, warehouseId);
      const variance = Number(count.countedQty) - balance.onHand;

      if (variance !== 0) {
        const item = await Item.findById(count.itemId);
        const adj = await stockLedgerService.postAdjustment({
          organizationId: orgId,
          documentNumber: countDocNum,
          itemId: count.itemId,
          warehouseId,
          binId: count.binId || null,
          quantity: Math.abs(variance),
          unitCost: item?.standardCost || 0,
          adjustmentType: variance > 0 ? 'in' : 'out',
          reasonCode: 'cycle_count_variance',
          batchNumber: count.batchNumber || '',
          notes: `Cycle Count ${countDocNum} variance reconciliation. Expected: ${balance.onHand}, Actual: ${count.countedQty}. ${notes}`.trim(),
          actorId: req.user._id,
        });
        adjustmentsCreated.push(adj);
      }
    }

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'cycle_count_posted',
      entity: 'StockLedger',
      metadata: {
        countNumber: countDocNum,
        totalAdjustments: adjustmentsCreated.length,
      },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({
      success: true,
      countNumber: countDocNum,
      varianceAdjustmentsCount: adjustmentsCreated.length,
      adjustments: adjustmentsCreated,
    });
  } catch (error) {
    console.error('Error in postCycleCount:', error);
    return res.status(400).json({ error: error.message || 'Failed to post cycle count.' });
  }
};

/**
 * Compensating Reversal of a Stock Ledger Entry
 */
exports.reverseLedgerEntry = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { ledgerId } = req.params;
    const { reason = '' } = req.body;

    const reversalEntry = await stockLedgerService.reverseLedgerEntry({
      organizationId: orgId,
      ledgerId,
      reason,
      actorId: req.user._id,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'stock_ledger_entry_reversed',
      entity: 'StockLedger',
      entityId: reversalEntry._id,
      metadata: {
        originalLedgerId: ledgerId,
        reversalDocumentNumber: reversalEntry.documentNumber,
        reason,
      },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, reversalEntry });
  } catch (error) {
    console.error('Error in reverseLedgerEntry:', error);
    return res.status(400).json({ error: error.message || 'Failed to reverse stock ledger entry.' });
  }
};

/**
 * Traceability lookup for a Batch Number
 */
exports.getBatchTrace = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { batchNumber } = req.params;

    const traceData = await traceabilityService.traceBatch(orgId, batchNumber);
    return res.json({ success: true, trace: traceData });
  } catch (error) {
    console.error('Error in getBatchTrace:', error);
    return res.status(400).json({ error: error.message || 'Failed to trace batch.' });
  }
};

/**
 * Traceability lookup for a Serial Number
 */
exports.getSerialTrace = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { serialNumber } = req.params;

    const traceData = await traceabilityService.traceSerial(orgId, serialNumber);
    return res.json({ success: true, trace: traceData });
  } catch (error) {
    console.error('Error in getSerialTrace:', error);
    return res.status(400).json({ error: error.message || 'Failed to trace serial number.' });
  }
};
