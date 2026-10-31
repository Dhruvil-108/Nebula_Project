const mongoose = require('mongoose');

const stockBatchSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: [true, 'itemId is required'],
      index: true,
    },
    batchNumber: {
      type: String,
      required: [true, 'batchNumber is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'warehouseId is required'],
      index: true,
    },
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    manufactureDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
      index: true,
    },
    initialQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    costPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'quarantined', 'expired', 'depleted'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

stockBatchSchema.index(
  { organizationId: 1, itemId: 1, batchNumber: 1, warehouseId: 1 },
  { unique: true }
);

module.exports = mongoose.model('StockBatch', stockBatchSchema);
