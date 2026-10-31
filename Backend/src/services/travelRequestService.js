const TravelRequest = require('../models/TravelRequest');
const DepartmentBudget = require('../models/DepartmentBudget');
const Counter = require('../models/Counter');
const { roundMoney } = require('../utils/money');

/**
 * Generates an atomic, collision-free request number (TR-YYYY-XXXX)
 */
async function getNextRequestNumber(organizationId) {
  const year = new Date().getFullYear();
  const counterId = `TR_${organizationId}_${year}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(4, '0');
  return `TR-${year}-${paddedSeq}`;
}

/**
 * Creates a new Travel Request with budget pre-commitment
 */
async function createTravelRequest({
  organizationId,
  employeeId,
  departmentId,
  projectId,
  costCenterId,
  destination,
  startDate,
  endDate,
  purpose,
  estimatedExpenses = {},
  currency = 'USD',
  submitNow = true,
}) {
  const requestNumber = await getNextRequestNumber(organizationId);

  const flights = parseFloat(estimatedExpenses.flights) || 0;
  const lodging = parseFloat(estimatedExpenses.lodging) || 0;
  const meals = parseFloat(estimatedExpenses.meals) || 0;
  const transport = parseFloat(estimatedExpenses.transport) || 0;
  const incidentals = parseFloat(estimatedExpenses.incidentals) || 0;
  const other = parseFloat(estimatedExpenses.other) || 0;

  const totalEstimated = roundMoney(
    flights + lodging + meals + transport + incidentals + other
  );

  const request = await TravelRequest.create({
    organizationId,
    requestNumber,
    employeeId,
    departmentId,
    projectId: projectId || null,
    costCenterId: costCenterId || null,
    destination: destination.trim(),
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    purpose: purpose.trim(),
    estimatedExpenses: {
      flights,
      lodging,
      meals,
      transport,
      incidentals,
      other,
    },
    totalEstimated,
    currency: (currency || 'USD').toUpperCase(),
    status: submitNow ? 'submitted' : 'draft',
    submittedAt: submitNow ? new Date() : null,
  });

  // Pre-commit budget if submitted
  if (submitNow && totalEstimated > 0) {
    const year = new Date(startDate).getFullYear();
    await DepartmentBudget.findOneAndUpdate(
      {
        organizationId,
        departmentId,
        fiscalYear: year,
      },
      {
        $inc: { pendingAmount: totalEstimated },
      }
    ).catch(() => {});
  }

  return request;
}

/**
 * Approve Travel Request (Anti-self-approval enforced)
 */
async function approveTravelRequest({
  travelRequestId,
  organizationId,
  approverId,
  comments = '',
}) {
  const request = await TravelRequest.findOne({
    _id: travelRequestId,
    organizationId,
    deletedAt: null,
  });

  if (!request) {
    throw new Error('Travel request not found.');
  }

  if (String(request.employeeId) === String(approverId)) {
    throw new Error('Anti-self-approval: You cannot approve your own travel authorization.');
  }

  if (request.status !== 'submitted') {
    throw new Error(`Travel request cannot be approved from current status: ${request.status}`);
  }

  request.status = 'approved';
  request.approval = {
    approvedById: approverId,
    approvedAt: new Date(),
    comments: comments.trim(),
  };

  await request.save();
  return request;
}

/**
 * Reject Travel Request
 */
async function rejectTravelRequest({
  travelRequestId,
  organizationId,
  approverId,
  reason,
}) {
  const request = await TravelRequest.findOne({
    _id: travelRequestId,
    organizationId,
    deletedAt: null,
  });

  if (!request) {
    throw new Error('Travel request not found.');
  }

  if (String(request.employeeId) === String(approverId)) {
    throw new Error('Anti-self-approval violation: You cannot reject your own travel authorization.');
  }

  request.status = 'rejected';
  request.rejection = {
    rejectedById: approverId,
    rejectedAt: new Date(),
    reason: (reason || '').trim() || 'Travel request rejected by approver.',
  };

  await request.save();

  // Release pre-committed budget
  if (request.totalEstimated > 0) {
    const year = new Date(request.startDate).getFullYear();
    await DepartmentBudget.findOneAndUpdate(
      {
        organizationId,
        departmentId: request.departmentId,
        fiscalYear: year,
      },
      {
        $inc: { pendingAmount: -request.totalEstimated },
      }
    ).catch(() => {});
  }

  return request;
}

/**
 * Record actual expenditure against Travel Request when an Expense Claim is processed
 */
async function recordActualSpend(travelRequestId, claimAmount) {
  if (!travelRequestId || !claimAmount) return;

  const request = await TravelRequest.findById(travelRequestId);
  if (!request) return;

  request.spentAmount = roundMoney((request.spentAmount || 0) + claimAmount);
  await request.save();
}

module.exports = {
  getNextRequestNumber,
  createTravelRequest,
  approveTravelRequest,
  rejectTravelRequest,
  recordActualSpend,
};
