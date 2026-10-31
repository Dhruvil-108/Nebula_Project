const MileageRate = require('../models/MileageRate');
const { roundMoney } = require('../utils/money');

// Standard default rates (e.g. IRS / CRA standard allowances)
const DEFAULT_MILEAGE_RATES = {
  car: { rate: 0.67, unit: 'mile', currency: 'USD' },
  motorcycle: { rate: 0.35, unit: 'mile', currency: 'USD' },
  bicycle: { rate: 0.20, unit: 'mile', currency: 'USD' },
  electric: { rate: 0.67, unit: 'mile', currency: 'USD' },
  van: { rate: 0.75, unit: 'mile', currency: 'USD' },
};

/**
 * Calculate mileage claim amount based on organization rate card or fallback defaults
 */
async function calculateMileage({
  organizationId,
  vehicleType = 'car',
  distance = 0,
  unit = 'km',
  date = new Date(),
}) {
  const numDistance = Math.max(0, parseFloat(distance) || 0);

  // Look up active rate in database for this organization
  const customRate = await MileageRate.findOne({
    organizationId,
    vehicleType,
    active: true,
    deletedAt: null,
    effectiveFrom: { $lte: new Date(date) },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: new Date(date) } }],
  }).lean();

  let ratePerUnit = 0;
  let rateUnit = unit;
  let currency = 'USD';

  if (customRate) {
    ratePerUnit = customRate.ratePerUnit;
    rateUnit = customRate.unit;
    currency = customRate.currency;
  } else {
    const fallback = DEFAULT_MILEAGE_RATES[vehicleType] || DEFAULT_MILEAGE_RATES.car;
    ratePerUnit = fallback.rate;
    rateUnit = fallback.unit;
    currency = fallback.currency;
  }

  // Normalize distance unit if requested unit differs from rate unit
  let normalizedDistance = numDistance;
  if (unit === 'km' && rateUnit === 'mile') {
    normalizedDistance = numDistance * 0.621371; // km to miles
  } else if (unit === 'mile' && rateUnit === 'km') {
    normalizedDistance = numDistance * 1.60934; // miles to km
  }

  const rawAmount = normalizedDistance * ratePerUnit;
  const amount = roundMoney(rawAmount, currency);

  return {
    distance: numDistance,
    unit,
    vehicleType,
    ratePerUnit,
    rateUnit,
    amount,
    currency,
  };
}

module.exports = {
  calculateMileage,
  DEFAULT_MILEAGE_RATES,
};
