const mongoose = require('mongoose');

const attendanceRegularizationSchema = new mongoose.Schema(
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
    date: {
      type: Date,
      required: true, // Midnight UTC of the attendance date
    },
    type: {
      type: String,
      enum: ['missed_check_in', 'missed_check_out', 'incorrect_hours', 'outdoor_duty', 'work_from_home'],
      required: true,
    },
    requestedCheckInAt: {
      type: Date,
      default: null,
    },
    requestedCheckOutAt: {
      type: Date,
      default: null,
    },
    reason: {
      type: String,
      required: [true, 'Reason for regularization is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    approvalInstanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApprovalInstance',
      default: null,
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
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

attendanceRegularizationSchema.index({ organizationId: 1, employeeId: 1, date: 1 });

module.exports = mongoose.model('AttendanceRegularization', attendanceRegularizationSchema);
