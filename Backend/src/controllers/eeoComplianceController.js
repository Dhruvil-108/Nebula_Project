const eeoComplianceService = require('../services/eeoComplianceService');
const Organization = require('../models/Organization');

// POST /api/v1/recruitment/public/careers/:tenantSlug/jobs/:jobId/eeo
const submitPublicEeoSurvey = async (req, res) => {
  try {
    const { tenantSlug, jobId } = req.params;
    const org = await Organization.findOne({
      $or: [{ slug: tenantSlug.toLowerCase() }, { companyId: tenantSlug.toUpperCase() }],
    }).lean();

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const survey = await eeoComplianceService.recordSurveyResponse(org._id, jobId, req.body);
    return res.status(201).json({
      success: true,
      message: 'Anonymous voluntary EEO demographic survey recorded.',
      id: survey._id,
    });
  } catch (err) {
    console.error('[eeoComplianceController.submitPublicEeoSurvey] Error:', err);
    return res.status(500).json({ error: 'Failed to record EEO survey response.' });
  }
};

// GET /api/v1/recruitment/compliance/eeo
const getDemographics = async (req, res) => {
  try {
    const summary = await eeoComplianceService.getDemographicsSummary(req.organizationId);
    return res.json(summary);
  } catch (err) {
    console.error('[eeoComplianceController.getDemographics] Error:', err);
    return res.status(500).json({ error: 'Failed to retrieve EEO demographics.' });
  }
};

// GET /api/v1/recruitment/compliance/adverse-impact
const getAdverseImpact = async (req, res) => {
  try {
    const impact = await eeoComplianceService.calculateAdverseImpact(req.organizationId);
    return res.json(impact);
  } catch (err) {
    console.error('[eeoComplianceController.getAdverseImpact] Error:', err);
    return res.status(500).json({ error: 'Failed to calculate adverse impact analysis.' });
  }
};

module.exports = {
  submitPublicEeoSurvey,
  getDemographics,
  getAdverseImpact,
};
