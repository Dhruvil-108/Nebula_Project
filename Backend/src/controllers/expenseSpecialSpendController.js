const MileageRate = require('../models/MileageRate');
const PerDiemRate = require('../models/PerDiemRate');
const TaxCode = require('../models/TaxCode');
const { calculateMileage } = require('../services/mileageService');
const { calculatePerDiem } = require('../services/perDiemService');

// ── Mileage Rates CRUD ──

exports.getMileageRates = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const rates = await MileageRate.find({ organizationId: orgId, deletedAt: null })
      .sort({ vehicleType: 1, effectiveFrom: -1 })
      .lean();

    return res.json({ success: true, rates });
  } catch (error) {
    console.error('Error fetching mileage rates:', error);
    return res.status(500).json({ error: 'Failed to fetch mileage rate cards.' });
  }
};

exports.createMileageRate = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { vehicleType, ratePerUnit, unit = 'km', currency = 'USD', description, effectiveFrom } = req.body;

    if (!ratePerUnit || parseFloat(ratePerUnit) <= 0) {
      return res.status(400).json({ error: 'Valid rate per unit is required.' });
    }

    const rate = await MileageRate.create({
      organizationId: orgId,
      vehicleType: vehicleType || 'car',
      ratePerUnit: parseFloat(ratePerUnit),
      unit,
      currency: currency.toUpperCase(),
      description: (description || '').trim(),
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      active: true,
    });

    return res.status(201).json({ success: true, rate });
  } catch (error) {
    console.error('Error creating mileage rate:', error);
    return res.status(500).json({ error: error.message || 'Failed to create mileage rate.' });
  }
};

exports.calculateMileageAmount = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { vehicleType, distance, unit, date } = req.body;

    const calculation = await calculateMileage({
      organizationId: orgId,
      vehicleType,
      distance,
      unit,
      date,
    });

    return res.json({ success: true, calculation });
  } catch (error) {
    console.error('Error calculating mileage:', error);
    return res.status(500).json({ error: 'Failed to calculate mileage amount.' });
  }
};

// ── Per-Diem Rates CRUD ──

exports.getPerDiemRates = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const rates = await PerDiemRate.find({ organizationId: orgId, deletedAt: null })
      .sort({ destination: 1, tier: 1 })
      .lean();

    return res.json({ success: true, rates });
  } catch (error) {
    console.error('Error fetching per-diem rates:', error);
    return res.status(500).json({ error: 'Failed to fetch per-diem rates.' });
  }
};

exports.createPerDiemRate = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const {
      destination,
      country,
      tier = 'standard',
      ratePerDay,
      currency = 'USD',
      breakfastDeductionPercent = 20,
      lunchDeductionPercent = 30,
      dinnerDeductionPercent = 50,
    } = req.body;

    if (!destination || !destination.trim()) {
      return res.status(400).json({ error: 'Destination is required.' });
    }
    if (!ratePerDay || parseFloat(ratePerDay) <= 0) {
      return res.status(400).json({ error: 'Valid rate per day is required.' });
    }

    const rate = await PerDiemRate.create({
      organizationId: orgId,
      destination: destination.trim(),
      country: (country || '').trim(),
      tier,
      ratePerDay: parseFloat(ratePerDay),
      currency: currency.toUpperCase(),
      breakfastDeductionPercent: Number(breakfastDeductionPercent),
      lunchDeductionPercent: Number(lunchDeductionPercent),
      dinnerDeductionPercent: Number(dinnerDeductionPercent),
      active: true,
    });

    return res.status(201).json({ success: true, rate });
  } catch (error) {
    console.error('Error creating per-diem rate:', error);
    return res.status(500).json({ error: error.message || 'Failed to create per-diem rate.' });
  }
};

exports.calculatePerDiemAmount = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { destination, tier, days, breakfastProvided, lunchProvided, dinnerProvided } = req.body;

    const calculation = await calculatePerDiem({
      organizationId: orgId,
      destination,
      tier,
      days,
      breakfastProvided,
      lunchProvided,
      dinnerProvided,
    });

    return res.json({ success: true, calculation });
  } catch (error) {
    console.error('Error calculating per diem:', error);
    return res.status(500).json({ error: 'Failed to calculate per-diem allowance.' });
  }
};

// ── Tax Codes CRUD ──

exports.getTaxCodes = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const taxCodes = await TaxCode.find({ organizationId: orgId, deletedAt: null })
      .sort({ code: 1 })
      .lean();

    return res.json({ success: true, taxCodes });
  } catch (error) {
    console.error('Error fetching tax codes:', error);
    return res.status(500).json({ error: 'Failed to fetch tax codes.' });
  }
};

exports.createTaxCode = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { code, name, ratePercent, isRecoverable = true, description } = req.body;

    if (!code || !code.trim() || !name || !name.trim()) {
      return res.status(400).json({ error: 'Tax code and name are required.' });
    }

    const taxCode = await TaxCode.create({
      organizationId: orgId,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      ratePercent: parseFloat(ratePercent) || 0,
      isRecoverable: Boolean(isRecoverable),
      description: (description || '').trim(),
      active: true,
    });

    return res.status(201).json({ success: true, taxCode });
  } catch (error) {
    console.error('Error creating tax code:', error);
    return res.status(500).json({ error: error.message || 'Failed to create tax code.' });
  }
};

exports.deleteTaxCode = async (req, res) => {
  try {
    const orgId = req.organizationId;
    const { id } = req.params;

    await TaxCode.findOneAndUpdate(
      { _id: id, organizationId: orgId },
      { deletedAt: new Date(), active: false }
    );

    return res.json({ success: true, message: 'Tax code archived.' });
  } catch (error) {
    console.error('Error deleting tax code:', error);
    return res.status(500).json({ error: 'Failed to delete tax code.' });
  }
};
