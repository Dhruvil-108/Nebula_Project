const mongoose = require('mongoose');
const EquipmentKit = require('../models/EquipmentKit');
const EmployeeAssetAssignment = require('../models/EmployeeAssetAssignment');
const Employee = require('../models/Employee');
const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const counterService = require('./counterService');
const stockLedgerService = require('./stockLedgerService');
const accountingHookService = require('./accountingHookService');

class HrmsInventoryBridgeService {
  /**
   * Create or update a reusable equipment kit template
   */
  async createEquipmentKit(organizationId, data) {
    const code =
      data.code || (await counterService.generateEquipmentKitCode(organizationId));

    const kit = await EquipmentKit.create({
      organizationId,
      name: data.name,
      code,
      description: data.description || '',
      departmentId: data.departmentId || null,
      designation: data.designation || '',
      isDefault: Boolean(data.isDefault),
      items: (data.items || []).map((it) => ({
        itemId: it.itemId,
        quantity: Math.max(1, Number(it.quantity) || 1),
        isMandatory: it.isMandatory !== false,
        notes: it.notes || '',
      })),
      active: true,
    });

    return kit;
  }

  async getEquipmentKits(organizationId, filter = {}) {
    return EquipmentKit.find({ organizationId, active: true, ...filter })
      .populate('items.itemId', 'sku name baseUom standardCost')
      .populate('departmentId', 'name')
      .lean();
  }

  /**
   * Automatically invoked upon Employee creation / Candidate onboarding
   */
  async autoCreateOnboardingAssetRequest({
    organizationId,
    employeeId,
    candidateId = null,
    departmentId = null,
    designation = '',
    actorId = null,
  }) {
    // 1. Locate matching equipment kit
    let kit = null;
    if (departmentId) {
      kit = await EquipmentKit.findOne({ organizationId, departmentId, active: true }).lean();
    }
    if (!kit && designation) {
      kit = await EquipmentKit.findOne({
        organizationId,
        designation: { $regex: new RegExp(`^${designation.trim()}$`, 'i') },
        active: true,
      }).lean();
    }
    if (!kit) {
      kit = await EquipmentKit.findOne({ organizationId, isDefault: true, active: true }).lean();
    }

    if (!kit || !kit.items || kit.items.length === 0) {
      return null;
    }

    const assignmentNumber = await counterService.generateAssetAssignmentNumber(organizationId);

    const assignedItems = kit.items.map((it) => ({
      itemId: it.itemId,
      requestedQuantity: it.quantity,
      issuedQuantity: 0,
      serialNumbers: [],
      status: 'requested',
      notes: it.notes || `Kit: ${kit.name}`,
    }));

    const assignment = await EmployeeAssetAssignment.create({
      organizationId,
      assignmentNumber,
      employeeId,
      candidateId,
      kitId: kit._id,
      requestType: 'onboarding_kit',
      status: 'requested',
      assignedItems,
      notes: `Automated equipment provisioning for employee onboarding (${kit.name}).`,
    });

    return assignment;
  }

  /**
   * Storekeeper / IT issues physical hardware to employee (posts stock ledger outflow)
   */
  async issueAssetsToEmployee({
    organizationId,
    assignmentId,
    actorId,
    warehouseId,
    allocations = [],
  }) {
    const assignment = await EmployeeAssetAssignment.findOne({
      _id: assignmentId,
      organizationId,
      deletedAt: null,
    });

    if (!assignment) {
      throw new Error('Asset assignment record not found.');
    }
    if (['issued', 'returned_full', 'cancelled'].includes(assignment.status)) {
      throw new Error(`Cannot issue assets in '${assignment.status}' status.`);
    }

    // 1. Prepare movement container
    const movementLines = [];

    for (const alloc of allocations) {
      const line = assignment.assignedItems.find(
        (it) => it.itemId.toString() === alloc.itemId.toString()
      );
      if (!line) continue;

      const qty = Number(alloc.quantity || line.requestedQuantity);
      const serials = Array.isArray(alloc.serialNumbers) ? alloc.serialNumbers : [];
      const batch = alloc.batchNumber || '';

      line.issuedQuantity = qty;
      line.warehouseId = warehouseId;
      line.binId = alloc.binId || null;
      line.serialNumbers = serials;
      line.batchNumber = batch;
      line.issuedAt = new Date();
      line.status = 'issued';

      movementLines.push({
        itemId: line.itemId,
        requestedQty: line.requestedQuantity,
        actualQty: qty,
        unitCost: alloc.unitCost || 0,
        totalCost: Math.round(qty * (alloc.unitCost || 0) * 100) / 100,
        sourceBinId: alloc.binId || null,
        batchNumber: batch,
        serialNumbers: serials,
        notes: `Asset issue to employee ${assignment.assignmentNumber}`,
      });
    }

    const movement = await StockMovement.create({
      organizationId,
      movementNumber: `MOV-${assignment.assignmentNumber}`,
      movementType: 'issue',
      sourceWarehouseId: warehouseId,
      sourceDocumentType: 'internal_issue',
      sourceDocumentId: assignment._id,
      status: 'completed',
      dispatchedBy: actorId,
      dispatchedAt: new Date(),
      lines: movementLines,
    });

    // 2. Post stock issue out of ledger for each allocated line
    for (const alloc of allocations) {
      const line = assignment.assignedItems.find(
        (it) => it.itemId.toString() === alloc.itemId.toString()
      );
      if (!line || line.status !== 'issued') continue;

      await stockLedgerService.postIssue({
        organizationId,
        documentNumber: assignment.assignmentNumber,
        movementId: movement._id,
        itemId: line.itemId,
        warehouseId,
        binId: alloc.binId || null,
        quantity: line.issuedQuantity,
        batchNumber: line.batchNumber,
        serialNumbers: line.serialNumbers,
        notes: `Assigned to Employee (Assignment #${assignment.assignmentNumber})`,
        actorId,
      });

      // Emit accounting hook event
      accountingHookService.emitInventoryEvent(organizationId, 'INVENTORY.ISSUE', {
        documentNumber: assignment.assignmentNumber,
        itemId: line.itemId,
        warehouseId,
        quantity: line.issuedQuantity,
        totalCost: movementLines.find((m) => m.itemId.toString() === line.itemId.toString())?.totalCost || 0,
        reason: 'employee_equipment_issue',
      });
    }

    assignment.status = 'issued';
    assignment.stockLedgerPosted = true;
    assignment.stockMovementId = movement._id;
    await assignment.save();

    return assignment;
  }

