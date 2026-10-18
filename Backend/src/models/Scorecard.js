const mongoose = require('mongoose');

const RECOMMENDATION_OPTIONS = [
  'strong_hire',
  'hire',
  'neutral',
  'no_hire',
  'strong_no_hire',
];

const competencyRatingSchema = new mongoose.Schema(
  {
    competency: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    weight: {
      type: Number,
      default: 1,
    },
    evidence: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const scorecardSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: [true, 'interviewId is required'],
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: [true, 'candidateId is required'],
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
      required: [true, 'jobOpeningId is required'],
    },
    interviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'interviewerId is required'],
      index: true,
    },
    competencyRatings: {
      type: [competencyRatingSchema],
      default: [],
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Overall rating is required'],
    },
    recommendation: {
      type: String,
      enum: {
        values: RECOMMENDATION_OPTIONS,
        message: '{VALUE} is not a valid recommendation',
      },
      required: [true, 'Recommendation is required'],
    },
    strengths: {
      type: String,
      default: '',
      trim: true,
    },
    areasOfConcern: {
      type: String,
      default: '',
      trim: true,
    },
    isSealed: {
      type: Boolean,
      default: false,
      index: true,
    },
    sealedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

scorecardSchema.index({ organizationId: 1, interviewId: 1, interviewerId: 1 }, { unique: true });
scorecardSchema.index({ organizationId: 1, candidateId: 1 });
scorecardSchema.index({ organizationId: 1, applicationId: 1 });

module.exports = mongoose.model('Scorecard', scorecardSchema);
module.exports.RECOMMENDATION_OPTIONS = RECOMMENDATION_OPTIONS;
