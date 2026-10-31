const mongoose = require('mongoose');

const branchLocationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch / Location name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      trim: true,
      uppercase: true,
      maxlength: [30, 'Branch code cannot exceed 30 characters'],
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: 'India',
    },
    timezone: {
      type: String,
      trim: true,
      default: 'Asia/Kolkata',
    },
    isHeadquarters: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

branchLocationSchema.index({ organizationId: 1, code: 1 }, { unique: true });
branchLocationSchema.index({ organizationId: 1, name: 1 });

module.exports = mongoose.model('BranchLocation', branchLocationSchema);
