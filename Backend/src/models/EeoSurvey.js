const mongoose = require('mongoose');

const GENDER_OPTIONS = ['male', 'female', 'non_binary', 'declined'];
const ETHNICITY_OPTIONS = [
  'asian',
  'black_or_african_american',
  'hispanic_or_latino',
  'white',
  'native_american_or_alaska_native',
  'native_hawaiian_or_pacific_islander',
  'two_or_more_races',
  'declined',
];
const VETERAN_STATUS_OPTIONS = ['veteran', 'non_veteran', 'declined'];
const DISABILITY_STATUS_OPTIONS = ['has_disability', 'no_disability', 'declined'];

const eeoSurveySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    jobOpeningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      default: null,
      index: true,
    },
    gender: {
      type: String,
      enum: GENDER_OPTIONS,
      default: 'declined',
    },
    ethnicity: {
      type: String,
      enum: ETHNICITY_OPTIONS,
      default: 'declined',
    },
    veteranStatus: {
      type: String,
      enum: VETERAN_STATUS_OPTIONS,
      default: 'declined',
    },
    disabilityStatus: {
      type: String,
      enum: DISABILITY_STATUS_OPTIONS,
      default: 'declined',
    },
    stageReached: {
      type: String,
      default: 'applied',
    },
    surveyCompletedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Explicitly NO foreign key reference to candidate or application to ensure legal privacy & anti-bias isolation
eeoSurveySchema.index({ organizationId: 1, surveyCompletedAt: -1 });
eeoSurveySchema.index({ organizationId: 1, jobOpeningId: 1 });

module.exports = mongoose.model('EeoSurvey', eeoSurveySchema);
module.exports.GENDER_OPTIONS = GENDER_OPTIONS;
module.exports.ETHNICITY_OPTIONS = ETHNICITY_OPTIONS;
module.exports.VETERAN_STATUS_OPTIONS = VETERAN_STATUS_OPTIONS;
module.exports.DISABILITY_STATUS_OPTIONS = DISABILITY_STATUS_OPTIONS;
