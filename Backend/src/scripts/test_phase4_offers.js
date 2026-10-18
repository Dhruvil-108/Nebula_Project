require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const JobOffer = require('../models/JobOffer');
const Department = require('../models/Department');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const compensationService = require('../services/compensationService');
const offerLetterService = require('../services/offerLetterService');
const crypto = require('crypto');

async function runPhase4Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  PHASE 4 OFFERS, E-SIGN & GOVERNANCE: ACCEPTANCE TESTS      ');
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
  const recruiterId = new mongoose.Types.ObjectId();
  const hiringManagerId = new mongoose.Types.ObjectId();
  const financeHeadId = new mongoose.Types.ObjectId();
  const hrDirectorId = new mongoose.Types.ObjectId();

  try {
    // ── TEST 1: Itemized CTC Calculation ──
    console.log('Test 1: Itemized CTC Calculation Service...');
    const breakdown1 = {
      baseSalary: 120000,
      variablePay: 20000,
      equityValue: 30000,
      signOnBonus: 10000,
      relocation: 5000,
      allowances: 15000,
      currency: 'USD',
    };
    const totalCtc1 = compensationService.calculateTotalCtc(breakdown1);
    assert(totalCtc1 === 200000, `Total CTC correctly summed 120k + 20k + 30k + 10k + 5k + 15k = 200,000 (got ${totalCtc1})`);

    // ── TEST 2: Band Governance - Within Band ──
    console.log('\nTest 2: Band Governance - Within Band Verification...');
    const jobWithinBand = {
      salaryRange: {
        min: 100000,
        max: 220000,
        currency: 'USD',
      },
    };
    const govWithin = compensationService.checkBandGovernance(totalCtc1, jobWithinBand);
    assert(govWithin.isOutOfBand === false, 'Detected within approved band');
    assert(govWithin.deviationPercentage === 0, 'Deviation percentage is 0%');
    assert(govWithin.requiresFinanceEscalation === false, 'No finance escalation required');

    // ── TEST 3: Band Governance - Out-of-Band Deviation & Escalation ──
    console.log('\nTest 3: Band Governance - Out-of-Band Deviation & Escalation...');
    const jobExceededBand = {
      salaryRange: {
        min: 100000,
        max: 160000,
        currency: 'USD',
      },
    };
    const govExceeded = compensationService.checkBandGovernance(totalCtc1, jobExceededBand);
    assert(govExceeded.isOutOfBand === true, 'Correctly flagged as out-of-band');
    assert(govExceeded.deviationPercentage === 25, `Calculated +25% deviation from 160k max to 200k (got ${govExceeded.deviationPercentage}%)`);
    assert(govExceeded.requiresFinanceEscalation === true, 'Requires Finance escalation flag set');

    // ── TEST 4: Dynamic Approval Chain Generation (Standard vs Escalation) ──
    console.log('\nTest 4: Dynamic Approval Chain Generation...');
    const chainStandard = compensationService.generateApprovalChain({
      isOutOfBand: false,
      recruiterId,
      hiringManagerId,
      hrDirectorId,
    });
    assert(chainStandard.length === 3, 'Standard chain has 3 steps (recruiter, hiring_manager, hr_director)');
    assert(chainStandard[0].role === 'recruiter' && chainStandard[0].status === 'approved', 'Step 1: Recruiter initiation approved');
    assert(chainStandard[1].role === 'hiring_manager' && chainStandard[1].status === 'pending', 'Step 2: Hiring Manager pending');
    assert(chainStandard[2].role === 'hr_director' && chainStandard[2].status === 'pending', 'Step 3: HR Director pending');

    const chainEscalated = compensationService.generateApprovalChain({
      isOutOfBand: true,
      recruiterId,
      hiringManagerId,
      hrDirectorId,
    });
    assert(chainEscalated.length === 4, 'Escalated chain has 4 steps (+ finance_head injected)');
    assert(chainEscalated[1].role === 'hiring_manager', 'Step 2: Hiring Manager');
    assert(chainEscalated[2].role === 'finance_head', 'Step 3: Finance Head injected for budget overrun');
    assert(chainEscalated[3].role === 'hr_director', 'Step 4: HR Director final approval');

    // ── TEST 5: Branded HTML Offer Letter Generation ──
    console.log('\nTest 5: Branded HTML Offer Letter Generator...');
    const mockOffer = {
      offerCode: 'OFF-TEST-001',
      designation: 'Principal Systems Architect',
      joiningDate: new Date('2026-11-01'),
      validUntil: new Date('2026-10-31'),
      currency: 'USD',
      offeredSalary: 200000,
      compensationBreakdown: breakdown1,
      benefits: ['Medical & Dental', 'Stock Options', 'Relocation Allowance'],
      notes: 'Contingent upon background check',
      bandGovernance: govExceeded,
      eSignature: {
        signedAt: null,
      },
    };
    const mockCandidate = {
      fullName: 'Dr. Jane Doe',
      email: 'jane.doe@example.com',
    };
    const mockOrg = {
      name: 'Nebula Enterprise Inc.',
      logo: 'https://example.com/logo.png',
    };

    const letterHtml = offerLetterService.generateOfferLetterHtml({
      offer: mockOffer,
      candidate: mockCandidate,
      organization: mockOrg,
    });
    assert(typeof letterHtml === 'string' && letterHtml.includes('OFF-TEST-001'), 'HTML contains offer code');
    assert(letterHtml.includes('Principal Systems Architect'), 'HTML contains designation');
    assert(letterHtml.includes('Dr. Jane Doe'), 'HTML contains candidate name');
    assert(letterHtml.includes('Nebula Enterprise Inc.'), 'HTML contains organization name');
    assert(letterHtml.includes('200,000'), 'HTML contains formatted CTC breakdown');
    assert(letterHtml.includes('PENDING DIGITAL SIGNATURE'), 'HTML shows pending digital signature watermark block');

    // ── TEST 6: JobOffer Mongoose Model & Document Lifecycle ──
    console.log('\nTest 6: JobOffer Mongoose Model Creation & Indexing...');
    const jobDoc = await JobOpening.create({
      organizationId: orgId,
      jobCode: 'JOB-TEST-P4',
      title: 'Principal Systems Architect',
      departmentId: new mongoose.Types.ObjectId(),
      hiringManagerId,
      salaryRange: { min: 140000, max: 180000, currency: 'USD' },
      status: 'published',
    });

    const candidateDoc = await Candidate.create({
      organizationId: orgId,
      candidateCode: 'CAN-TEST-P4',
      fullName: 'Alex River',
      email: `alex.river.${Date.now()}@test.com`,
      phone: '+15550199',
      jobOpeningId: jobDoc._id,
      currentStage: 'offer_sent',
    });

    const counterService = require('../services/counterService');
    const offerCode = await counterService.generateOfferCode(orgId);

    const offerDoc = await JobOffer.create({
      organizationId: orgId,
      offerCode,
      candidateId: candidateDoc._id,
      jobOpeningId: jobDoc._id,
      designation: 'Principal Systems Architect',
      departmentId: jobDoc.departmentId,
      offeredSalary: totalCtc1,
      currency: 'USD',
      joiningDate: new Date('2026-11-15'),
      validUntil: new Date('2026-10-31'),
      compensationBreakdown: breakdown1,
      bandGovernance: govExceeded,
      approvalChain: chainEscalated,
      currentApprovalStep: 1, // hiring_manager
      status: 'pending_approval',
    });

    assert(offerDoc.offerCode.startsWith('OFF-'), `Generated unique offerCode: ${offerDoc.offerCode}`);
    assert(offerDoc.status === 'pending_approval', 'Initial status is pending_approval');
    assert(offerDoc.approvalChain.length === 4, 'Persisted 4 approval steps');

    // ── TEST 7: Multi-Step Approval Flow (Step by Step) ──
    console.log('\nTest 7: Multi-Step Approval Workflow Execution...');
    // Step 1: Hiring manager approves
    offerDoc.approvalChain[1].status = 'approved';
    offerDoc.approvalChain[1].approvedAt = new Date();
    offerDoc.approvalChain[1].comments = 'Approved. Critical candidate for Q4.';
    offerDoc.currentApprovalStep = 2; // move to finance_head
    await offerDoc.save();

    assert(offerDoc.approvalChain[1].status === 'approved', 'Hiring Manager step approved');
    assert(offerDoc.currentApprovalStep === 2, 'Advanced to step 2 (Finance Head)');

    // Step 2: Finance head approves budget overrun
    offerDoc.approvalChain[2].status = 'approved';
    offerDoc.approvalChain[2].approvedAt = new Date();
    offerDoc.approvalChain[2].comments = 'Budget overrun +25% approved from contingency pool.';
    offerDoc.currentApprovalStep = 3; // move to hr_director
    await offerDoc.save();

    assert(offerDoc.approvalChain[2].status === 'approved', 'Finance Head escalation step approved');
    assert(offerDoc.currentApprovalStep === 3, 'Advanced to step 3 (HR Director)');

    // Step 3: HR Director signs off
    offerDoc.approvalChain[3].status = 'approved';
    offerDoc.approvalChain[3].approvedAt = new Date();
    offerDoc.approvalChain[3].comments = 'Final signoff granted. Ready to release.';
    offerDoc.status = 'approved';
    await offerDoc.save();

    assert(offerDoc.status === 'approved', 'Offer fully approved and transitioned to status: approved');

    // ── TEST 8: Token Generation & E-Signature Dispatch ──
    console.log('\nTest 8: Token Generation & Dispatch...');
    const signToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    offerDoc.eSignature = {
      signToken,
      tokenExpiresAt,
      signedAt: null,
    };
    offerDoc.status = 'sent';
    await offerDoc.save();

    assert(offerDoc.status === 'sent', 'Offer status set to sent');
    assert(offerDoc.eSignature.signToken.length === 64, 'Generated 64-char cryptographic hex token');
    assert(offerDoc.eSignature.tokenExpiresAt > new Date(), 'Token expiration set into future');

    // ── TEST 9: Zero-Login Public Offer Retrieval by Token ──
    console.log('\nTest 9: Zero-Login Public Offer Retrieval via Token...');
    const retrievedOffer = await JobOffer.findOne({
      'eSignature.signToken': signToken,
    }).populate('candidateId jobOpeningId departmentId');

    assert(retrievedOffer !== null, 'Successfully retrieved offer by e-sign token without authentication');
    assert(retrievedOffer.designation === 'Principal Systems Architect', 'Retrieved matching designation');
    assert(retrievedOffer.offeredSalary === 200000, 'Retrieved matching salary');

    // ── TEST 10: Candidate Digital E-Signature Execution ──
    console.log('\nTest 10: Candidate Digital E-Signature Capture & Audit Logging...');
    const clientIp = '203.0.113.195';
    const clientUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
    const dummySignatureBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    retrievedOffer.eSignature.signedAt = new Date();
    retrievedOffer.eSignature.signedIp = clientIp;
    retrievedOffer.eSignature.signedUserAgent = clientUserAgent;
    retrievedOffer.eSignature.signerName = 'Alex River';
    retrievedOffer.eSignature.signatureImageUrl = dummySignatureBase64;
    retrievedOffer.status = 'accepted';
    await retrievedOffer.save();

    // Advance candidate stage
    candidateDoc.stage = 'hired';
    candidateDoc.stageHistory.push({
      fromStage: 'offer_sent',
      toStage: 'hired',
      changedAt: new Date(),
      note: 'Offer accepted & e-signed by candidate',
    });
    await candidateDoc.save();

    // Activity log
    await RecruitmentActivity.create({
      organizationId: orgId,
      candidateId: candidateDoc._id,
      jobOpeningId: jobDoc._id,
      type: 'offer_status_change',
      title: 'Offer E-Signed & Accepted',
      description: `Alex River digitally accepted offer ${retrievedOffer.offerCode} from IP ${clientIp}`,
      performedBy: recruiterId,
    });

    assert(retrievedOffer.status === 'accepted', 'Offer status transitioned to accepted');
    assert(retrievedOffer.eSignature.signedIp === '203.0.113.195', 'Captured audit IP address');
    assert(retrievedOffer.eSignature.signerName === 'Alex River', 'Captured signer legal full name');
    assert(retrievedOffer.eSignature.signatureImageUrl.startsWith('data:image/png'), 'Saved signature image');
    assert(candidateDoc.stage === 'hired', 'Candidate stage advanced to hired');

    // Check signed letter HTML watermark
    const signedLetterHtml = offerLetterService.generateOfferLetterHtml({
      offer: retrievedOffer,
      candidate: candidateDoc,
      organization: mockOrg,
    });
    assert(signedLetterHtml.includes('DIGITALLY SIGNED &amp; EXECUTED'), 'Signed letter HTML displays verified digital execution stamp');
    assert(signedLetterHtml.includes('203.0.113.195'), 'Signed letter HTML embeds client IP audit stamp');

    // ── TEST 11: Cleanup Test Data ──
    console.log('\nCleaning up Phase 4 test artifacts...');
    await JobOffer.deleteMany({ organizationId: orgId });
    await Candidate.deleteMany({ organizationId: orgId });
    await JobOpening.deleteMany({ organizationId: orgId });
    await RecruitmentActivity.deleteMany({ organizationId: orgId });
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Unexpected test execution failure:', err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log(`  PHASE 4 TEST SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase4Tests();
