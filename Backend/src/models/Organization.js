const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [200, 'Organization name cannot exceed 200 characters'],
    },
    companySize: {
      type: String,
      enum: {
        values: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
        message: '{VALUE} is not a valid company size',
      },
      default: null,
    },
    industry: {
      type: String,
      trim: true,
      default: null,
    },
    subIndustry: {
      type: String,
      trim: true,
      default: null,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    faviconUrl: {
      type: String,
      trim: true,
      default: null,
    },
    website: {
      type: String,
      trim: true,
      default: null,
    },
    brandColor: {
      type: String,
      trim: true,
      default: '#f0512f',
    },
    primaryFocus: {
      type: [String],
      enum: {
        values: ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics', 'all'],
        message: '{VALUE} is not a valid focus area',
      },
      default: ['all'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    shiftStartTime: {
      type: String,
      default: '09:30',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Set after user creation within the transaction
    },
    // ── Platform-management fields (Master Panel only; never exposed to tenants) ──
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
      default: null,
    },
    suspendedReason: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: {
        values: ['trial', 'starter', 'professional', 'enterprise'],
        message: '{VALUE} is not a valid plan',
      },
      default: 'trial',
    },
    // Internal platform-owner notes — must never be returned by tenant endpoints
    notes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
