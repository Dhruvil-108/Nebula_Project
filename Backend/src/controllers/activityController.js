const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Deal = require('../models/Deal');
const { scopedFilter } = require('../middleware/tenant');
const { ACTIVITY_TYPES } = require('../models/Activity');

const RELATED_MODELS = {
  lead: Lead,
  contact: Contact,
  company: Company,
  deal: Deal,
};

/**
 * GET /api/v1/crm/activities?relatedToType=&relatedToId=
 * Timeline for any CRM record.
 */
const getActivities = async (req, res) => {
  try {
    const { relatedToType, relatedToId } = req.query;

    if (!relatedToType || !RELATED_MODELS[relatedToType]) {
      return res.status(400).json({ error: 'A valid relatedToType (lead/contact/company/deal) is required.' });
    }
    if (!relatedToId || !mongoose.Types.ObjectId.isValid(relatedToId)) {
      return res.status(400).json({ error: 'A valid relatedToId is required.' });
    }

    const activities = await Activity.find(
      scopedFilter(req, { relatedToType, relatedToId })
    )
      .populate('createdBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.json(activities);
  } catch (err) {
    console.error('[activityController.getActivities] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve activities.' });
  }
};

/**
 * POST /api/v1/crm/activities — log a note/call/email/meeting/task.
 */
const createActivity = async (req, res) => {
  try {
    const { type, relatedToType, relatedToId, content, dueDate } = req.body;

    if (!type || !ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({ error: `Activity type must be one of: ${ACTIVITY_TYPES.join(', ')}.` });
    }
    if (!relatedToType || !RELATED_MODELS[relatedToType]) {
      return res.status(400).json({ error: 'relatedToType must be lead, contact, company, or deal.' });
    }
    if (!relatedToId || !mongoose.Types.ObjectId.isValid(relatedToId)) {
      return res.status(400).json({ error: 'A valid relatedToId is required.' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ error: 'Activity content is required.' });
    }

    // Verify the related record exists within this tenant
    const RelatedModel = RELATED_MODELS[relatedToType];
    const related = await RelatedModel.findOne(
      scopedFilter(req, { _id: relatedToId })
    ).lean();
    if (!related) {
      return res.status(404).json({ error: `Related ${relatedToType} not found.` });
    }

    const activity = await Activity.create({
      organizationId: req.organizationId,
      type,
      relatedToType,
      relatedToId,
      content: String(content).trim(),
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy: req.user._id,
    });

    const populated = await Activity.findById(activity._id)
      .populate('createdBy', 'fullName email role')
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[activityController.createActivity] Error:', err);
    return res.status(500).json({ error: 'Failed to log activity.' });
  }
};

/**
 * PATCH /api/v1/crm/activities/:id — e.g. mark a task completedAt.
 */
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid activity id.' });
    }

    const updates = {};
    if (req.body.completedAt !== undefined) {
      updates.completedAt = req.body.completedAt ? new Date(req.body.completedAt) : null;
    }
    if (req.body.dueDate !== undefined) {
      updates.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }
    if (req.body.content !== undefined) {
      if (!String(req.body.content).trim()) {
        return res.status(400).json({ error: 'Activity content cannot be empty.' });
      }
      updates.content = String(req.body.content).trim();
    }

    const activity = await Activity.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true }
    )
      .populate('createdBy', 'fullName email role')
      .lean();

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found.' });
    }

    return res.json(activity);
  } catch (err) {
    console.error('[activityController.updateActivity] Error:', err);
    return res.status(500).json({ error: 'Failed to update activity.' });
  }
};

module.exports = { getActivities, createActivity, updateActivity };
