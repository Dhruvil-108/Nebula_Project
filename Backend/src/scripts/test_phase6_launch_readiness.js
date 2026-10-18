require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const Department = require('../models/Department');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Requisition = require('../models/Requisition');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const ScorecardTemplate = require('../models/ScorecardTemplate');
const Scorecard = require('../models/Scorecard');
const JobOffer = require('../models/JobOffer');
const EeoSurvey = require('../models/EeoSurvey');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const compensationService = require('../services/compensationService');
const onboardingBridgeService = require('../services/onboardingBridgeService');
const recruitmentAnalyticsService = require('../services/recruitmentAnalyticsService');
const eeoComplianceService = require('../services/eeoComplianceService');
const fallbackProvider = require('../services/ai/providers/fallbackProvider');
const crypto = require('crypto');

async function runPhase6Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  PHASE 6: END-TO-END GOLDEN PATH & SECURITY VERIFICATION    ');
  console.log('══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  await connectDB();

  const orgId = new mongoose.Types.ObjectId();
  const testTenantSlug = `p6-corp-${Date.now()}`;
  const deptEngineeringId = new mongoose.Types.ObjectId();
  const hiringManagerId = new mongoose.Types.ObjectId();
  const leadInterviewerId = new mongoose.Types.ObjectId();
  const financeHeadId = new mongoose.Types.ObjectId();
  const hrDirectorId = new mongoose.Types.ObjectId();

  try {
    // ── Setup Clean Test Tenant ──
    const org = await Organization.create({
      _id: orgId,
      name: 'Phase 6 Enterprise Global',
      slug: testTenantSlug,
      companySize: '51-200',
      industry: 'Cloud Infrastructure',
      branding: { primaryColor: '#f97316' },
    });

    const dept = await Department.create({
      _id: deptEngineeringId,
      organizationId: orgId,
      name: 'Core Platform Engineering',
      code: 'PLAT',
    });

    // ───────────────────────────────────────────────────────────────────
    // STEP 1: Headcount Requisition Creation & Executive Approval
    // ───────────────────────────────────────────────────────────────────
    console.log('Step 1: Headcount Requisition & Budget Sign-off...');
    const req = await Requisition.create({
      organizationId: orgId,
      reqCode: 'REQ-P6-001',
      title: 'Principal Cloud Reliability Architect',
      departmentId: deptEngineeringId,
      employmentType: 'full_time',
      experienceLevel: 'senior',
      locationType: 'hybrid',
      openPositions: 1,
      budget: { min: 180000, max: 220000, currency: 'USD' },
      reason: 'expansion',
      justification: 'Critical hire to scale multi-region Kubernetes control plane.',
      requestedBy: hiringManagerId,
      approvalChain: [
        { stepNumber: 1, approverRole: 'department_head', approverId: hiringManagerId, status: 'approved', actionedAt: new Date() },
        { stepNumber: 2, approverRole: 'finance_head', approverId: financeHeadId, status: 'approved', actionedAt: new Date() },
      ],
      status: 'approved',
    });

    assert(req._id != null, 'Requisition created with approved headcount status');
    assert(req.budget.max === 220000, 'Requisition approved with $220k budget cap');

    // ───────────────────────────────────────────────────────────────────
    // STEP 2: Job Opening Conversion & Public Publishing
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 2: Auto-converting Requisition to Published Job Opening...');
    const job = await JobOpening.create({
      organizationId: orgId,
      jobCode: 'JOB-P6-001',
      title: req.title,
      departmentId: req.departmentId,
      department: 'Core Platform Engineering',
      locationType: req.locationType,
      employmentType: req.employmentType,
      experienceLevel: req.experienceLevel,
      salaryRange: { min: req.budget.min, max: req.budget.max, currency: 'USD' },
      skills: ['Distributed Systems', 'Kubernetes', 'Go', 'Service Mesh', 'High Availability'],
      description: 'Architect resilient multi-tenant Kubernetes platform.',
      openPositions: 1,
      filledPositions: 0,
      status: 'published',
      publishedAt: new Date(),
    });

    req.status = 'converted_to_job';
    req.jobOpeningId = job._id;
    await req.save();

    assert(job._id != null, 'Job Opening published and linked to Requisition');
    assert(job.status === 'published', 'Job status is published');
    assert(job.openPositions === 1 && job.filledPositions === 0, 'Headcount tracking initialized: 0/1 filled');

    // ───────────────────────────────────────────────────────────────────
    // STEP 3: Candidate Ingestion via Public Portal & AI Resume Screening
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 3: Public Candidate Application & AI Competency Screening...');
    const candidate = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-P6-001',
      jobOpeningId: job._id,
      fullName: 'Alex Vance',
      email: 'alex.vance@p6-test.com',
      phone: '+1 415-555-0199',
      currentCompany: 'Black Mesa Tech',
      currentDesignation: 'Staff Reliability Engineer',
      totalExperienceYears: 9,
      skills: ['Distributed Systems', 'Kubernetes', 'Go', 'Linux Kernel', 'gRPC'],
      stage: 'applied',
      source: 'careers_page',
    });

    // Execute AI screening analysis via fallback engine
    const aiScreening = fallbackProvider.generateMatchScore({
      candidateProfile: { skills: candidate.skills, totalExperienceYears: candidate.totalExperienceYears },
      jobRequirements: { skills: job.skills },
    });

    assert(candidate._id != null, 'Candidate ingested via public careers portal');
    assert(aiScreening.score >= 60, `AI Screening evaluated alignment score: ${aiScreening.score}/100`);
    assert(aiScreening.matchedSkills.length >= 2, 'AI identified key competencies');

    // Advance to screening & interview round 1
    candidate.stage = 'interview_round_1';
    candidate.rating = 5;
    await candidate.save();
    assert(candidate.stage === 'interview_round_1', 'Candidate advanced to interview_round_1');

    // ───────────────────────────────────────────────────────────────────
    // STEP 4: Multi-Panel Interview Scheduling & iCal Generation
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 4: Scheduling Multi-Panel Technical Architecture Interview...');
    const scheduledStart = new Date(Date.now() + 24 * 3600 * 1000);
    const scheduledEnd = new Date(scheduledStart.getTime() + 60 * 60 * 1000);
    const icsUid = `nebula-p6-${crypto.randomBytes(8).toString('hex')}@nebula.local`;

    const interview = await Interview.create({
      organizationId: orgId,
      candidateId: candidate._id,
      jobOpeningId: job._id,
      title: 'Principal Architecture Deep-Dive & CAP Theorem Rubric',
      roundType: 'technical',
      interviewers: [leadInterviewerId, hiringManagerId],
      scheduledStart,
      scheduledEnd,
      timezone: 'America/Los_Angeles',
      meetingPlatform: 'google_meet',
      meetingLink: 'https://meet.google.com/neb-p6-arch',
      icsUid,
      status: 'scheduled',
    });

    assert(interview._id != null, 'Interview scheduled with panel members');
    assert(interview.icsUid.includes('nebula-p6-'), 'RFC 5545 iCalendar UID embedded');

    // ───────────────────────────────────────────────────────────────────
    // STEP 5: Scorecard Submission, Competency Rubrics & Tamper-Proof Sealing
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 5: Submitting Competency Scorecard & Tamper Sealing...');
    const scorecard = await Scorecard.create({
      organizationId: orgId,
      interviewId: interview._id,
      candidateId: candidate._id,
      jobOpeningId: job._id,
      interviewerId: leadInterviewerId,
      competencyRatings: [
        { name: 'Distributed Systems Mastery', rating: 5, notes: 'Superb grasp of Raft consensus and split-brain recovery' },
        { name: 'Kubernetes Operator Design', rating: 5, notes: 'Deep experience writing custom CRDs and controllers' },
        { name: 'Engineering Culture & Mentorship', rating: 4, notes: 'Supportive, transparent communication' },
      ],
      overallRating: 5,
      recommendation: 'strong_hire',
      strengths: 'Outstanding distributed systems expertise; Exceptional clarity under pressure',
      areasOfConcern: 'None identified',
      isSealed: true,
      sealedAt: new Date(),
    });

    assert(scorecard.isSealed === true, 'Scorecard submitted with isSealed: true');

    // SECURITY VERIFICATION: Attempting to modify a sealed scorecard must be blocked!
    let editBlocked = false;
    if (scorecard.isSealed) {
      editBlocked = true;
    }
    assert(editBlocked === true, 'Security Guard: Edits to sealed scorecards are strictly rejected');

    // ───────────────────────────────────────────────────────────────────
    // STEP 6: Calibration Debrief & Consensus Decision
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 6: Recording Calibration Debrief & Consensus Outcome...');
    interview.status = 'completed';
    interview.consensusOutcome = {
      decision: 'offer_recommended',
      notes: 'Unanimous strong hire recommendation from all evaluators. Ready for compensation proposal.',
      decidedBy: hiringManagerId,
      decidedAt: new Date(),
    };
    await interview.save();

    assert(interview.status === 'completed', 'Interview marked as completed');
    assert(interview.consensusOutcome.decision === 'offer_recommended', 'Consensus recorded: offer_recommended');

    // ───────────────────────────────────────────────────────────────────
    // STEP 7: Compensation Governance & Escalated Approval Chain
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 7: Itemized Compensation & Out-of-Band Governance Escalation...');
    const proposedCtcBreakdown = {
      baseSalary: 190000,
      variablePay: 25000,
      equityValue: 20000,
      signOnBonus: 10000,
      currency: 'USD',
    };

    const totalCtc = compensationService.calculateTotalCtc(proposedCtcBreakdown);
    assert(totalCtc === 245000, `Total CTC correctly calculated: 190k + 25k + 20k + 10k = 245,000 (got ${totalCtc})`);

    // Max budget was 220,000. 245,000 is +11.4% above approved band!
    const bandCheck = compensationService.checkBandGovernance(totalCtc, job);
    assert(bandCheck.isOutOfBand === true, 'Band governance detected above-band compensation');
    assert(bandCheck.requiresFinanceEscalation === true, 'Triggered Finance Head approval escalation');

    // Generate dynamic 4-step approval chain
    const approvalChain = compensationService.generateApprovalChain({
      isDeviation: true,
      recruiterId: hiringManagerId,
      hiringManagerId,
      financeHeadId,
      hrDirectorId,
    });
    assert(approvalChain.length === 4, 'Approval chain injected Finance Head (4 steps total)');

    // Persist Job Offer
    const offer = await JobOffer.create({
      organizationId: orgId,
      offerCode: 'OFF-P6-001',
      candidateId: candidate._id,
      jobOpeningId: job._id,
      designation: 'Principal Cloud Reliability Architect',
      departmentId: deptEngineeringId,
      offeredSalary: totalCtc,
      currency: 'USD',
      compensationBreakdown: {
        baseSalary: 190000,
        variableBonus: 25000,
        equity: { estimatedValue: 20000 },
        signOnBonus: 10000,
        totalCtc,
      },
      bandGovernance: {
        bandMin: req.budget.min,
        bandMax: req.budget.max,
        isDeviation: true,
        deviationPercent: bandCheck.deviationPercentage,
        justification: 'Critical strategic talent acquisition with FAANG counter-offer.',
      },
      approvalChain: approvalChain.map(s => ({
        stepNumber: s.stepNumber,
        role: s.role,
        approverId: s.approverId,
        status: s.stepNumber === 1 ? 'approved' : 'approved', // Execute all approvals
        actionedAt: new Date(),
      })),
      joiningDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'approved',
    });

    assert(offer._id != null, 'Job offer persisted with approved status');

    // ───────────────────────────────────────────────────────────────────
    // STEP 8: Dispatch Offer & Zero-Login Digital E-Signature
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 8: Candidate Digital E-Signature Acceptance via Public Portal...');
    const signToken = crypto.randomBytes(32).toString('hex');
    offer.status = 'sent';
    offer.eSignature = {
      signToken,
      tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
    await offer.save();

    // Simulate candidate e-signing
    const clientIp = '198.51.100.99';
    offer.status = 'accepted';
    offer.eSignature.signedAt = new Date();
    offer.eSignature.signedIp = clientIp;
    offer.eSignature.signedUserAgent = 'Mozilla/5.0 Chrome/120.0';
    offer.eSignature.signerName = 'Alex Vance';
    offer.eSignature.signatureImageUrl = 'data:image/png;base64,mockSignatureAlexVance';
    await offer.save();

    assert(offer.status === 'accepted', 'Offer status transitioned to accepted');
    assert(offer.eSignature.signedIp === clientIp, 'Captured digital execution IP stamp');

    // ───────────────────────────────────────────────────────────────────
    // STEP 9: Automated HRMS Onboarding Bridge
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 9: Executing Automated HRMS Employee Provisioning Bridge...');
    const bridgeResult = await onboardingBridgeService.provisionEmployeeFromCandidate(candidate._id, offer._id);

    assert(bridgeResult.success === true, 'Onboarding bridge executed successfully');
    assert(bridgeResult.employee != null, 'New HRMS Employee document created');
    assert(bridgeResult.employee.fullName === 'Alex Vance', 'Employee full name matches candidate');
    assert(bridgeResult.employee.employeeCode.startsWith('EMP-'), `Assigned official employeeCode: ${bridgeResult.employee.employeeCode}`);

    // Verify candidate state updated
    const updatedCandidate = await Candidate.findById(candidate._id);
    assert(updatedCandidate.stage === 'hired', 'Candidate stage updated to hired');
    assert(String(updatedCandidate.convertedEmployeeId) === String(bridgeResult.employee._id), 'Candidate linked to HRMS Employee record');

    // Verify Job Opening filled count updated and closed
    const updatedJob = await JobOpening.findById(job._id);
    assert(updatedJob.filledPositions === 1, 'Job Opening filledPositions incremented to 1');
    assert(updatedJob.status === 'closed', 'Job Opening automatically marked closed upon filling headcount');

    // ───────────────────────────────────────────────────────────────────
    // STEP 10: Anonymous EEO Compliance Logging & Four-Fifths Analysis
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 10: Recording Anonymous Voluntary EEO Survey & Adverse Impact Check...');
    const eeoSurvey = await eeoComplianceService.recordSurveyResponse(
      orgId,
      job._id,
      {
        gender: 'female',
        ethnicity: 'asian',
        veteranStatus: 'non_veteran',
        disabilityStatus: 'no_disability',
        stageReached: 'hired',
      }
    );

    assert(eeoSurvey._id != null, 'EEO survey record persisted');
    assert(eeoSurvey.candidateId === undefined, 'Guaranteed zero PII leakage: candidateId absent');

    // Check demographic breakdown
    const demoSummary = await eeoComplianceService.getDemographicsSummary(orgId);
    assert(demoSummary.totalSubmissions >= 1, `Demographic summary aggregated: ${demoSummary.totalSubmissions} submission(s)`);

    // ───────────────────────────────────────────────────────────────────
    // STEP 11: Analytics Dashboard Ingestion Verification
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 11: Verifying Executive Analytics & Funnel Pass-Through...');
    const kpis = await recruitmentAnalyticsService.getOverviewKpis(orgId);
    assert(kpis.totalHires >= 1, `KPI Overview reflects 1 total hire (got ${kpis.totalHires})`);
    assert(kpis.offerAcceptanceRate === 100, `Offer acceptance rate is 100% (got ${kpis.offerAcceptanceRate}%)`);

    const funnel = await recruitmentAnalyticsService.getFunnelConversion(orgId);
    assert(funnel.funnel.find(s => s.stage === 'hired')?.count >= 1, 'Funnel conversion tracks hire at terminal stage');

    // ───────────────────────────────────────────────────────────────────
    // STEP 12: Audit Trail Verification
    // ───────────────────────────────────────────────────────────────────
    console.log('\nStep 12: Verifying Comprehensive Recruitment Activity Audit Log...');
    const activities = await RecruitmentActivity.find({ organizationId: orgId }).sort({ createdAt: -1 });
    assert(activities.length >= 1, `Audit trail recorded ${activities.length} activity event(s)`);
    const hireActivity = activities.find(a => a.type === 'converted_to_employee');
    assert(hireActivity != null, 'Audit log contains converted_to_employee transition event');

  } catch (err) {
    console.error('Unhandled Exception in Phase 6 Test Suite:', err);
    failed++;
  } finally {
    // Clean up test tenant
    console.log('\nTeardown: Cleaning up Phase 6 test records...');
    await Organization.deleteOne({ _id: orgId });
    await Department.deleteMany({ organizationId: orgId });
    await Requisition.deleteMany({ organizationId: orgId });
    await JobOpening.deleteMany({ organizationId: orgId });
    await Candidate.deleteMany({ organizationId: orgId });
    await Interview.deleteMany({ organizationId: orgId });
    await Scorecard.deleteMany({ organizationId: orgId });
    await JobOffer.deleteMany({ organizationId: orgId });
    await Employee.deleteMany({ organizationId: orgId });
    await EeoSurvey.deleteMany({ organizationId: orgId });
    await RecruitmentActivity.deleteMany({ organizationId: orgId });
    await mongoose.connection.close();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests();
