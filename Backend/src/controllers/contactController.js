const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Company = require('../models/Company');
const Deal = require('../models/Deal');
const Activity = require('../models/Activity');
const { scopedFilter } = require('../middleware/tenant');

const OWNER_FIELDS = 'fullName email role';
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/contacts
// ─────────────────────────────────────────────────────────
const getContacts = async (req, res) => {
  try {
    const { search, companyId } = req.query;
    const extra = {};

    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return res.status(400).json({ error: 'Invalid company id.' });
      }
      extra.companyId = companyId;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ fullName: rx }, { email: rx }, { phone: rx }];
    }

    const contacts = await Contact.find(scopedFilter(req, extra))
      .populate('companyId', 'name')
      .populate('owner', OWNER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    return res.json(contacts);
  } catch (err) {
    console.error('[contactController.getContacts] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve contacts.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/crm/contacts
// ─────────────────────────────────────────────────────────
const createContact = async (req, res) => {
  try {
    const { fullName, email, phone, companyId, title, owner } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: 'Contact full name is required.' });
    }
    if (companyId && !mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ error: 'Invalid company id.' });
    }
    if (owner && !mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: 'Invalid owner id.' });
    }

    const contact = await Contact.create({
      organizationId: req.organizationId,
      fullName: String(fullName).trim(),
      email: email ? String(email).trim().toLowerCase() : '',
      phone: phone ? String(phone).trim() : '',
      companyId: companyId || null,
      title: title ? String(title).trim() : '',
      owner: owner || req.user._id,
    });

    const populated = await Contact.findById(contact._id)
      .populate('companyId', 'name')
      .populate('owner', OWNER_FIELDS)
      .lean();

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[contactController.createContact] Error:', err);
    return res.status(500).json({ error: 'Failed to create contact.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/contacts/:id — detail + Company + Deals + timeline
// ─────────────────────────────────────────────────────────
const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contact id.' });
    }

    const contact = await Contact.findOne(scopedFilter(req, { _id: id }))
      .populate('companyId', 'name industry website')
      .populate('owner', OWNER_FIELDS)
      .lean();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    const [deals, activities] = await Promise.all([
      Deal.find(scopedFilter(req, { contactId: id }))
        .populate('companyId', 'name')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Activity.find(scopedFilter(req, { relatedToType: 'contact', relatedToId: id }))
        .populate('createdBy', OWNER_FIELDS)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    return res.json({ ...contact, deals, activities });
  } catch (err) {
    console.error('[contactController.getContactById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve contact.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/crm/contacts/:id
// ─────────────────────────────────────────────────────────
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contact id.' });
    }

    const allowedFields = ['fullName', 'email', 'phone', 'companyId', 'title', 'owner'];
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
    // Explicit null clears the company link
    if (req.body.companyId === null) updates.companyId = null;
    // ObjectId fields must be valid before hitting Mongo
    for (const refField of ['companyId', 'owner']) {
      const value = req.body[refField];
      if (value && value !== null && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({ error: `Invalid ${refField}.` });
      }
    }

    const contact = await Contact.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('companyId', 'name')
      .populate('owner', OWNER_FIELDS)
      .lean();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    return res.json(contact);
  } catch (err) {
    console.error('[contactController.updateContact] Error:', err);
    return res.status(500).json({ error: 'Failed to update contact.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/crm/contacts/:id
// ─────────────────────────────────────────────────────────
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid contact id.' });
    }

    const contact = await Contact.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found.' });
    }

    await Activity.deleteMany(scopedFilter(req, { relatedToType: 'contact', relatedToId: id }));

    return res.json({ message: 'Contact deleted successfully.' });
  } catch (err) {
    console.error('[contactController.deleteContact] Error:', err);
    return res.status(500).json({ error: 'Failed to delete contact.' });
  }
};

module.exports = {
  getContacts,
  createContact,
  getContactById,
  updateContact,
  deleteContact,
};
