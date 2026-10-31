const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  stepOrder: {
    type: Number,
    required: true,
  },
  approverType: {
    type: String,
    enum: ['manager', 'finance', 'admin', 'specific_user'],
    required: true,
  },
  specificUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  slaHours: {
    type: Number,
    default: 48,
    min: 1,
  },
  canDelegate: {
    type: Boolean,
    default: true,
  },
});

const approvalWorkflowSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    conditions: {
      minAmount: { type: Number, default: 0, min: 0 },
      maxAmount: { type: Number, default: Infinity },
      departmentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
      categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory' }],
      projectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
    },
    autoApproveBelow: {
      type: Number,
      default: 0, // 0 = disabled
      min: 0,
    },
    steps: {
      type: [workflowStepSchema],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

approvalWorkflowSchema.index({ organizationId: 1, active: 1, isDefault: 1 });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
