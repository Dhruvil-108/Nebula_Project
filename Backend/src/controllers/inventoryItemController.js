const Item = require('../models/Item');
const ItemCategory = require('../models/ItemCategory');
const Warehouse = require('../models/Warehouse');
const WarehouseBin = require('../models/WarehouseBin');
const Supplier = require('../models/Supplier');
const AuditLog = require('../models/AuditLog');
const counterService = require('../services/counterService');
const inventoryMasterService = require('../services/inventoryMasterService');

/**
 * Get items with pagination, search, and category filters
 */
exports.getItems = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      search,
      categoryId,
      trackingType,
      activeOnly = 'true',
      page = 1,
      limit = 25,
      sortBy = 'sku',
      sortOrder = 'asc',
    } = req.query;

    const filter = { organizationId: orgId };

    if (activeOnly === 'true') {
      filter.active = true;
    } else if (activeOnly === 'false') {
      filter.active = false;
    }

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (trackingType && trackingType !== 'all') {
      filter.trackingType = trackingType;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { sku: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { barcode: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [items, totalCount] = await Promise.all([
      Item.find(filter)
        .populate('categoryId', 'name code')
        .populate('defaultWarehouseId', 'name code')
        .populate('defaultBinId', 'binCode')
        .populate('preferredSupplierId', 'name supplierCode')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Item.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      items,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getItems:', error);
    return res.status(500).json({ error: 'Failed to fetch items.' });
  }
};

/**
 * Get item by ID with full details & QR
 */
exports.getItemById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const item = await Item.findOne({ _id: id, organizationId: orgId })
      .populate('categoryId', 'name code parentId')
      .populate('defaultWarehouseId', 'name code')
      .populate('defaultBinId', 'binCode barcode')
      .populate('preferredSupplierId', 'name supplierCode contactPerson')
      .lean();

    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const qrDataUrl = await inventoryMasterService.generateQrCodeDataUrl({
      type: 'ITEM',
      sku: item.sku,
      name: item.name,
      baseUom: item.baseUom,
      trackingType: item.trackingType,
    });

    return res.json({ success: true, item: { ...item, qrDataUrl } });
  } catch (error) {
    console.error('Error in getItemById:', error);
    return res.status(500).json({ error: 'Failed to fetch item.' });
  }
};

/**
 * Create new Item
 */
exports.createItem = async (req, res) => {
  try {
    const orgId = req.organizationId;
    let {
      sku,
      barcode,
      name,
      description,
      categoryId,
      brand,
      baseUom = 'PCS',
      uomConversions = [],
      trackingType = 'none',
      hasExpiry = false,
      shelfLifeDays = 0,
      minStockLevel = 0,
      maxStockLevel = 0,
      reorderPoint = 0,
      reorderQuantity = 1,
      standardCost = 0,
      currency = 'USD',
      valuationMethod = 'fifo',
      images = [],
      variants = [],
      attributes = {},
      defaultWarehouseId,
      defaultBinId,
      preferredSupplierId,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Item name is required.' });
    }

    // Auto-generate SKU if omitted
    if (!sku || !sku.trim()) {
      sku = await counterService.generateItemSku(orgId);
    } else {
      sku = sku.trim().toUpperCase();
      const existing = await Item.findOne({ organizationId: orgId, sku });
      if (existing) {
        return res.status(409).json({ error: `Item with SKU "${sku}" already exists.` });
      }
    }

    // Auto-generate barcode if omitted
    if (!barcode || !barcode.trim()) {
      barcode = sku;
    }

    const item = await Item.create({
      organizationId: orgId,
      sku,
      barcode: barcode.trim(),
      name: name.trim(),
      description: description || '',
      categoryId: categoryId || null,
      brand: brand || '',
      baseUom: baseUom.toUpperCase(),
      uomConversions,
      trackingType,
      hasExpiry: Boolean(hasExpiry),
      shelfLifeDays: Number(shelfLifeDays) || 0,
      minStockLevel: Number(minStockLevel) || 0,
      maxStockLevel: Number(maxStockLevel) || 0,
      reorderPoint: Number(reorderPoint) || 0,
      reorderQuantity: Number(reorderQuantity) || 1,
      standardCost: Number(standardCost) || 0,
      currency,
      valuationMethod,
      images,
      variants,
      attributes,
      defaultWarehouseId: defaultWarehouseId || null,
      defaultBinId: defaultBinId || null,
      preferredSupplierId: preferredSupplierId || null,
      active: true,
    });

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'item_created',
      entity: 'Item',
      entityId: item._id,
      metadata: { sku: item.sku, name: item.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, item });
  } catch (error) {
    console.error('Error in createItem:', error);
    return res.status(500).json({ error: error.message || 'Failed to create item.' });
  }
};

