const { getRecentNotifications, registerWebhook, EVENT_TYPES } = require('../services/expenseNotificationService');

/**
 * Controller for Expense Notifications & Webhook Management (Phase 5)
 */
async function getNotifications(req, res) {
  try {
    const orgId = req.organizationId;
    const userId = req.user?._id;
    const items = getRecentNotifications(orgId, userId);
    return res.status(200).json({ success: true, data: items });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function createWebhook(req, res) {
  try {
    const orgId = req.organizationId;
    const { url, secret, events } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: 'Webhook URL is required' });
    }
    const result = registerWebhook(orgId, { url, secret, events });
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

async function getAvailableEvents(req, res) {
  try {
    return res.status(200).json({ success: true, data: Object.values(EVENT_TYPES) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getNotifications,
  createWebhook,
  getAvailableEvents,
};
