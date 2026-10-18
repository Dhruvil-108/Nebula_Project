const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const Interview = require('../models/Interview');
const JobOffer = require('../models/JobOffer');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const USER_FIELDS = 'fullName email role';

const counterService = require('../services/counterService');

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/candidates — List candidates
// ─────────────────────────────────────────────────────────
const getCandidates = async (req, res) => {
  try {
    const { stage, jobOpeningId, source, search, rating } = req.query;
    const extra = {};

    if (stage) extra.stage = stage;
    if (source) extra.source = source;
    if (rating) extra.rating = { $gte: Number(rating) };
    if (jobOpeningId && mongoose.Types.ObjectId.isValid(jobOpeningId)) {
      extra.jobOpeningId = jobOpeningId;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [
        { fullName: rx },
        { email: rx },
        { candidateCode: rx },
        { currentCompany: rx },
        { skills: rx },
        { tags: rx },
      ];
    }

    const candidates = await Candidate.find(scopedFilter(req, extra))
      .populate('jobOpeningId', 'title jobCode departmentId status')
      .populate('referredBy', 'fullName employeeCode')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    return res.json(candidates);
  } catch (err) {
    console.error('[candidateController.getCandidates] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve candidates.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/candidates — Create candidate
// ─────────────────────────────────────────────────────────
const createCandidate = async (req, res) => {
  try {
    const {
      jobOpeningId,
      fullName,
      email,
      phone,
      currentCompany,
      currentDesignation,
      totalExperienceYears,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      resumeUrl,
      resumeFileName,
      skills,
      expectedSalary,
      noticePeriodDays,
      source,
      referredBy,
      stage,
      tags,
      notes,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!jobOpeningId || !mongoose.Types.ObjectId.isValid(jobOpeningId)) {
      return res.status(400).json({ error: 'A valid job opening is required.' });
    }

    // Verify job belongs to organization
    const job = await JobOpening.findOne(scopedFilter(req, { _id: jobOpeningId })).lean();
    if (!job) {
      return res.status(404).json({ error: 'Job opening not found in this organization.' });
    }

    const candidateCode = await counterService.generateCandidateCode(req.organizationId);
    const initialStage = stage || 'applied';

    const newCandidate = await Candidate.create({
      organizationId: req.organizationId,
      candidateCode,
      jobOpeningId,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      currentCompany: currentCompany ? currentCompany.trim() : '',
      currentDesignation: currentDesignation ? currentDesignation.trim() : '',
      totalExperienceYears: totalExperienceYears ? Number(totalExperienceYears) : 0,
      portfolioUrl: portfolioUrl || '',
      linkedinUrl: linkedinUrl || '',
      githubUrl: githubUrl || '',
      resumeUrl: resumeUrl || '',
      resumeFileName: resumeFileName || '',
      skills: Array.isArray(skills) ? skills : [],
      expectedSalary: expectedSalary ? Number(expectedSalary) : 0,
      noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : 30,
      source: source || 'careers_page',
      referredBy: referredBy && mongoose.Types.ObjectId.isValid(referredBy) ? referredBy : null,
      stage: initialStage,
      tags: Array.isArray(tags) ? tags : [],
      notes: notes || '',
      stageHistory: [
        {
          fromStage: 'none',
          toStage: initialStage,
          changedBy: req.user._id,
          changedAt: new Date(),
          note: 'Candidate entered recruitment pipeline.',
        },
      ],
    });

    const populated = await Candidate.findById(newCandidate._id)
      .populate('jobOpeningId', 'title jobCode departmentId status')
      .populate('referredBy', 'fullName employeeCode')
      .lean();

    // Log recruitment activity
    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: newCandidate._id,
      jobOpeningId,
      type: 'stage_change',
      title: 'Candidate Applied',
      description: `${newCandidate.fullName} (${newCandidate.candidateCode}) applied for ${job.title}.`,
      performedBy: req.user._id,
    });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[candidateController.createCandidate] Error:', err);
    return res.status(500).json({ error: 'Failed to create candidate.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/candidates/:id — Single candidate details
// ─────────────────────────────────────────────────────────
const getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate id.' });
    }

    const candidate = await Candidate.findOne(scopedFilter(req, { _id: id }))
      .populate('jobOpeningId', 'title jobCode departmentId employmentType location salaryRange status')
      .populate('referredBy', 'fullName employeeCode email')
      .populate('convertedEmployeeId', 'employeeCode fullName designation joiningDate')
      .populate('stageHistory.changedBy', USER_FIELDS)
      .lean();

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    // Attach interviews
    const interviews = await Interview.find(scopedFilter(req, { candidateId: id }))
      .populate('interviewers', USER_FIELDS)
      .populate('scorecard.submittedBy', USER_FIELDS)
      .sort({ scheduledStart: -1 })
      .lean();

    // Attach offer (if any)
    const offer = await JobOffer.findOne(scopedFilter(req, { candidateId: id }))
      .populate('approvedBy', USER_FIELDS)
      .populate('departmentId', 'name')
      .lean();

    // Attach activities
    const activities = await RecruitmentActivity.find(scopedFilter(req, { candidateId: id }))
      .populate('performedBy', USER_FIELDS)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.json({
      ...candidate,
      interviews,
      offer,
      activities,
    });
  } catch (err) {
    console.error('[candidateController.getCandidateById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve candidate.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/candidates/:id — Update candidate
// ─────────────────────────────────────────────────────────
const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate id.' });
    }

    const allowed = [
      'fullName',
      'email',
      'phone',
      'currentCompany',
      'currentDesignation',
      'totalExperienceYears',
      'portfolioUrl',
      'linkedinUrl',
      'githubUrl',
      'resumeUrl',
      'resumeFileName',
      'skills',
      'expectedSalary',
      'noticePeriodDays',
      'source',
      'rating',
      'tags',
      'notes',
      'rejectionReason',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await Candidate.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('jobOpeningId', 'title jobCode departmentId')
      .populate('referredBy', 'fullName employeeCode')
      .lean();

    if (!updated) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[candidateController.updateCandidate] Error:', err);
    return res.status(500).json({ error: 'Failed to update candidate.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/recruitment/candidates/:id — Delete candidate
// ─────────────────────────────────────────────────────────
const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid candidate id.' });
    }

    const candidate = await Candidate.findOne(scopedFilter(req, { _id: id })).lean();
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found.' });
    }

    if (candidate.convertedEmployeeId) {
      return res.status(400).json({
        error: 'Cannot delete candidate who has already been converted into an HRMS Employee.',
      });
    }

    // Clean up associated interviews & offers
    await Interview.deleteMany({ organizationId: req.organizationId, candidateId: id });
    await JobOffer.deleteMany({ organizationId: req.organizationId, candidateId: id });
    await RecruitmentActivity.deleteMany({ organizationId: req.organizationId, candidateId: id });
    await Candidate.deleteOne({ _id: id });

    return res.json({ message: 'Candidate and associated records deleted successfully.' });
  } catch (err) {
    console.error('[candidateController.deleteCandidate] Error:', err);
    return res.status(500).json({ error: 'Failed to delete candidate.' });
  }
};

module.exports = {
  getCandidates,
  createCandidate,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
};
