const mongoose = require('mongoose');

const leaveEncashmentSchema = new mongoose.Schema(
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getUTCFullYear(),
    },
    requestedDays: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending',
      index: true,
    },
    approvedDays: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewerComments: {
      type: String,
      trim: true,
      default: '',
    },
    approvalInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalInstance',
      default: null,
    },
  },
  { timestamps: true }
);

leaveEncashmentSchema.index({ organizationId: 1, employeeId: 1, year: 1 });

module.exports = mongoose.model('LeaveEncashment', leaveEncashmentSchema);
