const mongoose = require('mongoose');

const leaveTypeSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Leave type name is required'],
      trim: true,
    },
    annualQuota: {
      type: Number,
      default: 0,
    },
    carryForward: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

leaveTypeSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('LeaveType', leaveTypeSchema);
