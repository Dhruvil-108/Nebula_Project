const mongoose = require('mongoose');

const ACTIVITY_TYPES = ['note', 'call', 'email', 'meeting', 'task'];
const ACTIVITY_RELATED_TYPES = ['lead', 'contact', 'company', 'deal'];

const activitySchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'organizationId is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ACTIVITY_TYPES,
        message: '{VALUE} is not a valid activity type',
      },
      required: [true, 'Activity type is required'],
    },
    relatedToType: {
      type: String,
      enum: {
        values: ACTIVITY_RELATED_TYPES,
        message: '{VALUE} is not a valid related record type',
      },
      required: [true, 'relatedToType is required'],
    },
    relatedToId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'relatedToId is required'],
    },
    content: {
      type: String,
      required: [true, 'Activity content is required'],
      trim: true,
      maxlength: [5000, 'Activity content cannot exceed 5000 characters'],
    },
    // For type "task"
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  { timestamps: true }
);

activitySchema.index({ organizationId: 1, relatedToType: 1, relatedToId: 1, createdAt: -1 });
activitySchema.index({ organizationId: 1, createdBy: 1 });

module.exports = mongoose.model('Activity', activitySchema);
module.exports.ACTIVITY_TYPES = ACTIVITY_TYPES;
module.exports.ACTIVITY_RELATED_TYPES = ACTIVITY_RELATED_TYPES;
