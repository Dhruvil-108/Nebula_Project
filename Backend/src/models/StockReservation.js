const mongoose = require('mongoose');

const stockReservationSchema = new mongoose.Schema(
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
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'warehouseId is required'],
      index: true,
    },
    reservedQty: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    sourceType: {
      type: String,
      enum: ['requisition', 'equipment_kit', 'work_order', 'manual'],
      default: 'requisition',
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'released', 'expired'],
      default: 'active',
      index: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days reservation TTL
      index: true,
    },
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

stockReservationSchema.index({ organizationId: 1, itemId: 1, warehouseId: 1, status: 1 });

module.exports = mongoose.model('StockReservation', stockReservationSchema);
