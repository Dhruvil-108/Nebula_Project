const mongoose = require('mongoose');

const REPORT_TYPES = ['pipeline_summary', 'time_to_hire', 'sourcing_roi', 'offer_audit', 'eeo_compliance'];
const SCHEDULE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'on_demand'];

const recruitmentReportConfigSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    reportType: {
      type: String,
      enum: REPORT_TYPES,
      required: true,
    },
    frequency: {
      type: String,
      enum: SCHEDULE_FREQUENCIES,
      default: 'weekly',
    },
    recipients: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    filters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastGeneratedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

recruitmentReportConfigSchema.index({ organizationId: 1, reportType: 1 });

module.exports = mongoose.model('RecruitmentReportConfig', recruitmentReportConfigSchema);
module.exports.REPORT_TYPES = REPORT_TYPES;
module.exports.SCHEDULE_FREQUENCIES = SCHEDULE_FREQUENCIES;
