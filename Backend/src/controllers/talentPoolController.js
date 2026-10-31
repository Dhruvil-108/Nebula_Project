const mongoose = require('mongoose');
const TalentPool = require('../models/TalentPool');
const Candidate = require('../models/Candidate');
const { scopedFilter } = require('../middleware/tenant');

exports.getTalentPools = async (req, res) => {
  try {
    const filter = scopedFilter(req);
    const pools = await TalentPool.find(filter)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    const formatted = pools.map((p) => ({
      ...p.toObject(),
      candidateCount: (p.candidateIds || []).length,
      candidates: p.candidateIds || [],
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching talent pools' });
  }
};

exports.getTalentPoolById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid talent pool id' });
    }
    const filter = scopedFilter(req, { _id: req.params.id });
    const pool = await TalentPool.findOne(filter)
      .populate('candidateIds', 'fullName candidateCode email phone currentDesignation currentCompany tags stage resumeUrl')
      .populate('createdBy', 'fullName email');

    if (!pool) {
      return res.status(404).json({ message: 'Talent pool not found' });
    }

    res.json({
      ...pool.toObject(),
      candidates: pool.candidateIds || [],
      candidateCount: (pool.candidateIds || []).length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error fetching talent pool' });
  }
};

exports.createTalentPool = async (req, res) => {
  try {
    const { name, description, color, tags, isPrivate } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Talent pool name is required' });
    }

    const pool = await TalentPool.create({
      organizationId: req.organizationId,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#f97316',
      tags: Array.isArray(tags) ? tags : [],
      isPrivate: Boolean(isPrivate),
      candidateIds: [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      ...pool.toObject(),
      candidateCount: 0,
      candidates: [],
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error creating talent pool' });
  }
};

exports.addCandidatesToPool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid talent pool id' });
    }
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: 'candidateIds array is required' });
    }
    if (!candidateIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: 'candidateIds contains an invalid candidate id' });
    }

    const filter = scopedFilter(req, { _id: req.params.id });
    const pool = await TalentPool.findOne(filter);
    if (!pool) {
      return res.status(404).json({ message: 'Talent pool not found' });
    }

    const validCandidateIds = await Candidate
      .find({
        _id: { $in: candidateIds },
        organizationId: req.organizationId,
      })
      .distinct('_id');
    if (validCandidateIds.length === 0) {
      return res.status(400).json({ message: 'No valid candidates found for this organization' });
    }
    const existingSet = new Set((pool.candidateIds || []).map((id) => id.toString()));
    validCandidateIds.forEach((id) => existingSet.add(id.toString()));
    pool.candidateIds = Array.from(existingSet);

    await pool.save();
    res.json({
      message: `Added ${validCandidateIds.length} candidate(s) to talent pool.`,
      pool: {
        ...pool.toObject(),
        candidates: pool.candidateIds || [],
        candidateCount: pool.candidateIds.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error updating talent pool' });
  }
};

exports.removeCandidatesFromPool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid talent pool id' });
    }
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: 'candidateIds array is required' });
    }

    const filter = scopedFilter(req, { _id: req.params.id });
    const pool = await TalentPool.findOne(filter);
    if (!pool) {
      return res.status(404).json({ message: 'Talent pool not found' });
    }

    const removeSet = new Set(candidateIds.map((id) => id.toString()));
    pool.candidateIds = (pool.candidateIds || []).filter((id) => !removeSet.has(id.toString()));

    await pool.save();
    res.json({
      message: `Removed candidates from talent pool.`,
      pool: {
        ...pool.toObject(),
        candidates: pool.candidateIds || [],
        candidateCount: pool.candidateIds.length,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error updating talent pool' });
  }
};

exports.deleteTalentPool = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid talent pool id' });
    }
    const filter = scopedFilter(req, { _id: req.params.id });
    const deleted = await TalentPool.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ message: 'Talent pool not found' });
    }

    res.json({ message: 'Talent pool deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error deleting talent pool' });
  }
};
