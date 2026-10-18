const mongoose = require('mongoose');

const recruitmentSettingsSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      unique: true,
      index: true,
    },
    aiEnabled: {
      type: Boolean,
      default: true,
    },
    aiMonthlyTokenLimit: {
      type: Number,
      default: 500000,
    },
    aiTokensUsedThisMonth: {
      type: Number,
      default: 0,
    },
    aiTokenResetDate: {
      type: Date,
      default: () => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth() + 1, 1);
      },
    },
    retentionDays: {
      type: Number,
      default: 365,
      min: 30,
    },
    featureFlags: {
      type: Map,
      of: Boolean,
      default: {
        requisitions: true,
        careersPortal: true,
        aiMatching: true,
        autoReminders: true,
        calendarSync: false,
      },
    },
    defaultTimezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruitmentSettings', recruitmentSettingsSchema);
