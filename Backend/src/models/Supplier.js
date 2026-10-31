const mongoose = require('mongoose');

const itemPriceSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    supplierPartNumber: {
      type: String,
      default: '',
      trim: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    minOrderQty: {
      type: Number,
      default: 1,
      min: 1,
    },
    leadTimeDays: {
      type: Number,
      default: 7,
      min: 0,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const supplierSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    supplierCode: {
      type: String,
      required: [true, 'Supplier code is required'],
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    contactPerson: {
      name: { type: String, default: '' },
      email: { type: String, default: '', lowercase: true, trim: true },
      phone: { type: String, default: '' },
    },
    taxDetails: {
      taxId: { type: String, default: '', trim: true }, // GSTIN / Tax ID
      panNumber: { type: String, default: '', trim: true },
      vatNumber: { type: String, default: '', trim: true },
    },
    paymentTerms: {
      paymentTermDays: { type: Number, default: 30, min: 0 },
      paymentMethod: {
        type: String,
        enum: ['net_30', 'net_15', 'net_60', 'due_on_receipt', 'advance', 'eom'],
        default: 'net_30',
      },
    },
    leadTimeDays: {
      type: Number,
      default: 7,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'US' },
    },
    itemPriceList: [itemPriceSchema],
    rating: {
      score: { type: Number, default: 5.0, min: 1, max: 5 },
      totalOrders: { type: Number, default: 0 },
      onTimeDeliveryRate: { type: Number, default: 100 }, // percentage
      rejectionRate: { type: Number, default: 0 }, // percentage
      priceStabilityScore: { type: Number, default: 100 },
      leadTimeVarianceDays: { type: Number, default: 0 },
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

supplierSchema.index({ organizationId: 1, supplierCode: 1 }, { unique: true });
supplierSchema.index({ organizationId: 1, name: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
