const mongoose = require('mongoose');

const leaveLedgerSchema = new mongoose.Schema(
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
      index: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getUTCFullYear(),
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        'credit_annual',
        'credit_accrual',
        'debit_leave',
        'credit_compoff',
        'debit_lapse',
        'debit_encashment',
        'manual_adjustment',
      ],
      required: true,
      index: true,
    },
    /**
     * Positive for credit (e.g. +1.5 days accrued, +1 compoff),
     * Negative for debit (e.g. -2 days taken, -3 lapsed).
     */
    days: {
      type: Number,
      required: true,
    },
    balanceBefore: {
      type: Number,
      required: true,
      default: 0,
    },
    balanceAfter: {
      type: Number,
      required: true,
      default: 0,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    referenceType: {
      type: String,
      enum: ['LeaveRequest', 'CompOffGrant', 'LeaveEncashment', 'SystemCron', 'Manual'],
      default: 'Manual',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

leaveLedgerSchema.index({ organizationId: 1, employeeId: 1, year: 1, createdAt: -1 });

module.exports = mongoose.model('LeaveLedger', leaveLedgerSchema);
