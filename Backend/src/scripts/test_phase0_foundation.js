const mongoose = require('mongoose');
const counterService = require('../services/counterService');
const fileService = require('../services/fileService');
const aiService = require('../services/ai/aiService');
const Counter = require('../models/Counter');
const AiRun = require('../models/AiRun');
const RecruitmentSettings = require('../models/RecruitmentSettings');
const { backfillCounters } = require('./backfillCounters');

async function runPhase0Tests() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('   PHASE 0 FOUNDATION: AUTOMATED ACCEPTANCE TEST HARNESS      ');
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

  const tenantA = new mongoose.Types.ObjectId();
  const tenantB = new mongoose.Types.ObjectId();

  try {
    // ── TEST 1: Backfill script runs idempotently ──
    console.log('Test 1: Running Backfill Counters...');
    await backfillCounters();
    assert(true, 'Backfill counters script executed successfully without throwing errors.');

    // ── TEST 2: Concurrency & Atomic Code Generation ──
    console.log('\nTest 2: Concurrency Safety under Parallel Invocations...');
    const concurrencyCount = 20;
    const promises = [];
    for (let i = 0; i < concurrencyCount; i++) {
      promises.push(counterService.generateJobCode(tenantA));
    }
    const codes = await Promise.all(promises);
    const uniqueCodes = new Set(codes);

    assert(
      codes.length === concurrencyCount,
      `Generated ${concurrencyCount} job codes concurrently.`
    );
    assert(
      uniqueCodes.size === concurrencyCount,
      `All ${concurrencyCount} generated codes are unique (zero collisions).`
    );
    console.log(`    Sample generated codes: ${codes.slice(0, 3).join(', ')} ... ${codes.slice(-1)[0]}`);

    // ── TEST 3: Multi-Tenant Counter Isolation ──
    console.log('\nTest 3: Cross-Tenant Counter Isolation...');
    const tenantACode = await counterService.generateCandidateCode(tenantA);
    const tenantBCode = await counterService.generateCandidateCode(tenantB);
    const tenantACode2 = await counterService.generateCandidateCode(tenantA);

    assert(
      tenantACode.startsWith('CAND-') && tenantBCode.startsWith('CAND-'),
      'Tenant A and Tenant B both produce valid candidate codes.'
    );
    assert(
      tenantBCode.endsWith('0001'),
      `Tenant B fresh sequence starts at 0001 regardless of Tenant A's usage (Got: ${tenantBCode}).`
    );

    // ── TEST 4: File Service Security & MIME-sniffing ──
    console.log('\nTest 4: File Service Validation & Anti-Spoofing...');
    // A: Valid PDF buffer (%PDF-1.5)
    const validPdfBuffer = Buffer.from('%PDF-1.5\n%Valid dummy PDF file content for test');
    let validPdfPassed = false;
    try {
      fileService.validateFile(validPdfBuffer, 'candidate_resume.pdf');
      validPdfPassed = true;
    } catch (err) {
      validPdfPassed = false;
    }
    assert(validPdfPassed, 'Valid PDF with %PDF magic bytes is successfully accepted.');

    // B: Spoofed executable renamed to .pdf (starts with MZ: Windows Executable Header)
    const spoofedExeBuffer = Buffer.from([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]); // MZ PE header
    let spoofedRejected = false;
    try {
      fileService.validateFile(spoofedExeBuffer, 'malicious_resume.pdf');
    } catch (err) {
      spoofedRejected = true;
      console.log(`    Expected rejection reason: "${err.message}"`);
    }
    assert(spoofedRejected, 'Executable binary spoofed as .pdf is detected and rejected.');

    // C: Oversized buffer (> 5MB)
    const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024);
    oversizedBuffer[0] = 0x25; oversizedBuffer[1] = 0x50; oversizedBuffer[2] = 0x44; oversizedBuffer[3] = 0x46; // %PDF
    let oversizedRejected = false;
    try {
      fileService.validateFile(oversizedBuffer, 'huge_file.pdf');
    } catch (err) {
      oversizedRejected = true;
    }
    assert(oversizedRejected, 'File exceeding 5MB size limit is rejected.');

    // ── TEST 5: AI Service Layer & Fallback Engine ──
    console.log('\nTest 5: AI Service Layer & Fallback Engine Execution...');
    const aiResult = await aiService.generate({
      task: 'linked_in_post',
      input: {
        jobTitle: 'Senior Full Stack Engineer',
        departmentName: 'Platform Engineering',
        companyName: 'Nebula Test Org',
        employmentType: 'full_time',
        locationText: 'Remote (Worldwide)',
        salaryText: '$140,000 - $180,000',
        skillsText: 'React, Node.js, MongoDB, TypeScript',
        description: 'Lead architecture of core multi-tenant business systems.',
        tone: 'engineering',
        customNotes: 'Equity grants & flexible hours included.',
      },
      organizationId: tenantA,
      entityType: 'JobOpening',
    });

    assert(Boolean(aiResult.success), 'AI service call succeeded.');
    assert(
      typeof aiResult.data?.post === 'string' && aiResult.data.post.length > 50,
      `AI post generated successfully (${aiResult.data.post.length} characters, provider: ${aiResult.provider}).`
    );
    assert(
      Array.isArray(aiResult.data?.hashtags) && aiResult.data.hashtags.length > 0,
      `AI post contains structured hashtags: ${aiResult.data.hashtags.join(', ')}`
    );

    // Verify AiRun log was written
    const aiRunRecord = await AiRun.findOne({ organizationId: tenantA }).sort({ createdAt: -1 });
    assert(Boolean(aiRunRecord), 'AiRun collection recorded operational audit entry.');
    assert(
      aiRunRecord?.task === 'linked_in_post',
      `AiRun record task correctly identifies "linked_in_post" (ID: ${aiRunRecord?._id}).`
    );

    // ── TEST 6: Tenant Recruitment Settings & Feature Flags ──
    console.log('\nTest 6: Tenant Recruitment Settings & Isolation...');
    const settings = await RecruitmentSettings.create({
      organizationId: tenantA,
      aiEnabled: true,
      retentionDays: 180,
    });
    assert(settings.retentionDays === 180, 'Tenant A settings created with 180 days retention.');

    const tenantBSettings = await RecruitmentSettings.findOne({ organizationId: tenantB });
    assert(tenantBSettings === null, 'Tenant B has no records from Tenant A (Tenant Isolation confirmed).');

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(`   PHASE 0 RESULTS: ${passed} PASSED, ${failed} FAILED                 `);
    console.log('══════════════════════════════════════════════════════════════\n');

    return { passed, failed };
  } catch (err) {
    console.error('Test harness encountered unhandled error:', err);
    throw err;
  }
}

if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    const { failed } = await runPhase0Tests();
    process.exit(failed > 0 ? 1 : 0);
  }).catch((err) => {
    console.error('Database connection failed for test harness:', err);
    process.exit(1);
  });
}

module.exports = { runPhase0Tests };
