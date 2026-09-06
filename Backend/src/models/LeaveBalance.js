const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
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
    allocated: {
      type: Number,
      default: 0,
    },
    used: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

leaveBalanceSchema.virtual('remaining').get(function () {
  return Math.max(0, (this.allocated || 0) - (this.used || 0));
});

leaveBalanceSchema.index(
  { organizationId: 1, employeeId: 1, leaveTypeId: 1, year: 1 },
  { unique: true }
);

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);
