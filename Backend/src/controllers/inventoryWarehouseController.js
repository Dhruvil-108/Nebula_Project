const Warehouse = require('../models/Warehouse');
const WarehouseZone = require('../models/WarehouseZone');
const WarehouseBin = require('../models/WarehouseBin');
const AuditLog = require('../models/AuditLog');
const counterService = require('../services/counterService');
const inventoryMasterService = require('../services/inventoryMasterService');

/**
 * Get all warehouses for tenant
 */
exports.getWarehouses = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { activeOnly = 'true' } = req.query;

    const filter = { organizationId: orgId };
    if (activeOnly === 'true') {
      filter.active = true;
    }

    const warehouses = await Warehouse.find(filter).sort({ isDefault: -1, code: 1 }).lean();

    // Attach zone & bin counts
    const warehousesWithCounts = await Promise.all(
      warehouses.map(async (wh) => {
        const [zoneCount, binCount] = await Promise.all([
          WarehouseZone.countDocuments({ organizationId: orgId, warehouseId: wh._id }),
          WarehouseBin.countDocuments({ organizationId: orgId, warehouseId: wh._id }),
        ]);
        return { ...wh, zoneCount, binCount };
      })
    );

    return res.json({ success: true, warehouses: warehousesWithCounts });
  } catch (error) {
    console.error('Error in getWarehouses:', error);
    return res.status(500).json({ error: 'Failed to fetch warehouses.' });
  }
};

/**
 * Create a new Warehouse
 */
exports.createWarehouse = async (req, res) => {
  try {
    const orgId = req.organizationId;
    let { code, name, address, contactPerson, isDefault = false } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Warehouse name is required.' });
    }

    if (!code || !code.trim()) {
      code = await counterService.generateWarehouseCode(orgId);
    } else {
      code = code.trim().toUpperCase();
      const existing = await Warehouse.findOne({ organizationId: orgId, code });
      if (existing) {
        return res.status(409).json({ error: `Warehouse with code "${code}" already exists.` });
      }
    }

    if (isDefault) {
      // Unset previous default
      await Warehouse.updateMany({ organizationId: orgId }, { isDefault: false });
    }

    const warehouse = await Warehouse.create({
      organizationId: orgId,
      code,
      name: name.trim(),
      address: address || {},
      contactPerson: contactPerson || {},
      isDefault: Boolean(isDefault),
      active: true,
    });

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'warehouse_created',
      entity: 'Warehouse',
      entityId: warehouse._id,
      metadata: { code: warehouse.code, name: warehouse.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.status(201).json({ success: true, warehouse });
  } catch (error) {
    console.error('Error in createWarehouse:', error);
    return res.status(500).json({ error: error.message || 'Failed to create warehouse.' });
  }
};

/**
 * Update Warehouse
 */
exports.updateWarehouse = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const { name, address, contactPerson, isDefault, active } = req.body;

    const warehouse = await Warehouse.findOne({ _id: id, organizationId: orgId });
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found.' });
    }

    if (name) warehouse.name = name.trim();
    if (address !== undefined) warehouse.address = address;
    if (contactPerson !== undefined) warehouse.contactPerson = contactPerson;
    if (active !== undefined) warehouse.active = Boolean(active);

    if (isDefault) {
      await Warehouse.updateMany({ organizationId: orgId }, { isDefault: false });
      warehouse.isDefault = true;
    }

    await warehouse.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'warehouse_updated',
      entity: 'Warehouse',
      entityId: warehouse._id,
      metadata: { code: warehouse.code, name: warehouse.name },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, warehouse });
  } catch (error) {
    console.error('Error in updateWarehouse:', error);
    return res.status(500).json({ error: 'Failed to update warehouse.' });
  }
};

/**
 * Delete Warehouse
 */
exports.deleteWarehouse = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const warehouse = await Warehouse.findOne({ _id: id, organizationId: orgId });
    if (!warehouse) {
      return res.status(404).json({ error: 'Warehouse not found.' });
    }

    warehouse.active = false;
    await warehouse.save();

    await AuditLog.create({
      organizationId: orgId,
      actor: req.user._id,
      action: 'warehouse_deactivated',
      entity: 'Warehouse',
      entityId: warehouse._id,
      metadata: { code: warehouse.code },
    }).catch((e) => console.warn('AuditLog error:', e.message));

    return res.json({ success: true, message: 'Warehouse deactivated.' });
  } catch (error) {
    console.error('Error in deleteWarehouse:', error);
    return res.status(500).json({ error: 'Failed to delete warehouse.' });
  }
};

