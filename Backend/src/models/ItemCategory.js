const mongoose = require('mongoose');

const itemCategorySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      trim: true,
      uppercase: true,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ItemCategory',
      default: null,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
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

// Compound index guaranteeing uniqueness of category code per organization
itemCategorySchema.index({ organizationId: 1, code: 1 }, { unique: true });
itemCategorySchema.index({ organizationId: 1, parentId: 1 });

module.exports = mongoose.model('ItemCategory', itemCategorySchema);
