const mongoose = require('mongoose');

const stockLedgerSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    transactionType: {
      type: String,
      enum: [
        'receipt', // Goods Receipt Note (GRN) inbound
        'issue', // Consumption, dispatch, or assignment
        'transfer_out', // Dispatched from source warehouse (moves to in-transit)
        'transfer_in', // Received at destination warehouse from in-transit
        'adjustment_in', // Positive correction/count surplus
        'adjustment_out', // Negative correction/count shrinkage/damaged
        'cycle_count_variance', // Physical count reconciliation
        'reversal', // Compensating entry reversing an erroneous transaction
      ],
      required: [true, 'transactionType is required'],
      index: true,
    },
    documentNumber: {
      type: String,
      required: [true, 'documentNumber is required'],
      trim: true,
      uppercase: true,
      index: true,
    },
    movementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockMovement',
      default: null,
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
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
      index: true,
    },
    batchNumber: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
      index: true,
    },
    serialNumber: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
      index: true,
    },
    /**
     * Signed quantity:
     * Positive (+) for stock inflows (receipt, transfer_in, adjustment_in)
     * Negative (-) for stock outflows (issue, transfer_out, adjustment_out)
     */
    quantity: {
      type: Number,
      required: [true, 'quantity is required'],
    },
    unitCost: {
      type: Number,
      required: [true, 'unitCost is required'],
      min: 0,
    },
    totalCost: {
      type: Number,
      required: [true, 'totalCost is required'],
    },
    valuationMethod: {
      type: String,
      enum: ['fifo', 'weighted_average'],
      default: 'fifo',
    },
    runningBalanceQty: {
      type: Number,
      default: 0,
    },
    runningValuation: {
      type: Number,
      default: 0,
    },
    reversalOfLedgerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockLedger',
      default: null,
    },
    isReversed: {
      type: Boolean,
      default: false,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
    // Ledger rows are immutable; disable Mongoose versionKey
    versionKey: false,
  }
);

stockLedgerSchema.index({ organizationId: 1, itemId: 1, warehouseId: 1, createdAt: 1 });
stockLedgerSchema.index({ organizationId: 1, documentNumber: 1 });
stockLedgerSchema.index({ organizationId: 1, transactionType: 1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