/**
 * Get Zones for a Warehouse
 */
exports.getZones = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { warehouseId } = req.params;

    const zones = await WarehouseZone.find({ organizationId: orgId, warehouseId, active: true })
      .sort({ code: 1 })
      .lean();

    // Attach bin counts
    const zonesWithCounts = await Promise.all(
      zones.map(async (zone) => {
        const binCount = await WarehouseBin.countDocuments({
          organizationId: orgId,
          warehouseId,
          zoneId: zone._id,
          active: true,
        });
        return { ...zone, binCount };
      })
    );

    return res.json({ success: true, zones: zonesWithCounts });
  } catch (error) {
    console.error('Error in getZones:', error);
    return res.status(500).json({ error: 'Failed to fetch zones.' });
  }
};

/**
 * Create Zone
 */
exports.createZone = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { warehouseId } = req.params;
    const { code, name, zoneType = 'storage' } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Zone code and name are required.' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await WarehouseZone.findOne({
      organizationId: orgId,
      warehouseId,
      code: cleanCode,
    });
    if (existing) {
      return res.status(409).json({ error: `Zone with code "${cleanCode}" already exists in this warehouse.` });
    }

    const zone = await WarehouseZone.create({
      organizationId: orgId,
      warehouseId,
      code: cleanCode,
      name: name.trim(),
      zoneType,
      active: true,
    });

    return res.status(201).json({ success: true, zone });
  } catch (error) {
    console.error('Error in createZone:', error);
    return res.status(500).json({ error: error.message || 'Failed to create zone.' });
  }
};

/**
 * Get Bins for a Warehouse and optional Zone
 */
exports.getBins = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { warehouseId } = req.params;
    const { zoneId } = req.query;

    const filter = { organizationId: orgId, warehouseId, active: true };
    if (zoneId) {
      filter.zoneId = zoneId;
    }

    const bins = await WarehouseBin.find(filter)
      .populate('zoneId', 'code name zoneType')
      .sort({ binCode: 1 })
      .lean();

    return res.json({ success: true, bins });
  } catch (error) {
    console.error('Error in getBins:', error);
    return res.status(500).json({ error: 'Failed to fetch bins.' });
  }
};

/**
 * Create a Warehouse Bin
 */
exports.createBin = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { warehouseId } = req.params;
    let { binCode, zoneId, barcode, capacity } = req.body;

    if (!binCode || !binCode.trim()) {
      binCode = await counterService.generateBinCode(orgId);
    } else {
      binCode = binCode.trim().toUpperCase();
    }

    const existing = await WarehouseBin.findOne({
      organizationId: orgId,
      warehouseId,
      binCode,
    });
    if (existing) {
      return res.status(409).json({ error: `Bin code "${binCode}" already exists in this warehouse.` });
    }

    if (!barcode || !barcode.trim()) {
      barcode = binCode;
    }

    const bin = await WarehouseBin.create({
      organizationId: orgId,
      warehouseId,
      zoneId: zoneId || null,
      binCode,
      barcode: barcode.trim(),
      capacity: capacity || {},
      active: true,
    });

    return res.status(201).json({ success: true, bin });
  } catch (error) {
    console.error('Error in createBin:', error);
    return res.status(500).json({ error: error.message || 'Failed to create bin.' });
  }
};

/**
 * Get Bin QR code
 */
exports.getBinQrCode = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { binId } = req.params;

    const bin = await WarehouseBin.findOne({ _id: binId, organizationId: orgId })
      .populate('warehouseId', 'code name')
      .populate('zoneId', 'code name')
      .lean();

    if (!bin) {
      return res.status(404).json({ error: 'Bin not found.' });
    }

    const qrDataUrl = await inventoryMasterService.generateQrCodeDataUrl({
      type: 'BIN',
      binCode: bin.binCode,
      barcode: bin.barcode,
      warehouse: bin.warehouseId ? bin.warehouseId.code : '',
      zone: bin.zoneId ? bin.zoneId.code : '',
    });

    return res.json({
      success: true,
      binCode: bin.binCode,
      warehouseName: bin.warehouseId?.name,
      qrDataUrl,
    });
  } catch (error) {
    console.error('Error in getBinQrCode:', error);
    return res.status(500).json({ error: 'Failed to generate bin QR code.' });
  }
};
