const CashAdvance = require('../models/CashAdvance');
const Counter = require('../models/Counter');
const { roundMoney } = require('../utils/money');

/**
 * Generates an atomic, collision-free advance number (ADV-YYYY-XXXX)
 */
async function getNextAdvanceNumber(organizationId) {
  const year = new Date().getFullYear();
  const counterId = `ADV_${organizationId}_${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `ADV-${year}-${paddedSeq}`;
}

/**
 * Request a new Cash Advance
 */
async function createCashAdvance({
  organizationId,
  employeeId,
  travelRequestId,
  amount,
  currency = 'USD',
  purpose,
  disbursementMethod = 'bank_transfer',
}) {
  const advanceNumber = await getNextAdvanceNumber(organizationId);
  const roundedAmount = roundMoney(parseFloat(amount) || 0);

  if (roundedAmount <= 0) {
    throw new Error('Cash advance amount must be greater than zero.');
  }

  const advance = await CashAdvance.create({
    organizationId,
    advanceNumber,
    employeeId,
    travelRequestId: travelRequestId || null,
    amount: roundedAmount,
    currency: (currency || 'USD').toUpperCase(),
    purpose: purpose.trim(),
    disbursementMethod,
    disbursedAmount: 0,
    settledAmount: 0,
    remainingBalance: 0,
    status: 'requested',
  });

  return advance;
}

/**
 * Approve Cash Advance (Anti-self-approval enforced)
 */
async function approveCashAdvance({
  cashAdvanceId,
  organizationId,
  approverId,
  comments = '',
}) {
  const advance = await CashAdvance.findOne({
    _id: cashAdvanceId,
    organizationId,
    deletedAt: null,
  });

  if (!advance) {
    throw new Error('Cash advance not found.');
  }

  if (String(advance.employeeId) === String(approverId)) {
    throw new Error('Anti-self-approval: You cannot approve your own cash advance.');
  }

  if (advance.status !== 'requested') {
    throw new Error(`Cannot approve advance in status: ${advance.status}`);
  }

  advance.status = 'approved';
  advance.approval = {
    approvedById: approverId,
    approvedAt: new Date(),
    comments: comments.trim(),
  };

  await advance.save();
  return advance;
}

/**
 * Disburse Cash Advance (Finance action)
 */
async function disburseCashAdvance({
  cashAdvanceId,
  organizationId,
  disbursedById,
  reference = '',
}) {
  const advance = await CashAdvance.findOne({
    _id: cashAdvanceId,
    organizationId,
    deletedAt: null,
  });

  if (!advance) {
    throw new Error('Cash advance not found.');
  }

  if (advance.status !== 'approved') {
    throw new Error(`Cannot disburse advance in status: ${advance.status}. Must be approved first.`);
  }

  advance.status = 'disbursed';
  advance.disbursedAmount = advance.amount;
  advance.remainingBalance = advance.amount;
  advance.disbursement = {
    disbursedById,
    disbursedAt: new Date(),
    reference: reference.trim(),
  };

  await advance.save();
  return advance;
}

/**
 * Net-Pay Math Engine (M3)
 * Calculates settlement deductions between an Expense Claim and an active Cash Advance
 */
function calculateNetPaySettlement(claimAmount, remainingAdvanceBalance) {
  const claim = roundMoney(claimAmount);
  const advance = roundMoney(remainingAdvanceBalance);

  if (advance <= 0) {
    return {
      advanceDeduction: 0,
      netReimbursement: claim,
      newRemainingBalance: 0,
      isFullySettled: true,
    };
  }

  if (claim >= advance) {
    const netReimbursement = roundMoney(claim - advance);
    return {
      advanceDeduction: advance,
      netReimbursement,
      newRemainingBalance: 0,
      isFullySettled: true,
    };
  } else {
    const advanceDeduction = claim;
    const newRemainingBalance = roundMoney(advance - claim);
    return {
      advanceDeduction,
      netReimbursement: 0,
      newRemainingBalance,
      isFullySettled: false,
    };
  }
}

/**
 * Applies advance deduction when claim is reimbursed or approved
 */
async function applyAdvanceDeduction({
  cashAdvanceId,
  claimId,
  deductedAmount,
  notes = '',
}) {
  if (!cashAdvanceId || deductedAmount <= 0) return null;

  const advance = await CashAdvance.findById(cashAdvanceId);
  if (!advance) return null;

  const deduction = roundMoney(deductedAmount);
  advance.settledAmount = roundMoney(advance.settledAmount + deduction);
  advance.remainingBalance = roundMoney(Math.max(0, advance.remainingBalance - deduction));

  advance.status = advance.remainingBalance <= 0 ? 'settled' : 'partially_settled';

  advance.settlementHistory.push({
    claimId,
    amount: deduction,
    settledAt: new Date(),
    notes,
  });

  await advance.save();
  return advance;
}

module.exports = {
  getNextAdvanceNumber,
  createCashAdvance,
  approveCashAdvance,
  disburseCashAdvance,
  calculateNetPaySettlement,
  applyAdvanceDeduction,
};
