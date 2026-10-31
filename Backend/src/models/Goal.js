const mongoose = require('mongoose');

const keyResultSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    targetValue: {
      type: Number,
      required: true,
      default: 100,
    },
    currentValue: {
      type: Number,
      required: true,
      default: 0,
    },
    unit: {
      type: String,
      default: '%',
      trim: true,
    },
    weight: {
      type: Number,
      default: 1,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
  },
  { _id: true }
);

const checkInSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    progressSnapshot: {
      type: Number,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { _id: true }
);

const goalSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['engineering', 'sales', 'operations', 'leadership', 'personal_growth', 'general'],
      default: 'general',
    },
    level: {
      type: String,
      enum: ['individual', 'department', 'company'],
      default: 'individual',
    },
    period: {
      type: String,
      required: true,
      default: '2026 Annual',
      trim: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'at_risk', 'behind', 'completed', 'cancelled'],
      default: 'in_progress',
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    weight: {
      type: Number,
      default: 10,
    },
    keyResults: [keyResultSchema],
    checkIns: [checkInSchema],
    alignedWithGoalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal',
      default: null,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

goalSchema.index({ organizationId: 1, employeeId: 1, period: 1 });
goalSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Goal', goalSchema);
