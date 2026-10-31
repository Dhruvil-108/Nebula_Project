const EquipmentKit = require('../models/EquipmentKit');
const EmployeeAssetAssignment = require('../models/EmployeeAssetAssignment');
const hrmsInventoryBridgeService = require('../services/hrmsInventoryBridgeService');
const accountingHookService = require('../services/accountingHookService');
const inventoryNotificationService = require('../services/inventoryNotificationService');
const procurementBudgetBridgeService = require('../services/procurementBudgetBridgeService');

// ── Equipment Kits ──────────────────────────────────────────────────────────

exports.getEquipmentKits = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const kits = await hrmsInventoryBridgeService.getEquipmentKits(orgId);
    return res.json({ success: true, count: kits.length, kits });
  } catch (err) {
    console.error('Error fetching equipment kits:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch equipment kits.' });
  }
};

exports.createEquipmentKit = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const kit = await hrmsInventoryBridgeService.createEquipmentKit(orgId, req.body);
    return res.status(201).json({ success: true, kit });
  } catch (err) {
    console.error('Error creating equipment kit:', err);
    return res.status(400).json({ error: err.message });
  }
};

// ── Asset Assignments ───────────────────────────────────────────────────────

exports.getAssetAssignments = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { employeeId, status, page = 1, limit = 20 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };
    if (employeeId) filter.employeeId = employeeId;
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await EmployeeAssetAssignment.countDocuments(filter);

    const assignments = await EmployeeAssetAssignment.find(filter)
      .populate('employeeId', 'fullName email employeeCode designation departmentId')
      .populate('kitId', 'name code')
      .populate('assignedItems.itemId', 'sku name baseUom standardCost')
      .populate('assignedItems.warehouseId', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      assignments,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error in getAssetAssignments:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch asset assignments.' });
  }
};

exports.issueAssets = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const actorId = req.user._id;
    const { id } = req.params;
    const { warehouseId, allocations } = req.body;

    if (!warehouseId) {
      return res.status(400).json({ error: 'Source warehouseId is required to issue assets.' });
    }

    const assignment = await hrmsInventoryBridgeService.issueAssetsToEmployee({
      organizationId: orgId,
      assignmentId: id,
      actorId,
      warehouseId,
      allocations,
    });

    return res.json({
      success: true,
      message: 'Assets issued and stock ledger updated.',
      assignment,
    });
  } catch (err) {
    console.error('Error issuing assets:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.initiateExitChecklist = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const actorId = req.user._id;
    const { employeeId, exitDate, remarks } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId is required.' });
    }

    const result = await hrmsInventoryBridgeService.initiateExitReturnChecklist({
      organizationId: orgId,
      employeeId,
      actorId,
      exitDate,
      remarks,
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('Error initiating exit checklist:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.processExitReturn = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const actorId = req.user._id;
    const { id } = req.params;
    const { warehouseId, returnsList } = req.body;

    const assignment = await hrmsInventoryBridgeService.processExitAssetReturn({
      organizationId: orgId,
      assignmentId: id,
      actorId,
      warehouseId,
      returnsList,
    });

    return res.json({
      success: true,
      message: 'Asset returns processed and items returned to stock.',
      assignment,
    });
  } catch (err) {
    console.error('Error processing exit return:', err);
    return res.status(400).json({ error: err.message });
  }
};

// ── Accounting Events & General Ledger Sync ─────────────────────────────────

exports.getAccountingEvents = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { eventType } = req.query;

    const events = accountingHookService.getAccountingEvents(orgId, { eventType });
    return res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error('Error in getAccountingEvents:', err);
    return res.status(500).json({ error: err.message });
  }
};

// ── Notifications & Webhooks ────────────────────────────────────────────────

exports.getNotifications = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const notifications = inventoryNotificationService.getNotifications(orgId);
    return res.json({ success: true, count: notifications.length, notifications });
  } catch (err) {
    console.error('Error in getNotifications:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.scanExpiringBatches = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { days = 30 } = req.query;

    const alerts = await inventoryNotificationService.scanExpiringBatches(orgId, parseInt(days, 10));
    return res.json({ success: true, count: alerts.length, alerts });
  } catch (err) {
    console.error('Error scanning expiring batches:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.registerWebhook = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { url, secret, events } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'Webhook URL is required.' });
    }

    const sub = inventoryNotificationService.registerWebhook(orgId, { url, secret, events });
    return res.status(201).json({ success: true, subscription: sub });
  } catch (err) {
    console.error('Error registering webhook:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.getWebhooks = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const webhooks = inventoryNotificationService.getWebhooks(orgId);
    return res.json({ success: true, count: webhooks.length, webhooks });
  } catch (err) {
    console.error('Error getting webhooks:', err);
    return res.status(500).json({ error: err.message });
  }
};
