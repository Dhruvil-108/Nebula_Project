const mongoose = require('mongoose');

const delegationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'fromUserId (Delegator) is required'],
      index: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'toUserId (Delegatee) is required'],
      index: true,
    },
    startsAt: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endsAt: {
      type: Date,
      required: [true, 'End date is required'],
    },
    scope: {
      type: String,
      enum: ['all', 'expenses_only'],
      default: 'expenses_only',
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

delegationSchema.index({ organizationId: 1, fromUserId: 1, active: 1, startsAt: 1, endsAt: 1 });

module.exports = mongoose.model('Delegation', delegationSchema);
