const Supplier = require('../models/Supplier');
const Item = require('../models/Item');
const AuditLog = require('../models/AuditLog');
const counterService = require('../services/counterService');
const inventoryMasterService = require('../services/inventoryMasterService');

/**
 * Get all suppliers for tenant
 */
exports.getSuppliers = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { search, activeOnly = 'true', page = 1, limit = 25 } = req.query;

    const filter = { organizationId: orgId };
    if (activeOnly === 'true') {
      filter.active = true;
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { supplierCode: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
        { 'contactPerson.email': { $regex: q, $options: 'i' } },
        { 'taxDetails.taxId': { $regex: q, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .populate('itemPriceList.itemId', 'sku name baseUom standardCost')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Supplier.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      suppliers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Error in getSuppliers:', error);
    return res.status(500).json({ error: 'Failed to fetch suppliers.' });
  }
};

/**
 * Get single supplier by ID
 */
exports.getSupplierById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, organizationId: orgId })
      .populate('itemPriceList.itemId', 'sku name baseUom standardCost brand')
      .lean();

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    return res.json({ success: true, supplier });
  } catch (error) {
    console.error('Error in getSupplierById:', error);
    return res.status(500).json({ error: 'Failed to fetch supplier.' });
  }
};

/**
 * Create a new Supplier
 */
exports.createSupplier = async (req, res) => {
  try {
    const orgId = req.organizationId;
    let {
      supplierCode,
      name,
      contactPerson = {},
      taxDetails = {},
      paymentTerms = {},
      leadTimeDays = 7,
      currency = 'USD',
      address = {},
      itemPriceList = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Supplier name is required.' });
    }

    if (!supplierCode || !supplierCode.trim()) {
      supplierCode = await counterService.generateSupplierCode(orgId);
    } else {
      supplierCode = supplierCode.trim().toUpperCase();
      const existing = await Supplier.findOne({ organizationId: orgId, supplierCode });
      if (existing) {
        return res.status(409).json({ error: `Supplier with code "${supplierCode}" already exists.` });
      }
    }

    const supplier = await Supplier.create({
      organizationId: orgId,
      supplierCode,
      name: name.trim(),
      contactPerson,
      taxDetails,
      paymentTerms,
      leadTimeDays: Number(leadTimeDays) || 7,
      currency,
      address,
      itemPriceList,
      active: true,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'supplier_created',
      entity: 'Supplier',
      entityId: supplier._id,
      metadata: { supplierCode: supplier.supplierCode, name: supplier.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, supplier });
  } catch (error) {
    console.error('Error in createSupplier:', error);
    return res.status(500).json({ error: error.message || 'Failed to create supplier.' });
  }
};

/**
 * Update Supplier
 */
exports.updateSupplier = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, organizationId: orgId });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    const fields = ['name', 'contactPerson', 'taxDetails', 'paymentTerms', 'leadTimeDays', 'currency', 'address', 'itemPriceList', 'active'];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) {
        supplier[f] = req.body[f];
      }
    });

    await supplier.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'supplier_updated',
      entity: 'Supplier',
      entityId: supplier._id,
      metadata: { supplierCode: supplier.supplierCode, name: supplier.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, supplier });
  } catch (error) {
    console.error('Error in updateSupplier:', error);
    return res.status(500).json({ error: error.message || 'Failed to update supplier.' });
  }
};

/**
 * Delete Supplier (soft)
 */
exports.deleteSupplier = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const supplier = await Supplier.findOne({ _id: id, organizationId: orgId });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    supplier.active = false;
    await supplier.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'supplier_deactivated',
      entity: 'Supplier',
      entityId: supplier._id,
      metadata: { supplierCode: supplier.supplierCode },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, message: 'Supplier deactivated successfully.' });
  } catch (error) {
    console.error('Error in deleteSupplier:', error);
    return res.status(500).json({ error: 'Failed to delete supplier.' });
  }
};

/**
 * Add or update item price in price list
 */
exports.updateItemPrice = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const { itemId, supplierPartNumber, unitPrice, minOrderQty, leadTimeDays, currency } = req.body;

    if (!itemId || unitPrice === undefined) {
      return res.status(400).json({ error: 'itemId and unitPrice are required.' });
    }

    const supplier = await Supplier.findOne({ _id: id, organizationId: orgId });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found.' });
    }

    const itemExists = await Item.findOne({ _id: itemId, organizationId: orgId });
    if (!itemExists) {
      return res.status(404).json({ error: 'Item not found in this organization.' });
    }

    const existingIdx = supplier.itemPriceList.findIndex(
      (p) => p.itemId.toString() === itemId.toString()
    );

    const priceEntry = {
      itemId,
      supplierPartNumber: supplierPartNumber || '',
      unitPrice: Number(unitPrice),
      currency: currency || supplier.currency || 'USD',
      minOrderQty: Number(minOrderQty) || 1,
      leadTimeDays: Number(leadTimeDays) || supplier.leadTimeDays || 7,
      effectiveFrom: new Date(),
    };

    if (existingIdx >= 0) {
      supplier.itemPriceList[existingIdx] = priceEntry;
    } else {
      supplier.itemPriceList.push(priceEntry);
    }

    await supplier.save();
    return res.json({ success: true, priceList: supplier.itemPriceList });
  } catch (error) {
    console.error('Error in updateItemPrice:', error);
    return res.status(500).json({ error: error.message || 'Failed to update price list.' });
  }
};

/**
 * Export Suppliers to CSV
 */
exports.exportSuppliersCsv = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const csvData = await inventoryMasterService.exportSuppliersCsv(orgId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-suppliers-${Date.now()}.csv"`);
    return res.send(csvData);
  } catch (error) {
    console.error('Error in exportSuppliersCsv:', error);
    return res.status(500).json({ error: 'Failed to export suppliers CSV.' });
  }
};
