const mongoose = require('mongoose');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const { scopedFilter } = require('../middleware/tenant');
const { DEAL_STAGES } = require('../models/Deal');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SALES_FIELDS = 'fullName email role';

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/deals — list with stage/salesperson filters
// ─────────────────────────────────────────────────────────
const getDeals = async (req, res) => {
  try {
    const { stage, salesperson, search } = req.query;
    const extra = {};

    if (stage && DEAL_STAGES.includes(stage)) extra.stage = stage;
    if (salesperson) {
      if (!mongoose.Types.ObjectId.isValid(salesperson)) {
        return res.status(400).json({ error: 'Invalid salesperson id.' });
      }
      extra.salesperson = salesperson;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.dealName = rx;
    }

    const deals = await Deal.find(scopedFilter(req, extra))
      .populate('companyId', 'name')
      .populate('contactId', 'fullName')
      .populate('salesperson', SALES_FIELDS)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json(deals);
  } catch (err) {
    console.error('[dealController.getDeals] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve deals.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/deals/pipeline — Kanban payload grouped by stage
// NOTE: must be declared before '/:id' in crmRoutes.
// ─────────────────────────────────────────────────────────
const getDealPipeline = async (req, res) => {
  try {
    const deals = await Deal.find(scopedFilter(req))
      .populate('companyId', 'name')
      .populate('contactId', 'fullName')
      .populate('salesperson', SALES_FIELDS)
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    const grouped = {};
    for (const stage of DEAL_STAGES) {
      grouped[stage] = [];
    }
    for (const deal of deals) {
      grouped[deal.stage] = grouped[deal.stage] || [];
      grouped[deal.stage].push(deal);
    }

    return res.json(grouped);
  } catch (err) {
    console.error('[dealController.getDealPipeline] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve pipeline.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/crm/deals
// ─────────────────────────────────────────────────────────
const createDeal = async (req, res) => {
  try {
    const { dealName, companyId, contactId, amount, probability, expectedCloseDate, stage, salesperson } = req.body;

    if (!dealName || !String(dealName).trim()) {
      return res.status(400).json({ error: 'Deal name is required.' });
    }
    if (amount === undefined || amount === null || Number.isNaN(Number(amount)) || Number(amount) < 0) {
      return res.status(400).json({ error: 'A valid non-negative deal amount is required.' });
    }
    for (const [field, value] of [['companyId', companyId], ['contactId', contactId], ['salesperson', salesperson]]) {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ error: `Invalid ${field}.` });
      }
    }

    const deal = await Deal.create({
      organizationId: req.organizationId,
      dealName: String(dealName).trim(),
      companyId: companyId || null,
      contactId: contactId || null,
      amount: Number(amount),
      probability: Math.min(100, Math.max(0, Number(probability) || 0)),
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
      stage: DEAL_STAGES.includes(stage) ? stage : 'new',
      salesperson: salesperson || req.user._id,
    });

    const populated = await Deal.findById(deal._id)
      .populate('companyId', 'name')
      .populate('contactId', 'fullName')
      .populate('salesperson', SALES_FIELDS)
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[dealController.createDeal] Error:', err);
    return res.status(500).json({ error: 'Failed to create deal.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/deals/:id — detail + activity timeline
// ─────────────────────────────────────────────────────────
const getDealById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid deal id.' });
    }

    const deal = await Deal.findOne(scopedFilter(req, { _id: id }))
      .populate('companyId', 'name industry website')
      .populate('contactId', 'fullName email phone')
      .populate('salesperson', SALES_FIELDS)
      .lean();

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    const activities = await Activity.find(scopedFilter(req, { relatedToType: 'deal', relatedToId: id }))
      .populate('createdBy', SALES_FIELDS)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return res.json({ ...deal, activities });
  } catch (err) {
    console.error('[dealController.getDealById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve deal.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/crm/deals/:id — includes drag-and-drop stage moves
// ─────────────────────────────────────────────────────────
const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid deal id.' });
    }

    const allowedFields = ['dealName', 'companyId', 'contactId', 'amount', 'probability', 'expectedCloseDate', 'stage', 'salesperson'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    }

    if (updates.stage !== undefined && !DEAL_STAGES.includes(updates.stage)) {
      return res.status(400).json({ error: 'Invalid deal stage.' });
    }
    if (updates.amount !== undefined && (Number.isNaN(Number(updates.amount)) || Number(updates.amount) < 0)) {
      return res.status(400).json({ error: 'Deal amount must be a non-negative number.' });
    }
    if (updates.probability !== undefined) {
      updates.probability = Math.min(100, Math.max(0, Number(updates.probability) || 0));
    }
    if (updates.expectedCloseDate !== undefined) {
      updates.expectedCloseDate = updates.expectedCloseDate ? new Date(updates.expectedCloseDate) : null;
    }
    // Explicit nulls clear optional links
    for (const field of ['companyId', 'contactId']) {
      if (req.body[field] === null) updates[field] = null;
    }

    const deal = await Deal.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('companyId', 'name')
      .populate('contactId', 'fullName')
      .populate('salesperson', SALES_FIELDS)
      .lean();

    if (!deal) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    return res.json(deal);
  } catch (err) {
    console.error('[dealController.updateDeal] Error:', err);
    return res.status(500).json({ error: 'Failed to update deal.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/crm/deals/:id
// ─────────────────────────────────────────────────────────
const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid deal id.' });
    }

    const deal = await Deal.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found.' });
    }

    await Activity.deleteMany(scopedFilter(req, { relatedToType: 'deal', relatedToId: id }));

    return res.json({ message: 'Deal deleted successfully.' });
  } catch (err) {
    console.error('[dealController.deleteDeal] Error:', err);
    return res.status(500).json({ error: 'Failed to delete deal.' });
  }
};

module.exports = {
  getDeals,
  getDealPipeline,
  createDeal,
  getDealById,
  updateDeal,
  deleteDeal,
};
