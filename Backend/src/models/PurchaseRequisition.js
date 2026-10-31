const mongoose = require('mongoose');

const purchaseRequisitionItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    uom: {
      type: String,
      trim: true,
      default: 'PCS',
    },
    estimatedUnitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const approvalTierSchema = new mongoose.Schema(
  {
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    comments: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { _id: false }
);

const purchaseRequisitionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    requisitionNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    requiredDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'manager_approved',
        'approved',
        'rejected',
        'converted_to_po',
        'cancelled',
      ],
      default: 'draft',
      index: true,
    },
    items: {
      type: [purchaseRequisitionItemSchema],
      default: [],
    },
    totalEstimatedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    managerApproval: {
      type: approvalTierSchema,
      default: () => ({ status: 'pending' }),
    },
    procurementApproval: {
      type: approvalTierSchema,
      default: () => ({ status: 'pending' }),
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    convertedPoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

purchaseRequisitionSchema.index({ organizationId: 1, requisitionNumber: 1 }, { unique: true });
purchaseRequisitionSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PurchaseRequisition', purchaseRequisitionSchema);
