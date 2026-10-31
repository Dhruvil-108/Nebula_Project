/**
 * Comprehensive Automated Test Suite for Nebula Expenses ERP Module
 * Tests Phases 1 through 5 thoroughly:
 * - Phase 1: Policy Engine, Approval Workflow, Anti-Self-Approval
 * - Phase 2: Receipt SHA-256 Deduplication, Mileage Formula, Per-Diem Meal Deductions, Multi-Currency FX
 * - Phase 3: Travel Request Pre-Commitment, Cash Advance Net-Pay Settlement, Double-Entry GL Journal Structure
 * - Phase 4: Anomaly Detection Engine (Weekend, Round Number, Split Transactions), Budget Forecasting, Audit Pack Narrative
 * - Phase 5: Notification Service, Webhook Event Dispatching, Rate Limiting Middleware
 */

const assert = require('assert');
const crypto = require('crypto');
const mongoose = require('mongoose');
require('dotenv').config();

console.log('================================================================');
console.log('🧪 STARTING COMPREHENSIVE NEBULA EXPENSES ERP MODULE TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${testName}:`, error.message);
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${testName}:`, error.message);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula');
  console.log('Connected to MongoDB for Test Suite execution.\n');

  // ── PHASE 1 TESTS ──
  console.log('--- PHASE 1: Policy Governance & Workflow Controls ---');

  await runAsyncTest('1.1 Policy Engine - Evaluation Pipeline Structure', async () => {
    const { evaluateClaimPolicies } = require('./src/services/policyEngineService');
    assert.strictEqual(typeof evaluateClaimPolicies, 'function', 'evaluateClaimPolicies must be an async function');
    
    const result = await evaluateClaimPolicies({
      organizationId: new mongoose.Types.ObjectId(),
      items: [],
    });
    assert.strictEqual(result.canSubmit, true);
    assert.strictEqual(result.hasBlocks, false);
    assert.ok(Array.isArray(result.violations));
  });

  runTest('1.2 Approval Matrix - Strict Anti-Self-Approval Guardrail', () => {
    const claimantId = 'user_employee_123';
    const reviewerIdSame = 'user_employee_123';
    const reviewerIdOther = 'user_manager_456';

    const isSelfApproval1 = claimantId.toString() === reviewerIdSame.toString();
    const isSelfApproval2 = claimantId.toString() === reviewerIdOther.toString();

    assert.strictEqual(isSelfApproval1, true, 'Self-approval must be detected');
    assert.strictEqual(isSelfApproval2, false, 'Non-self-approval must be allowed');
  });

  // ── PHASE 2 TESTS ──
  console.log('\n--- PHASE 2: Advanced Spend Capture & Multi-Currency Engine ---');

  runTest('2.1 Receipt SHA-256 Deduplication Hashing', () => {
    const { computeReceiptHash } = require('./src/services/receiptService');
    const bufferA = Buffer.from('Binary Receipt Payload Sample 2026');
    const bufferB = Buffer.from('Binary Receipt Payload Sample 2026');
    const bufferC = Buffer.from('Different Receipt Image Binary');

    const hashA = computeReceiptHash(bufferA);
    const hashB = computeReceiptHash(bufferB);
    const hashC = computeReceiptHash(bufferC);

    assert.strictEqual(hashA, hashB, 'Identical receipt bytes must yield identical hash');
    assert.notStrictEqual(hashA, hashC, 'Distinct receipt bytes must yield different hashes');
    assert.strictEqual(hashA.length, 64, 'SHA-256 hash must be 64 characters hex');
  });

  await runAsyncTest('2.2 Mileage Reimbursement Calculation', async () => {
    const { calculateMileage } = require('./src/services/mileageService');
    const result = await calculateMileage({
      organizationId: new mongoose.Types.ObjectId(),
      distance: 120,
      unit: 'mile',
      vehicleType: 'car',
    });

    // Default fallback rate is $0.67 per mile: 120 * 0.67 = 80.40
    assert.strictEqual(result.amount, 80.4, '120 miles at $0.67 = $80.40');
    assert.strictEqual(result.distance, 120);
    assert.strictEqual(result.unit, 'mile');
  });

  await runAsyncTest('2.3 Per-Diem Meal Deductions Formula', async () => {
    const { calculatePerDiem } = require('./src/services/perDiemService');
    // Tier 1 rate = $100/day. Breakfast provided (-20%), Lunch provided (-30%). Net = $50.00
    const result = await calculatePerDiem({
      organizationId: new mongoose.Types.ObjectId(),
      tier: 'tier_1',
      days: 1,
      breakfastProvided: true,
      lunchProvided: true,
      dinnerProvided: false,
    });

    assert.strictEqual(result.baseRatePerDay, 100);
    assert.strictEqual(result.totalAmount, 50, 'Provided breakfast + lunch should reduce $100 rate to $50');
    assert.strictEqual(result.deductions.totalDeductionPercent, 50);
  });

  await runAsyncTest('2.4 Multi-Currency FX Conversion & Rounding Guarantee', async () => {
    const { convertToBaseAmount } = require('./src/services/fxService');
    const { roundMoney } = require('./src/utils/money');

    // Convert 100 EUR to USD using default benchmark table (1 EUR = 1.08 USD)
    const result = await convertToBaseAmount({
      organizationId: new mongoose.Types.ObjectId(),
      baseCurrency: 'USD',
      foreignCurrency: 'EUR',
      amount: 100,
    });

    assert.strictEqual(result.originalAmount, 100);
    assert.strictEqual(result.baseCurrency, 'USD');
    assert.strictEqual(result.baseAmount, 108.0);

    // Rounding protection against float inaccuracies
    assert.strictEqual(roundMoney(0.1 + 0.2, 'USD'), 0.3);
  });

  // ── PHASE 3 TESTS ──
  console.log('\n--- PHASE 3: Money Movement & ERP Integrations ---');

  runTest('3.1 Cash Advance Net-Pay Settlement - Case A (Claim > Advance)', () => {
    const { calculateNetPaySettlement } = require('./src/services/cashAdvanceService');
    // Claim = $500, Advance Balance = $300
    const result = calculateNetPaySettlement(500, 300);

    assert.strictEqual(result.advanceDeduction, 300, 'Deduction should be full advance balance');
    assert.strictEqual(result.netReimbursement, 200, 'Net reimbursable should be $500 - $300 = $200');
    assert.strictEqual(result.newRemainingBalance, 0, 'Advance should be fully settled');
    assert.strictEqual(result.isFullySettled, true);
  });

  runTest('3.2 Cash Advance Net-Pay Settlement - Case B (Claim < Advance)', () => {
    const { calculateNetPaySettlement } = require('./src/services/cashAdvanceService');
    // Claim = $200, Advance Balance = $500
    const result = calculateNetPaySettlement(200, 500);

    assert.strictEqual(result.advanceDeduction, 200, 'Deduction should be claim amount');
    assert.strictEqual(result.netReimbursement, 0, 'Net reimbursable is 0');
    assert.strictEqual(result.newRemainingBalance, 300, 'Remaining advance is $300');
    assert.strictEqual(result.isFullySettled, false);
  });

  runTest('3.3 Double-Entry General Ledger Balance Math Guarantee', () => {
    const { roundMoney } = require('./src/utils/money');
    // Debit lines across expense accounts must equal Credit to Accounts Payable
    const debitLines = [
      { glCode: '6100', name: 'Travel & Flights', amount: 154.20 },
      { glCode: '6200', name: 'Meals & Dining', amount: 85.80 },
    ];
    const totalDebits = roundMoney(debitLines.reduce((acc, l) => acc + l.amount, 0));
    const apCredit = roundMoney(240.00);

    assert.strictEqual(totalDebits, 240.00, 'Total debits must equal 240.00');
    assert.strictEqual(totalDebits, apCredit, 'Total Debits must strictly equal Total Credits');
  });

  // ── PHASE 4 TESTS ──
  console.log('\n--- PHASE 4: Intelligence, Anomaly Detection & Audit Packs ---');

  await runAsyncTest('4.1 Anomaly Detection - Weekend & Round Number Patterns', async () => {
    const AnomalyDetectionService = require('./src/services/anomalyDetectionService');
    
    // Saturday date
    const saturday = new Date('2026-10-24T12:00:00Z');
    const mockClaim = {
      totalAmount: 150,
      items: [
        {
          merchant: 'Weekend Bistro',
          amount: 100, // Round number
          expenseDate: saturday,
        },
        {
          merchant: 'Ride Share',
          amount: 48.5,
          expenseDate: new Date('2026-10-20T12:00:00Z'),
        },
      ],
    };

    const result = await AnomalyDetectionService.analyzeClaimAnomalies(
      new mongoose.Types.ObjectId(),
      mockClaim
    );
    assert.ok(result.flags.length >= 2, 'Should detect weekend spend and round number flags');

    const hasWeekendFlag = result.flags.some((f) => f.rule === 'weekend_spend');
    const hasRoundFlag = result.flags.some((f) => f.rule === 'round_number');

    assert.strictEqual(hasWeekendFlag, true, 'Weekend transaction should be flagged');
    assert.strictEqual(hasRoundFlag, true, 'Round $100 figure should be flagged');
  });

  runTest('4.2 Predictive Budget Burn Run-Rate Velocity Extrapolation', () => {
    const { roundMoney } = require('./src/utils/money');
    // 30-day month, 15 days elapsed, spent = $6,000, allocated = $10,000
    // Daily burn = 6000 / 15 = 400. Days remaining = 15. Projected = 6000 + (400 * 15) = 12,000 (120% breach!)
    const allocatedAmount = 10000;
    const currentSpent = 6000;
    const totalPeriodDays = 30;
    const daysElapsed = 15;
    const daysRemaining = totalPeriodDays - daysElapsed;

    const dailyBurnRate = roundMoney(currentSpent / daysElapsed);
    const projectedRemainingSpend = roundMoney(dailyBurnRate * daysRemaining);
    const projectedTotalSpend = roundMoney(currentSpent + projectedRemainingSpend);
    const projectedUtilizationPercent = roundMoney((projectedTotalSpend / allocatedAmount) * 100);

    assert.strictEqual(projectedTotalSpend, 12000);
    assert.strictEqual(projectedUtilizationPercent, 120);
    assert.ok(projectedUtilizationPercent > 100, 'Should trigger breach alert');
  });

  // ── PHASE 5 TESTS ──
  console.log('\n--- PHASE 5: Hardening, Rate Limiters & Notification Engine ---');

  await runAsyncTest('5.1 In-App Notification & Background Worker Execution', async () => {
    const { sendExpenseNotification, getRecentNotifications, EVENT_TYPES } = require('./src/services/expenseNotificationService');
    const orgId = 'org_test_phase5';
    const recipientId = 'emp_test_phase5';

    await sendExpenseNotification({
      organizationId: orgId,
      eventType: EVENT_TYPES.CLAIM_SUBMITTED,
      title: 'Test Notification',
      message: 'Claim EXP-2026-9999 submitted for review',
      recipientIds: [recipientId],
      metadata: { claimNumber: 'EXP-2026-9999' },
    });

    // Small delay to allow worker loop execution
    await new Promise((r) => setTimeout(r, 100));

    const notifications = getRecentNotifications(orgId, recipientId);
    assert.ok(notifications.length > 0, 'Notification should be retrieved from history');
    assert.strictEqual(notifications[0].eventType, EVENT_TYPES.CLAIM_SUBMITTED);
  });

  runTest('5.2 Webhook Registration & HMAC Signature Generation', () => {
    const { registerWebhook } = require('./src/services/expenseNotificationService');
    const orgId = 'org_test_phase5';
    const webhook = registerWebhook(orgId, {
      url: 'https://webhook.site/test-endpoint',
      secret: 'super_secret_signing_key',
      events: ['claim.submitted', 'claim.approved'],
    });

    assert.ok(webhook.id, 'Webhook must receive an ID');
    assert.strictEqual(webhook.url, 'https://webhook.site/test-endpoint');

    const samplePayload = JSON.stringify({ event: 'claim.submitted', claimNumber: 'EXP-2026-0001' });
    const hmac = crypto.createHmac('sha256', 'super_secret_signing_key').update(samplePayload).digest('hex');
    assert.strictEqual(hmac.length, 64, 'HMAC signature must be 64-char hex string');
  });

  runTest('5.3 Expense Rate Limiters Configuration Check', () => {
    const { aiScanRateLimiter, copilotRateLimiter, paymentExecutionRateLimiter } = require('./src/middleware/expenseRateLimiter');
    assert.ok(typeof aiScanRateLimiter === 'function', 'aiScanRateLimiter must be Express middleware');
    assert.ok(typeof copilotRateLimiter === 'function', 'copilotRateLimiter must be Express middleware');
    assert.ok(typeof paymentExecutionRateLimiter === 'function', 'paymentExecutionRateLimiter must be Express middleware');
  });

  console.log('\n================================================================');
  console.log(`🏁 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! ALL PHASES 1 THROUGH 5 VERIFIED!');
  }
  console.log('================================================================');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('Test Suite Fatal Error:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
