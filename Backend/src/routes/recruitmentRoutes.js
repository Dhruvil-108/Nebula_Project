const express = require('express');
const router = express.Router();

const jobOpeningController = require('../controllers/jobOpeningController');
const candidateController = require('../controllers/candidateController');
const recruitmentPipelineController = require('../controllers/recruitmentPipelineController');
const interviewController = require('../controllers/interviewController');
const scorecardController = require('../controllers/scorecardController');
const offerController = require('../controllers/offerController');
const hiringHrmsBridgeController = require('../controllers/hiringHrmsBridgeController');
const { getRecruitmentSummary } = require('../controllers/recruitmentSummaryController');
const recruitmentAiController = require('../controllers/recruitmentAiController');

const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// ── Public Careers Portal Endpoints (Unauthenticated, rate-limited) ──
const publicCareersController = require('../controllers/publicCareersController');
const publicOfferController = require('../controllers/publicOfferController');
const eeoComplianceController = require('../controllers/eeoComplianceController');
const recruitmentAnalyticsController = require('../controllers/recruitmentAnalyticsController');
const recruiterCopilotController = require('../controllers/recruiterCopilotController');

router.get('/public/:tenantSlug/info', publicCareersController.getPublicTenantInfo);
router.get('/public/:tenantSlug/jobs', publicCareersController.getPublicJobs);
router.get('/public/:tenantSlug/jobs/:id', publicCareersController.getPublicJobById);
router.post('/public/:tenantSlug/jobs/:id/apply', publicCareersController.applyPublicJob);
router.post('/public/:tenantSlug/jobs/:jobId/eeo', eeoComplianceController.submitPublicEeoSurvey);

// ── Public Candidate Offer E-Signature Portal ──
router.get('/public/offers/:token', publicOfferController.getPublicOffer);
router.get('/public/offers/:token/pdf', publicOfferController.downloadPublicOfferPdf);
router.post('/public/offers/:token/sign', publicOfferController.signPublicOffer);
router.post('/public/offers/:token/decline', publicOfferController.declinePublicOffer);

// Every internal Recruitment route below requires an authenticated session
router.use(requireAuth);

// ── Summary / KPIs (view) ──
router.get('/summary', requireModuleAccess('recruitment', 'view'), getRecruitmentSummary);

// ── Job Openings ──
router.get('/jobs', requireModuleAccess('recruitment', 'view'), jobOpeningController.getJobs);
router.post('/jobs', requireModuleAccess('recruitment', 'create'), jobOpeningController.createJob);
router.get('/jobs/:id', requireModuleAccess('recruitment', 'view'), jobOpeningController.getJobById);
router.patch('/jobs/:id', requireModuleAccess('recruitment', 'edit'), jobOpeningController.updateJob);
router.patch('/jobs/:id/status', requireModuleAccess('recruitment', 'edit'), jobOpeningController.updateJobStatus);
router.delete('/jobs/:id', requireModuleAccess('recruitment', 'delete'), jobOpeningController.deleteJob);
router.post('/jobs/:id/linkedin-post', requireModuleAccess('recruitment', 'view'), recruitmentAiController.generateLinkedInPost);

// ── ATS Pipeline (Kanban) ──
router.get('/pipeline', requireModuleAccess('recruitment', 'view'), recruitmentPipelineController.getRecruitmentPipeline);
router.patch('/candidates/:id/stage', requireModuleAccess('recruitment', 'edit'), recruitmentPipelineController.moveCandidateStage);

// ── Candidates ──
router.get('/candidates', requireModuleAccess('recruitment', 'view'), candidateController.getCandidates);
router.post('/candidates', requireModuleAccess('recruitment', 'create'), candidateController.createCandidate);
router.get('/candidates/:id', requireModuleAccess('recruitment', 'view'), candidateController.getCandidateById);
router.patch('/candidates/:id', requireModuleAccess('recruitment', 'edit'), candidateController.updateCandidate);
router.delete('/candidates/:id', requireModuleAccess('recruitment', 'delete'), candidateController.deleteCandidate);

// ── Interviews ──
router.get('/interviews', requireModuleAccess('recruitment', 'view'), interviewController.getInterviews);
router.post('/interviews', requireModuleAccess('recruitment', 'create'), interviewController.scheduleInterview);
router.patch('/interviews/:id', requireModuleAccess('recruitment', 'edit'), interviewController.updateInterview);
router.patch('/interviews/:id/reschedule', requireModuleAccess('recruitment', 'edit'), interviewController.rescheduleInterview);
router.get('/interviews/:id/ics', requireModuleAccess('recruitment', 'view'), interviewController.getInterviewIcs);
router.post('/interviews/:id/scorecard', requireModuleAccess('recruitment', 'edit'), interviewController.submitScorecard);
router.delete('/interviews/:id', requireModuleAccess('recruitment', 'delete'), interviewController.cancelInterview);

