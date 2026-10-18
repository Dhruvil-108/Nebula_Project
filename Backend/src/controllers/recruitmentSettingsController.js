const RecruitmentSettings = require('../models/RecruitmentSettings');
const AiRun = require('../models/AiRun');
const queueService = require('../services/queueService');
const { scopedFilter } = require('../middleware/tenant');

/**
 * GET /api/v1/recruitment/settings
 * Retrieves tenant recruitment settings & feature flags (auto-initializing if first access)
 */
exports.getSettings = async (req, res) => {
  try {
    let settings = await RecruitmentSettings.findOne({ organizationId: req.organizationId });

    if (!settings) {
      settings = await RecruitmentSettings.create({
        organizationId: req.organizationId,
        aiEnabled: true,
        aiMonthlyTokenLimit: 500000,
        retentionDays: 365,
      });
    }

    return res.json(settings);
  } catch (err) {
    console.error('[recruitmentSettingsController.getSettings] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve recruitment settings.' });
  }
};

/**
 * PATCH /api/v1/recruitment/settings
 * Updates tenant recruitment settings & feature flags
 */
exports.updateSettings = async (req, res) => {
  try {
    const {
      aiEnabled,
      aiMonthlyTokenLimit,
      retentionDays,
      featureFlags,
      defaultTimezone,
    } = req.body;

    const updates = {};
    if (typeof aiEnabled === 'boolean') updates.aiEnabled = aiEnabled;
    if (typeof aiMonthlyTokenLimit === 'number') updates.aiMonthlyTokenLimit = aiMonthlyTokenLimit;
    if (typeof retentionDays === 'number') updates.retentionDays = Math.max(30, retentionDays);
    if (defaultTimezone) updates.defaultTimezone = defaultTimezone;
    if (featureFlags && typeof featureFlags === 'object') {
      for (const [k, v] of Object.entries(featureFlags)) {
        updates[`featureFlags.${k}`] = Boolean(v);
      }
    }

    const settings = await RecruitmentSettings.findOneAndUpdate(
      { organizationId: req.organizationId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return res.json(settings);
  } catch (err) {
    console.error('[recruitmentSettingsController.updateSettings] Error:', err);
    return res.status(500).json({ error: 'Failed to update recruitment settings.' });
  }
};

/**
 * GET /api/v1/recruitment/ai/runs
 * Retrieves paginated audit log of AI executions for the organization
 */
exports.getAiRuns = async (req, res) => {
  try {
    const { task, limit = 50 } = req.query;
    const filter = { organizationId: req.organizationId };
    if (task) filter.task = task;

    const runs = await AiRun.find(filter)
      .populate('userId', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(Math.min(100, Number(limit)))
      .lean();

    return res.json(runs);
  } catch (err) {
    console.error('[recruitmentSettingsController.getAiRuns] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve AI audit runs.' });
  }
};

/**
 * GET /api/v1/recruitment/queue/dead-letter
 * View dead-letter background jobs (for admins)
 */
exports.getDeadLetterJobs = async (req, res) => {
  try {
    const deadLetter = queueService.getDeadLetterJobs();
    return res.json(deadLetter);
  } catch (err) {
    console.error('[recruitmentSettingsController.getDeadLetterJobs] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve dead-letter queue.' });
  }
};
