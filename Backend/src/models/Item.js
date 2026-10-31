const mongoose = require('mongoose');

const uomConversionSchema = new mongoose.Schema(
  {
    uom: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    conversionFactor: {
      type: Number,
      required: true,
      min: 0.0001,
      // e.g., 1 BOX = 12 PCS -> conversionFactor is 12 (1 foreign UoM = 12 base UoM)
    },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    options: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Item SKU / code is required'],
      trim: true,
      uppercase: true,
    },
    barcode: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItemCategory',
      default: null,
      index: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    baseUom: {
      type: String,
      required: [true, 'Base Unit of Measure is required'],
      default: 'PCS',
      trim: true,
      uppercase: true,
    },
    uomConversions: [uomConversionSchema],
    trackingType: {
      type: String,
      enum: ['none', 'batch', 'serial'],
      default: 'none',
      index: true,
    },
    hasExpiry: {
      type: Boolean,
      default: false,
    },
    shelfLifeDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxStockLevel: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderPoint: {
      type: Number,
      default: 0,
      min: 0,
    },
    reorderQuantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    standardCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    reorderLevel: {
      type: Number,
      default: 0,
    },
    safetyStock: {
      type: Number,
      default: 0,
    },
    leadTimeDays: {
      type: Number,
      default: 7,
    },
    unitOfMeasure: {
      type: String,
      default: 'pcs',
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    valuationMethod: {
      type: String,
      enum: ['fifo', 'weighted_average'],
      default: 'fifo',
    },
    images: [
      {
        url: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],
    variants: [variantSchema],
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    defaultWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    defaultBinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    preferredSupplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
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

itemSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
itemSchema.index({ organizationId: 1, name: 1 });
itemSchema.index({ organizationId: 1, trackingType: 1 });
itemSchema.index({ organizationId: 1, categoryId: 1 });

module.exports = mongoose.model('Item', itemSchema);
