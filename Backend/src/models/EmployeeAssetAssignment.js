const mongoose = require('mongoose');

const assignedItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    issuedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    serialNumbers: [
      {
        type: String,
        trim: true,
        uppercase: true,
      },
    ],
    batchNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
    },
    binId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WarehouseBin',
      default: null,
    },
    issuedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['requested', 'issued', 'returned', 'damaged', 'lost'],
      default: 'requested',
    },
    returnDate: {
      type: Date,
      default: null,
    },
    returnCondition: {
      type: String,
      enum: ['good', 'fair', 'damaged', 'unusable'],
      default: 'good',
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: true }
);

const exitChecklistSchema = new mongoose.Schema(
  {
    initiatedAt: {
      type: Date,
      default: null,
    },
    exitDate: {
      type: Date,
      default: null,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { _id: false }
);

const employeeAssetAssignmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    assignmentNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      default: null,
    },
    kitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EquipmentKit',
      default: null,
    },
    requestType: {
      type: String,
      enum: ['onboarding_kit', 'ad_hoc_request', 'replacement'],
      default: 'onboarding_kit',
    },
    status: {
      type: String,
      enum: ['requested', 'allocated', 'issued', 'returned_partial', 'returned_full', 'cancelled'],
      default: 'requested',
      index: true,
    },
    assignedItems: {
      type: [assignedItemSchema],
      default: [],
    },
    exitChecklist: {
      type: exitChecklistSchema,
      default: () => ({ isCompleted: false }),
    },
    stockLedgerPosted: {
      type: Boolean,
      default: false,
    },
    stockMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockMovement',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

employeeAssetAssignmentSchema.index({ organizationId: 1, assignmentNumber: 1 }, { unique: true });
employeeAssetAssignmentSchema.index({ organizationId: 1, employeeId: 1, status: 1 });

module.exports = mongoose.model('EmployeeAssetAssignment', employeeAssetAssignmentSchema);
