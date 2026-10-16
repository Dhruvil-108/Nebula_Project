const mongoose = require('mongoose');

const expenseCategorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      trim: true,
      uppercase: true,
    },
    glCode: {
      type: String,
      trim: true,
      default: '',
    },
    icon: {
      type: String,
      default: 'Receipt',
      trim: true,
    },
    color: {
      type: String,
      default: '#f97316',
      trim: true,
    },
    maxClaimLimit: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    isReceiptMandatory: {
      type: Boolean,
      default: true,
    },
    receiptThresholdAmount: {
      type: Number,
      default: 25,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

// Unique category code per organization
expenseCategorySchema.index({ organizationId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('ExpenseCategory', expenseCategorySchema);
