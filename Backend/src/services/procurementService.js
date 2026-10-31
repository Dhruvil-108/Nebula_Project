const mongoose = require('mongoose');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceiptNote = require('../models/GoodsReceiptNote');
const SupplierInvoice = require('../models/SupplierInvoice');
const ReturnToVendor = require('../models/ReturnToVendor');
const Item = require('../models/Item');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
const StockMovement = require('../models/StockMovement');
const counterService = require('./counterService');
const stockLedgerService = require('./stockLedgerService');
const procurementBudgetBridgeService = require('./procurementBudgetBridgeService');
const accountingHookService = require('./accountingHookService');
const inventoryNotificationService = require('./inventoryNotificationService');
const { ROLES } = require('../config/roles');

class ProcurementService {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. PURCHASE REQUISITIONS (PR)
  // ──────────────────────────────────────────────────────────────────────────

  async createRequisition(organizationId, userId, data) {
    const requisitionNumber =
      data.requisitionNumber ||
      (await counterService.generatePurchaseRequisitionNumber(organizationId));

    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new Error('At least one item is required in a purchase requisition.');
    }

    let totalEstimated = 0;
    const validatedItems = rawItems.map((item) => {
      const qty = Number(item.quantity);
      if (!qty || qty <= 0) {
        throw new Error('Quantity must be greater than zero for all requisition items.');
      }
      const unitPrice = Number(item.estimatedUnitPrice || 0);
      const estTotal = Math.round(qty * unitPrice * 100) / 100;
      totalEstimated += estTotal;

      return {
        itemId: item.itemId,
        description: item.description || '',
        quantity: qty,
        uom: item.uom || 'PCS',
        estimatedUnitPrice: unitPrice,
        estimatedTotal: estTotal,
        notes: item.notes || '',
      };
    });

    let budgetWarningNote = '';
    if (data.departmentId) {
      const compliance = await procurementBudgetBridgeService.checkProcurementBudgetCommitment({
        organizationId,
        departmentId: data.departmentId,
        amount: totalEstimated,
      });

      if (!compliance.allowed) {
        throw new Error(compliance.message || 'Department annual budget exceeded. Hard block active.');
      }
      if (compliance.message) {
        budgetWarningNote = ` [${compliance.message}]`;
      }
    }

    const requisition = await PurchaseRequisition.create({
      organizationId,
      requisitionNumber,
      requestedBy: userId,
      departmentId: data.departmentId || null,
      requiredDate: data.requiredDate || null,
      priority: data.priority || 'normal',
      status: data.submitImmediately ? 'pending_approval' : 'draft',
      items: validatedItems,
      totalEstimatedAmount: Math.round(totalEstimated * 100) / 100,
      currency: data.currency || 'USD',
      notes: `${data.notes || ''}${budgetWarningNote}`.trim(),
    });

