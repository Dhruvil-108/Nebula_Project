const FxRate = require('../models/FxRate');
const { roundMoney } = require('../utils/money');

// Standard static FX rate benchmarks against USD
const DEFAULT_FX_RATES = {
  USD: 1.0,
  EUR: 1.08,    // 1 EUR = 1.08 USD
  GBP: 1.30,    // 1 GBP = 1.30 USD
  INR: 0.012,   // 1 INR = 0.012 USD (approx 83.5 INR = 1 USD)
  CAD: 0.74,    // 1 CAD = 0.74 USD
  AUD: 0.66,    // 1 AUD = 0.66 USD
  JPY: 0.0067,  // 1 JPY = 0.0067 USD
};

/**
 * Get the effective exchange rate to convert from foreignCurrency to baseCurrency
 */
async function getFxRate({
  organizationId,
  baseCurrency = 'USD',
  foreignCurrency = 'USD',
  date = new Date(),
}) {
  const base = baseCurrency.toUpperCase();
  const foreign = foreignCurrency.toUpperCase();

  if (base === foreign) {
    return { rate: 1.0, baseCurrency: base, foreignCurrency: foreign, source: 'identity' };
  }

  // 1. Check database for date-specific rate
  const rateRecord = await FxRate.findOne({
    organizationId,
    baseCurrency: base,
    foreignCurrency: foreign,
    effectiveDate: { $lte: new Date(date) },
  })
    .sort({ effectiveDate: -1 })
    .lean();

  if (rateRecord) {
    return {
      rate: rateRecord.rate,
      baseCurrency: base,
      foreignCurrency: foreign,
      effectiveDate: rateRecord.effectiveDate,
      source: rateRecord.source,
    };
  }

  // 2. Check inverse pair in database
  const inverseRecord = await FxRate.findOne({
    organizationId,
    baseCurrency: foreign,
    foreignCurrency: base,
    effectiveDate: { $lte: new Date(date) },
  })
    .sort({ effectiveDate: -1 })
    .lean();

  if (inverseRecord && inverseRecord.rate > 0) {
    return {
      rate: Math.round((1 / inverseRecord.rate) * 1000000) / 1000000,
      baseCurrency: base,
      foreignCurrency: foreign,
      effectiveDate: inverseRecord.effectiveDate,
      source: 'inverse_db',
    };
  }

  // 3. Fallback using benchmark table
  const foreignToUsd = DEFAULT_FX_RATES[foreign] || 1.0;
  const baseToUsd = DEFAULT_FX_RATES[base] || 1.0;
  const fallbackRate = foreignToUsd / baseToUsd;

  return {
    rate: Math.round(fallbackRate * 1000000) / 1000000,
    baseCurrency: base,
    foreignCurrency: foreign,
    source: 'benchmark_table',
  };
}

/**
 * Convert foreign amount to normalized base amount
 */
async function convertToBaseAmount({
  organizationId,
  baseCurrency = 'USD',
  foreignCurrency = 'USD',
  amount = 0,
  date = new Date(),
}) {
  const fx = await getFxRate({ organizationId, baseCurrency, foreignCurrency, date });
  const rawBase = (parseFloat(amount) || 0) * fx.rate;
  const baseAmount = roundMoney(rawBase, baseCurrency);

  return {
    originalAmount: parseFloat(amount) || 0,
    foreignCurrency: foreignCurrency.toUpperCase(),
    baseAmount,
    baseCurrency: baseCurrency.toUpperCase(),
    fxRate: fx.rate,
    fxSource: fx.source,
  };
}

module.exports = {
  getFxRate,
  convertToBaseAmount,
  DEFAULT_FX_RATES,
};
