const mongoose = require('mongoose');

const compOffGrantSchema = new mongoose.Schema(
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
    attendanceRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceRecord',
      default: null,
    },
    workDate: {
      type: Date,
      required: true,
    },
    overtimeMinutes: {
      type: Number,
      required: true,
      min: 60, // Minimum 1 hour overtime to claim comp-off
    },
    grantedDays: {
      type: Number,
      required: true,
      enum: [0.5, 1.0],
      default: 1.0,
    },
    reason: {
      type: String,
      required: [true, 'Reason or work summary is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'availed', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days validity
      index: true,
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

compOffGrantSchema.index({ organizationId: 1, employeeId: 1, status: 1 });

module.exports = mongoose.model('CompOffGrant', compOffGrantSchema);
