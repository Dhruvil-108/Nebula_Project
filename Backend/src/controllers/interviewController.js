const mongoose = require('mongoose');
const Interview = require('../models/Interview');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { scopedFilter } = require('../middleware/tenant');

const USER_FIELDS = 'fullName email role';

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/interviews — List interviews
// ─────────────────────────────────────────────────────────
const getInterviews = async (req, res) => {
  try {
    const { status, candidateId, jobOpeningId, interviewerId, upcoming } = req.query;
    const extra = {};

    if (status) extra.status = status;
    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) extra.candidateId = candidateId;
    if (jobOpeningId && mongoose.Types.ObjectId.isValid(jobOpeningId)) extra.jobOpeningId = jobOpeningId;
    if (interviewerId && mongoose.Types.ObjectId.isValid(interviewerId)) {
      extra.interviewers = interviewerId;
    }
    if (upcoming === 'true') {
      extra.scheduledStart = { $gte: new Date(Date.now() - 30 * 60 * 1000) }; // Include currently in-progress
      extra.status = { $in: ['scheduled', 'rescheduled'] };
    }

    const interviews = await Interview.find(scopedFilter(req, extra))
      .populate('candidateId', 'fullName candidateCode email phone currentCompany resumeUrl stage')
      .populate('jobOpeningId', 'title jobCode departmentId')
      .populate('interviewers', USER_FIELDS)
      .populate('scorecard.submittedBy', USER_FIELDS)
      .sort({ scheduledStart: 1 })
      .limit(500)
      .lean();

    return res.json(interviews);
  } catch (err) {
    console.error('[interviewController.getInterviews] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve interviews.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/interviews — Schedule interview
// ─────────────────────────────────────────────────────────
const scheduleInterview = async (req, res) => {
  try {
    const {
      candidateId,
      jobOpeningId,
      title,
      roundType,
      interviewers,
      scheduledStart,
      scheduledEnd,
      timezone,
      meetingLink,
      location,
    } = req.body;

    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'A valid candidate is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Interview title is required.' });
    }
    if (!scheduledStart || !scheduledEnd) {
      return res.status(400).json({ error: 'Start and end times are required.' });
    }

    const candidate = await Candidate.findOne(scopedFilter(req, { _id: candidateId })).lean();
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found in this organization.' });
    }

    const resolvedJobId = jobOpeningId || candidate.jobOpeningId;

    const interview = await Interview.create({
      organizationId: req.organizationId,
      candidateId,
      jobOpeningId: resolvedJobId,
      title: title.trim(),
      roundType: roundType || 'technical',
      interviewers: Array.isArray(interviewers) ? interviewers : [],
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      timezone: timezone || 'Asia/Kolkata',
      meetingLink: meetingLink || '',
      location: location || '',
      status: 'scheduled',
    });

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'fullName candidateCode email')
      .populate('jobOpeningId', 'title jobCode')
      .populate('interviewers', USER_FIELDS)
      .lean();

    // Log activity
    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId,
      jobOpeningId: resolvedJobId,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      description: `"${interview.title}" scheduled for ${new Date(scheduledStart).toLocaleString()}.`,
      performedBy: req.user._id,
      metadata: { interviewId: interview._id, scheduledStart },
    });

    return res.status(201).json(populated);
  } catch (err) {
    console.error('[interviewController.scheduleInterview] Error:', err);
    return res.status(500).json({ error: 'Failed to schedule interview.' });
  }
};

// ─────────────────────────────────────────────────────────
// PATCH /api/v1/recruitment/interviews/:id — Reschedule/Update interview
// ─────────────────────────────────────────────────────────
const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid interview id.' });
    }

    const allowed = [
      'title',
      'roundType',
      'interviewers',
      'scheduledStart',
      'scheduledEnd',
      'timezone',
      'meetingLink',
      'location',
      'status',
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await Interview.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('candidateId', 'fullName candidateCode email')
      .populate('jobOpeningId', 'title jobCode')
      .populate('interviewers', USER_FIELDS)
      .populate('scorecard.submittedBy', USER_FIELDS)
      .lean();

    if (!updated) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    return res.json(updated);
  } catch (err) {
    console.error('[interviewController.updateInterview] Error:', err);
    return res.status(500).json({ error: 'Failed to update interview.' });
  }
};

