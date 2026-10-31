const mongoose = require('mongoose');

const warehouseZoneSchema = new mongoose.Schema(
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
    code: {
      type: String,
      required: [true, 'Zone code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
    },
    zoneType: {
      type: String,
      enum: ['storage', 'receiving', 'shipping', 'quarantine', 'picking'],
      default: 'storage',
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

warehouseZoneSchema.index({ organizationId: 1, warehouseId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('WarehouseZone', warehouseZoneSchema);
