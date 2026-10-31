const mongoose = require('mongoose');

const breakSchema = new mongoose.Schema(
  {
    breakInAt: {
      type: Date,
      required: true,
    },
    breakOutAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const attendanceRecordSchema = new mongoose.Schema(
  {
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
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      // Stored as midnight UTC for the day
    },
    checkInAt: {
      type: Date,
      default: null,
    },
    checkOutAt: {
      type: Date,
      default: null,
    },
    breaks: [breakSchema],
    status: {
      type: String,
      enum: ['present', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend'],
      default: 'present',
    },
    totalWorkedMinutes: {
      type: Number,
      default: 0,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shift',
      default: null,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    isRegularized: {
      type: Boolean,
      default: false,
    },
    regularizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceRegularization',
      default: null,
    },
  },
  { timestamps: true }
);

// Compound unique index — one record per employee per day
attendanceRecordSchema.index(
  { organizationId: 1, employeeId: 1, date: 1 },
  { unique: true }
);

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
