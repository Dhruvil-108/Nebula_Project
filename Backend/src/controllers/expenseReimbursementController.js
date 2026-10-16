const ExpenseClaim = require('../models/ExpenseClaim');
const ExpenseActivity = require('../models/ExpenseActivity');
const { ROLES } = require('../config/roles');

/**
 * Mark approved claim as reimbursed
 */
exports.reimburseClaim = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const user = req.user;
    const { id } = req.params;
    const { paymentMethod = 'bank_transfer', transactionReference = '' } = req.body;

    const isFinanceOrAdmin = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE].includes(user.role);
    if (!isFinanceOrAdmin) {
      return res.status(403).json({ error: 'Only Finance or Admin can mark claims as reimbursed.' });
    }

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId: orgId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim not found.' });
    }

    if (claim.status !== 'approved') {
      return res.status(400).json({
        error: `Only approved claims can be marked as reimbursed. Current status: "${claim.status}".`,
      });
    }

    claim.status = 'reimbursed';
    claim.reimbursement = {
      reimbursedAt: new Date(),
      reimbursedById: user._id,
      paymentMethod,
      transactionReference: transactionReference.trim(),
    };

    await claim.save();

    await ExpenseActivity.create({
      organizationId: orgId,
      claimId: claim._id,
      actorId: user._id,
      action: 'reimbursed',
      comment: `Reimbursed via ${paymentMethod} (Ref: ${transactionReference || 'N/A'})`,
      details: {
        totalAmount: claim.totalAmount,
        paymentMethod,
        transactionReference,
      },
    });

    const updated = await ExpenseClaim.findById(claim._id)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('reimbursement.reimbursedById', 'fullName email');

    return res.json({ success: true, message: 'Claim marked as reimbursed.', claim: updated });
  } catch (error) {
    console.error('Error reimbursing claim:', error);
    return res.status(500).json({ error: 'Failed to process reimbursement.' });
  }
};

/**
 * Export claims to CSV format for accounting reconciliation
 */
exports.exportClaims = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { status, departmentId } = req.query;

    const filter = { organizationId: orgId };
    if (status && status !== 'all') filter.status = status;
    if (departmentId && departmentId !== 'all') filter.departmentId = departmentId;

    const claims = await ExpenseClaim.find(filter)
      .populate('employeeId', 'fullName email')
      .populate('departmentId', 'name')
      .populate('items.categoryId', 'name glCode')
      .sort({ createdAt: -1 })
      .lean();

    const headers = [
      'Claim Number',
      'Created Date',
      'Employee Name',
      'Employee Email',
      'Department',
      'Title',
      'Total Amount',
      'Currency',
      'Status',
      'Payment Method',
      'Transaction Ref',
      'Items Count',
    ];

    const rows = claims.map((c) => [
      c.claimNumber,
      c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : '',
      `"${(c.employeeId?.fullName || '').replace(/"/g, '""')}"`,
      c.employeeId?.email || '',
      `"${(c.departmentId?.name || '').replace(/"/g, '""')}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      c.totalAmount,
      c.currency,
      c.status,
      c.reimbursement?.paymentMethod || '',
      c.reimbursement?.transactionReference || '',
      c.items?.length || 0,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nebula_expenses_${new Date().toISOString().split('T')[0]}.csv"`
    );
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting claims:', error);
    return res.status(500).json({ error: 'Failed to export claims.' });
  }
};
