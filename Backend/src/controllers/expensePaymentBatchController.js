const PaymentBatch = require('../models/PaymentBatch');
const paymentBatchService = require('../services/paymentBatchService');
const erpExportService = require('../services/erpExportService');

/**
 * List Payment Batches
 */
exports.getPaymentBatches = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status } = req.query;

    const query = { organizationId: orgId, deletedAt: null };
    if (status) query.status = status;

    const batches = await PaymentBatch.find(query)
      .populate('createdById', 'fullName email')
      .populate('approvedById', 'fullName email')
      .populate('paidById', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: batches.length, paymentBatches: batches });
  } catch (error) {
    console.error('Error fetching payment batches:', error);
    return res.status(500).json({ error: 'Failed to fetch payment batches.' });
  }
};

/**
 * Get Single Payment Batch
 */
exports.getPaymentBatchById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const batch = await PaymentBatch.findOne({
      _id: id,
      organizationId: orgId,
      deletedAt: null,
    })
      .populate('createdById', 'fullName email')
      .populate('approvedById', 'fullName email')
      .populate('paidById', 'fullName email')
      .populate({
        path: 'claimIds',
        populate: [
          { path: 'employeeId', select: 'fullName email' },
          { path: 'departmentId', select: 'name' },
        ],
      });

    if (!batch) {
      return res.status(404).json({ error: 'Payment batch not found.' });
    }

    return res.json({ success: true, paymentBatch: batch });
  } catch (error) {
    console.error('Error fetching payment batch:', error);
    return res.status(500).json({ error: 'Failed to fetch payment batch.' });
  }
};

/**
 * Create Payment Batch
 */
exports.createPaymentBatch = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const createdById = req.user?._id;

    const batch = await paymentBatchService.createPaymentBatch({
      organizationId: orgId,
      createdById,
      ...req.body,
    });

    return res.status(201).json({ success: true, paymentBatch: batch });
  } catch (error) {
    console.error('Error creating payment batch:', error);
    return res.status(400).json({ error: error.message || 'Failed to create payment batch.' });
  }
};

/**
 * Execute & Reimburse Batch
 */
exports.executePaymentBatch = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const paidById = req.user?._id;
    const { id } = req.params;
    const { bankReference } = req.body;

    const batch = await paymentBatchService.executePaymentBatch({
      batchId: id,
      organizationId: orgId,
      paidById,
      bankReference,
    });

    return res.json({ success: true, paymentBatch: batch });
  } catch (error) {
    console.error('Error executing payment batch:', error);
    return res.status(400).json({ error: error.message || 'Failed to execute payment batch.' });
  }
};

/**
 * Export Bank Payment CSV
 */
exports.exportBankPaymentFile = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const csvContent = await erpExportService.generateBankPaymentCsv(id, orgId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bank_payments_batch_${id}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting bank payment file:', error);
    return res.status(400).json({ error: error.message || 'Failed to export bank payment file.' });
  }
};

/**
 * Export Balanced GL Journal CSV (QuickBooks / NetSuite)
 */
exports.exportGlJournalFile = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;
    const { format = 'quickbooks' } = req.query;

    const csvContent = await erpExportService.generateGlJournalCsv(id, orgId, format);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="gl_journal_${format}_batch_${id}.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting GL journal file:', error);
    return res.status(400).json({ error: error.message || 'Failed to export GL journal file.' });
  }
};
