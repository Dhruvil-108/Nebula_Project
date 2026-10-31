const CashAdvance = require('../models/CashAdvance');
const cashAdvanceService = require('../services/cashAdvanceService');

/**
 * List Cash Advances
 */
exports.getCashAdvances = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status, employeeId } = req.query;

    const query = { organizationId: orgId, deletedAt: null };
    if (status) query.status = status;
    if (employeeId) query.employeeId = employeeId;

    const advances = await CashAdvance.find(query)
      .populate('employeeId', 'fullName email')
      .populate('travelRequestId', 'requestNumber destination startDate endDate')
      .populate('approval.approvedById', 'fullName email')
      .populate('disbursement.disbursedById', 'fullName email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, count: advances.length, cashAdvances: advances });
  } catch (error) {
    console.error('Error fetching cash advances:', error);
    return res.status(500).json({ error: 'Failed to fetch cash advances.' });
  }
};

/**
 * Get Active Advances for Employee (available for claim deduction)
 */
exports.getActiveAdvancesForEmployee = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { employeeId } = req.params;

    const advances = await CashAdvance.find({
      organizationId: orgId,
      employeeId,
      status: { $in: ['disbursed', 'partially_settled'] },
      remainingBalance: { $gt: 0 },
      deletedAt: null,
    })
      .populate('travelRequestId', 'requestNumber destination')
      .sort({ createdAt: 1 })
      .lean();

    return res.json({ success: true, advances });
  } catch (error) {
    console.error('Error fetching employee active advances:', error);
    return res.status(500).json({ error: 'Failed to fetch active advances.' });
  }
};

/**
 * Get Single Cash Advance
 */
exports.getCashAdvanceById = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    const advance = await CashAdvance.findOne({
      _id: id,
      organizationId: orgId,
      deletedAt: null,
    })
      .populate('employeeId', 'fullName email')
      .populate('travelRequestId', 'requestNumber destination totalEstimated')
      .populate('approval.approvedById', 'fullName email')
      .populate('disbursement.disbursedById', 'fullName email')
      .populate('settlementHistory.claimId', 'claimNumber title totalAmount');

    if (!advance) {
      return res.status(404).json({ error: 'Cash advance not found.' });
    }

    return res.json({ success: true, cashAdvance: advance });
  } catch (error) {
    console.error('Error fetching cash advance:', error);
    return res.status(500).json({ error: 'Failed to fetch cash advance.' });
  }
};

/**
 * Request Cash Advance
 */
exports.createCashAdvance = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const employeeId = req.user?._id;

    const advance = await cashAdvanceService.createCashAdvance({
      organizationId: orgId,
      employeeId,
      ...req.body,
    });

    return res.status(201).json({ success: true, cashAdvance: advance });
  } catch (error) {
    console.error('Error creating cash advance:', error);
    return res.status(400).json({ error: error.message || 'Failed to create cash advance.' });
  }
};

/**
 * Approve Cash Advance (Anti-self-approval)
 */
exports.approveCashAdvance = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const approverId = req.user?._id;
    const { id } = req.params;
    const { comments } = req.body;

    const advance = await cashAdvanceService.approveCashAdvance({
      cashAdvanceId: id,
      organizationId: orgId,
      approverId,
      comments,
    });

    return res.json({ success: true, cashAdvance: advance });
  } catch (error) {
    console.error('Error approving cash advance:', error);
    return res.status(400).json({ error: error.message || 'Failed to approve cash advance.' });
  }
};

/**
 * Disburse Cash Advance (Finance)
 */
exports.disburseCashAdvance = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const disbursedById = req.user?._id;
    const { id } = req.params;
    const { reference } = req.body;

    const advance = await cashAdvanceService.disburseCashAdvance({
      cashAdvanceId: id,
      organizationId: orgId,
      disbursedById,
      reference,
    });

    return res.json({ success: true, cashAdvance: advance });
  } catch (error) {
    console.error('Error disbursing cash advance:', error);
    return res.status(400).json({ error: error.message || 'Failed to disburse cash advance.' });
  }
};
