const mongoose = require('mongoose');

const DOC_TYPES = ['id_proof', 'certificate', 'offer_letter', 'contract', 'other'];

const employeeDocumentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'employeeId is required'],
      index: true,
    },
    docType: {
      type: String,
      enum: {
        values: DOC_TYPES,
        message: '{VALUE} is not a valid document type',
      },
      default: 'other',
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
      trim: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'uploadedBy is required'],
    },
  },
  { timestamps: true }
);

employeeDocumentSchema.index({ organizationId: 1, employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
module.exports.DOC_TYPES = DOC_TYPES;
