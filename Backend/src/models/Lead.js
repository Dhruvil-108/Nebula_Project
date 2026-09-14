const mongoose = require('mongoose');

const LEAD_SOURCES = ['website', 'referral', 'cold_call', 'social', 'event', 'other'];
const PIPELINE_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const leadSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    leadName: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
      maxlength: [200, 'Lead name cannot exceed 200 characters'],
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: {
        values: LEAD_SOURCES,
        message: '{VALUE} is not a valid lead source',
      },
      default: 'other',
    },
    industry: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: PIPELINE_STAGES,
        message: '{VALUE} is not a valid lead status',
      },
      default: 'new',
      index: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Tenant + pipeline query indexes
leadSchema.index({ organizationId: 1, owner: 1 });
leadSchema.index({ organizationId: 1, status: 1 });
leadSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Lead', leadSchema);
module.exports.LEAD_SOURCES = LEAD_SOURCES;
module.exports.PIPELINE_STAGES = PIPELINE_STAGES;
