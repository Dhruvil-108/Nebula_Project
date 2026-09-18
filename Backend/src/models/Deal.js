const mongoose = require('mongoose');

const DEAL_STAGES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const dealSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    dealName: {
      type: String,
      required: [true, 'Deal name is required'],
      trim: true,
      maxlength: [200, 'Deal name cannot exceed 200 characters'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact',
      default: null,
    },
    amount: {
      type: Number,
      required: [true, 'Deal amount is required'],
      min: [0, 'Deal amount cannot be negative'],
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    expectedCloseDate: {
      type: Date,
      default: null,
    },
    stage: {
      type: String,
      enum: {
        values: DEAL_STAGES,
        message: '{VALUE} is not a valid deal stage',
      },
      default: 'new',
      index: true,
    },
    // Set when the deal enters 'won'; used for accurate "won this month" stats
    wonAt: {
      type: Date,
      default: null,
    },
    salesperson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Pipeline board and salesperson queries
dealSchema.index({ organizationId: 1, stage: 1 });
dealSchema.index({ organizationId: 1, salesperson: 1 });
dealSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Deal', dealSchema);
module.exports.DEAL_STAGES = DEAL_STAGES;
