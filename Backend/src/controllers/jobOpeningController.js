const mongoose = require('mongoose');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const USER_FIELDS = 'fullName email role';

const counterService = require('../services/counterService');

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/jobs — List jobs with filters
// ─────────────────────────────────────────────────────────
const getJobs = async (req, res) => {
  try {
    const { status, departmentId, employmentType, search } = req.query;
    const extra = {};

    if (status) extra.status = status;
    if (employmentType) extra.employmentType = employmentType;
    if (departmentId && mongoose.Types.ObjectId.isValid(departmentId)) {
      extra.departmentId = departmentId;
    }
    if (search && String(search).trim()) {
      const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
      extra.$or = [{ title: rx }, { jobCode: rx }, { skills: rx }, { location: rx }];
    }

    const jobs = await JobOpening.find(scopedFilter(req, extra))
      .populate('departmentId', 'name')
      .populate('hiringManagerId', USER_FIELDS)
      .populate('assignedRecruiters', USER_FIELDS)
      .sort({ createdAt: -1 })
      .lean();

    // Attach candidate counts per job
    const jobIds = jobs.map((j) => j._id);
    const candidateCounts = await Candidate.aggregate([
      { $match: { organizationId: req.organizationId, jobOpeningId: { $in: jobIds } } },
      { $group: { _id: '$jobOpeningId', total: { $sum: 1 } } },
    ]);
    const countsMap = candidateCounts.reduce((acc, curr) => {
      acc[String(curr._id)] = curr.total;
      return acc;
    }, {});

    const jobsWithMetrics = jobs.map((job) => ({
      ...job,
      applicantCount: countsMap[String(job._id)] || 0,
    }));

    return res.json(jobsWithMetrics);
  } catch (err) {
    console.error('[jobOpeningController.getJobs] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve jobs.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/jobs — Create new job opening
// ─────────────────────────────────────────────────────────
const createJob = async (req, res) => {
  try {
    const {
      title,
      departmentId,
      locationType,
      location,
      employmentType,
      experienceLevel,
      salaryRange,
      openPositions,
      status,
      hiringManagerId,
      assignedRecruiters,
      description,
      requirements,
      responsibilities,
      skills,
      targetCloseDate,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Job title is required.' });
    }
    if (!departmentId || !mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ error: 'A valid department is required.' });
    }

    const jobCode = await counterService.generateJobCode(req.organizationId);

    const newJob = await JobOpening.create({
      organizationId: req.organizationId,
      jobCode,
      title: title.trim(),
      departmentId,
      locationType: locationType || 'hybrid',
      location: location || '',
      employmentType: employmentType || 'full_time',
      experienceLevel: experienceLevel || 'mid',
      salaryRange: salaryRange || { min: 0, max: 0, currency: 'USD', isPublic: false },
      openPositions: openPositions ? Math.max(1, Number(openPositions)) : 1,
      status: status || 'published',
      hiringManagerId: hiringManagerId && mongoose.Types.ObjectId.isValid(hiringManagerId) ? hiringManagerId : null,
      assignedRecruiters: Array.isArray(assignedRecruiters) ? assignedRecruiters : [],
      description: description || '',
      requirements: Array.isArray(requirements) ? requirements : [],
      responsibilities: Array.isArray(responsibilities) ? responsibilities : [],
      skills: Array.isArray(skills) ? skills : [],
      targetCloseDate: targetCloseDate || null,
      publishedAt: status === 'draft' ? null : new Date(),
    });

    const populated = await JobOpening.findById(newJob._id)
      .populate('departmentId', 'name')
      .populate('hiringManagerId', USER_FIELDS)
      .populate('assignedRecruiters', USER_FIELDS)
      .lean();

    // Log recruitment activity
    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      jobOpeningId: newJob._id,
      type: 'note_added',
      title: 'Job Opening Created',
      description: `Job "${newJob.title}" (${newJob.jobCode}) created in ${populated.departmentId?.name || 'Department'}.`,
      performedBy: req.user._id,
    });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[jobOpeningController.createJob] Error:', err);
    return res.status(500).json({ error: 'Failed to create job opening.' });
  }
};

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/jobs/:id — Retrieve single job details
// ─────────────────────────────────────────────────────────
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid job id.' });
    }

    const job = await JobOpening.findOne(scopedFilter(req, { _id: id }))
      .populate('departmentId', 'name')
      .populate('hiringManagerId', USER_FIELDS)
      .populate('assignedRecruiters', USER_FIELDS)
      .lean();

    if (!job) {
      return res.status(404).json({ error: 'Job opening not found.' });
    }

    // Breakdown of applicants by stage
    const stageCounts = await Candidate.aggregate([
      { $match: { organizationId: req.organizationId, jobOpeningId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: '$stage', count: { $sum: 1 } } },
    ]);
    const stageBreakdown = stageCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const totalApplicants = Object.values(stageBreakdown).reduce((a, b) => a + b, 0);

    return res.json({
      ...job,
      applicantCount: totalApplicants,
      stageBreakdown,
    });
  } catch (err) {
    console.error('[jobOpeningController.getJobById] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve job details.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/jobs/:id — Update job opening
// ─────────────────────────────────────────────────────────
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid job id.' });
    }

    const allowed = [
      'title',
      'departmentId',
      'locationType',
      'location',
      'employmentType',
      'experienceLevel',
      'salaryRange',
      'openPositions',
      'status',
      'hiringManagerId',
      'assignedRecruiters',
      'description',
      'requirements',
      'responsibilities',
      'skills',
      'targetCloseDate',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.status === 'published') {
      updates.publishedAt = updates.publishedAt || new Date();
    } else if (updates.status === 'closed') {
      updates.closedAt = new Date();
    }

    const updated = await JobOpening.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('departmentId', 'name')
      .populate('hiringManagerId', USER_FIELDS)
      .populate('assignedRecruiters', USER_FIELDS)
      .lean();

    if (!updated) {
      return res.status(404).json({ error: 'Job opening not found.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[jobOpeningController.updateJob] Error:', err);
    return res.status(500).json({ error: 'Failed to update job opening.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/jobs/:id/status — Toggle status
// ─────────────────────────────────────────────────────────
const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid job id.' });
    }

    const validStatuses = JobOpening.schema.path('status').enumValues;
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updates = { status };
    if (status === 'published') updates.publishedAt = new Date();
    if (status === 'closed') updates.closedAt = new Date();

    const updated = await JobOpening.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true }
    )
      .populate('departmentId', 'name')
      .populate('hiringManagerId', USER_FIELDS)
      .lean();

    if (!updated) {
      return res.status(404).json({ error: 'Job opening not found.' });
    }

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      jobOpeningId: updated._id,
      type: 'note_added',
      title: 'Job Status Changed',
      description: `Job status changed to "${status}".`,
      performedBy: req.user._id,
    });

    return res.json(updated);
  } catch (err) {
    console.error('[jobOpeningController.updateJobStatus] Error:', err);
    return res.status(500).json({ error: 'Failed to update job status.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/recruitment/jobs/:id — Delete job opening
// ─────────────────────────────────────────────────────────
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid job id.' });
    }

    // Check if there are active candidates attached to this job
    const candidatesCount = await Candidate.countDocuments({
      organizationId: req.organizationId,
      jobOpeningId: id,
    });

    if (candidatesCount > 0) {
      return res.status(400).json({
        error: `Cannot delete job opening with ${candidatesCount} candidate(s). Archive or set status to 'closed' instead.`,
      });
    }

    const deleted = await JobOpening.findOneAndDelete(scopedFilter(req, { _id: id }));
    if (!deleted) {
      return res.status(404).json({ error: 'Job opening not found.' });
    }

    return res.json({ message: 'Job opening deleted successfully.' });
  } catch (err) {
    console.error('[jobOpeningController.deleteJob] Error:', err);
    return res.status(500).json({ error: 'Failed to delete job opening.' });
  }
};

module.exports = {
  getJobs,
  createJob,
  getJobById,
  updateJob,
  updateJobStatus,
  deleteJob,
};
