const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Application = require('../models/Application');
const Interview = require('../models/Interview');
const JobOffer = require('../models/JobOffer');
const RecruitmentActivity = require('../models/RecruitmentActivity');
const counterService = require('../services/counterService');

/**
 * Migration Script: Candidate/Application Decoupling
 * Idempotent, dry-run by default, reversible.
 *
 * Usage:
 *   node migrate_candidate_applications.js --dry-run
 *   node migrate_candidate_applications.js --execute
 *   node migrate_candidate_applications.js --rollback
 */
async function runMigration(options = {}) {
  const isExecute = options.execute || process.argv.includes('--execute');
  const isRollback = options.rollback || process.argv.includes('--rollback');
  const isDryRun = !isExecute && !isRollback;

  console.log('══════════════════════════════════════════════════════════════');
  console.log(` MIGRATION: Candidate / Application Decoupling [Mode: ${isRollback ? 'ROLLBACK' : isExecute ? 'EXECUTE' : 'DRY-RUN'}] `);
  console.log('══════════════════════════════════════════════════════════════\n');

  if (isRollback) {
    console.log('[Rollback] Reverting migrated applications...');
    const apps = await Application.find({}).lean();
    console.log(`[Rollback] Found ${apps.length} applications to remove.`);

    if (isExecute || isRollback) {
      await Interview.updateMany({}, { $set: { applicationId: null } });
      await JobOffer.updateMany({}, { $set: { applicationId: null } });
      await RecruitmentActivity.updateMany({}, { $set: { applicationId: null } });
      const delResult = await Application.deleteMany({});
      console.log(`[Rollback] Deleted ${delResult.deletedCount} Application records and unlinked Interviews/Offers.`);
    }
    return { rolledBackCount: apps.length };
  }

  // Sourcing Candidates with a jobOpeningId
  const candidates = await Candidate.find({ jobOpeningId: { $ne: null } }).lean();
  console.log(`[Migration] Found ${candidates.length} candidates with linked job openings.`);

  let createdCount = 0;
  let skippedCount = 0;
  let repointedInterviewsCount = 0;
  let repointedOffersCount = 0;

  for (const cand of candidates) {
    // Check if an application already exists for this candidate & job
    const existingApp = await Application.findOne({
      organizationId: cand.organizationId,
      candidateId: cand._id,
      jobOpeningId: cand.jobOpeningId,
    });

    if (existingApp) {
      skippedCount++;
      // Ensure interviews & offers are linked even if app already existed
      if (isExecute) {
        const intRes = await Interview.updateMany(
          { organizationId: cand.organizationId, candidateId: cand._id, applicationId: null },
          { $set: { applicationId: existingApp._id } }
        );
        repointedInterviewsCount += intRes.modifiedCount;

        const offRes = await JobOffer.updateMany(
          { organizationId: cand.organizationId, candidateId: cand._id, applicationId: null },
          { $set: { applicationId: existingApp._id } }
        );
        repointedOffersCount += offRes.modifiedCount;
      }
      continue;
    }

    if (isDryRun) {
      createdCount++;
      continue;
    }

    // Execute mode: create Application
    const applicationCode = await counterService.generateApplicationCode(cand.organizationId);
    const newApp = await Application.create({
      organizationId: cand.organizationId,
      applicationCode,
      candidateId: cand._id,
      jobOpeningId: cand.jobOpeningId,
      stage: cand.stage || 'applied',
      stageHistory: cand.stageHistory || [
        {
          fromStage: 'none',
          toStage: cand.stage || 'applied',
          changedAt: cand.createdAt || new Date(),
          note: 'Migrated from Candidate legacy stage.',
        },
      ],
      rating: cand.rating || 0,
      source: cand.source || 'careers_page',
      referredBy: cand.referredBy || null,
      tags: cand.tags || [],
      status: cand.stage === 'hired' ? 'hired' : cand.stage === 'rejected' ? 'rejected' : 'active',
      convertedEmployeeId: cand.convertedEmployeeId || null,
      hiredAt: cand.hiredAt || null,
    });

    createdCount++;

    // Repoint Interviews
    const intRes = await Interview.updateMany(
      { organizationId: cand.organizationId, candidateId: cand._id, applicationId: null },
      { $set: { applicationId: newApp._id } }
    );
    repointedInterviewsCount += intRes.modifiedCount;

    // Repoint Offers
    const offRes = await JobOffer.updateMany(
      { organizationId: cand.organizationId, candidateId: cand._id, applicationId: null },
      { $set: { applicationId: newApp._id } }
    );
    repointedOffersCount += offRes.modifiedCount;

    // Repoint Activities
    await RecruitmentActivity.updateMany(
      { organizationId: cand.organizationId, candidateId: cand._id, applicationId: null },
      { $set: { applicationId: newApp._id } }
    );
  }

  console.log(`\n[Migration Summary]`);
  console.log(`  Mode: ${isDryRun ? 'DRY-RUN (Simulated)' : 'EXECUTED'}`);
  console.log(`  Candidates Processed: ${candidates.length}`);
  console.log(`  Applications to Create / Created: ${createdCount}`);
  console.log(`  Existing Applications Skipped: ${skippedCount}`);
  console.log(`  Interviews Repointed: ${repointedInterviewsCount}`);
  console.log(`  Offers Repointed: ${repointedOffersCount}`);
  console.log('══════════════════════════════════════════════════════════════\n');

  return {
    candidatesCount: candidates.length,
    createdCount,
    skippedCount,
    repointedInterviewsCount,
    repointedOffersCount,
  };
}

if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await runMigration();
    process.exit(0);
  }).catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
}

module.exports = { runMigration };