  /**
   * HRMS Employee Offboarding: Initiate asset return checklist
   */
  async initiateExitReturnChecklist({
    organizationId,
    employeeId,
    actorId,
    exitDate = new Date(),
    remarks = '',
  }) {
    const assignments = await EmployeeAssetAssignment.find({
      organizationId,
      employeeId,
      status: { $in: ['issued', 'allocated', 'returned_partial'] },
    });

    if (assignments.length === 0) {
      return { count: 0, message: 'No active asset assignments found for this employee.' };
    }

    for (const asst of assignments) {
      asst.exitChecklist = {
        initiatedAt: new Date(),
        exitDate,
        isCompleted: false,
        verifiedBy: actorId,
        remarks,
      };
      await asst.save();
    }

    return { count: assignments.length, assignments };
  }

  /**
   * Process equipment returns during employee offboarding (receipts good items back to stock)
   */
  async processExitAssetReturn({
    organizationId,
    assignmentId,
    actorId,
    warehouseId,
    returnsList = [],
  }) {
    const assignment = await EmployeeAssetAssignment.findOne({
      _id: assignmentId,
      organizationId,
      deletedAt: null,
    });

    if (!assignment) {
      throw new Error('Asset assignment not found.');
    }

    let allReturned = true;

    for (const ret of returnsList) {
      const line = assignment.assignedItems.find(
        (it) => it.itemId.toString() === ret.itemId.toString()
      );
      if (!line) continue;

      line.returnDate = new Date();
      line.returnCondition = ret.condition || 'good';

      if (['damaged', 'unusable'].includes(ret.condition)) {
        line.status = 'damaged';
      } else if (ret.isLost) {
        line.status = 'lost';
      } else {
        line.status = 'returned';
        // Good/Fair equipment is returned into the warehouse inventory!
        if (warehouseId && line.issuedQuantity > 0) {
          await stockLedgerService.postReceipt({
            organizationId,
            documentNumber: `RET-${assignment.assignmentNumber}`,
            itemId: line.itemId,
            warehouseId,
            binId: ret.binId || null,
            quantity: line.issuedQuantity,
            batchNumber: line.batchNumber || '',
            serialNumbers: line.serialNumbers || [],
            notes: `Employee Exit Return: ${assignment.assignmentNumber}`,
            actorId,
          });

          accountingHookService.emitInventoryEvent(organizationId, 'INVENTORY.RECEIPT', {
            documentNumber: `RET-${assignment.assignmentNumber}`,
            itemId: line.itemId,
            warehouseId,
            quantity: line.issuedQuantity,
            reason: 'employee_asset_return',
          });
        }
      }
    }

    const hasUnreturned = assignment.assignedItems.some((it) => it.status === 'issued');
    assignment.status = hasUnreturned ? 'returned_partial' : 'returned_full';

    if (!hasUnreturned) {
      assignment.exitChecklist.isCompleted = true;
      assignment.exitChecklist.completedAt = new Date();
      assignment.exitChecklist.verifiedBy = actorId;
    }

    await assignment.save();
    return assignment;
  }
}

module.exports = new HrmsInventoryBridgeService();
