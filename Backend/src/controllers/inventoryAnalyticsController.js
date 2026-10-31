const inventoryAnalyticsService = require('../services/inventoryAnalyticsService');

// ── 1. Unified Overview KPI Snapshot ──
exports.getOverview = async (req, res) => {
  try {
    const valuation = await inventoryAnalyticsService.getStockValuationReport(req.organizationId);
    const turnover = await inventoryAnalyticsService.getTurnoverAndDsi(req.organizationId);
    const aging = await inventoryAnalyticsService.getStockAgingReport(req.organizationId);
    const otif = await inventoryAnalyticsService.getFulfillmentAndOtif(req.organizationId);

    return res.json({
      success: true,
      kpis: {
        totalValuation: valuation.summary.totalValuation,
        totalStockUnits: valuation.summary.totalStockUnits,
        totalActiveSkus: valuation.summary.totalActiveSkus,
        turnoverRatio: turnover.turnoverRatio,
        daysSalesOfInventory: turnover.daysSalesOfInventory,
        efficiencyRating: turnover.efficiencyRating,
        totalStagnantCapital: aging.totalStagnantCapital,
        otifRate: otif.metrics.otifRate,
        onTimeRate: otif.metrics.onTimeRate,
        inFullRate: otif.metrics.inFullRate,
      },
      warehouseBreakdown: valuation.warehouseBreakdown,
      categoryBreakdown: valuation.categoryBreakdown,
    });
  } catch (err) {
    console.error('[inventoryAnalyticsController.getOverview] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 2. Stock Valuation ──
exports.getStockValuation = async (req, res) => {
  try {
    const report = await inventoryAnalyticsService.getStockValuationReport(req.organizationId);
    return res.json({ success: true, ...report });
  } catch (err) {
    console.error('[inventoryAnalyticsController.getStockValuation] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 3. ABC / XYZ & 9-Cell Matrix ──
exports.getAbcXyz = async (req, res) => {
  try {
    const lookbackDays = parseInt(req.query.lookbackDays, 10) || 180;
    const abc = await inventoryAnalyticsService.getAbcAnalysis(req.organizationId, { lookbackDays });
    const xyz = await inventoryAnalyticsService.getXyzAnalysis(req.organizationId, { lookbackDays });
    const matrix = await inventoryAnalyticsService.getAbcXyzMatrix(req.organizationId, { lookbackDays });

    return res.json({
      success: true,
      abc,
      xyz,
      matrix,
    });
  } catch (err) {
    console.error('[inventoryAnalyticsController.getAbcXyz] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 4. Stock Aging ──
exports.getStockAging = async (req, res) => {
  try {
    const report = await inventoryAnalyticsService.getStockAgingReport(req.organizationId);
    return res.json({ success: true, ...report });
  } catch (err) {
    console.error('[inventoryAnalyticsController.getStockAging] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 5. Turnover & DSI ──
exports.getTurnover = async (req, res) => {
  try {
    const days = parseInt(req.query.days, 10) || 365;
    const report = await inventoryAnalyticsService.getTurnoverAndDsi(req.organizationId, { days });
    return res.json({ success: true, ...report });
  } catch (err) {
    console.error('[inventoryAnalyticsController.getTurnover] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 6. OTIF & Fulfillment ──
exports.getFulfillmentOtif = async (req, res) => {
  try {
    const report = await inventoryAnalyticsService.getFulfillmentAndOtif(req.organizationId);
    return res.json({ success: true, ...report });
  } catch (err) {
    console.error('[inventoryAnalyticsController.getFulfillmentOtif] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ── 7. CSV Report Export ──
exports.exportReport = async (req, res) => {
  try {
    const { type = 'valuation' } = req.query;
    const csvContent = await inventoryAnalyticsService.exportAnalyticsCsv(req.organizationId, type);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventory-${type}-report-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    console.error('[inventoryAnalyticsController.exportReport] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
