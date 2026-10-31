const mongoose = require('mongoose');

const poItemSchema = new mongoose.Schema(
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
    orderedQuantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    invoicedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    uom: {
      type: String,
      trim: true,
      default: 'PCS',
    },
  },
  { _id: true }
);

const poAmendmentSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
    },
    amendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amendedAt: {
      type: Date,
      default: Date.now,
    },
    changesSummary: {
      type: String,
      trim: true,
      required: true,
    },
    previousGrandTotal: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const poApprovalTierSchema = new mongoose.Schema(
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

const purchaseOrderSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    poNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    requisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseRequisition',
      default: null,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    expectedDeliveryDate: {
      type: Date,
      default: null,
    },
    paymentTerms: {
      type: String,
      trim: true,
      default: 'Net 30',
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    status: {
      type: String,
      enum: [
        'draft',
        'pending_approval',
        'approved',
        'ordered',
        'partially_received',
        'received',
        'billed',
        'closed',
        'cancelled',
      ],
      default: 'draft',
      index: true,
    },
    items: {
      type: [poItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    managerApproval: {
      type: poApprovalTierSchema,
      default: () => ({ status: 'pending' }),
    },
    procurementApproval: {
      type: poApprovalTierSchema,
      default: () => ({ status: 'pending' }),
    },
    version: {
      type: Number,
      default: 1,
    },
    amendments: {
      type: [poAmendmentSchema],
      default: [],
    },
    emailedToSupplierAt: {
      type: Date,
      default: null,
    },
    emailedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    closureReason: {
      type: String,
      trim: true,
      default: '',
    },
    closedAt: {
      type: Date,
      default: null,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: 'Standard delivery and commercial terms apply.',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });
purchaseOrderSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
