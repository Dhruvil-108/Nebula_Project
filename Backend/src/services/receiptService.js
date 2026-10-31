const crypto = require('crypto');
const Receipt = require('../models/Receipt');
const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * Compute SHA-256 hash of a receipt buffer or base64 data
 */
function computeReceiptHash(input) {
  if (!input) return '';
  let buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === 'string') {
    // Check if it's data URI
    const base64Index = input.indexOf(';base64,');
    if (base64Index !== -1) {
      buffer = Buffer.from(input.substring(base64Index + 8), 'base64');
    } else {
      buffer = Buffer.from(input, 'utf-8');
    }
  } else {
    return '';
  }

  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Check if a receipt hash already exists in another claim within the organization
 */
async function checkDuplicateReceipt({ organizationId, contentHash, excludeClaimId = null }) {
  if (!organizationId || !contentHash) {
    return { isDuplicate: false };
  }

  // 1. Check in Receipt collection
  const existingReceipt = await Receipt.findOne({
    organizationId,
    contentHash,
    deletedAt: null,
    ...(excludeClaimId ? { claimId: { $ne: excludeClaimId } } : {}),
  }).populate('claimId', 'claimNumber title status createdAt');

  if (existingReceipt && existingReceipt.claimId) {
    return {
      isDuplicate: true,
      existingClaim: {
        id: existingReceipt.claimId._id,
        claimNumber: existingReceipt.claimId.claimNumber,
        title: existingReceipt.claimId.title,
        status: existingReceipt.claimId.status,
        createdAt: existingReceipt.claimId.createdAt,
      },
    };
  }

  // 2. Check in ExpenseClaim items subdocuments
  const matchFilter = {
    organizationId,
    deletedAt: null,
    'items.receiptHash': contentHash,
  };
  if (excludeClaimId) {
    matchFilter._id = { $ne: excludeClaimId };
  }

  const existingClaim = await ExpenseClaim.findOne(matchFilter)
    .select('claimNumber title status createdAt')
    .lean();

  if (existingClaim) {
    return {
      isDuplicate: true,
      existingClaim: {
        id: existingClaim._id,
        claimNumber: existingClaim.claimNumber,
        title: existingClaim.title,
        status: existingClaim.status,
        createdAt: existingClaim.createdAt,
      },
    };
  }

  return { isDuplicate: false };
}

module.exports = {
  computeReceiptHash,
  checkDuplicateReceipt,
};