// ── Multi-Interviewer Scorecards & Calibration ──
router.get('/interviews/:interviewId/scorecards', requireModuleAccess('recruitment', 'view'), scorecardController.getInterviewScorecards);
router.post('/interviews/:interviewId/scorecards', requireModuleAccess('recruitment', 'edit'), scorecardController.submitScorecard);
router.post('/scorecards/:id/seal', requireModuleAccess('recruitment', 'edit'), scorecardController.sealScorecard);
router.get('/interviews/:interviewId/debrief', requireModuleAccess('recruitment', 'view'), scorecardController.getInterviewDebrief);
router.post('/interviews/:interviewId/consensus', requireModuleAccess('recruitment', 'approve'), scorecardController.recordConsensus);
router.get('/settings/scorecard-templates', requireModuleAccess('recruitment', 'view'), scorecardController.getScorecardTemplates);
router.post('/settings/scorecard-templates', requireModuleAccess('recruitment', 'edit'), scorecardController.createScorecardTemplate);

// ── Offers & Compensation Governance ──
router.get('/offers', requireModuleAccess('recruitment', 'view'), offerController.getOffers);
router.post('/offers', requireModuleAccess('recruitment', 'create'), offerController.createOffer);
router.post('/offers/:id/submit', requireModuleAccess('recruitment', 'create'), offerController.submitOfferForApproval);
router.post('/offers/:id/approve-step', requireModuleAccess('recruitment', 'approve'), offerController.approveOfferStep);
router.post('/offers/:id/reject-step', requireModuleAccess('recruitment', 'approve'), offerController.rejectOfferStep);
router.post('/offers/:id/send', requireModuleAccess('recruitment', 'approve'), offerController.sendOfferToCandidate);
router.get('/offers/:id/letter', requireModuleAccess('recruitment', 'view'), offerController.getOfferLetterHtml);
router.get('/offers/:id/pdf', requireModuleAccess('recruitment', 'view'), offerController.downloadOfferLetterPdf);
router.patch('/offers/:id/status', requireModuleAccess('recruitment', 'approve'), offerController.updateOfferStatus);

// ── HRMS Bridge: Onboard Hired Candidate as Employee ──
router.post(
  '/candidates/:id/onboard-employee',
  requireModuleAccess('recruitment', 'approve'),
  hiringHrmsBridgeController.onboardCandidateToEmployee
);

// ── Requisitions & Headcount ──
const requisitionController = require('../controllers/requisitionController');
router.get('/requisitions', requireModuleAccess('recruitment', 'view'), requisitionController.getRequisitions);
router.post('/requisitions', requireModuleAccess('recruitment', 'create'), requisitionController.createRequisition);
router.get('/requisitions/:id', requireModuleAccess('recruitment', 'view'), requisitionController.getRequisitionById);
router.post('/requisitions/:id/submit', requireModuleAccess('recruitment', 'create'), requisitionController.submitRequisition);
router.post('/requisitions/:id/approve', requireModuleAccess('recruitment', 'approve'), requisitionController.approveRequisitionStep);
router.post('/requisitions/:id/reject', requireModuleAccess('recruitment', 'approve'), requisitionController.rejectRequisitionStep);
router.post('/requisitions/:id/convert-to-job', requireModuleAccess('recruitment', 'create'), requisitionController.convertToJob);

// ── Applications & Bulk Operations ──
const applicationController = require('../controllers/applicationController');
router.get('/applications', requireModuleAccess('recruitment', 'view'), applicationController.getApplications);
router.get('/applications/:id', requireModuleAccess('recruitment', 'view'), applicationController.getApplicationById);
router.patch('/applications/:id/stage', requireModuleAccess('recruitment', 'edit'), applicationController.moveApplicationStage);
router.post('/applications/bulk-move', requireModuleAccess('recruitment', 'edit'), applicationController.bulkMoveApplications);
router.post('/applications/bulk-reject', requireModuleAccess('recruitment', 'edit'), applicationController.bulkRejectApplications);
router.post('/applications/bulk-tag', requireModuleAccess('recruitment', 'edit'), applicationController.bulkTagApplications);

