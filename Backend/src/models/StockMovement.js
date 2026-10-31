const mongoose = require('mongoose');

const stockMovementLineSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    requestedQty: {
      type: Number,
      required: true,
      min: 0.0001,
    },
    actualQty: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    sourceBinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    destinationBinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    batchNumber: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    serialNumbers: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const stockMovementSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    movementNumber: {
      type: String,
      required: [true, 'movementNumber is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: ['receipt', 'issue', 'transfer', 'adjustment', 'cycle_count'],
      required: [true, 'movementType is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'approved', 'in_transit', 'completed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    sourceWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
    destinationWarehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    reasonCode: {
      type: String,
      enum: [
        '',
        'po_receipt',
        'internal_use',
        'project_issue',
        'equipment_assignment',
        'warehouse_transfer',
        'damaged',
        'spoilage',
        'shrinkage',
        'cycle_count_variance',
        'write_off',
        'reversal',
      ],
      default: '',
    },
    lines: [stockMovementLineSchema],
    totalQuantity: {
      type: Number,
      default: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PurchaseOrder',
      default: null,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

stockMovementSchema.index({ organizationId: 1, movementNumber: 1 }, { unique: true });
stockMovementSchema.index({ organizationId: 1, status: 1 });
stockMovementSchema.index({ organizationId: 1, movementType: 1 });

module.exports = mongoose.model('StockMovement', stockMovementSchema);
