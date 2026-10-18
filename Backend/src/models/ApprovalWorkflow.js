const mongoose = require('mongoose');

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
    entityType: {
      type: String,
      enum: ['requisition', 'job_offer'],
      required: true,
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null, // null means organization-wide default
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    steps: [
      {
        order: { type: Number, required: true },
        role: { type: String, required: true }, // e.g. 'manager', 'hr', 'super_admin'
        specificUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        title: { type: String, default: 'Step Approval' },
      },
    ],
  },
  { timestamps: true }
);

approvalWorkflowSchema.index({ organizationId: 1, entityType: 1 });

module.exports = mongoose.model('ApprovalWorkflow', approvalWorkflowSchema);
