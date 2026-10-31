const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
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
    billedQuantity: {
      type: Number,
      required: true,
      min: 0.0001,
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
  },
  { _id: true }
);

const matchDetailSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    itemCode: {
      type: String,
      default: '',
    },
    poQty: {
      type: Number,
      default: 0,
    },
    grnQty: {
      type: Number,
      default: 0,
    },
    invQty: {
      type: Number,
      default: 0,
    },
    poPrice: {
      type: Number,
      default: 0,
    },
    invPrice: {
      type: Number,
      default: 0,
    },
    priceVariancePercent: {
      type: Number,
      default: 0,
    },
    qtyVariancePercent: {
      type: Number,
      default: 0,
    },
    varianceAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['match', 'qty_mismatch', 'price_mismatch', 'tolerance_exceeded'],
      default: 'match',
    },
  },
  { _id: false }
);

const supplierInvoiceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    supplierInvoiceRef: {
      type: String,
      required: true,
      trim: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
    },
    grnIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoodsReceiptNote',
      },
    ],
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    items: {
      type: [invoiceItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    matchingStatus: {
      type: String,
      enum: ['pending', 'matched', 'variance_detected', 'approved_with_variance', 'rejected'],
      default: 'pending',
      index: true,
    },
    threeWayMatch: {
      poMatches: { type: Boolean, default: false },
      grnMatches: { type: Boolean, default: false },
      priceVariance: { type: Number, default: 0 },
      quantityVariance: { type: Number, default: 0 },
      toleranceExceeded: { type: Boolean, default: false },
      details: {
        type: [matchDetailSchema],
        default: [],
      },
    },
    varianceApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    varianceApprovedAt: {
      type: Date,
      default: null,
    },
    varianceApprovalNotes: {
      type: String,
      trim: true,
      default: '',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'paid'],
      default: 'unpaid',
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

supplierInvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
supplierInvoiceSchema.index({ organizationId: 1, poId: 1 });

module.exports = mongoose.model('SupplierInvoice', supplierInvoiceSchema);
