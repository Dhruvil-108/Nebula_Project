const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    priority: {
      type: String,
      enum: ['normal', 'important', 'urgent'],
      default: 'normal',
      index: true,
    },
    targetDepartments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

announcementSchema.index({ organizationId: 1, priority: 1, publishedAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
