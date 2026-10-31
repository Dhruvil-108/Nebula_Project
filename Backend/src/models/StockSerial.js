const mongoose = require('mongoose');

const stockSerialSchema = new mongoose.Schema(
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
    serialNumber: {
      type: String,
      required: [true, 'serialNumber is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    currentWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
    currentBinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    status: {
      type: String,
      enum: ['in_stock', 'issued', 'in_transit', 'damaged', 'returned'],
      default: 'in_stock',
      index: true,
    },
    cost: {
      type: Number,
      default: 0,
    },
    batchNumber: {
      type: String,
      default: '',
      trim: true,
    },
    issuedToUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    issuedToDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    warrantyExpiryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

stockSerialSchema.index(
  { organizationId: 1, itemId: 1, serialNumber: 1 },
  { unique: true }
);

module.exports = mongoose.model('StockSerial', stockSerialSchema);
