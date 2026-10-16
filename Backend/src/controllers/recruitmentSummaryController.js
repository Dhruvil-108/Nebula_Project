const mongoose = require('mongoose');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const JobOffer = require('../models/JobOffer');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const { CANDIDATE_STAGES } = require('../models/Candidate');
const { scopedFilter } = require('../middleware/tenant');

const USER_FIELDS = 'fullName email role';

// ─────────────────────────────────────────────────────────
// GET /api/v1/recruitment/summary — Recruitment Hub KPI metrics
// ─────────────────────────────────────────────────────────
const getRecruitmentSummary = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const now = new Date();

    // Start & end of this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // Start of this month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      activeJobsCount,
      totalCandidatesCount,
      interviewsThisWeekCount,
      pendingOffersCount,
      hiredThisMonthCount,
      stageCountsAgg,
      upcomingInterviews,
      recentActivities,
      recentJobs,
    ] = await Promise.all([
      // 1. Active job openings
      JobOpening.countDocuments({ organizationId: orgId, status: 'published' }),

      // 2. Total active candidates (not rejected or withdrawn)
      Candidate.countDocuments({
        organizationId: orgId,
        stage: { $nin: ['rejected', 'withdrawn'] },
      }),

      // 3. Interviews this week
      Interview.countDocuments({
        organizationId: orgId,
        scheduledStart: { $gte: startOfWeek, $lt: endOfWeek },
        status: { $in: ['scheduled', 'rescheduled', 'completed'] },
      }),

      // 4. Pending offers
      JobOffer.countDocuments({
        organizationId: orgId,
        status: { $in: ['pending_approval', 'sent'] },
      }),

      // 5. Hired this month
      Candidate.countDocuments({
        organizationId: orgId,
        stage: 'hired',
        hiredAt: { $gte: startOfMonth },
      }),

      // 6. Stage distribution for funnel
      Candidate.aggregate([
        { $match: { organizationId: orgId } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),

      // 7. Upcoming 5 interviews
      Interview.find({
        organizationId: orgId,
        scheduledStart: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
        status: { $in: ['scheduled', 'rescheduled'] },
      })
        .populate('candidateId', 'fullName candidateCode email')
        .populate('jobOpeningId', 'title jobCode')
        .populate('interviewers', USER_FIELDS)
        .sort({ scheduledStart: 1 })
        .limit(5)
        .lean(),

      // 8. Recent 10 activities
      RecruitmentActivity.find({ organizationId: orgId })
        .populate('performedBy', USER_FIELDS)
        .populate('candidateId', 'fullName candidateCode')
        .populate('jobOpeningId', 'title jobCode')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),

      // 9. Top 4 active jobs
      JobOpening.find({ organizationId: orgId, status: 'published' })
        .populate('departmentId', 'name')
        .sort({ createdAt: -1 })
        .limit(4)
        .lean(),
    ]);

    // Format stage counts
    const stageCounts = {};
    for (const s of CANDIDATE_STAGES) {
      stageCounts[s] = 0;
    }
    for (const item of stageCountsAgg) {
      stageCounts[item._id] = item.count;
    }

    return res.json({
      metrics: {
        activeJobs: activeJobsCount,
        candidatesInPipeline: totalCandidatesCount,
        interviewsThisWeek: interviewsThisWeekCount,
        pendingOffers: pendingOffersCount,
        hiredThisMonth: hiredThisMonthCount,
      },
      stageCounts,
      upcomingInterviews,
      recentActivities,
      recentJobs,
    });
  } catch (err) {
    console.error('[recruitmentSummaryController.getRecruitmentSummary] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve recruitment summary.' });
  }
};

module.exports = {
  getRecruitmentSummary,
};
