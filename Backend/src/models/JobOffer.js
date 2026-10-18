const mongoose = require('mongoose');

const OFFER_STATUSES = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'accepted',
  'declined',
  'revoked',
];

const compensationItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const approvalStepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    role: {
      type: String,
      enum: ['recruiter', 'hiring_manager', 'department_head', 'finance_head', 'hr_director', 'executive'],
      required: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    comments: { type: String, default: '', trim: true },
    actionedAt: { type: Date, default: null },
  },
  { _id: false }
);

const jobOfferSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    offerCode: {
      type: String,
      required: [true, 'Offer code is required'],
      trim: true,
      uppercase: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'Candidate is required'],
      index: true,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: [true, 'Job opening is required'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    offeredSalary: {
      type: Number,
      required: [true, 'Offered salary is required'],
      min: [0, 'Salary cannot be negative'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    // Detailed Compensation Breakdown
    compensationBreakdown: {
      baseSalary: { type: Number, default: 0, min: 0 },
      variableBonus: { type: Number, default: 0, min: 0 },
      equity: {
        shares: { type: Number, default: 0, min: 0 },
        estimatedValue: { type: Number, default: 0, min: 0 },
        vestingSchedule: { type: String, default: '4-year vesting with 1-year cliff' },
      },
      signOnBonus: { type: Number, default: 0, min: 0 },
      relocationAllowance: { type: Number, default: 0, min: 0 },
      otherAllowances: { type: [compensationItemSchema], default: [] },
      totalCtc: { type: Number, default: 0, min: 0 },
    },
    // Band Governance & Out-of-Band Deviation Checks
    bandGovernance: {
      bandMin: { type: Number, default: 0 },
      bandMax: { type: Number, default: 0 },
      bandMid: { type: Number, default: 0 },
      isDeviation: { type: Boolean, default: false },
      deviationPercent: { type: Number, default: 0 },
      justification: { type: String, default: '', trim: true },
    },
    // Multi-Step Approval Chain
    approvalChain: {
      type: [approvalStepSchema],
      default: [],
    },
    currentApprovalStep: {
      type: Number,
      default: 1,
    },
    // Candidate E-Signature & Audit Trail
    eSignature: {
      signToken: { type: String, default: null, index: true },
      tokenExpiresAt: { type: Date, default: null },
      signedAt: { type: Date, default: null },
      signedIp: { type: String, default: null },
      signedUserAgent: { type: String, default: null },
      signatureImageUrl: { type: String, default: null },
      signerName: { type: String, default: null },
      declineReason: { type: String, default: null },
      declineNotes: { type: String, default: null },
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    validUntil: {
      type: Date,
      required: [true, 'Validity date is required'],
    },
    status: {
      type: String,
      enum: {
        values: OFFER_STATUSES,
        message: '{VALUE} is not a valid offer status',
      },
      default: 'draft',
      index: true,
    },
    benefits: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    offerLetterUrl: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

jobOfferSchema.index({ organizationId: 1, offerCode: 1 }, { unique: true });
jobOfferSchema.index({ organizationId: 1, candidateId: 1 });
jobOfferSchema.index({ organizationId: 1, status: 1 });
jobOfferSchema.index({ organizationId: 1, 'eSignature.signToken': 1 });

module.exports = mongoose.model('JobOffer', jobOfferSchema);
module.exports.OFFER_STATUSES = OFFER_STATUSES;
