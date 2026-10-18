const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['active', 'hired', 'rejected', 'withdrawn'];

const applicationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    applicationCode: {
      type: String,
      required: [true, 'Application code is required'],
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
      index: true,
    },
    stage: {
      type: String,
      required: [true, 'Stage is required'],
      default: 'applied',
      index: true,
    },
    stageHistory: [
      {
        fromStage: { type: String, required: true },
        toStage: { type: String, required: true },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    matchScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    matchExplanation: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    source: {
      type: String,
      default: 'careers_page',
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    rejectionReasonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RejectionReason',
      default: null,
    },
    rejectionNotes: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: '{VALUE} is not a valid application status',
      },
      default: 'active',
      index: true,
    },
    convertedEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    hiredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
applicationSchema.index({ organizationId: 1, applicationCode: 1 }, { unique: true });
applicationSchema.index({ organizationId: 1, candidateId: 1, jobOpeningId: 1, status: 1 });
applicationSchema.index({ organizationId: 1, jobOpeningId: 1, stage: 1 });
applicationSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
