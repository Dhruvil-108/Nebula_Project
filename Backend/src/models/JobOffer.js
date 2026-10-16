const mongoose = require('mongoose');

const OFFER_STATUSES = ['draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'revoked'];

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

module.exports = mongoose.model('JobOffer', jobOfferSchema);
module.exports.OFFER_STATUSES = OFFER_STATUSES;
