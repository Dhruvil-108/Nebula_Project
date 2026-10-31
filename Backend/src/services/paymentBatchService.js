const PaymentBatch = require('../models/PaymentBatch');
const ExpenseClaim = require('../models/ExpenseClaim');
const Counter = require('../models/Counter');
const { roundMoney, sumMoney } = require('../utils/money');
const { applyAdvanceDeduction } = require('./cashAdvanceService');

/**
 * Generates an atomic, collision-free batch number (BATCH-YYYY-XXXX)
 */
async function getNextBatchNumber(organizationId) {
  const year = new Date().getFullYear();
  const counterId = `BATCH_${organizationId}_${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `BATCH-${year}-${paddedSeq}`;
}

/**
 * Creates a new Payment Batch for approved claims (M4)
 */
async function createPaymentBatch({
  organizationId,
  createdById,
  name,
  paymentMethod = 'bank_transfer',
  currency = 'USD',
  claimIds = [],
}) {
  if (!Array.isArray(claimIds) || claimIds.length === 0) {
    throw new Error('At least one approved claim must be selected for the batch.');
  }

  // Fetch and validate claims
  const claims = await ExpenseClaim.find({
    _id: { $in: claimIds },
    organizationId,
    deletedAt: null,
  });

  if (claims.length !== claimIds.length) {
    throw new Error('One or more selected claims could not be found.');
  }

  for (const claim of claims) {
    if (claim.status !== 'approved') {
      throw new Error(
        `Claim ${claim.claimNumber} is not approved (current status: ${claim.status}) and cannot be batched.`
      );
    }
    if (claim.paymentBatchId) {
      throw new Error(`Claim ${claim.claimNumber} is already assigned to another payment batch.`);
    }
  }

  const batchNumber = await getNextBatchNumber(organizationId);

  // Total payable amount accounts for any cash advance deduction (net reimbursable)
  const totalAmount = roundMoney(
    sumMoney(
      claims.map((c) =>
        c.netReimbursableAmount !== undefined && c.netReimbursableAmount !== null
          ? c.netReimbursableAmount
          : c.totalAmount
      )
    )
  );

  const batch = await PaymentBatch.create({
    organizationId,
    batchNumber,
    name: name.trim(),
    paymentMethod,
    currency: (currency || 'USD').toUpperCase(),
    totalAmount,
    claimsCount: claims.length,
    claimIds: claims.map((c) => c._id),
    status: 'draft',
    createdById,
  });

  // Assign batch ID to constituent claims
  await ExpenseClaim.updateMany(
    { _id: { $in: claimIds } },
    { $set: { paymentBatchId: batch._id } }
  );

  return batch;
}

/**
 * Execute & Pay Batch (Finance action)
 * Transitions all constituent claims to 'reimbursed' atomically
 */
async function executePaymentBatch({
  batchId,
  organizationId,
  paidById,
  bankReference = '',
}) {
  const batch = await PaymentBatch.findOne({
    _id: batchId,
    organizationId,
    deletedAt: null,
  });

  if (!batch) {
    throw new Error('Payment batch not found.');
  }

  if (batch.status === 'paid') {
    throw new Error('Payment batch has already been executed and marked as paid.');
  }

  const now = new Date();
  const ref = bankReference.trim() || batch.batchNumber;

  // Fetch claims in batch
  const claims = await ExpenseClaim.find({
    _id: { $in: batch.claimIds },
    organizationId,
    deletedAt: null,
  });

  for (const claim of claims) {
    claim.status = 'reimbursed';
    claim.reimbursement = {
      reimbursedAt: now,
      reimbursedById: paidById,
      paymentMethod: batch.paymentMethod,
      transactionReference: ref,
    };
    await claim.save();

    // Settle linked cash advance if applicable
    if (claim.cashAdvanceId && (claim.advanceDeductedAmount || 0) > 0) {
      await applyAdvanceDeduction({
        cashAdvanceId: claim.cashAdvanceId,
        claimId: claim._id,
        deductedAmount: claim.advanceDeductedAmount,
        notes: `Settled via payment batch ${batch.batchNumber}`,
      });
    }
  }

  batch.status = 'paid';
  batch.paidById = paidById;
  batch.paidAt = now;
  batch.bankReference = ref;

  await batch.save();
  return batch;
}

module.exports = {
  getNextBatchNumber,
  createPaymentBatch,
  executePaymentBatch,
};
