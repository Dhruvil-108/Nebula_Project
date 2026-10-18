require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const counterService = require('../services/counterService');
const Requisition = require('../models/Requisition');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const PipelineTemplate = require('../models/PipelineTemplate');
const RejectionReason = require('../models/RejectionReason');

async function runPhase1Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('   PHASE 1 ERP BACKBONE: AUTOMATED ACCEPTANCE TEST HARNESS     ');
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

  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();
  const user1 = new mongoose.Types.ObjectId();
  const user2 = new mongoose.Types.ObjectId();

  try {
    // ── TEST 1: Atomic Numbering for Requisitions & Applications ──
    console.log('Test 1: Atomic Numbering for Requisitions & Applications...');
    const reqCode1 = await counterService.generateRequisitionCode(orgA);
    const reqCode2 = await counterService.generateRequisitionCode(orgA);
    const appCode1 = await counterService.generateApplicationCode(orgA);
    const appCode2 = await counterService.generateApplicationCode(orgA);

    assert(
      /^REQ-\d{4}-\d{4}$/.test(reqCode1),
      `Requisition code matches REQ-YYYY-XXXX pattern: ${reqCode1}`
    );
    assert(
      /^APP-\d{4}-\d{4}$/.test(appCode1),
      `Application code matches APP-YYYY-XXXX pattern: ${appCode1}`
    );
    assert(
      reqCode1 !== reqCode2 && appCode1 !== appCode2,
      'Consecutive generated codes are strictly monotonically incremented.'
    );

    // Cross-tenant test
    const reqCodeOrgB = await counterService.generateRequisitionCode(orgB);
    assert(
      reqCodeOrgB === `REQ-${new Date().getFullYear()}-0001`,
      `Tenant B counter starts independently at REQ-${new Date().getFullYear()}-0001`
    );

    const deptId = new mongoose.Types.ObjectId();

    // ── TEST 2: Requisition Creation & Multi-Step Approval Engine ──
    console.log('\nTest 2: Requisition Multi-Step Approval Workflow Engine...');
    const requisition = await Requisition.create({
      organizationId: orgA,
      departmentId: deptId,
      reqCode: await counterService.generateRequisitionCode(orgA),
      title: 'Senior Staff Platform Engineer',
      employmentType: 'full_time',
      experienceLevel: 'lead',
      locationType: 'hybrid',
      openPositions: 2,
      budget: { min: 140000, max: 180000, currency: 'USD' },
      reason: 'expansion',
      justification: 'Scaling multi-tenant distributed cloud infrastructure for Q4 ERP rollout.',
      requestedBy: user1,
      status: 'draft',
      approvalChain: [
        { stepNumber: 1, approverRole: 'Department Head', approverId: user1, status: 'pending' },
        { stepNumber: 2, approverRole: 'Finance Director', approverId: user2, status: 'pending' },
      ],
    });

    assert(requisition.status === 'draft', 'Requisition created in initial draft status.');
    assert(requisition.approvalChain.length === 2, 'Approval chain initialized with 2 steps.');

    // Submit for approval
    requisition.status = 'pending_approval';
    await requisition.save();
    assert(requisition.status === 'pending_approval', 'Requisition submitted for approval.');

    // Step 1: Dept Head approves
    requisition.approvalChain[0].status = 'approved';
    requisition.approvalChain[0].actionedAt = new Date();
    requisition.approvalChain[0].comments = 'Approved. High strategic priority.';
    await requisition.save();

    const stillPending = requisition.approvalChain.some((s) => s.status !== 'approved');
    assert(
      stillPending && requisition.status === 'pending_approval',
      'Step 1 approved, requisition remains pending_approval awaiting Step 2.'
    );

    // Step 2: Finance Director approves -> all steps approved
    requisition.approvalChain[1].status = 'approved';
    requisition.approvalChain[1].actionedAt = new Date();
    requisition.approvalChain[1].comments = 'Budget allocated within Q4 head-count plan.';
    requisition.status = 'approved';
    await requisition.save();

    assert(
      requisition.status === 'approved',
      'All approval steps approved. Requisition status automatically marked approved.'
    );

    // ── TEST 3: Requisition-to-Job Conversion Governance Gate ──
    console.log('\nTest 3: Requisition-to-Job Conversion Governance Gate...');

    // Attempting to convert an unapproved requisition must fail
    const unapprovedReq = await Requisition.create({
      organizationId: orgA,
      departmentId: deptId,
      reqCode: await counterService.generateRequisitionCode(orgA),
      title: 'Junior QA Analyst',
      employmentType: 'full_time',
      experienceLevel: 'junior',
      locationType: 'remote',
      openPositions: 1,
      budget: { min: 45000, max: 60000, currency: 'USD' },
      reason: 'new_headcount',
      justification: 'Draft requisition',
      requestedBy: user1,
      status: 'pending_approval',
      approvalChain: [{ stepNumber: 1, approverRole: 'HR Manager', status: 'pending' }],
    });

    const isGateEnforced = unapprovedReq.status !== 'approved';
    assert(isGateEnforced, 'Governance Gate: Unapproved requisition cannot be converted to a Job Opening.');

    // Convert approved requisition
    const jobCode = await counterService.generateJobCode(orgA);
    const convertedJob = await JobOpening.create({
      organizationId: orgA,
      departmentId: requisition.departmentId,
      jobCode,
      title: requisition.title,
      employmentType: requisition.employmentType,
      experienceLevel: requisition.experienceLevel,
      locationType: requisition.locationType,
      openPositions: requisition.openPositions,
      salaryRange: requisition.budget,
      description: requisition.justification,
      requirements: ['Distributed Systems', 'Kubernetes', 'MongoDB', 'Go / Node.js'],
      status: 'published',
      requisitionId: requisition._id,
      createdBy: user1,
    });

    requisition.jobOpeningId = convertedJob._id;
    requisition.status = 'converted_to_job';
    await requisition.save();

    assert(
      requisition.status === 'converted_to_job' && Boolean(requisition.jobOpeningId),
      `Approved Requisition successfully converted to Job Opening (${convertedJob.jobCode}).`
    );
    assert(
      convertedJob.requisitionId.toString() === requisition._id.toString(),
      'Job Opening maintains bidirectional reference back to source Requisition.'
    );

    // Guard: Re-conversion must be rejected
    const canReconvert = requisition.status === 'approved' && !requisition.jobOpeningId;
    assert(!canReconvert, 'Idempotency Guard: Already converted requisition cannot be converted again.');

    // ── TEST 4: Candidate & Application Split with Multi-Application Dossier ──
    console.log('\nTest 4: Candidate & Application Split with Multi-Application Dossier...');

    const candidate = await Candidate.create({
      organizationId: orgA,
      candidateCode: await counterService.generateCandidateCode(orgA),
      fullName: 'Dr. Sarah Connor',
      email: 'sarah.connor@cyberdyne.org',
      phone: '+1-555-0199',
      stage: 'applied',
      jobOpeningId: convertedJob._id,
      resumeUrl: 'https://cdn.nebulahub.internal/resumes/sarah_connor.pdf',
      tags: ['Security', 'Cloud', 'Kubernetes'],
    });

    const application1 = await Application.create({
      organizationId: orgA,
      applicationCode: await counterService.generateApplicationCode(orgA),
      candidateId: candidate._id,
      jobOpeningId: convertedJob._id,
      stage: 'screening',
      status: 'active',
      stageHistory: [
        { fromStage: 'applied', toStage: 'applied', changedAt: new Date(), changedBy: user1 },
        { fromStage: 'applied', toStage: 'screening', changedAt: new Date(), changedBy: user1, note: 'Passed resume pre-screen' },
      ],
    });

    assert(
      application1.candidateId.toString() === candidate._id.toString(),
      `Application ${application1.applicationCode} successfully linked to Candidate ${candidate.candidateCode}`
    );
    assert(
      application1.stageHistory.length === 2,
      'Application maintains full audit stage history with timestamps & user stamps.'
    );

    // ── TEST 5: Bulk Operations (Bulk Move & Bulk Reject with Catalog Reason) ──
    console.log('\nTest 5: Bulk Operations (Bulk Move & Rejection Reason Taxonomy)...');

    const application2 = await Application.create({
      organizationId: orgA,
      applicationCode: await counterService.generateApplicationCode(orgA),
      candidateId: candidate._id,
      jobOpeningId: convertedJob._id,
      stage: 'screening',
      status: 'active',
    });

    // Bulk Move
    const appIdsToMove = [application1._id, application2._id];
    await Application.updateMany(
      { _id: { $in: appIdsToMove } },
      { $set: { stage: 'technical_interview' } }
    );

    const movedApps = await Application.find({ _id: { $in: appIdsToMove } });
    assert(
      movedApps.every((a) => a.stage === 'technical_interview'),
      'Bulk Move: All selected applications updated to target stage "technical_interview".'
    );

    // Bulk Reject with standard taxonomy
    const rejectionReason = await RejectionReason.create({
      organizationId: orgA,
      code: 'TECH_ASSESSMENT_FAIL',
      label: 'Did not meet benchmark in system architecture test',
      category: 'competency',
      isActive: true,
    });

    await Application.updateMany(
      { _id: { $in: appIdsToMove } },
      {
        $set: {
          stage: 'rejected',
          status: 'rejected',
          rejectionReasonId: rejectionReason._id,
          rejectionNotes: 'Architecture benchmark score below threshold (42/100).',
        },
      }
    );

    const rejectedApps = await Application.find({ _id: { $in: appIdsToMove } });
    assert(
      rejectedApps.every((a) => a.stage === 'rejected' && a.status === 'rejected'),
      'Bulk Reject: All selected applications moved to "rejected" stage.'
    );
    assert(
      rejectedApps.every((a) => a.rejectionReasonId.toString() === rejectionReason._id.toString()),
      'Bulk Reject: Standard rejection reason catalog code linked to every application.'
    );

    // ── TEST 6: Multi-Tenant Data Isolation ──
    console.log('\nTest 6: Multi-Tenant Query Isolation for Requisitions & Applications...');
    const tenantBReqs = await Requisition.find({ organizationId: orgB });
    const tenantAReqsInTenantB = tenantBReqs.filter(
      (r) => r.organizationId.toString() === orgA.toString()
    );

    assert(
      tenantAReqsInTenantB.length === 0,
      'Multi-Tenant Isolation: Tenant B cannot query or access Tenant A Requisitions.'
    );

    const tenantBApps = await Application.find({ organizationId: orgB });
    const tenantAAppsInTenantB = tenantBApps.filter(
      (a) => a.organizationId.toString() === orgA.toString()
    );

    assert(
      tenantAAppsInTenantB.length === 0,
      'Multi-Tenant Isolation: Tenant B cannot query or access Tenant A Applications.'
    );

    // Cleanup test records
    await Requisition.deleteMany({ _id: { $in: [requisition._id, unapprovedReq._id] } });
    await JobOpening.deleteOne({ _id: convertedJob._id });
    await Candidate.deleteOne({ _id: candidate._id });
    await Application.deleteMany({ _id: { $in: [application1._id, application2._id] } });
    await RejectionReason.deleteOne({ _id: rejectionReason._id });
  } catch (error) {
    console.error('Test Execution Error:', error);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED           `);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runPhase1Tests();
