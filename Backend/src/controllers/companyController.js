const mongoose = require('mongoose');
const Company = require('../models/Company');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const { scopedFilter } = require('../middleware/tenant');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/companies — list with contact/deal counts
// ─────────────────────────────────────────────────────────
const getCompanies = async (req, res) => {
  try {
    const { search } = req.query;
    const extra = {};

    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ name: rx }, { industry: rx }, { website: rx }];
    }

    const companies = await Company.find(scopedFilter(req, extra))
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    // Aggregate linked record counts in one pass each (tenant-scoped)
    const ids = companies.map((c) => c._id);
    const [contactCounts, dealCounts] = await Promise.all([
      Contact.aggregate([
        { $match: { organizationId: req.organizationId, companyId: { $in: ids } } },
        { $group: { _id: '$companyId', count: { $sum: 1 } } },
      ]),
      Deal.aggregate([
        { $match: { organizationId: req.organizationId, companyId: { $in: ids } } },
        { $group: { _id: '$companyId', count: { $sum: 1 } } },
      ]),
    ]);

    const contactMap = new Map(contactCounts.map((r) => [r._id.toString(), r.count]));
    const dealMap = new Map(dealCounts.map((r) => [r._id.toString(), r.count]));

    return res.json(
      companies.map((c) => ({
        ...c,
        contactCount: contactMap.get(c._id.toString()) || 0,
        dealCount: dealMap.get(c._id.toString()) || 0,
      }))
    );
  } catch (err) {
    console.error('[companyController.getCompanies] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve companies.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/crm/companies
// ─────────────────────────────────────────────────────────
const createCompany = async (req, res) => {
  try {
    const { name, industry, website, phone, address } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Company name is required.' });
    }

    const company = await Company.create({
      organizationId: req.organizationId,
      name: String(name).trim(),
      industry: industry ? String(industry).trim() : '',
      website: website ? String(website).trim() : '',
      phone: phone ? String(phone).trim() : '',
      address: address ? String(address).trim() : '',
    });

    return res.status(201).json(company.toObject());
  } catch (err) {
    console.error('[companyController.createCompany] Error:', err);
    return res.status(500).json({ error: 'Failed to create company.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/crm/companies/:id — detail + linked Contacts + Deals
// ─────────────────────────────────────────────────────────
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid company id.' });
    }

    const company = await Company.findOne(scopedFilter(req, { _id: id })).lean();
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    const [contacts, deals] = await Promise.all([
      Contact.find(scopedFilter(req, { companyId: id }))
        .populate('owner', 'fullName email role')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      Deal.find(scopedFilter(req, { companyId: id }))
        .populate('salesperson', 'fullName email role')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    return res.json({ ...company, contacts, deals });
  } catch (err) {
    console.error('[companyController.getCompanyById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve company.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/crm/companies/:id
// ─────────────────────────────────────────────────────────
const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid company id.' });
    }

    const allowedFields = ['name', 'industry', 'website', 'phone', 'address'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
      }
    }

    const company = await Company.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    return res.json(company);
  } catch (err) {
    console.error('[companyController.updateCompany] Error:', err);
    return res.status(500).json({ error: 'Failed to update company.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/crm/companies/:id
// ─────────────────────────────────────────────────────────
const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid company id.' });
    }

    const company = await Company.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!company) {
      return res.status(404).json({ error: 'Company not found.' });
    }

    // Contacts/Deals keep their links but now dangle — null them out
    await Contact.updateMany(
      scopedFilter(req, { companyId: id }),
      { $set: { companyId: null } }
    );
    await Deal.updateMany(
      scopedFilter(req, { companyId: id }),
      { $set: { companyId: null } }
    );

    return res.json({ message: 'Company deleted successfully.' });
  } catch (err) {
    console.error('[companyController.deleteCompany] Error:', err);
    return res.status(500).json({ error: 'Failed to delete company.' });
  }
};

module.exports = {
  getCompanies,
  createCompany,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
