const mongoose = require('mongoose');

const rtvItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
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
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    totalAmount: {
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
    reasonCode: {
      type: String,
      enum: ['defective', 'excess', 'damaged_in_transit', 'wrong_specification', 'expired', 'other'],
      default: 'defective',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const returnToVendorSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    returnNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    debitNoteNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
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
      default: null,
    },
    grnId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GoodsReceiptNote',
      default: null,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'approved', 'dispatched', 'completed', 'cancelled'],
      default: 'draft',
      index: true,
    },
    items: {
      type: [rtvItemSchema],
      default: [],
    },
    totalDebitAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    stockLedgerPosted: {
      type: Boolean,
      default: false,
    },
    stockMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockMovement',
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
    dispatchedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dispatchedAt: {
      type: Date,
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

returnToVendorSchema.index({ organizationId: 1, returnNumber: 1 }, { unique: true });
returnToVendorSchema.index({ organizationId: 1, debitNoteNumber: 1 }, { unique: true });

module.exports = mongoose.model('ReturnToVendor', returnToVendorSchema);
