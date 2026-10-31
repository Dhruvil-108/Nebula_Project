const AnomalyDetectionService = require('../services/anomalyDetectionService');
const ApproverAssistantService = require('../services/approverAssistantService');
const BudgetForecastService = require('../services/budgetForecastService');
const SpendCopilotService = require('../services/spendCopilotService');
const AuditPackService = require('../services/auditPackService');
const ExpenseClaim = require('../models/ExpenseClaim');

/**
 * Run on-demand anomaly detection on a claim
 */
exports.analyzeClaimAnomalies = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const claim = await ExpenseClaim.findOne({ _id: id, organizationId });
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Expense claim not found.' });
    }

    const result = await AnomalyDetectionService.analyzeClaimAnomalies(
      organizationId,
      claim,
      req.user._id || req.user.id
    );

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error analyzing claim anomalies:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate AI Approver Brief for review drawer
 */
exports.getApproverSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const brief = await ApproverAssistantService.generateBrief(
      organizationId,
      id,
      req.user._id || req.user.id
    );

    res.status(200).json({ success: true, brief });
  } catch (error) {
    console.error('Error generating approver brief:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Forecast department budgets
 */
exports.getBudgetForecasts = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const fiscalYear = parseInt(req.query.fiscalYear, 10) || new Date().getFullYear();

    const forecasts = await BudgetForecastService.forecastDepartmentBudgets(
      organizationId,
      fiscalYear,
      req.user._id || req.user.id
    );

    res.status(200).json({ success: true, forecasts });
  } catch (error) {
    console.error('Error forecasting budgets:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Query Spend Copilot
 */
exports.queryCopilot = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, message: 'Prompt query is required.' });
    }

    const result = await SpendCopilotService.queryCopilot(organizationId, req.user, prompt.trim());
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Error querying spend copilot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Generate Audit Pack
 */
exports.getAuditPack = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { startDate, endDate, departmentId } = req.body;

    const auditPack = await AuditPackService.generateAuditPack(
      organizationId,
      { startDate, endDate, departmentId },
      req.user._id || req.user.id
    );

    res.status(200).json({ success: true, auditPack });
  } catch (error) {
    console.error('Error generating audit pack:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export Audit Pack CSV
 */
exports.exportAuditPackCsv = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { startDate, endDate, departmentId } = req.body;

    const auditPack = await AuditPackService.generateAuditPack(
      organizationId,
      { startDate, endDate, departmentId },
      req.user._id || req.user.id
    );

    const csvData = AuditPackService.generateCsvString(auditPack);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="nebula_audit_pack_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.status(200).send(csvData);
  } catch (error) {
    console.error('Error exporting audit pack CSV:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
