const mongoose = require('mongoose');
const Counter = require('../models/Counter');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const JobOffer = require('../models/JobOffer');
const Employee = require('../models/Employee');
const counterService = require('../services/counterService');

/**
 * Idempotent backfill script
 * Scans existing codes and synchronizes the Counter collection to the maximum existing code per tenant.
 */
async function backfillCounters() {
  console.log('[BackfillCounters] Starting counter backfill...');
  const currentYear = new Date().getFullYear();

  // 1. Backfill JobOpenings
  const jobs = await JobOpening.find({}, 'organizationId jobCode').lean();
  const jobMap = {};
  for (const job of jobs) {
    if (!job.organizationId || !job.jobCode) continue;
    const match = String(job.jobCode).match(/JOB-(\d{4})-(\d+)/i);
    if (match) {
      const year = match[1];
      const seq = parseInt(match[2], 10);
      const key = `${job.organizationId}:job_opening_${year}`;
      jobMap[key] = Math.max(jobMap[key] || 0, seq);
    }
  }
  for (const [key, maxSeq] of Object.entries(jobMap)) {
    const [orgId, entityType] = key.split(':');
    await counterService.setCounterIfHigher(orgId, entityType, maxSeq);
  }
  console.log(`[BackfillCounters] Processed ${Object.keys(jobMap).length} job opening sequence counters.`);

  // 2. Backfill Candidates
  const candidates = await Candidate.find({}, 'organizationId candidateCode').lean();
  const candMap = {};
  for (const cand of candidates) {
    if (!cand.organizationId || !cand.candidateCode) continue;
    const match = String(cand.candidateCode).match(/CAND-(\d{4})-(\d+)/i);
    if (match) {
      const year = match[1];
      const seq = parseInt(match[2], 10);
      const key = `${cand.organizationId}:candidate_${year}`;
      candMap[key] = Math.max(candMap[key] || 0, seq);
    }
  }
  for (const [key, maxSeq] of Object.entries(candMap)) {
    const [orgId, entityType] = key.split(':');
    await counterService.setCounterIfHigher(orgId, entityType, maxSeq);
  }
  console.log(`[BackfillCounters] Processed ${Object.keys(candMap).length} candidate sequence counters.`);

  // 3. Backfill Job Offers
  const offers = await JobOffer.find({}, 'organizationId offerCode').lean();
  const offerMap = {};
  for (const off of offers) {
    if (!off.organizationId || !off.offerCode) continue;
    const match = String(off.offerCode).match(/OFF-(\d{4})-(\d+)/i);
    if (match) {
      const year = match[1];
      const seq = parseInt(match[2], 10);
      const key = `${off.organizationId}:job_offer_${year}`;
      offerMap[key] = Math.max(offerMap[key] || 0, seq);
    }
  }
  for (const [key, maxSeq] of Object.entries(offerMap)) {
    const [orgId, entityType] = key.split(':');
    await counterService.setCounterIfHigher(orgId, entityType, maxSeq);
  }
  console.log(`[BackfillCounters] Processed ${Object.keys(offerMap).length} job offer sequence counters.`);

  // 4. Backfill Employees
  const employees = await Employee.find({}, 'organizationId employeeCode').lean();
  const empMap = {};
  for (const emp of employees) {
    if (!emp.organizationId || !emp.employeeCode) continue;
    const match = String(emp.employeeCode).match(/EMP-(\d+)/i);
    if (match) {
      const seq = parseInt(match[1], 10);
      const key = `${emp.organizationId}:employee`;
      empMap[key] = Math.max(empMap[key] || 0, seq);
    }
  }
  for (const [key, maxSeq] of Object.entries(empMap)) {
    const [orgId, entityType] = key.split(':');
    await counterService.setCounterIfHigher(orgId, entityType, maxSeq);
  }
  console.log(`[BackfillCounters] Processed ${Object.keys(empMap).length} employee sequence counters.`);

  console.log('[BackfillCounters] Counter backfill completed successfully.');
}

module.exports = { backfillCounters };

if (require.main === module) {
  require('dotenv').config();
  const connectDB = require('../config/db');
  connectDB().then(async () => {
    await backfillCounters();
    process.exit(0);
  }).catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
}
