const inventoryForecastService = require('../services/inventoryForecastService');
const inventoryOcrService = require('../services/inventoryOcrService');
const inventoryAnomalyService = require('../services/inventoryAnomalyService');
const inventoryCopilotService = require('../services/inventoryCopilotService');
const supplierScoringService = require('../services/supplierScoringService');
const InventoryAnomaly = require('../models/InventoryAnomaly');

// ── 1. Demand Forecasting ──
exports.getDemandForecast = async (req, res) => {
  try {
    const { itemId } = req.params;
    const lookbackDays = parseInt(req.query.lookbackDays, 10) || 60;

    const forecast = await inventoryForecastService.forecastItemDemand(
      req.organizationId,
      itemId,
      { lookbackDays, userId: req.user._id }
    );

    return res.json({ success: true, forecast });
  } catch (err) {
    console.error('[inventoryAiController.getDemandForecast] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.createRequisitionFromForecast = async (req, res) => {
  try {
    const { itemId, quantity, departmentId, notes } = req.body;
    if (!itemId) {
      return res.status(400).json({ success: false, message: 'itemId is required.' });
    }

    const requisition = await inventoryForecastService.createRequisitionFromForecast(
      req.organizationId,
      req.user,
      { itemId, quantity, departmentId, notes }
    );

    return res.status(201).json({
      success: true,
      message: `Draft PR ${requisition.prNumber} generated successfully from AI Forecast.`,
      requisition,
    });
  } catch (err) {
    console.error('[inventoryAiController.createRequisitionFromForecast] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── 2. Document OCR (Invoice / Delivery Challan) ──
exports.extractDocument = async (req, res) => {
  try {
    const { documentBase64, mimeType, purchaseOrderId } = req.body;
    if (!documentBase64) {
      return res.status(400).json({ success: false, message: 'documentBase64 is required.' });
    }

    const result = await inventoryOcrService.extractDocumentData({
      organizationId: req.organizationId,
      userId: req.user._id,
      documentBase64,
      mimeType,
      purchaseOrderId,
    });

    return res.json(result);
  } catch (err) {
    console.error('[inventoryAiController.extractDocument] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── 3. Anomaly Detection & Shrinkage ──
exports.scanAnomalies = async (req, res) => {
  try {
    const result = await inventoryAnomalyService.scanAnomalies(req.organizationId, req.user._id);
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[inventoryAiController.scanAnomalies] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

exports.getAnomalies = async (req, res) => {
  try {
    const { status, severity, anomalyType } = req.query;
    const filter = { organizationId: req.organizationId };

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (anomalyType) filter.anomalyType = anomalyType;

    const anomalies = await InventoryAnomaly.find(filter)
      .populate('itemId', 'sku name currentStock standardCost')
      .populate('warehouseId', 'name code')
      .populate('supplierId', 'name supplierCode')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, count: anomalies.length, anomalies });
  } catch (err) {
    console.error('[inventoryAiController.getAnomalies] Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.recordAnomalyFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userFeedback, feedbackNote } = req.body;

    const updated = await inventoryAnomalyService.recordFeedback(
      req.organizationId,
      req.user,
      id,
      { status, userFeedback, feedbackNote }
    );

    return res.json({ success: true, anomaly: updated });
  } catch (err) {
    console.error('[inventoryAiController.recordAnomalyFeedback] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── 4. Natural-Language Inventory Copilot ──
exports.queryCopilot = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ success: false, message: 'prompt string is required.' });
    }

    const copilotResponse = await inventoryCopilotService.queryCopilot(
      req.organizationId,
      req.user,
      prompt
    );

    return res.json({ success: true, ...copilotResponse });
  } catch (err) {
    console.error('[inventoryAiController.queryCopilot] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};

// ── 5. Supplier Scoring & Performance ──
exports.getSupplierScore = async (req, res) => {
  try {
    const { supplierId } = req.params;
    const result = await supplierScoringService.evaluateSupplier(
      req.organizationId,
      supplierId,
      { userId: req.user._id }
    );

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[inventoryAiController.getSupplierScore] Error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
};
