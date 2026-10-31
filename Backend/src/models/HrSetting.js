const mongoose = require('mongoose');

const hrSettingSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    // Working hours & shift policies
    workWeekDays: {
      type: [Number], // 0 = Sunday, 1 = Monday, ... 6 = Saturday
      default: [1, 2, 3, 4, 5],
    },
    defaultShiftStartTime: {
      type: String,
      default: '09:30',
      trim: true,
    },
    defaultShiftEndTime: {
      type: String,
      default: '18:30',
      trim: true,
    },
    gracePeriodMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 120,
    },
    halfDayHours: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 12,
    },
    fullDayHours: {
      type: Number,
      default: 8.0,
      min: 1,
      max: 16,
    },
    // Attendance & Geo
    allowWebClockIn: {
      type: Boolean,
      default: true,
    },
    enableGeofencing: {
      type: Boolean,
      default: false,
    },
    geofenceRadiusMeters: {
      type: Number,
      default: 200,
    },
    // Leave & Approvals
    allowSelfRegularization: {
      type: Boolean,
      default: true,
    },
    leaveYearStartMonth: {
      type: Number, // 1 = Jan, 4 = April (Financial Year)
      default: 1,
    },
    sandwichLeaveRule: {
      type: Boolean, // Count weekends/holidays falling between leaves as leave
      default: false,
    },
    // Notifications & Alerting
    notifyManagerOnLeaveRequest: {
      type: Boolean,
      default: true,
    },
    notifyEmployeeOnApproval: {
      type: Boolean,
      default: true,
    },
    notifyOnLateArrival: {
      type: Boolean,
      default: false,
    },
    // AI & Intelligence
    aiCopilotEnabled: {
      type: Boolean,
      default: true,
    },
    aiAutomatedScreening: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HrSetting', hrSettingSchema);
