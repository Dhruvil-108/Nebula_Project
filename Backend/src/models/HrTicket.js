const mongoose = require('mongoose');

const ticketCommentSchema = new mongoose.Schema(
  {
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
    isInternal: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const hrTicketSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    ticketCode: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['payroll', 'benefits', 'workplace', 'it_equipment', 'policy', 'general'],
      default: 'general',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comments: [ticketCommentSchema],
    resolutionNotes: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

hrTicketSchema.index({ organizationId: 1, ticketCode: 1 }, { unique: true });
hrTicketSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('HrTicket', hrTicketSchema);
