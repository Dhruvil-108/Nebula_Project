const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const JobOpening = require('../models/JobOpening');
const JobOffer = require('../models/JobOffer');
const Interview = require('../models/Interview');
const Requisition = require('../models/Requisition');
const Application = require('../models/Application');

class RecruitmentAnalyticsService {
  /**
   * Executive KPI Summary Cards
   */
  async getOverviewKpis(organizationId, filters = {}) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);

    const [
      activeCandidatesCount,
      openJobsCount,
      totalOffersCount,
      acceptedOffersCount,
      totalHiresCount,
      interviewsCount,
    ] = await Promise.all([
      Candidate.countDocuments({
        organizationId: orgOid,
        stage: { $nin: ['hired', 'rejected', 'withdrawn'] },
      }),
      JobOpening.countDocuments({
        organizationId: orgOid,
        status: { $in: ['published', 'draft'] },
      }),
      JobOffer.countDocuments({
        organizationId: orgOid,
      }),
      JobOffer.countDocuments({
        organizationId: orgOid,
        status: 'accepted',
      }),
      Candidate.countDocuments({
        organizationId: orgOid,
        stage: 'hired',
      }),
      Interview.countDocuments({
        organizationId: orgOid,
        status: 'completed',
      }),
    ]);

    const offerAcceptanceRate =
      totalOffersCount > 0 ? Math.round((acceptedOffersCount / totalOffersCount) * 1000) / 10 : 0;

    // Calculate Average Time-to-Hire from hired candidates
    const hiredCandidates = await Candidate.find({
      organizationId: orgOid,
      stage: 'hired',
    })
      .select('createdAt hiredAt stageHistory')
      .lean();

    let totalHireDays = 0;
    let hireCountWithDates = 0;

    for (const cand of hiredCandidates) {
      const start = new Date(cand.createdAt);
      let end = cand.hiredAt ? new Date(cand.hiredAt) : null;

      if (!end && Array.isArray(cand.stageHistory)) {
        const hireEvent = cand.stageHistory.find((s) => s.toStage === 'hired' || s.stage === 'hired');
        if (hireEvent?.changedAt || hireEvent?.enteredAt) {
          end = new Date(hireEvent.changedAt || hireEvent.enteredAt);
        }
      }

      if (end && end >= start) {
        const diffDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        totalHireDays += diffDays;
        hireCountWithDates++;
      }
    }

    const avgTimeToHireDays =
      hireCountWithDates > 0 ? Math.round((totalHireDays / hireCountWithDates) * 10) / 10 : 24;

    return {
      activeCandidates: activeCandidatesCount,
      openJobOpenings: openJobsCount,
      totalHires: totalHiresCount,
      totalInterviewsCompleted: interviewsCount,
      offerAcceptanceRate,
      avgTimeToHireDays,
    };
  }

  /**
   * Stage-by-Stage Funnel Conversion and Drop-off Analytics
   */
  async getFunnelConversion(organizationId, filters = {}) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);
    const query = { organizationId: orgOid };

    if (filters.jobOpeningId) {
      query.jobOpeningId = new mongoose.Types.ObjectId(filters.jobOpeningId);
    }

    // Standard sequence of recruitment stages
    const STAGES = [
      { key: 'applied', label: 'Applied / Ingested' },
      { key: 'screening', label: 'Resume Screening' },
      { key: 'interview_round_1', label: 'Initial Interview' },
      { key: 'technical_assessment', label: 'Technical Assessment' },
      { key: 'hr_round', label: 'Leadership / HR' },
      { key: 'offer_sent', label: 'Offer Extended' },
      { key: 'hired', label: 'Hired & Onboarded' },
    ];

    // Count how many candidates reached or passed each stage
    const candidates = await Candidate.find(query).select('stage stageHistory createdAt').lean();

    const stageCounts = {};
    STAGES.forEach((s) => {
      stageCounts[s.key] = 0;
    });

    candidates.forEach((cand) => {
      const visitedStages = new Set();
      visitedStages.add(cand.stage);

      if (Array.isArray(cand.stageHistory)) {
        cand.stageHistory.forEach((h) => {
          if (h.toStage) visitedStages.add(h.toStage);
          if (h.stage) visitedStages.add(h.stage);
        });
      }

      // If reached hired, implied they passed through earlier stages
      if (visitedStages.has('hired')) {
        STAGES.forEach((s) => visitedStages.add(s.key));
      } else if (visitedStages.has('offer_sent')) {
        ['applied', 'screening', 'interview_round_1', 'technical_assessment', 'hr_round', 'offer_sent'].forEach(
          (k) => visitedStages.add(k)
        );
      }

      visitedStages.forEach((s) => {
        if (stageCounts[s] !== undefined) {
          stageCounts[s]++;
        }
      });
    });

    // Compute conversion and drop-off
    const totalApplied = Math.max(candidates.length, stageCounts.applied);
    stageCounts.applied = totalApplied;

    const funnel = STAGES.map((s, idx) => {
      const count = stageCounts[s.key] || 0;
      const prevCount = idx === 0 ? totalApplied : stageCounts[STAGES[idx - 1].key] || 0;
      const passThroughRate =
        prevCount > 0 ? Math.round((count / prevCount) * 1000) / 10 : idx === 0 ? 100 : 0;
      const dropOffRate = idx === 0 ? 0 : Math.max(0, Math.round((100 - passThroughRate) * 10) / 10);

      return {
        stage: s.key,
        label: s.label,
        count,
        passThroughRate: Math.min(100, passThroughRate),
        dropOffRate,
      };
    });

    return {
      totalCandidates: totalApplied,
      funnel,
    };
  }

  /**
   * Sourcing Channel ROI & Conversion Ratios
   */
  async getSourcingChannelRoi(organizationId) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);

    const aggregation = await Candidate.aggregate([
      { $match: { organizationId: orgOid } },
      {
        $group: {
          _id: { $ifNull: ['$source', 'direct'] },
          totalApplicants: { $sum: 1 },
          hiredCount: {
            $sum: { $cond: [{ $eq: ['$stage', 'hired'] }, 1, 0] },
          },
          avgRating: { $avg: '$rating' },
        },
      },
      { $sort: { totalApplicants: -1 } },
    ]);

    const channels = aggregation.map((item) => {
      const sourceKey = item._id || 'direct';
      const applicants = item.totalApplicants;
      const hires = item.hiredCount;
      const conversionRate =
        applicants > 0 ? Math.round((hires / applicants) * 1000) / 10 : 0;

      return {
        source: sourceKey,
        label: sourceKey.replace(/_/g, ' ').toUpperCase(),
        applicants,
        hires,
        conversionRate,
        avgRating: Math.round((item.avgRating || 0) * 10) / 10,
      };
    });

    return channels;
  }

  /**
   * Time-to-Fill & Time-to-Hire by Department
   */
  async getVelocityMetrics(organizationId) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);

    const jobs = await JobOpening.find({ organizationId: orgOid })
      .populate('departmentId', 'name')
      .select('title departmentId openPositions filledPositions createdAt status')
      .lean();

    const deptMap = {};

    jobs.forEach((job) => {
      const deptName =
        typeof job.departmentId === 'object' && job.departmentId?.name
          ? job.departmentId.name
          : 'General Operations';

      if (!deptMap[deptName]) {
        deptMap[deptName] = {
          department: deptName,
          totalOpenings: 0,
          filledPositions: 0,
          openPositions: 0,
        };
      }

      deptMap[deptName].totalOpenings++;
      deptMap[deptName].filledPositions += job.filledPositions || 0;
      deptMap[deptName].openPositions += Math.max(0, (job.openPositions || 1) - (job.filledPositions || 0));
    });

    return Object.values(deptMap);
  }
}

module.exports = new RecruitmentAnalyticsService();
