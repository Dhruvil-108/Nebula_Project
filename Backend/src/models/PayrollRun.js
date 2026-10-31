const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    runCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['draft', 'processing', 'reviewed', 'approved', 'paid', 'cancelled'],
      default: 'draft',
      index: true,
    },
    totalEmployees: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalGrossPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalNetPay: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalLopDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    paymentDate: {
      type: Date,
      default: null,
    },
    paymentReference: {
      type: String,
      trim: true,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

payrollRunSchema.index({ organizationId: 1, year: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('PayrollRun', payrollRunSchema);