/**
 * Update an Item
 */
exports.updateItem = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const item = await Item.findOne({ _id: id, organizationId: orgId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const allowedUpdates = [
      'name',
      'barcode',
      'description',
      'categoryId',
      'brand',
      'baseUom',
      'uomConversions',
      'trackingType',
      'hasExpiry',
      'shelfLifeDays',
      'minStockLevel',
      'maxStockLevel',
      'reorderPoint',
      'reorderQuantity',
      'standardCost',
      'currency',
      'valuationMethod',
      'images',
      'variants',
      'attributes',
      'defaultWarehouseId',
      'defaultBinId',
      'preferredSupplierId',
      'active',
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    await item.save();

    // Audit log
    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'item_updated',
      entity: 'Item',
      entityId: item._id,
      metadata: { sku: item.sku, name: item.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, item });
  } catch (error) {
    console.error('Error in updateItem:', error);
    return res.status(500).json({ error: error.message || 'Failed to update item.' });
  }
};

/**
 * Delete Item (Soft-delete)
 */
exports.deleteItem = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const item = await Item.findOne({ _id: id, organizationId: orgId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    item.active = false;
    await item.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'item_deactivated',
      entity: 'Item',
      entityId: item._id,
      metadata: { sku: item.sku },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, message: 'Item deactivated successfully.' });
  } catch (error) {
    console.error('Error in deleteItem:', error);
    return res.status(500).json({ error: 'Failed to deactivate item.' });
  }
};

/**
 * Get Item QR code
 */
exports.getItemQrCode = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const item = await Item.findOne({ _id: id, organizationId: orgId }).lean();
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const qrDataUrl = await inventoryMasterService.generateQrCodeDataUrl({
      type: 'ITEM',
      sku: item.sku,
      barcode: item.barcode,
      name: item.name,
      baseUom: item.baseUom,
      trackingType: item.trackingType,
    });

    return res.json({ success: true, sku: item.sku, name: item.name, qrDataUrl });
  } catch (error) {
    console.error('Error in getItemQrCode:', error);
    return res.status(500).json({ error: 'Failed to generate QR code.' });
  }
};

/**
 * Preview CSV Import
 */
exports.previewCsvImport = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({ error: 'csvContent is required.' });
    }

    const preview = await inventoryMasterService.validateItemsCsv(orgId, csvContent);
    return res.json({ success: true, ...preview });
  } catch (error) {
    console.error('Error in previewCsvImport:', error);
    return res.status(500).json({ error: 'Failed to preview CSV.' });
  }
};

/**
 * Commit CSV Import
 */
exports.commitCsvImport = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required for import commit.' });
    }

    const result = await inventoryMasterService.commitItemsImport(orgId, items);

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'items_bulk_imported',
      entity: 'Item',
      metadata: { importedCount: result.importedCount },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json(result);
  } catch (error) {
    console.error('Error in commitCsvImport:', error);
    return res.status(500).json({ error: error.message || 'Failed to commit CSV import.' });
  }
};

/**
 * Export Items to CSV
 */
exports.exportItemsCsv = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const csvData = await inventoryMasterService.exportItemsCsv(orgId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-items-${Date.now()}.csv"`);
    return res.send(csvData);
  } catch (error) {
    console.error('Error in exportItemsCsv:', error);
    return res.status(500).json({ error: 'Failed to export items CSV.' });
  }
};
