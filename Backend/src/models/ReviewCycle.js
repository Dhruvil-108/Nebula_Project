const mongoose = require('mongoose');

const reviewCycleSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    reviewPeriod: {
      type: String,
      enum: ['annual', 'semi_annual', 'quarterly', 'adhoc'],
      default: 'annual',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'in_review', 'calibrating', 'completed', 'archived'],
      default: 'draft',
      index: true,
    },
    type: {
      type: String,
      enum: ['360_degree', 'manager_only', 'self_and_manager'],
      default: '360_degree',
    },
    eligibleDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    submissionStats: {
      totalEligible: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

reviewCycleSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('ReviewCycle', reviewCycleSchema);
