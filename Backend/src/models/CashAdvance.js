const mongoose = require('mongoose');

const CASH_ADVANCE_STATUSES = [
  'requested',
  'approved',
  'disbursed',
  'partially_settled',
  'settled',
  'rejected',
  'cancelled',
];

const DISBURSEMENT_METHODS = ['bank_transfer', 'cash', 'payroll', 'check'];

const cashAdvanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    advanceNumber: {
      type: String,
      required: [true, 'Advance number is required'],
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee is required'],
      index: true,
    },
    travelRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TravelRequest',
      default: null,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    purpose: {
      type: String,
      required: [true, 'Business purpose is required'],
      trim: true,
    },
    disbursementMethod: {
      type: String,
      enum: DISBURSEMENT_METHODS,
      default: 'bank_transfer',
    },
    disbursedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    settledAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    remainingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: CASH_ADVANCE_STATUSES,
      default: 'requested',
      index: true,
    },
    approval: {
      approvedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: { type: String, default: '', trim: true },
    },
    disbursement: {
      disbursedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      disbursedAt: Date,
      reference: { type: String, default: '', trim: true },
    },
    rejection: {
      rejectedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectedAt: Date,
      reason: { type: String, default: '', trim: true },
    },
    settlementHistory: [
      {
        claimId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseClaim' },
        amount: Number,
        settledAt: { type: Date, default: Date.now },
        notes: String,
      },
    ],
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

cashAdvanceSchema.index({ organizationId: 1, advanceNumber: 1 }, { unique: true });
cashAdvanceSchema.index({ organizationId: 1, employeeId: 1, status: 1 });
cashAdvanceSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('CashAdvance', cashAdvanceSchema);
