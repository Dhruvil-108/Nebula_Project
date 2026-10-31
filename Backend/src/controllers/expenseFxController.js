const FxRate = require('../models/FxRate');
const { getFxRate, convertToBaseAmount } = require('../services/fxService');

exports.getFxRates = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const rates = await FxRate.find({ organizationId: orgId })
      .sort({ effectiveDate: -1, foreignCurrency: 1 })
      .limit(100)
      .lean();

    return res.json({ success: true, rates });
  } catch (error) {
    console.error('Error fetching FX rates:', error);
    return res.status(500).json({ error: 'Failed to fetch FX rates.' });
  }
};

exports.createOrUpdateFxRate = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { baseCurrency = 'USD', foreignCurrency, rate, effectiveDate, source = 'manual' } = req.body;

    if (!foreignCurrency || !rate || parseFloat(rate) <= 0) {
      return res.status(400).json({ error: 'Valid foreignCurrency and positive rate are required.' });
    }

    const fxRate = await FxRate.create({
      organizationId: orgId,
      baseCurrency: baseCurrency.toUpperCase(),
      foreignCurrency: foreignCurrency.toUpperCase(),
      rate: parseFloat(rate),
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date(),
      source: source.trim(),
    });

    return res.status(201).json({ success: true, fxRate });
  } catch (error) {
    console.error('Error saving FX rate:', error);
    return res.status(500).json({ error: error.message || 'Failed to save FX rate.' });
  }
};

exports.convertAmount = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { baseCurrency = 'USD', foreignCurrency = 'USD', amount = 0, date } = req.body;

    const conversion = await convertToBaseAmount({
      organizationId: orgId,
      baseCurrency,
      foreignCurrency,
      amount,
      date,
    });

    return res.json({ success: true, conversion });
  } catch (error) {
    console.error('Error converting amount:', error);
    return res.status(500).json({ error: 'Failed to convert currency amount.' });
  }
};
