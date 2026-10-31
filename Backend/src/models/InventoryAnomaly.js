const mongoose = require('mongoose');

const inventoryAnomalySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    anomalyType: {
      type: String,
      required: true,
      enum: [
        'shrinkage_spike',
        'price_spike',
        'duplicate_receipt',
        'dead_stock',
        'stockout_risk',
        'unusual_adjustment',
      ],
      index: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'warning',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      default: null,
      index: true,
    },
    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['open', 'acknowledged', 'dismissed', 'resolved'],
      default: 'open',
      index: true,
    },
    userFeedback: {
      type: String,
      enum: ['none', 'confirmed_issue', 'false_positive'],
      default: 'none',
    },
    feedbackNote: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

inventoryAnomalySchema.index({ organizationId: 1, anomalyType: 1, status: 1 });
inventoryAnomalySchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('InventoryAnomaly', inventoryAnomalySchema);
