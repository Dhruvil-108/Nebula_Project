const mongoose = require('mongoose');

const warehouseBinSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: [true, 'warehouseId is required'],
      index: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseZone',
      default: null,
      index: true,
    },
    binCode: {
      type: String,
      required: [true, 'Bin code is required'],
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
    },
    capacity: {
      maxWeightKg: { type: Number, default: 0 },
      maxVolumeCubicM: { type: Number, default: 0 },
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

warehouseBinSchema.index({ organizationId: 1, warehouseId: 1, binCode: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseBin', warehouseBinSchema);
