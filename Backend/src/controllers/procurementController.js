const PurchaseRequisition = require('../models/PurchaseRequisition');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceiptNote = require('../models/GoodsReceiptNote');
const SupplierInvoice = require('../models/SupplierInvoice');
const ReturnToVendor = require('../models/ReturnToVendor');
const Supplier = require('../models/Supplier');
const Warehouse = require('../models/Warehouse');
const Organization = require('../models/Organization');
const procurementService = require('../services/procurementService');
const procurementPdfService = require('../services/procurementPdfService');
const emailService = require('../services/emailService');

// ── Requisitions ──────────────────────────────────────────────────────────

exports.getRequisitions = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status, priority, page = 1, limit = 20 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await PurchaseRequisition.countDocuments(filter);

    const requisitions = await PurchaseRequisition.find(filter)
      .populate('requestedBy', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.itemId', 'sku name baseUom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      requisitions,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error in getRequisitions:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch requisitions.' });
  }
};

exports.createRequisition = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;

    const requisition = await procurementService.createRequisition(orgId, userId, req.body);
    return res.status(201).json({ success: true, requisition });
  } catch (err) {
    console.error('Error in createRequisition:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.submitRequisition = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;
    const { id } = req.params;

    const requisition = await procurementService.submitRequisition(orgId, id, userId);
    return res.json({ success: true, requisition });
  } catch (err) {
    console.error('Error in submitRequisition:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.approveRequisition = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { comments } = req.body;

    const requisition = await procurementService.approveRequisition(orgId, id, user, comments);
    return res.json({ success: true, requisition });
  } catch (err) {
    console.error('Error in approveRequisition:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.rejectRequisition = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const requisition = await procurementService.rejectRequisition(orgId, id, user, reason);
    return res.json({ success: true, requisition });
  } catch (err) {
    console.error('Error in rejectRequisition:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.convertRequisitionToPo = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;

    const po = await procurementService.convertRequisitionToPo(orgId, id, user, req.body);
    return res.status(201).json({ success: true, po });
  } catch (err) {
    console.error('Error in convertRequisitionToPo:', err);
    return res.status(400).json({ error: err.message });
  }
};

// ── Purchase Orders ───────────────────────────────────────────────────────

exports.getPurchaseOrders = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status, supplierId, warehouseId, search, page = 1, limit = 20 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (search) {
      filter.poNumber = { $regex: search, $options: 'i' };
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await PurchaseOrder.countDocuments(filter);

    const purchaseOrders = await PurchaseOrder.find(filter)
      .populate('supplierId', 'name contactEmail contactPhone currency')
      .populate('warehouseId', 'name code')
      .populate('items.itemId', 'sku name baseUom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      purchaseOrders,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error in getPurchaseOrders:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch Purchase Orders.' });
  }
};

exports.getPurchaseOrderById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const po = await PurchaseOrder.findOne({ _id: id, organizationId: orgId, deletedAt: null })
      .populate('supplierId')
      .populate('warehouseId')
      .populate('items.itemId')
      .populate('amendments.amendedBy', 'fullName email')
      .lean();

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    return res.json({ success: true, purchaseOrder: po });
  } catch (err) {
    console.error('Error in getPurchaseOrderById:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;

    const po = await procurementService.createPurchaseOrder(orgId, userId, req.body);
    return res.status(201).json({ success: true, purchaseOrder: po });
  } catch (err) {
    console.error('Error in createPurchaseOrder:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.amendPurchaseOrder = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;

    const po = await procurementService.amendPurchaseOrder(orgId, id, user, req.body);
    return res.json({ success: true, purchaseOrder: po });
  } catch (err) {
    console.error('Error in amendPurchaseOrder:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.closePurchaseOrder = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { reason } = req.body;

    const po = await procurementService.closePurchaseOrder(orgId, id, user, reason);
    return res.json({ success: true, purchaseOrder: po });
  } catch (err) {
    console.error('Error in closePurchaseOrder:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.downloadPoPdf = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const po = await PurchaseOrder.findOne({ _id: id, organizationId: orgId })
      .populate('supplierId')
      .populate('warehouseId')
      .populate('items.itemId');

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    const organization = await Organization.findById(orgId).lean();
    const pdfBuffer = await procurementPdfService.generatePurchaseOrderPdf({
      po,
      organization,
      supplier: po.supplierId,
      warehouse: po.warehouseId,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${po.poNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error downloading PO PDF:', err);
    return res.status(500).json({ error: 'Failed to generate PO PDF.' });
  }
};

exports.emailPoToSupplier = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;

    const po = await PurchaseOrder.findOne({ _id: id, organizationId: orgId })
      .populate('supplierId')
      .populate('warehouseId')
      .populate('items.itemId');

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found.' });
    }

    const supplierEmail = po.supplierId?.contactEmail || po.supplierId?.email;
    if (!supplierEmail) {
      return res.status(400).json({ error: 'Supplier does not have a registered contact email.' });
    }

    const organization = await Organization.findById(orgId).lean();
    const pdfBuffer = await procurementPdfService.generatePurchaseOrderPdf({
      po,
      organization,
      supplier: po.supplierId,
      warehouse: po.warehouseId,
    });

    const emailSubject = `Purchase Order ${po.poNumber} from ${organization?.name || 'Nebula HUB'}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #f97316;">Official Purchase Order: ${po.poNumber}</h2>
        <p>Dear ${po.supplierId?.name || 'Partner'},</p>
        <p>Please find attached the official Purchase Order <strong>${po.poNumber}</strong> with grand total of <strong>${po.currency} ${Number(po.grandTotal).toFixed(2)}</strong>.</p>
        <p>Kindly acknowledge receipt and notify us of estimated dispatch date.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">Sent via Nebula HUB Enterprise ERP System.</p>
      </div>
    `;

    // Send through universal email service
    if (emailService.transporter) {
      await emailService.transporter.sendMail({
        from: `"${organization?.name || 'Nebula ERP'}" <${process.env.SMTP_FROM || 'no-reply@nebulahub.com'}>`,
        to: supplierEmail,
        subject: emailSubject,
        html: emailHtml,
        attachments: [
          {
            filename: `${po.poNumber}.pdf`,
            content: pdfBuffer,
          },
        ],
      });
    }

    po.emailedToSupplierAt = new Date();
    po.emailedBy = user._id;
    if (po.status === 'approved' || po.status === 'draft') {
      po.status = 'ordered';
    }
    await po.save();

    return res.json({
      success: true,
      message: `Purchase Order sent successfully to ${supplierEmail}`,
      emailedAt: po.emailedToSupplierAt,
    });
  } catch (err) {
    console.error('Error emailing PO:', err);
    return res.status(500).json({ error: err.message || 'Failed to email Purchase Order.' });
  }
};

// ── Goods Receipt Notes (GRN) ─────────────────────────────────────────────

exports.getGoodsReceiptNotes = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { poId, supplierId, status, page = 1, limit = 20 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };
    if (poId) filter.poId = poId;
    if (supplierId) filter.supplierId = supplierId;
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await GoodsReceiptNote.countDocuments(filter);

    const grns = await GoodsReceiptNote.find(filter)
      .populate('poId', 'poNumber status grandTotal')
      .populate('supplierId', 'name contactEmail')
      .populate('warehouseId', 'name code')
      .populate('receivedBy', 'fullName email')
      .populate('items.itemId', 'sku name baseUom')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      goodsReceiptNotes: grns,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error in getGoodsReceiptNotes:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch GRNs.' });
  }
};

exports.createGoodsReceiptNote = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;

    const grn = await procurementService.createGoodsReceiptNote(orgId, userId, req.body);
    return res.status(201).json({ success: true, goodsReceiptNote: grn });
  } catch (err) {
    console.error('Error in createGoodsReceiptNote:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.postGrnToLedger = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;
    const { id } = req.params;

    const result = await procurementService.postGrnToStockLedger(orgId, id, userId);
    return res.json({
      success: true,
      message: 'GRN successfully posted to Stock Ledger.',
      goodsReceiptNote: result.grn,
      purchaseOrder: result.po,
    });
  } catch (err) {
    console.error('Error in postGrnToLedger:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.downloadGrnPdf = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const grn = await GoodsReceiptNote.findOne({ _id: id, organizationId: orgId })
      .populate('poId')
      .populate('supplierId')
      .populate('warehouseId')
      .populate('items.itemId');

    if (!grn) {
      return res.status(404).json({ error: 'GRN not found.' });
    }

    const organization = await Organization.findById(orgId).lean();
    const pdfBuffer = await procurementPdfService.generateGrnPdf({
      grn,
      po: grn.poId,
      organization,
      supplier: grn.supplierId,
      warehouse: grn.warehouseId,
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${grn.grnNumber}.pdf"`);
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('Error downloading GRN PDF:', err);
    return res.status(500).json({ error: 'Failed to generate GRN PDF.' });
  }
};

// ── Supplier Invoices & 3-Way Match ───────────────────────────────────────

exports.getSupplierInvoices = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { poId, matchingStatus, page = 1, limit = 20 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };
    if (poId) filter.poId = poId;
    if (matchingStatus) filter.matchingStatus = matchingStatus;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await SupplierInvoice.countDocuments(filter);

    const invoices = await SupplierInvoice.find(filter)
      .populate('poId', 'poNumber grandTotal status')
      .populate('supplierId', 'name contactEmail')
      .populate('items.itemId', 'sku name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      invoices,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error in getSupplierInvoices:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch invoices.' });
  }
};

