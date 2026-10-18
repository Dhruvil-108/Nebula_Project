const mongoose = require('mongoose');

const REFERRAL_STATUSES = ['submitted', 'in_review', 'hired', 'rejected'];

const referralSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: [true, 'Job opening is required'],
      index: true,
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
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Referred by user is required'],
      index: true,
    },
    relationship: {
      type: String,
      required: [true, 'Professional relationship is required'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: REFERRAL_STATUSES,
        message: '{VALUE} is not a valid referral status',
      },
      default: 'submitted',
      index: true,
    },
  },
  { timestamps: true }
);

referralSchema.index({ organizationId: 1, jobOpeningId: 1, candidateId: 1 }, { unique: true });
referralSchema.index({ organizationId: 1, referredBy: 1 });

module.exports = mongoose.model('Referral', referralSchema);
module.exports.REFERRAL_STATUSES = REFERRAL_STATUSES;
