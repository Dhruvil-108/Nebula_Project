/**
 * Central Money and Financial Math Utility for Nebula Expenses
 * Prevents floating-point precision issues and normalizes rounding.
 */

// Minor unit exponents for common currencies (e.g. USD, EUR, INR have 2, JPY has 0)
const CURRENCY_MINOR_UNITS = {
  USD: 2,
  EUR: 2,
  GBP: 2,
  INR: 2,
  CAD: 2,
  AUD: 2,
  SGD: 2,
  AED: 2,
  JPY: 0,
  KRW: 0,
};

/**
 * Returns minor unit factor (e.g., 100 for USD, 1 for JPY)
 */
function getMinorUnitFactor(currency = 'USD') {
  const decimals = CURRENCY_MINOR_UNITS[currency.toUpperCase()] ?? 2;
  return Math.pow(10, decimals);
}

/**
 * Rounds monetary amount to standard decimal places
 */
function roundMoney(amount, currency = 'USD') {
  const factor = getMinorUnitFactor(currency);
  return Math.round(Number(amount || 0) * factor) / factor;
}

/**
 * Safe sum of numbers
 */
function sumMoney(amounts, currency = 'USD') {
  const factor = getMinorUnitFactor(currency);
  const totalCents = amounts.reduce((acc, curr) => acc + Math.round(Number(curr || 0) * factor), 0);
  return totalCents / factor;
}

/**
 * Convert foreign currency amount to base currency using FX rate
 */
function convertCurrency(amount, fxRate, baseCurrency = 'USD') {
  const rate = Number(fxRate || 1);
  return roundMoney(Number(amount || 0) * rate, baseCurrency);
}

module.exports = {
  roundMoney,
  sumMoney,
  convertCurrency,
  getMinorUnitFactor,
};