// ── Talent Pools CRM ──
const talentPoolController = require('../controllers/talentPoolController');
router.get('/talent-pools', requireModuleAccess('recruitment', 'view'), talentPoolController.getTalentPools);
router.post('/talent-pools', requireModuleAccess('recruitment', 'create'), talentPoolController.createTalentPool);
router.get('/talent-pools/:id', requireModuleAccess('recruitment', 'view'), talentPoolController.getTalentPoolById);
router.post('/talent-pools/:id/candidates', requireModuleAccess('recruitment', 'edit'), talentPoolController.addCandidatesToPool);
router.delete('/talent-pools/:id/candidates', requireModuleAccess('recruitment', 'edit'), talentPoolController.removeCandidatesFromPool);
router.delete('/talent-pools/:id', requireModuleAccess('recruitment', 'delete'), talentPoolController.deleteTalentPool);

// ── Employee Referrals ──
const referralController = require('../controllers/referralController');
router.get('/referrals', requireModuleAccess('recruitment', 'view'), referralController.getReferrals);
router.post('/referrals', requireModuleAccess('recruitment', 'create'), referralController.createReferral);
router.patch('/referrals/:id/status', requireModuleAccess('recruitment', 'approve'), referralController.updateReferralStatus);

// ── AI Suite Endpoints ──
router.post('/jobs/:id/social-posts', requireModuleAccess('recruitment', 'view'), recruitmentAiController.generateMultiChannelPosts);
router.post('/ai/parse-resume', requireModuleAccess('recruitment', 'view'), recruitmentAiController.parseResume);
router.post('/applications/:id/match-score', requireModuleAccess('recruitment', 'view'), recruitmentAiController.calculateMatchScore);
router.post('/ai/generate-jd', requireModuleAccess('recruitment', 'view'), recruitmentAiController.generateJobDescription);
router.post('/interviews/:id/question-kit', requireModuleAccess('recruitment', 'view'), recruitmentAiController.generateInterviewQuestionKit);
router.post('/ai/question-kit', requireModuleAccess('recruitment', 'view'), recruitmentAiController.generateInterviewQuestionKit);

// ── Settings, Pipeline Templates & Catalogs ──
const recruitmentSettingsController = require('../controllers/recruitmentSettingsController');
const pipelineTemplateController = require('../controllers/pipelineTemplateController');
router.get('/settings', requireModuleAccess('recruitment', 'view'), recruitmentSettingsController.getSettings);
router.patch('/settings', requireModuleAccess('recruitment', 'edit'), recruitmentSettingsController.updateSettings);
router.get('/settings/pipelines', requireModuleAccess('recruitment', 'view'), pipelineTemplateController.getPipelineTemplates);
router.post('/settings/pipelines', requireModuleAccess('recruitment', 'edit'), pipelineTemplateController.createPipelineTemplate);
router.patch('/settings/pipelines/:id', requireModuleAccess('recruitment', 'edit'), pipelineTemplateController.updatePipelineTemplate);
router.get('/settings/rejection-reasons', requireModuleAccess('recruitment', 'view'), pipelineTemplateController.getRejectionReasons);
router.post('/settings/rejection-reasons', requireModuleAccess('recruitment', 'edit'), pipelineTemplateController.createRejectionReason);
router.get('/ai/runs', requireModuleAccess('recruitment', 'view'), recruitmentSettingsController.getAiRuns);
router.get('/queue/dead-letter', requireModuleAccess('recruitment', 'view'), recruitmentSettingsController.getDeadLetterJobs);

// ── Phase 5: Analytics, Reporting & EEO Compliance ──
router.get('/analytics/overview', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.getOverview);
router.get('/analytics/funnel', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.getFunnel);
router.get('/analytics/sources', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.getSources);
router.get('/analytics/velocity', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.getVelocity);
router.get('/compliance/eeo', requireModuleAccess('recruitment', 'view'), eeoComplianceController.getDemographics);
router.get('/compliance/adverse-impact', requireModuleAccess('recruitment', 'view'), eeoComplianceController.getAdverseImpact);
router.post('/reports/export', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.exportReport);
router.post('/search/semantic', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.semanticSearch);
router.get('/jobs/:jobId/silver-medalists', requireModuleAccess('recruitment', 'view'), recruitmentAnalyticsController.getSilverMedalists);
router.post('/ai/copilot', requireModuleAccess('recruitment', 'view'), recruiterCopilotController.synthesizeCopilot);

module.exports = router;
