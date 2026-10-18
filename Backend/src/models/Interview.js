const mongoose = require('mongoose');

const INTERVIEW_TYPES = ['screening', 'technical', 'behavioral', 'managerial', 'culture_fit', 'final'];
const INTERVIEW_STATUSES = ['scheduled', 'completed', 'rescheduled', 'cancelled', 'no_show'];
const EVALUATION_DECISIONS = ['strong_hire', 'hire', 'neutral', 'do_not_hire', 'strong_do_not_hire'];
const MEETING_PLATFORMS = ['google_meet', 'zoom', 'microsoft_teams', 'phone', 'in_person'];
const CONSENSUS_OUTCOMES = ['advance_to_next_round', 'offer_recommended', 'schedule_followup', 'reject', 'pending'];

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
      trim: true,
    },
    meetingPlatform: {
      type: String,
      enum: {
        values: MEETING_PLATFORMS,
        message: '{VALUE} is not a valid meeting platform',
      },
      default: 'google_meet',
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
    },
    meetingPassword: {
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
    icsUid: {
      type: String,
      default: '',
      index: true,
    },
    rescheduleHistory: [
      {
        rescheduledAt: { type: Date, default: Date.now },
        previousStart: { type: Date, required: true },
        previousEnd: { type: Date, required: true },
        reason: { type: String, default: '' },
        requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      },
    ],
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScorecardTemplate',
      default: null,
    },
    consensusOutcome: {
      decision: {
        type: String,
        enum: CONSENSUS_OUTCOMES,
        default: 'pending',
      },
      notes: { type: String, default: '' },
      decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      decidedAt: { type: Date, default: null },
    },
    // Backward compatibility for single embedded scorecard
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
  },
  { timestamps: true }
);

interviewSchema.index({ organizationId: 1, candidateId: 1 });
interviewSchema.index({ organizationId: 1, scheduledStart: 1 });
interviewSchema.index({ organizationId: 1, status: 1 });
interviewSchema.index({ organizationId: 1, interviewers: 1 });

module.exports = mongoose.model('Interview', interviewSchema);
module.exports.INTERVIEW_TYPES = INTERVIEW_TYPES;
module.exports.INTERVIEW_STATUSES = INTERVIEW_STATUSES;
module.exports.EVALUATION_DECISIONS = EVALUATION_DECISIONS;
module.exports.MEETING_PLATFORMS = MEETING_PLATFORMS;
module.exports.CONSENSUS_OUTCOMES = CONSENSUS_OUTCOMES;
