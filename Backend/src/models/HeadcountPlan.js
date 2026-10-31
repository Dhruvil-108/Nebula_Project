const mongoose = require('mongoose');

const headcountPlanSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
      index: true,
    },
    period: {
      type: String,
      required: true,
      default: 'FY2026',
      trim: true,
    },
    targetHeadcount: {
      type: Number,
      required: true,
      default: 10,
    },
    budgetAllocated: {
      type: Number,
      default: 0,
    },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['draft', 'approved', 'active', 'archived'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true }
);

headcountPlanSchema.index({ organizationId: 1, departmentId: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('HeadcountPlan', headcountPlanSchema);
