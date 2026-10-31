const mongoose = require('mongoose');

const PAYMENT_BATCH_STATUSES = ['draft', 'approved', 'processing', 'paid', 'cancelled'];
const PAYMENT_METHODS = ['bank_transfer', 'payroll', 'company_card', 'cash', 'check'];

const paymentBatchSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'Batch number is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: 'bank_transfer',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    claimsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    claimIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExpenseClaim',
      },
    ],
    status: {
      type: String,
      enum: PAYMENT_BATCH_STATUSES,
      default: 'draft',
      index: true,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    approvedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: Date,
    paidById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paidAt: Date,
    bankReference: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

paymentBatchSchema.index({ organizationId: 1, batchNumber: 1 }, { unique: true });
paymentBatchSchema.index({ organizationId: 1, deletedAt: 1, createdAt: -1 });

module.exports = mongoose.model('PaymentBatch', paymentBatchSchema);
