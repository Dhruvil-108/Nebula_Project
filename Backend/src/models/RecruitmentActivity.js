const mongoose = require('mongoose');

const ACTIVITY_TYPES = [
  'stage_change',
  'interview_scheduled',
  'interview_rescheduled',
  'interview_cancelled',
  'feedback_submitted',
  'offer_created',
  'offer_status_change',
  'note_added',
  'converted_to_employee',
];

const recruitmentActivitySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      default: null,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ACTIVITY_TYPES,
        message: '{VALUE} is not a valid recruitment activity type',
      },
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

recruitmentActivitySchema.index({ organizationId: 1, candidateId: 1, createdAt: -1 });
recruitmentActivitySchema.index({ organizationId: 1, jobOpeningId: 1, createdAt: -1 });

module.exports = mongoose.model('RecruitmentActivity', recruitmentActivitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
