const mongoose = require('mongoose');

const INTERVIEW_TYPES = ['screening', 'technical', 'behavioral', 'managerial', 'culture_fit', 'final'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'rescheduled', 'cancelled', 'no_show'];
const EVALUATION_DECISIONS = ['strong_hire', 'hire', 'neutral', 'do_not_hire', 'strong_do_not_hire'];

const interviewSchema = new mongoose.Schema(
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
      required: [true, 'Candidate is required'],
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: [true, 'Job opening is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Interview title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    roundType: {
      type: String,
      enum: {
        values: INTERVIEW_TYPES,
        message: '{VALUE} is not a valid interview type',
      },
      default: 'technical',
    },
    interviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    scheduledStart: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    scheduledEnd: {
      type: Date,
      required: [true, 'End time is required'],
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: INTERVIEW_STATUSES,
        message: '{VALUE} is not a valid interview status',
      },
      default: 'scheduled',
      index: true,
    },
    scorecard: {
      rating: { type: Number, min: 1, max: 5, default: null },
      decision: {
        type: String,
        enum: EVALUATION_DECISIONS,
        default: null,
      },
      technicalSkillScore: { type: Number, min: 1, max: 5, default: null },
      communicationScore: { type: Number, min: 1, max: 5, default: null },
      cultureFitScore: { type: Number, min: 1, max: 5, default: null },
      notes: { type: String, default: '' },
      submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      submittedAt: { type: Date, default: null },
    },
    cancellationReason: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

interviewSchema.index({ organizationId: 1, candidateId: 1 });
interviewSchema.index({ organizationId: 1, scheduledStart: 1 });
interviewSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
module.exports.INTERVIEW_TYPES = INTERVIEW_TYPES;
module.exports.INTERVIEW_STATUSES = INTERVIEW_STATUSES;
module.exports.EVALUATION_DECISIONS = EVALUATION_DECISIONS;
