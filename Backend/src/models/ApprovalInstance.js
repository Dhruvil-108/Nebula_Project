const mongoose = require('mongoose');

const stepInstanceSchema = new mongoose.Schema(
  {
    stepOrder: {
      type: Number,
      required: true,
    },
    approverType: {
      type: String,
      enum: ['manager', 'dept_head', 'hr', 'finance', 'specific_user', 'role'],
      required: true,
    },
    approverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approverRole: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending',
    },
    actedAt: {
      type: Date,
      default: null,
    },
    actionBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const approvalInstanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    requestType: {
      type: String,
      enum: ['leave', 'regularization', 'expense', 'payroll', 'transfer', 'general'],
      required: true,
      index: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    referenceModel: {
      type: String,
      required: true,
      default: 'LeaveRequest',
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalWorkflow',
      default: null,
    },
    requesterEmployeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    requesterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    currentStepIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'auto_approved'],
      default: 'pending',
      index: true,
    },
    steps: [stepInstanceSchema],
    slaDeadline: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

approvalInstanceSchema.index({ organizationId: 1, requestType: 1, status: 1 });
approvalInstanceSchema.index({ organizationId: 1, referenceId: 1 });

module.exports = mongoose.model('ApprovalInstance', approvalInstanceSchema);
