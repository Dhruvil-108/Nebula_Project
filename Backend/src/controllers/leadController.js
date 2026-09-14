const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const { scopedFilter } = require('../middleware/tenant');
const { PIPELINE_STAGES } = require('../models/Lead');

const OWNER_FIELDS = 'fullName email role';

// ─────────────────────────────────────────────────────────
// Shared pipeline helpers (also used by activity timelines)
// ─────────────────────────────────────────────────────────
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildActivityTimeline = async (organizationId, relatedToType, relatedToId) => {
  return Activity.find({ organizationId, relatedToType, relatedToId })
    .populate('createdBy', OWNER_FIELDS)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/leads
// ─────────────────────────────────────────────────────────
const getLeads = async (req, res) => {
  try {
    const { status, owner, source, search } = req.query;
    const extra = {};

    if (status && PIPELINE_STAGES.includes(status)) extra.status = status;
    if (owner) {
      if (!mongoose.Types.ObjectId.isValid(owner)) {
        return res.status(400).json({ error: 'Invalid owner id.' });
      }
      extra.owner = owner;
    }
    if (source) {
      const { LEAD_SOURCES } = require('../models/Lead');
      if (!LEAD_SOURCES.includes(source)) {
        return res.status(400).json({ error: 'Invalid source filter.' });
      }
      extra.source = source;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ leadName: rx }, { company: rx }, { email: rx }];
    }

    const leads = await Lead.find(scopedFilter(req, extra))
      .populate('owner', OWNER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json(leads);
  } catch (err) {
    console.error('[leadController.getLeads] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve leads.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/crm/leads
// ─────────────────────────────────────────────────────────
const createLead = async (req, res) => {
  try {
    const { leadName, company, email, phone, source, industry, status, owner, notes } = req.body;

    if (!leadName || !String(leadName).trim()) {
      return res.status(400).json({ error: 'Lead name is required.' });
    }

    const lead = await Lead.create({
      organizationId: req.organizationId,
      leadName: String(leadName).trim(),
      company: company ? String(company).trim() : '',
      email: email ? String(email).trim().toLowerCase() : '',
      phone: phone ? String(phone).trim() : '',
      source: source || 'other',
      industry: industry ? String(industry).trim() : '',
      status: PIPELINE_STAGES.includes(status) ? status : 'new',
      owner: owner || req.user._id,
      notes: notes ? String(notes).trim() : '',
    });

    const populated = await Lead.findById(lead._id).populate('owner', OWNER_FIELDS).lean();
    return res.status(201).json(populated);
  } catch (err) {
    console.error('[leadController.createLead] Error:', err);
    return res.status(500).json({ error: 'Failed to create lead.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/leads/:id — detail + activity timeline
// ─────────────────────────────────────────────────────────
const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid lead id.' });
    }

    const lead = await Lead.findOne(scopedFilter(req, { _id: id }))
      .populate('owner', OWNER_FIELDS)
      .lean();

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    const activities = await buildActivityTimeline(req.organizationId, 'lead', lead._id);

    return res.json({ ...lead, activities });
  } catch (err) {
    console.error('[leadController.getLeadById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve lead.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/crm/leads/:id
// ─────────────────────────────────────────────────────────
const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid lead id.' });
    }

    const allowedFields = ['leadName', 'company', 'email', 'phone', 'source', 'industry', 'status', 'owner', 'notes'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] =
          field === 'email' && req.body[field]
            ? String(req.body[field]).trim().toLowerCase()
            : typeof req.body[field] === 'string'
              ? req.body[field].trim()
              : req.body[field];
      }
    }

    if (updates.status !== undefined && !PIPELINE_STAGES.includes(updates.status)) {
      return res.status(400).json({ error: 'Invalid lead status.' });
    }

    const lead = await Lead.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('owner', OWNER_FIELDS)
      .lean();

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    return res.json(lead);
  } catch (err) {
    console.error('[leadController.updateLead] Error:', err);
    return res.status(500).json({ error: 'Failed to update lead.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/crm/leads/:id
// ─────────────────────────────────────────────────────────
const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid lead id.' });
    }

    const lead = await Lead.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found.' });
    }

    // Cascade-delete activities attached to this lead
    await Activity.deleteMany(scopedFilter(req, { relatedToType: 'lead', relatedToId: id }));

    return res.json({ message: 'Lead deleted successfully.' });
  } catch (err) {
    console.error('[leadController.deleteLead] Error:', err);
    return res.status(500).json({ error: 'Failed to delete lead.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/crm/leads/:id/convert
// Atomic: Contact + (Company if new) + Deal; lead → status "won".
// Mirrors the signup pattern: try a Mongo transaction, fall back to
// sequential writes with manual cleanup on standalone instances.
// ─────────────────────────────────────────────────────────
const convertLead = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid lead id.' });
  }

  const organizationId = req.organizationId;
  const userId = req.user._id;
  const dealAmount = Number(req.body?.dealAmount) || 0;

  // Tracks created docs so the non-transactional fallback can manually roll back
  const created = { companyId: null, contactId: null, dealId: null };

  const runConversion = async (session) => {
    const opts = session ? { session } : {};

    const lead = await Lead.findOne({ _id: id, organizationId }).session(session || null);
    if (!lead) {
      const e = new Error('Lead not found.');
      e.status = 404;
      throw e;
    }
    if (lead.status === 'won' || lead.status === 'lost') {
      const e = new Error(`Lead is already ${lead.status} and cannot be converted.`);
      e.status = 400;
      throw e;
    }

    // 1. Company — reuse existing (case-insensitive name match) or create
    let company = null;
    if (lead.company) {
      company = await Company.findOne({ organizationId, name: new RegExp(`^${escapeRegex(lead.company)}$`, 'i') }).session(session || null);
      if (!company) {
        const [companyDoc] = await Company.create(
          [{ organizationId, name: lead.company, industry: lead.industry || '' }],
          opts
        );
        company = companyDoc;
        created.companyId = company._id;
      }
    }

    // 2. Contact from the lead's identity fields
    const [contact] = await Contact.create(
      [{
        organizationId,
        fullName: lead.leadName,
        email: lead.email || '',
        phone: lead.phone || '',
        companyId: company ? company._id : null,
        title: '',
        owner: lead.owner || userId,
      }],
      opts
    );
    created.contactId = contact._id;

    // 3. Deal at "qualified" referencing both
    const [deal] = await Deal.create(
      [{
        organizationId,
        dealName: lead.leadName,
        companyId: company ? company._id : null,
        contactId: contact._id,
        amount: dealAmount,
        probability: 50,
        stage: 'qualified',
        salesperson: lead.owner || userId,
      }],
      opts
    );
    created.dealId = deal._id;

    // 4. Mark the source lead as won
    lead.status = 'won';
    await lead.save(opts);

    // 5. Timeline entries documenting the conversion
    const activityDocs = [
      {
        organizationId,
        type: 'note',
        relatedToType: 'lead',
        relatedToId: lead._id,
        content: `Lead converted to Contact and Deal${deal ? ` (deal amount: ${dealAmount})` : ''}.`,
        createdBy: userId,
      },
      {
        organizationId,
        type: 'note',
        relatedToType: 'contact',
        relatedToId: contact._id,
        content: `Created via conversion of lead "${lead.leadName}".`,
        createdBy: userId,
      },
      {
        organizationId,
        type: 'note',
        relatedToType: 'deal',
        relatedToId: deal._id,
        content: `Deal opened at "qualified" stage from lead "${lead.leadName}".`,
        createdBy: userId,
      },
    ];
    if (session) {
      await Activity.insertMany(activityDocs, { session });
    } else {
      await Activity.insertMany(activityDocs);
    }

    return { lead, contact, deal, company };
  };

  // ── Attempt 1: real transaction (replica set) ──
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const result = await runConversion(session);
    await session.commitTransaction();
    session.endSession();
    return res.json({
      message: 'Lead converted successfully.',
      contact: result.contact,
      deal: result.deal,
      company: result.company,
      lead: result.lead,
    });
  } catch (txErr) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) { /* noop */ }
      try { session.endSession(); } catch (_) { /* noop */ }
    }

    const isNotReplicaSet =
      txErr.codeName === 'IllegalOperation' ||
      txErr.message?.includes('Transaction numbers') ||
      txErr.message?.includes('replica set') ||
      txErr.message?.includes('not supported') ||
      txErr.message?.includes('standalone');

    if (!isNotReplicaSet) {
      console.error('[leadController.convertLead] Transaction error:', txErr);
      const status = txErr.status || 500;
      return res.status(status).json({ error: txErr.message || 'Lead conversion failed.' });
    }

    // ── Attempt 2: sequential fallback with manual cleanup (standalone) ──
    console.warn('[leadController.convertLead] Transactions unsupported — using fallback mode');
    try {
      const result = await runConversion(null);
      return res.json({
        message: 'Lead converted successfully.',
        contact: result.contact,
        deal: result.deal,
        company: result.company,
        lead: result.lead,
      });
    } catch (fallbackErr) {
      // Manual rollback of anything created in this failed pass
      try {
        if (created.dealId) await Deal.findByIdAndDelete(created.dealId);
        if (created.contactId) await Contact.findByIdAndDelete(created.contactId);
        if (created.companyId) await Company.findByIdAndDelete(created.companyId);
      } catch (_) { /* best-effort */ }
      console.error('[leadController.convertLead] Fallback error:', fallbackErr);
      const status = fallbackErr.status || 500;
      return res.status(status).json({ error: fallbackErr.message || 'Lead conversion failed.' });
    }
  }
};

module.exports = {
  getLeads,
  createLead,
  getLeadById,
  updateLead,
  deleteLead,
  convertLead,
};
