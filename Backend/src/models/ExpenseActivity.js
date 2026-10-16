const mongoose = require('mongoose');

const expenseActivitySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseClaim',
      required: [true, 'claimId is required'],
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'actorId is required'],
    },
    action: {
      type: String,
      enum: [
        'created',
        'submitted',
        'manager_approved',
        'finance_approved',
        'rejected',
        'reimbursed',
        'cancelled',
        'item_added',
        'item_updated',
        'receipt_scanned',
        'comment_added',
      ],
      required: [true, 'action is required'],
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ExpenseActivity', expenseActivitySchema);
