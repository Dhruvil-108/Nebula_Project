const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    fullName: {
      type: String,
      required: [true, 'Contact full name is required'],
      trim: true,
      maxlength: [200, 'Contact name cannot exceed 200 characters'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

contactSchema.index({ organizationId: 1, owner: 1 });
contactSchema.index({ organizationId: 1, companyId: 1 });
contactSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('Contact', contactSchema);