// ─────────────────────────────────────────────────────────
// POST /api/v1/recruitment/interviews/:id/scorecard — Submit scorecard
// ─────────────────────────────────────────────────────────
const submitScorecard = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, decision, technicalSkillScore, communicationScore, cultureFitScore, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid interview id.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Scorecard rating must be between 1 and 5.' });
    }

    const interview = await Interview.findOne(scopedFilter(req, { _id: id }));
    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    interview.status = 'completed';
    interview.scorecard = {
      rating: Number(rating),
      decision: decision || 'hire',
      technicalSkillScore: technicalSkillScore ? Number(technicalSkillScore) : null,
      communicationScore: communicationScore ? Number(communicationScore) : null,
      cultureFitScore: cultureFitScore ? Number(cultureFitScore) : null,
      notes: notes || '',
      submittedBy: req.user._id,
      submittedAt: new Date(),
    };

    await interview.save();

    // Also update candidate rating average
    const allCandidateInterviews = await Interview.find({
      organizationId: req.organizationId,
      candidateId: interview.candidateId,
      'scorecard.rating': { $ne: null },
    }).lean();

    if (allCandidateInterviews.length > 0) {
      const avg =
        allCandidateInterviews.reduce((acc, curr) => acc + (curr.scorecard?.rating || 0), 0) /
        allCandidateInterviews.length;
      await Candidate.findByIdAndUpdate(interview.candidateId, {
        rating: Math.round(avg * 10) / 10,
      });
    }

    const populated = await Interview.findById(interview._id)
      .populate('candidateId', 'fullName candidateCode email')
      .populate('jobOpeningId', 'title jobCode')
      .populate('interviewers', USER_FIELDS)
      .populate('scorecard.submittedBy', USER_FIELDS)
      .lean();

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: interview.candidateId,
      jobOpeningId: interview.jobOpeningId,
      type: 'feedback_submitted',
      title: 'Interview Feedback Submitted',
      description: `Evaluation logged for "${interview.title}" with decision: ${decision || 'hire'} (${rating}/5).`,
      performedBy: req.user._id,
      metadata: { interviewId: interview._id, rating, decision },
    });

    return res.json(populated);
  } catch (err) {
    console.error('[interviewController.submitScorecard] Error:', err);
    return res.status(500).json({ error: 'Failed to submit scorecard.' });
  }
};

// ─────────────────────────────────────────────────────────
// DELETE /api/v1/recruitment/interviews/:id — Cancel interview
// ─────────────────────────────────────────────────────────
const cancelInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid interview id.' });
    }

    const interview = await Interview.findOneAndUpdate(
      scopedFilter(req, { _id: id }),
      {
        $set: {
          status: 'cancelled',
          cancellationReason: reason || 'Cancelled by recruiter/interviewer',
        },
      },
      { new: true }
    )
      .populate('candidateId', 'fullName candidateCode email')
      .populate('interviewers', USER_FIELDS)
      .lean();

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    await RecruitmentActivity.create({
      organizationId: req.organizationId,
      candidateId: interview.candidateId,
      jobOpeningId: interview.jobOpeningId,
      type: 'interview_cancelled',
      title: 'Interview Cancelled',
      description: `"${interview.title}" was cancelled: ${reason || 'No reason provided'}.`,
      performedBy: req.user._id,
    });

    return res.json(interview);
  } catch (err) {
    console.error('[interviewController.cancelInterview] Error:', err);
    return res.status(500).json({ error: 'Failed to cancel interview.' });
  }
};

module.exports = {
  getInterviews,
  scheduleInterview,
  updateInterview,
  submitScorecard,
  cancelInterview,
};