    return requisition;
  }

  async submitRequisition(organizationId, requisitionId, userId) {
    const requisition = await PurchaseRequisition.findOne({
      _id: requisitionId,
      organizationId,
      deletedAt: null,
    });

    if (!requisition) {
      throw new Error('Purchase Requisition not found.');
    }
    if (requisition.status !== 'draft') {
      throw new Error(`Cannot submit requisition in '${requisition.status}' status.`);
    }

    requisition.status = 'pending_approval';
    await requisition.save();
    return requisition;
  }

  async approveRequisition(organizationId, requisitionId, user, comments = '') {
    const requisition = await PurchaseRequisition.findOne({
      _id: requisitionId,
      organizationId,
      deletedAt: null,
    });

    if (!requisition) {
      throw new Error('Purchase Requisition not found.');
    }

    // Anti-self-approval rule
    if (requisition.requestedBy.toString() === user._id.toString()) {
      throw new Error('Anti-Self-Approval Rule: You cannot approve your own purchase requisition.');
    }

    const isProcurementOrAdmin = [
      ROLES.SUPER_ADMIN,
      ROLES.ADMIN,
      ROLES.FINANCE,
      'procurement_officer',
      'inventory_manager',
    ].includes(user.role);
    const isManager = user.role === ROLES.MANAGER;

    if (requisition.status === 'pending_approval') {
      if (isProcurementOrAdmin) {
        // Direct high-level approval completes both tiers
        requisition.managerApproval = {
          approverId: user._id,
          approvedAt: new Date(),
          comments: comments || 'Direct Administrative Approval',
          status: 'approved',
        };
        requisition.procurementApproval = {
          approverId: user._id,
          approvedAt: new Date(),
          comments: comments || 'Procurement Tier Approved',
          status: 'approved',
        };
        requisition.status = 'approved';
      } else if (isManager) {
        // Tier 1: Department Manager Approval
        requisition.managerApproval = {
          approverId: user._id,
          approvedAt: new Date(),
          comments: comments || 'Manager Tier Approved',
          status: 'approved',
        };

        // If under threshold (e.g. $1,000), single-tier is sufficient
        if (requisition.totalEstimatedAmount <= 1000) {
          requisition.status = 'approved';
        } else {
          requisition.status = 'manager_approved';
        }
      } else {
        throw new Error('Insufficient privileges to approve this requisition.');
      }
    } else if (requisition.status === 'manager_approved') {
      // Tier 2: Procurement / Finance Approval
      if (!isProcurementOrAdmin) {
        throw new Error('Only Procurement Officers or Admins can approve Tier-2 requisitions.');
      }
      requisition.procurementApproval = {
        approverId: user._id,
        approvedAt: new Date(),
        comments: comments || 'Procurement Tier Approved',
        status: 'approved',
      };
      requisition.status = 'approved';
    } else {
      throw new Error(`Requisition cannot be approved in '${requisition.status}' status.`);
    }

    await requisition.save();
    return requisition;
  }

  async rejectRequisition(organizationId, requisitionId, user, rejectionReason) {
    const requisition = await PurchaseRequisition.findOne({
      _id: requisitionId,
      organizationId,
      deletedAt: null,
    });

    if (!requisition) {
      throw new Error('Purchase Requisition not found.');
    }
    if (requisition.requestedBy.toString() === user._id.toString()) {
      throw new Error('Anti-Self-Approval Rule: You cannot reject your own requisition.');
    }

    requisition.status = 'rejected';
    requisition.rejectionReason = rejectionReason || 'Requisition rejected by reviewer.';
    await requisition.save();
    return requisition;
  }

  async convertRequisitionToPo(organizationId, requisitionId, user, poDetails = {}) {
    const requisition = await PurchaseRequisition.findOne({
      _id: requisitionId,
      organizationId,
      deletedAt: null,
    });

    if (!requisition) {
      throw new Error('Purchase Requisition not found.');
    }
    if (requisition.status !== 'approved') {
      throw new Error('Only approved requisitions can be converted into a Purchase Order.');
    }
    if (!poDetails.supplierId) {
      throw new Error('A valid Supplier is required to convert requisition to PO.');
    }
    if (!poDetails.warehouseId) {
      throw new Error('A destination Warehouse is required.');
    }

    const items = requisition.items.map((it) => ({
      itemId: it.itemId,
      description: it.description,
      orderedQuantity: it.quantity,
      unitPrice: it.estimatedUnitPrice,
      taxRate: poDetails.defaultTaxRate || 0,
      uom: it.uom,
    }));

    const po = await this.createPurchaseOrder(organizationId, user._id, {
      requisitionId: requisition._id,
      supplierId: poDetails.supplierId,
      warehouseId: poDetails.warehouseId,
      paymentTerms: poDetails.paymentTerms || 'Net 30',
      expectedDeliveryDate: poDetails.expectedDeliveryDate || requisition.requiredDate,
      currency: requisition.currency,
      items,
      notes: `Converted from PR #${requisition.requisitionNumber}. ${poDetails.notes || ''}`,
      status: poDetails.autoOrder ? 'ordered' : 'draft',
    });

    requisition.status = 'converted_to_po';
    requisition.convertedPoId = po._id;
    await requisition.save();

    return po;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PURCHASE ORDERS (PO)
  // ──────────────────────────────────────────────────────────────────────────

  async createPurchaseOrder(organizationId, userId, data) {
    const poNumber =
      data.poNumber || (await counterService.generatePoNumber(organizationId));

    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new Error('At least one line item is required in a Purchase Order.');
    }

    let subtotal = 0;
    let taxTotal = 0;

    const validatedItems = rawItems.map((item) => {
      const qty = Number(item.orderedQuantity);
      if (!qty || qty <= 0) {
        throw new Error('Ordered quantity must be greater than zero.');
      }
      const unitPrice = Number(item.unitPrice || 0);
      const taxRate = Number(item.taxRate || 0);

      const lineSubtotal = Math.round(qty * unitPrice * 100) / 100;
      const lineTax = Math.round(lineSubtotal * (taxRate / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        itemId: item.itemId,
        description: item.description || '',
        orderedQuantity: qty,
        receivedQuantity: 0,
        invoicedQuantity: 0,
        returnedQuantity: 0,
        unitPrice,
        taxRate,
        taxAmount: lineTax,
        lineTotal,
        uom: item.uom || 'PCS',
      };
    });

    const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

    const po = await PurchaseOrder.create({
      organizationId,
      poNumber,
      requisitionId: data.requisitionId || null,
      supplierId: data.supplierId,
      warehouseId: data.warehouseId,
      orderDate: data.orderDate || new Date(),
      expectedDeliveryDate: data.expectedDeliveryDate || null,
      paymentTerms: data.paymentTerms || 'Net 30',
      currency: data.currency || 'USD',
      status: data.status || 'draft',
      items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal,
      termsAndConditions: data.termsAndConditions || 'Standard delivery terms apply.',
      notes: data.notes || '',
    });

    return po;
  }

  async amendPurchaseOrder(organizationId, poId, user, data) {
    const po = await PurchaseOrder.findOne({ _id: poId, organizationId, deletedAt: null });
    if (!po) {
      throw new Error('Purchase Order not found.');
    }
    if (['received', 'closed', 'cancelled'].includes(po.status)) {
      throw new Error(`Cannot amend Purchase Order in '${po.status}' status.`);
    }

    const previousGrandTotal = po.grandTotal;
    const nextVersion = po.version + 1;

    let subtotal = 0;
    let taxTotal = 0;
    const validatedItems = data.items.map((item) => {
      const qty = Number(item.orderedQuantity);
      if (!qty || qty <= 0) {
        throw new Error('Ordered quantity must be greater than zero.');
      }
      const unitPrice = Number(item.unitPrice || 0);
      const taxRate = Number(item.taxRate || 0);
      const lineSubtotal = Math.round(qty * unitPrice * 100) / 100;
      const lineTax = Math.round(lineSubtotal * (taxRate / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      // Retain existing received and invoiced amounts
      const existingItem = po.items.find(
        (it) => it.itemId.toString() === (item.itemId._id || item.itemId).toString()
      );

      return {
        itemId: item.itemId._id || item.itemId,
        description: item.description || '',
        orderedQuantity: qty,
        receivedQuantity: existingItem ? existingItem.receivedQuantity : 0,
        invoicedQuantity: existingItem ? existingItem.invoicedQuantity : 0,
        returnedQuantity: existingItem ? existingItem.returnedQuantity : 0,
        unitPrice,
        taxRate,
        taxAmount: lineTax,
        lineTotal,
        uom: item.uom || 'PCS',
      };
    });

    const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;

    po.items = validatedItems;
    po.subtotal = Math.round(subtotal * 100) / 100;
    po.taxTotal = Math.round(taxTotal * 100) / 100;
    po.grandTotal = grandTotal;
    po.version = nextVersion;

    if (data.expectedDeliveryDate) po.expectedDeliveryDate = data.expectedDeliveryDate;
    if (data.paymentTerms) po.paymentTerms = data.paymentTerms;
    if (data.notes) po.notes = data.notes;

    po.amendments.push({
      version: nextVersion,
      amendedBy: user._id,
      amendedAt: new Date(),
      changesSummary: data.changesSummary || `Amended to version ${nextVersion}`,
      previousGrandTotal,
    });

    await po.save();
    return po;
  }

  async closePurchaseOrder(organizationId, poId, user, reason) {
    const po = await PurchaseOrder.findOne({ _id: poId, organizationId, deletedAt: null });
    if (!po) {
      throw new Error('Purchase Order not found.');
    }

    po.status = 'closed';
    po.closureReason = reason || 'Order completed and closed.';
    po.closedAt = new Date();
    po.closedBy = user._id;
    await po.save();
    return po;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. GOODS RECEIPT NOTE (GRN) & STOCK LEDGER POSTING
  // ──────────────────────────────────────────────────────────────────────────

  async createGoodsReceiptNote(organizationId, userId, data) {
    const po = await PurchaseOrder.findOne({
      _id: data.poId,
      organizationId,
      deletedAt: null,
    });

    if (!po) {
      throw new Error('Associated Purchase Order not found.');
    }
    if (['draft', 'pending_approval', 'closed', 'cancelled'].includes(po.status)) {
      throw new Error(`Cannot issue GRN against PO in '${po.status}' status.`);
    }

    const grnNumber =
      data.grnNumber || (await counterService.generateGrnNumber(organizationId));

    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new Error('At least one received item is required in GRN.');
    }

    const validatedItems = rawItems.map((item) => {
      const recQty = Number(item.receivedQuantity);
      if (!recQty || recQty <= 0) {
        throw new Error('Received quantity must be greater than zero.');
      }
      const accQty = Number(item.acceptedQuantity ?? recQty);
      const rejQty = Math.max(0, recQty - accQty);

      const poLine = po.items.find(
        (it) => it._id.toString() === (item.poItemId || '').toString() ||
                it.itemId.toString() === (item.itemId || '').toString()
      );

      return {
        itemId: item.itemId,
        poItemId: poLine ? poLine._id : null,
        orderedQuantity: poLine ? poLine.orderedQuantity : recQty,
        receivedQuantity: recQty,
        acceptedQuantity: accQty,
        rejectedQuantity: rejQty,
        rejectionReason: rejQty > 0 ? item.rejectionReason || 'Quality inspection rejection' : '',
        unitCost: Number(item.unitCost ?? (poLine ? poLine.unitPrice : 0)),
        batchNumber: (item.batchNumber || '').trim().toUpperCase(),
        expiryDate: item.expiryDate || null,
        serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        binId: item.binId || null,
        notes: item.notes || '',
      };
    });

    const grn = await GoodsReceiptNote.create({
      organizationId,
      grnNumber,
      poId: po._id,
      supplierId: po.supplierId,
      warehouseId: data.warehouseId || po.warehouseId,
      receivedDate: data.receivedDate || new Date(),
      receivedBy: userId,
      deliveryChallanNumber: data.deliveryChallanNumber || '',
      deliveryChallanDate: data.deliveryChallanDate || null,
      carrier: data.carrier || '',
      trackingNumber: data.trackingNumber || '',
      status: data.postToLedgerImmediately ? 'inspected' : 'draft',
      items: validatedItems,
      stockLedgerPosted: false,
      notes: data.notes || '',
    });

    if (data.postToLedgerImmediately) {
      await this.postGrnToStockLedger(organizationId, grn._id, userId);
    }

    return grn;
  }

  async postGrnToStockLedger(organizationId, grnId, userId) {
    const grn = await GoodsReceiptNote.findOne({
      _id: grnId,
      organizationId,
      deletedAt: null,
    });

    if (!grn) {
      throw new Error('Goods Receipt Note not found.');
    }
    if (grn.stockLedgerPosted) {
      throw new Error('This GRN has already posted entries into the Stock Ledger.');
    }

    const po = await PurchaseOrder.findOne({ _id: grn.poId, organizationId });
    if (!po) {
      throw new Error('Referenced Purchase Order not found.');
    }

    // 1. Create StockMovement container for this GRN
    const movementLines = grn.items
      .filter((it) => it.acceptedQuantity > 0)
      .map((it) => ({
        itemId: it.itemId,
        requestedQty: it.orderedQuantity,
        actualQty: it.acceptedQuantity,
        unitCost: it.unitCost,
        totalCost: Math.round(it.acceptedQuantity * it.unitCost * 100) / 100,
        destinationBinId: it.binId,
        batchNumber: it.batchNumber,
        serialNumbers: it.serialNumbers,
        notes: `GRN #${grn.grnNumber}`,
      }));

    const movement = await StockMovement.create({
      organizationId,
      movementNumber: `MOV-${grn.grnNumber}`,
      movementType: 'receipt',
      destinationWarehouseId: grn.warehouseId,
      sourceDocumentType: 'goods_receipt',
      sourceDocumentId: grn._id,
      purchaseOrderId: po._id,
      supplierId: grn.supplierId,
      status: 'completed',
      dispatchedBy: userId,
      dispatchedAt: new Date(),
      receivedBy: userId,
      receivedAt: new Date(),
      lines: movementLines,
    });

    // 2. Post each accepted item into the immutable Stock Ledger
    for (const item of grn.items) {
      if (item.acceptedQuantity > 0) {
        await stockLedgerService.postReceipt({
          organizationId,
          documentNumber: grn.grnNumber,
          movementId: movement._id,
          itemId: item.itemId,
          warehouseId: grn.warehouseId,
          binId: item.binId,
          quantity: item.acceptedQuantity,
          unitCost: item.unitCost,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          serialNumbers: item.serialNumbers,
          notes: `GRN #${grn.grnNumber} for PO #${po.poNumber}`,
          actorId: userId,
        });

        // 3. Update PO line item receivedQuantity
        const poLine = po.items.find(
          (it) => it._id.toString() === (item.poItemId || '').toString() ||
                  it.itemId.toString() === item.itemId.toString()
        );
        if (poLine) {
          poLine.receivedQuantity = Math.round((poLine.receivedQuantity + item.acceptedQuantity) * 100) / 100;
        }
      }
    }

    // 4. Update PO status based on receipts
    const allReceived = po.items.every((it) => it.receivedQuantity >= it.orderedQuantity);
    const anyReceived = po.items.some((it) => it.receivedQuantity > 0);

    if (allReceived) {
      po.status = 'received';
    } else if (anyReceived) {
      po.status = 'partially_received';
    }
    await po.save();

    // 5. Update GRN state
    grn.stockLedgerPosted = true;
    grn.stockMovementId = movement._id;
    grn.status = 'posted_to_ledger';
    await grn.save();

    // Phase 4: Emit General Ledger Accounting Event
    accountingHookService.emitInventoryEvent(organizationId, 'INVENTORY.RECEIPT', {
      documentNumber: grn.grnNumber,
      poNumber: po.poNumber,
      supplierId: grn.supplierId,
      warehouseId: grn.warehouseId,
      quantity: grn.items.reduce((acc, it) => acc + (it.acceptedQuantity || 0), 0),
      totalCost: movement.lines.reduce((acc, l) => acc + (l.totalCost || 0), 0),
    });

    return { grn, po, movement };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. 3-WAY MATCHING ENGINE & SUPPLIER INVOICES
  // ──────────────────────────────────────────────────────────────────────────

  async createSupplierInvoice(organizationId, data) {
    const invoiceNumber =
      data.invoiceNumber || (await counterService.generateSupplierInvoiceNumber(organizationId));

    const po = await PurchaseOrder.findOne({
      _id: data.poId,
      organizationId,
      deletedAt: null,
    });
    if (!po) {
      throw new Error('Associated Purchase Order not found.');
    }

    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new Error('At least one item is required in supplier invoice.');
    }

    let subtotal = 0;
    let taxAmount = 0;

    const validatedItems = rawItems.map((item) => {
      const qty = Number(item.billedQuantity);
      if (!qty || qty <= 0) {
        throw new Error('Billed quantity must be greater than zero.');
      }
      const unitPrice = Number(item.unitPrice || 0);
      const taxRate = Number(item.taxRate || 0);
      const lineSubtotal = Math.round(qty * unitPrice * 100) / 100;
      const lineTax = Math.round(lineSubtotal * (taxRate / 100) * 100) / 100;
      const lineTotal = Math.round((lineSubtotal + lineTax) * 100) / 100;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        itemId: item.itemId,
        description: item.description || '',
        billedQuantity: qty,
        unitPrice,
        taxRate,
        taxAmount: lineTax,
        lineTotal,
      };
    });

    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const invoice = await SupplierInvoice.create({
      organizationId,
      invoiceNumber,
      supplierInvoiceRef: data.supplierInvoiceRef,
      supplierId: po.supplierId,
      poId: po._id,
      grnIds: data.grnIds || [],
      invoiceDate: data.invoiceDate || new Date(),
      dueDate: data.dueDate || null,
      currency: data.currency || po.currency || 'USD',
      items: validatedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount,
      notes: data.notes || '',
    });

    // Automatically execute 3-Way Match with tolerance checks
    const matchedInvoice = await this.runThreeWayMatch(organizationId, invoice._id);
    return matchedInvoice;
  }

  /**
   * 3-Way Match Algorithm: PO vs GRN vs Supplier Invoice
   * Tolerance rules:
   *  - Price variance: default 5% tolerance or max $50 absolute variance
   *  - Quantity variance: 0% over-billing tolerance (billed cannot exceed received GRN qty)
   */
  async runThreeWayMatch(organizationId, invoiceId, toleranceConfig = { pricePct: 5, qtyPct: 0 }) {
    const invoice = await SupplierInvoice.findOne({
      _id: invoiceId,
      organizationId,
      deletedAt: null,
    }).populate('items.itemId', 'sku name');

    if (!invoice) {
      throw new Error('Supplier invoice not found.');
    }

    const po = await PurchaseOrder.findOne({ _id: invoice.poId, organizationId });
    if (!po) {
      throw new Error('Referenced PO not found for 3-way match.');
    }

    // Find all GRNs associated with this PO
    const grns = await GoodsReceiptNote.find({
      organizationId,
      poId: po._id,
      status: 'posted_to_ledger',
      deletedAt: null,
    });

    // Sum up accepted received quantities per item across all GRNs
    const grnReceivedByItem = {};
    grns.forEach((grn) => {
      grn.items.forEach((item) => {
        const id = item.itemId.toString();
        grnReceivedByItem[id] = (grnReceivedByItem[id] || 0) + item.acceptedQuantity;
      });
    });

    let overallPoMatches = true;
    let overallGrnMatches = true;
    let toleranceExceeded = false;
    let totalPriceVariance = 0;
    let totalQtyVariance = 0;

    const details = invoice.items.map((invItem) => {
      const itemIdStr = (invItem.itemId?._id || invItem.itemId).toString();
      const itemCode = invItem.itemId?.sku || 'ITEM';

      // 1. PO Match Check
      const poLine = po.items.find((p) => p.itemId.toString() === itemIdStr);
      const poQty = poLine ? poLine.orderedQuantity : 0;
      const poPrice = poLine ? poLine.unitPrice : 0;

      // 2. GRN Received Qty Check
      const grnQty = grnReceivedByItem[itemIdStr] || 0;
      const invQty = invItem.billedQuantity;
      const invPrice = invItem.unitPrice;

      // Calculate Variances
      const priceDiff = Math.abs(invPrice - poPrice);
      const priceVariancePercent = poPrice > 0 ? (priceDiff / poPrice) * 100 : 0;
      const qtyDiff = invQty - grnQty;
      const qtyVariancePercent = grnQty > 0 ? (qtyDiff / grnQty) * 100 : 0;

      const lineVarianceAmt = Math.round((invQty * invPrice - grnQty * poPrice) * 100) / 100;
      totalPriceVariance += Math.round(priceDiff * invQty * 100) / 100;
      totalQtyVariance += Math.abs(qtyDiff);

      let status = 'match';

      if (invQty > grnQty) {
        status = 'qty_mismatch';
        overallGrnMatches = false;
        if (qtyVariancePercent > toleranceConfig.qtyPct) {
          toleranceExceeded = true;
          status = 'tolerance_exceeded';
        }
      }

      if (priceVariancePercent > 0.01) {
        if (status === 'match') status = 'price_mismatch';
        if (priceVariancePercent > toleranceConfig.pricePct) {
          toleranceExceeded = true;
          status = 'tolerance_exceeded';
          overallPoMatches = false;
        }
      }

      return {
        itemId: invItem.itemId?._id || invItem.itemId,
        itemCode,
        poQty,
        grnQty,
        invQty,
        poPrice,
        invPrice,
        priceVariancePercent: Math.round(priceVariancePercent * 100) / 100,
        qtyVariancePercent: Math.round(qtyVariancePercent * 100) / 100,
        varianceAmount: lineVarianceAmt,
        status,
      };
    });

    const isFullMatch = !toleranceExceeded && overallPoMatches && overallGrnMatches;

    invoice.threeWayMatch = {
      poMatches: overallPoMatches,
      grnMatches: overallGrnMatches,
      priceVariance: Math.round(totalPriceVariance * 100) / 100,
      quantityVariance: Math.round(totalQtyVariance * 100) / 100,
      toleranceExceeded,
      details,
    };

    invoice.matchingStatus = isFullMatch ? 'matched' : 'variance_detected';
    await invoice.save();

    // If fully matched, update PO invoicedQuantity and status
    if (isFullMatch) {
      invoice.items.forEach((invItem) => {
        const itemIdStr = (invItem.itemId?._id || invItem.itemId).toString();
        const poLine = po.items.find((p) => p.itemId.toString() === itemIdStr);
        if (poLine) {
          poLine.invoicedQuantity = Math.round((poLine.invoicedQuantity + invItem.billedQuantity) * 100) / 100;
        }
      });
      if (po.items.every((it) => it.invoicedQuantity >= it.orderedQuantity)) {
        po.status = 'billed';
      }
      await po.save();
    }

    return invoice;
  }

  async approveInvoiceVariance(organizationId, invoiceId, user, comments = '') {
    const invoice = await SupplierInvoice.findOne({
      _id: invoiceId,
      organizationId,
      deletedAt: null,
    });
    if (!invoice) {
      throw new Error('Supplier invoice not found.');
    }

    invoice.matchingStatus = 'approved_with_variance';
    invoice.varianceApprovedBy = user._id;
    invoice.varianceApprovedAt = new Date();
    invoice.varianceApprovalNotes = comments || 'Variance approved by authorized officer.';
    await invoice.save();
    return invoice;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. RETURN TO VENDOR (RTV) & DEBIT NOTES
  // ──────────────────────────────────────────────────────────────────────────

  async createReturnToVendor(organizationId, userId, data) {
    const returnNumber =
      data.returnNumber || (await counterService.generateReturnNumber(organizationId));
    const debitNoteNumber =
      data.debitNoteNumber || (await counterService.generateDebitNoteNumber(organizationId));

    const rawItems = Array.isArray(data.items) ? data.items : [];
    if (rawItems.length === 0) {
      throw new Error('At least one item is required for Return to Vendor.');
    }

    let totalDebit = 0;
    const validatedItems = rawItems.map((item) => {
      const qty = Number(item.quantity);
      if (!qty || qty <= 0) {
        throw new Error('Return quantity must be greater than zero.');
      }
      const unitCost = Number(item.unitCost || 0);
      const totalAmount = Math.round(qty * unitCost * 100) / 100;
      totalDebit += totalAmount;

      return {
        itemId: item.itemId,
        quantity: qty,
        uom: item.uom || 'PCS',
        unitCost,
        totalAmount,
        batchNumber: (item.batchNumber || '').trim().toUpperCase(),
        serialNumbers: Array.isArray(item.serialNumbers) ? item.serialNumbers : [],
        binId: item.binId || null,
        reasonCode: item.reasonCode || 'defective',
        notes: item.notes || '',
      };
    });

    const rtv = await ReturnToVendor.create({
      organizationId,
      returnNumber,
      debitNoteNumber,
      supplierId: data.supplierId,
      poId: data.poId || null,
      grnId: data.grnId || null,
      warehouseId: data.warehouseId,
      status: 'approved',
      items: validatedItems,
      totalDebitAmount: Math.round(totalDebit * 100) / 100,
      approvedBy: userId,
      approvedAt: new Date(),
      notes: data.notes || '',
    });

    // Post compensating stock outflow in Stock Ledger
    const dispatchedRtv = await this.dispatchReturnToVendor(organizationId, rtv._id, userId);

    return dispatchedRtv;
  }

  async dispatchReturnToVendor(organizationId, rtvId, userId) {
    const rtv = await ReturnToVendor.findOne({
      _id: rtvId,
      organizationId,
      deletedAt: null,
    });
    if (!rtv) {
      throw new Error('Return To Vendor record not found.');
    }
    if (rtv.stockLedgerPosted) {
      return rtv;
    }

    // 1. Create StockMovement for the return
    const movementLines = rtv.items.map((it) => ({
      itemId: it.itemId,
      requestedQty: it.quantity,
      actualQty: it.quantity,
      unitCost: it.unitCost,
      totalCost: it.totalAmount,
      sourceBinId: it.binId,
      batchNumber: it.batchNumber,
      serialNumbers: it.serialNumbers,
      notes: `RTV #${rtv.returnNumber} (${it.reasonCode})`,
    }));

    const movement = await StockMovement.create({
      organizationId,
      movementNumber: `MOV-${rtv.returnNumber}`,
      movementType: 'issue',
      sourceWarehouseId: rtv.warehouseId,
      sourceDocumentType: 'return_to_vendor',
      sourceDocumentId: rtv._id,
      purchaseOrderId: rtv.poId,
      supplierId: rtv.supplierId,
      status: 'completed',
      dispatchedBy: userId,
      dispatchedAt: new Date(),
      lines: movementLines,
    });

    // 2. Post stock issue out of ledger for each item
    for (const it of rtv.items) {
      await stockLedgerService.postIssue({
        organizationId,
        documentNumber: rtv.returnNumber,
        movementId: movement._id,
        itemId: it.itemId,
        warehouseId: rtv.warehouseId,
        binId: it.binId,
        quantity: it.quantity,
        batchNumber: it.batchNumber,
        serialNumbers: it.serialNumbers,
        notes: `RTV #${rtv.returnNumber} - Reason: ${it.reasonCode}`,
        actorId: userId,
      });

      // Update PO returnedQuantity if linked
      if (rtv.poId) {
        const po = await PurchaseOrder.findOne({ _id: rtv.poId, organizationId });
        if (po) {
          const poLine = po.items.find((p) => p.itemId.toString() === it.itemId.toString());
          if (poLine) {
            poLine.returnedQuantity = Math.round((poLine.returnedQuantity + it.quantity) * 100) / 100;
            await po.save();
          }
        }
      }
    }

    rtv.stockLedgerPosted = true;
    rtv.stockMovementId = movement._id;
    rtv.status = 'dispatched';
    rtv.dispatchedBy = userId;
    rtv.dispatchedAt = new Date();
    await rtv.save();

    // Phase 4: Emit General Ledger Accounting Event for RTV / Debit Note
    accountingHookService.emitInventoryEvent(organizationId, 'INVENTORY.RETURN_TO_VENDOR', {
      documentNumber: rtv.debitNoteNumber,
      returnNumber: rtv.returnNumber,
      supplierId: rtv.supplierId,
      warehouseId: rtv.warehouseId,
      quantity: rtv.items.reduce((acc, it) => acc + (it.quantity || 0), 0),
      totalAmount: rtv.totalDebitAmount,
    });

    return rtv;
  }
}

module.exports = new ProcurementService();
