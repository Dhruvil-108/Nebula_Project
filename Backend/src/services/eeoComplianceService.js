const mongoose = require('mongoose');
const EeoSurvey = require('../models/EeoSurvey');

class EeoComplianceService {
  /**
   * Records an anonymous voluntary EEO survey submission.
   * STRICT LEGAL GUARD: Zero linkage to candidate personal profile.
   */
  async recordSurveyResponse(organizationId, jobOpeningId, surveyData = {}) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);
    const jobOid =
      jobOpeningId && mongoose.Types.ObjectId.isValid(jobOpeningId)
        ? new mongoose.Types.ObjectId(jobOpeningId)
        : null;

    const survey = await EeoSurvey.create({
      organizationId: orgOid,
      jobOpeningId: jobOid,
      gender: surveyData.gender || 'declined',
      ethnicity: surveyData.ethnicity || 'declined',
      veteranStatus: surveyData.veteranStatus || 'declined',
      disabilityStatus: surveyData.disabilityStatus || 'declined',
      stageReached: surveyData.stageReached || 'applied',
    });

    return survey;
  }

  /**
   * Aggregates anonymized EEO demographic breakdown
   */
  async getDemographicsSummary(organizationId) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);

    const [genderAgg, ethnicityAgg, veteranAgg, disabilityAgg, totalCount] = await Promise.all([
      EeoSurvey.aggregate([
        { $match: { organizationId: orgOid } },
        { $group: { _id: '$gender', count: { $sum: 1 } } },
      ]),
      EeoSurvey.aggregate([
        { $match: { organizationId: orgOid } },
        { $group: { _id: '$ethnicity', count: { $sum: 1 } } },
      ]),
      EeoSurvey.aggregate([
        { $match: { organizationId: orgOid } },
        { $group: { _id: '$veteranStatus', count: { $sum: 1 } } },
      ]),
      EeoSurvey.aggregate([
        { $match: { organizationId: orgOid } },
        { $group: { _id: '$disabilityStatus', count: { $sum: 1 } } },
      ]),
      EeoSurvey.countDocuments({ organizationId: orgOid }),
    ]);

    const formatBreakdown = (agg) =>
      agg.map((item) => ({
        key: item._id,
        label: (item._id || 'unspecified').replace(/_/g, ' ').toUpperCase(),
        count: item.count,
        percentage: totalCount > 0 ? Math.round((item.count / totalCount) * 1000) / 10 : 0,
      }));

    return {
      totalSubmissions: totalCount,
      gender: formatBreakdown(genderAgg),
      ethnicity: formatBreakdown(ethnicityAgg),
      veteranStatus: formatBreakdown(veteranAgg),
      disabilityStatus: formatBreakdown(disabilityAgg),
    };
  }

  /**
   * Automated Adverse Impact (Four-Fifths / 80% Rule) Calculation
   * Selection Rate = (Hires / Total Applicants) per subgroup.
   * Impact Ratio = Selection Rate / Benchmark Selection Rate.
   * If Impact Ratio < 0.80, flags Potential Adverse Impact.
   */
  async calculateAdverseImpact(organizationId) {
    const orgOid = new mongoose.Types.ObjectId(organizationId);

    const records = await EeoSurvey.find({ organizationId: orgOid }).lean();

    // Group by gender
    const genderStats = {};
    records.forEach((r) => {
      const g = r.gender || 'declined';
      if (!genderStats[g]) {
        genderStats[g] = { total: 0, hired: 0 };
      }
      genderStats[g].total++;
      if (r.stageReached === 'hired') {
        genderStats[g].hired++;
      }
    });

    // Compute selection rates
    let highestRate = 0;
    let benchmarkGroup = 'none';

    Object.entries(genderStats).forEach(([group, stats]) => {
      const rate = stats.total > 0 ? stats.hired / stats.total : 0;
      stats.selectionRate = Math.round(rate * 1000) / 10;
      if (stats.selectionRate > highestRate) {
        highestRate = stats.selectionRate;
        benchmarkGroup = group;
      }
    });

    const analysis = Object.entries(genderStats).map(([group, stats]) => {
      const ratio = highestRate > 0 ? Math.round((stats.selectionRate / highestRate) * 100) / 100 : 1;
      const isAdverseImpact = ratio < 0.8 && stats.total >= 5;

      return {
        group: group.replace(/_/g, ' '),
        totalApplicants: stats.total,
        hires: stats.hired,
        selectionRatePercent: stats.selectionRate,
        impactRatio: ratio,
        isBenchmark: group === benchmarkGroup,
        hasAdverseImpactNotice: isAdverseImpact,
      };
    });

    return {
      rule: 'EEOC Uniform Guidelines on Employee Selection Procedures (4/5ths Rule)',
      benchmarkGroup: benchmarkGroup.replace(/_/g, ' '),
      highestSelectionRatePercent: highestRate,
      groups: analysis,
    };
  }
}

module.exports = new EeoComplianceService();
