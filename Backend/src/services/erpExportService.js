const PaymentBatch = require('../models/PaymentBatch');
const ExpenseClaim = require('../models/ExpenseClaim');
const { roundMoney } = require('../utils/money');

/**
 * Generates Corporate Bank Direct Wire / ACH Payment CSV (M4)
 */
async function generateBankPaymentCsv(batchId, organizationId) {
  const batch = await PaymentBatch.findOne({
    _id: batchId,
    organizationId,
    deletedAt: null,
  });

  if (!batch) {
    throw new Error('Payment batch not found.');
  }

  const claims = await ExpenseClaim.find({
    _id: { $in: batch.claimIds },
    organizationId,
    deletedAt: null,
  })
    .populate('employeeId', 'fullName email')
    .populate('departmentId', 'name')
    .lean();

  const headers = [
    'Batch Number',
    'Claim Number',
    'Employee Name',
    'Employee Email',
    'Department',
    'Payment Method',
    'Claim Total',
    'Advance Deducted',
    'Net Payable',
    'Currency',
    'Bank Reference',
    'Execution Date',
  ];

  const rows = claims.map((claim) => {
    const netPayable =
      claim.netReimbursableAmount !== undefined && claim.netReimbursableAmount !== null
        ? claim.netReimbursableAmount
        : claim.totalAmount;

    return [
      `"${batch.batchNumber}"`,
      `"${claim.claimNumber}"`,
      `"${claim.employeeId?.fullName || 'Employee'}"`,
      `"${claim.employeeId?.email || ''}"`,
      `"${claim.departmentId?.name || ''}"`,
      `"${batch.paymentMethod}"`,
      claim.totalAmount.toFixed(2),
      (claim.advanceDeductedAmount || 0).toFixed(2),
      netPayable.toFixed(2),
      `"${claim.currency}"`,
      `"${batch.bankReference || batch.batchNumber}"`,
      `"${new Date().toISOString().split('T')[0]}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Generates Balanced General Ledger (GL) Double-Entry Journal Export (QuickBooks / NetSuite)
 */
async function generateGlJournalCsv(batchId, organizationId, format = 'quickbooks') {
  const batch = await PaymentBatch.findOne({
    _id: batchId,
    organizationId,
    deletedAt: null,
  });

  if (!batch) {
    throw new Error('Payment batch not found.');
  }

  const claims = await ExpenseClaim.find({
    _id: { $in: batch.claimIds },
    organizationId,
    deletedAt: null,
  })
    .populate('items.categoryId', 'name code glCode')
    .populate('costCenterId', 'code name')
    .populate('departmentId', 'name')
    .lean();

  // Aggregate debits by GL code / category
  const debitsByGl = {};
  let totalDebits = 0;

  for (const claim of claims) {
    for (const item of claim.items || []) {
      const cat = item.categoryId || {};
      const glCode = cat.glCode || '6000';
      const glName = cat.name || 'General Expense';
      const key = `${glCode} - ${glName}`;

      if (!debitsByGl[key]) {
        debitsByGl[key] = {
          glCode,
          glName,
          amount: 0,
          costCenter: claim.costCenterId?.code || 'GEN',
          department: claim.departmentId?.name || 'General',
        };
      }

      const itemAmount = item.amount || 0;
      debitsByGl[key].amount = roundMoney(debitsByGl[key].amount + itemAmount);
      totalDebits = roundMoney(totalDebits + itemAmount);
    }
  }

  const dateStr = new Date().toISOString().split('T')[0];

  if (format === 'netsuite') {
    // NetSuite Journal Entry CSV Format
    const headers = [
      'ExternalID',
      'Date',
      'PostingPeriod',
      'Memo',
      'Account',
      'Debit',
      'Credit',
      'Department',
      'CostCenter',
    ];

    const lines = [];
    const memo = `Expense Batch ${batch.batchNumber}`;

    // Debit lines
    Object.values(debitsByGl).forEach((item, idx) => {
      lines.push([
        `"${batch.batchNumber}"`,
        `"${dateStr}"`,
        `"${dateStr.slice(0, 7)}"`,
        `"${memo}"`,
        `"${item.glCode} ${item.glName}"`,
        item.amount.toFixed(2),
        '0.00',
        `"${item.department}"`,
        `"${item.costCenter}"`,
      ].join(','));
    });

    // Credit line to AP Clearing account
    lines.push([
      `"${batch.batchNumber}"`,
      `"${dateStr}"`,
      `"${dateStr.slice(0, 7)}"`,
      `"${memo}"`,
      `"2000 Accounts Payable - Employee Reimbursements"`,
      '0.00',
      totalDebits.toFixed(2),
      `"Finance"`,
      `"CORP"`,
    ].join(','));

    return [headers.join(','), ...lines].join('\n');
  }

  // Default: QuickBooks Online Journal Entry CSV Format
  const headers = [
    'JournalNo',
    'JournalDate',
    'Account',
    'Debit',
    'Credit',
    'Description',
    'Department',
    'CostCenter',
  ];

  const lines = [];
  const journalNo = batch.batchNumber;

  // Debit lines
  Object.values(debitsByGl).forEach((item) => {
    lines.push([
      `"${journalNo}"`,
      `"${dateStr}"`,
      `"${item.glCode} - ${item.glName}"`,
      item.amount.toFixed(2),
      '0.00',
      `"Expense reimbursement line - ${item.glName}"`,
      `"${item.department}"`,
      `"${item.costCenter}"`,
    ].join(','));
  });

  // Balanced Credit line to AP
  lines.push([
    `"${journalNo}"`,
    `"${dateStr}"`,
    `"2000 - Accounts Payable: Employee Clearing"`,
    '0.00',
    totalDebits.toFixed(2),
    `"Reimbursement batch clearing ${journalNo}"`,
    `"Corporate"`,
    `"FIN"`,
  ].join(','));

  return [headers.join(','), ...lines].join('\n');
}

module.exports = {
  generateBankPaymentCsv,
  generateGlJournalCsv,
};
