const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    code: {
      type: String,
      required: [true, 'Warehouse code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Warehouse name is required'],
      trim: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'US' },
    },
    contactPerson: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

warehouseSchema.index({ organizationId: 1, code: 1 }, { unique: true });
warehouseSchema.index({ organizationId: 1, active: 1 });

module.exports = mongoose.model('Warehouse', warehouseSchema);