exports.createSupplierInvoice = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const invoice = await procurementService.createSupplierInvoice(orgId, req.body);
    return res.status(201).json({ success: true, invoice });
  } catch (err) {
    console.error('Error in createSupplierInvoice:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.runThreeWayMatch = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const { priceTolerancePct = 5, qtyTolerancePct = 0 } = req.body;

    const invoice = await procurementService.runThreeWayMatch(orgId, id, {
      pricePct: Number(priceTolerancePct),
      qtyPct: Number(qtyTolerancePct),
    });

    return res.json({ success: true, invoice });
  } catch (err) {
    console.error('Error in runThreeWayMatch:', err);
    return res.status(400).json({ error: err.message });
  }
};

exports.approveInvoiceVariance = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { comments } = req.body;

    const invoice = await procurementService.approveInvoiceVariance(orgId, id, user, comments);
    return res.json({ success: true, invoice });
  } catch (err) {
    console.error('Error in approveInvoiceVariance:', err);
    return res.status(400).json({ error: err.message });
  }
};

// ── Return to Vendor (RTV) & Debit Notes ───────────────────────────────────

exports.getReturnToVendors = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { supplierId, warehouseId, status, page = 1, limit = 20 } = req.query;

    const filter = { organizationId: orgId, deletedAt: null };
    if (supplierId) filter.supplierId = supplierId;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (status) filter.status = status;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const total = await ReturnToVendor.countDocuments(filter);

    const returns = await ReturnToVendor.find(filter)
      .populate('supplierId', 'name contactEmail')
      .populate('warehouseId', 'name code')
      .populate('poId', 'poNumber')
      .populate('items.itemId', 'sku name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    return res.json({
      success: true,
      returns,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (err) {
    console.error('Error in getReturnToVendors:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch returns.' });
  }
};

exports.createReturnToVendor = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const userId = req.user._id;

    const rtv = await procurementService.createReturnToVendor(orgId, userId, req.body);
    return res.status(201).json({ success: true, returnToVendor: rtv });
  } catch (err) {
    console.error('Error in createReturnToVendor:', err);
    return res.status(400).json({ error: err.message });
  }
};
