const mongoose = require('mongoose');

const grnItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    poItemId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    orderedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    receivedQuantity: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    acceptedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    rejectedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    batchNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    serialNumbers: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const goodsReceiptNoteSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    grnNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      required: true,
      index: true,
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
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deliveryChallanNumber: {
      type: String,
      trim: true,
      default: '',
    },
    deliveryChallanDate: {
      type: Date,
      default: null,
    },
    carrier: {
      type: String,
      trim: true,
      default: '',
    },
    trackingNumber: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'inspected', 'posted_to_ledger', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: {
      type: [grnItemSchema],
      default: [],
    },
    stockLedgerPosted: {
      type: Boolean,
      default: false,
      index: true,
    },
    stockMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockMovement',
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

goodsReceiptNoteSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });
goodsReceiptNoteSchema.index({ organizationId: 1, poId: 1, status: 1 });

module.exports = mongoose.model('GoodsReceiptNote', goodsReceiptNoteSchema);
