const PerDiemRate = require('../models/PerDiemRate');
const { roundMoney } = require('../utils/money');

// Standard default rates by tier
const DEFAULT_PER_DIEM_RATES = {
  standard: { ratePerDay: 75, currency: 'USD' },
  tier_1: { ratePerDay: 100, currency: 'USD' }, // Tier 1 cities (e.g. NYC, London, Tokyo)
  tier_2: { ratePerDay: 85, currency: 'USD' },  // Tier 2 cities (e.g. Chicago, Berlin)
  tier_3: { ratePerDay: 65, currency: 'USD' },  // Tier 3 cities
  high_cost: { ratePerDay: 130, currency: 'USD' },
};

/**
 * Calculate per-diem allowance factoring in meal deductions
 */
async function calculatePerDiem({
  organizationId,
  destination = '',
  tier = 'standard',
  days = 1,
  breakfastProvided = false,
  lunchProvided = false,
  dinnerProvided = false,
}) {
  const numDays = Math.max(1, parseInt(days, 10) || 1);

  // Look up rate for destination or tier
  let rateRecord = null;
  if (destination && destination.trim()) {
    rateRecord = await PerDiemRate.findOne({
      organizationId,
      destination: { $regex: new RegExp(`^${destination.trim()}$`, 'i') },
      active: true,
      deletedAt: null,
    }).lean();
  }

  if (!rateRecord && tier) {
    rateRecord = await PerDiemRate.findOne({
      organizationId,
      tier,
      active: true,
      deletedAt: null,
    }).lean();
  }

  let ratePerDay = 75;
  let currency = 'USD';
  let bPercent = 20;
  let lPercent = 30;
  let dPercent = 50;

  if (rateRecord) {
    ratePerDay = rateRecord.ratePerDay;
    currency = rateRecord.currency;
    bPercent = rateRecord.breakfastDeductionPercent ?? 20;
    lPercent = rateRecord.lunchDeductionPercent ?? 30;
    dPercent = rateRecord.dinnerDeductionPercent ?? 50;
  } else {
    const fallback = DEFAULT_PER_DIEM_RATES[tier] || DEFAULT_PER_DIEM_RATES.standard;
    ratePerDay = fallback.ratePerDay;
    currency = fallback.currency;
  }

  // Calculate daily deductions
  let deductionRatio = 0;
  if (breakfastProvided) deductionRatio += bPercent / 100;
  if (lunchProvided) deductionRatio += lPercent / 100;
  if (dinnerProvided) deductionRatio += dPercent / 100;

  // Max deduction is 100%
  deductionRatio = Math.min(1, deductionRatio);

  const effectiveDailyRate = ratePerDay * (1 - deductionRatio);
  const totalAmount = roundMoney(effectiveDailyRate * numDays, currency);

  return {
    destination,
    tier,
    days: numDays,
    baseRatePerDay: ratePerDay,
    deductions: {
      breakfast: breakfastProvided,
      lunch: lunchProvided,
      dinner: dinnerProvided,
      totalDeductionPercent: Math.round(deductionRatio * 100),
    },
    effectiveDailyRate: roundMoney(effectiveDailyRate, currency),
    totalAmount,
    currency,
  };
}

module.exports = {
  calculatePerDiem,
  DEFAULT_PER_DIEM_RATES,
};
