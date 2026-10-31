/**
 * test_inventory_ai_suite.js
 * Comprehensive End-to-End Test Suite for Phase 5: AI Features in Nebula Inventory ERP
 */
const mongoose = require('mongoose');
const assert = require('assert');

// Models
const Organization = require('./src/models/Organization');
const User = require('./src/models/User');
const Item = require('./src/models/Item');
const ItemCategory = require('./src/models/ItemCategory');
const Warehouse = require('./src/models/Warehouse');
const Supplier = require('./src/models/Supplier');
const StockMovement = require('./src/models/StockMovement');
const StockLedger = require('./src/models/StockLedger');
const PurchaseOrder = require('./src/models/PurchaseOrder');
const GoodsReceiptNote = require('./src/models/GoodsReceiptNote');
const SupplierInvoice = require('./src/models/SupplierInvoice');
const PurchaseRequisition = require('./src/models/PurchaseRequisition');
const InventoryAnomaly = require('./src/models/InventoryAnomaly');
const AiRun = require('./src/models/AiRun');

// Services
const inventoryForecastService = require('./src/services/inventoryForecastService');
const inventoryOcrService = require('./src/services/inventoryOcrService');
const inventoryAnomalyService = require('./src/services/inventoryAnomalyService');
const inventoryCopilotService = require('./src/services/inventoryCopilotService');
const supplierScoringService = require('./src/services/supplierScoringService');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nebula';

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${testName}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runSuite() {
  console.log('================================================================');
  console.log('🧪 STARTING NEBULA INVENTORY ERP - PHASE 5: AI FEATURES TEST SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for Phase 5 AI Verification.\n');

  // Setup Test Tenant A
  const orgA = await Organization.create({
    name: 'AI Test Enterprise A',
    domain: `ai-test-${Date.now()}a.nebula.test`,
  });

  const userA = await User.create({
    organizationId: orgA._id,
    email: `ai.user-${Date.now()}@tenant-a.com`,
    passwordHash: 'dummyhash',
    fullName: 'Dr. Jane AI Scientist',
    role: 'inventory_manager',
  });

  // Setup Test Tenant B (for multi-tenant isolation tests)
  const orgB = await Organization.create({
    name: 'AI Test Enterprise B',
    domain: `ai-test-${Date.now()}b.nebula.test`,
  });

  const userB = await User.create({
    organizationId: orgB._id,
    email: `ai.user-${Date.now()}@tenant-b.com`,
    passwordHash: 'dummyhash',
    fullName: 'Mark Tenant B Lead',
    role: 'inventory_manager',
  });

  const category = await ItemCategory.create({
    organizationId: orgA._id,
    name: 'AI Electronics',
    code: `ELEC-${Date.now().toString().slice(-4)}`,
  });

  const warehouse = await Warehouse.create({
    organizationId: orgA._id,
    name: 'AI High-Tech Fulfillment Hub',
    code: `WH-AI-${Date.now().toString().slice(-4)}`,
  });

  const supplier = await Supplier.create({
    organizationId: orgA._id,
    name: 'Global Semiconductor Fab Ltd',
    supplierCode: `SUP-${Date.now().toString().slice(-4)}`,
    leadTimeDays: 14,
    contactPerson: { name: 'Alex Wong', email: 'alex@fab.com', phone: '+123456789' },
  });

  const itemA = await Item.create({
    organizationId: orgA._id,
    sku: `SKU-CHIP-${Date.now().toString().slice(-4)}`,
    name: 'ARM Cortex M4 Processing Unit',
    categoryId: category._id,
    unitOfMeasure: 'pcs',
    currentStock: 15,
    reorderLevel: 25,
    safetyStock: 10,
    standardCost: 45.0,
    preferredSupplierId: supplier._id,
    active: true,
    leadTimeDays: 14,
  });

  // ────────────────────────────────────────────────────────────────
  // 1. Demand Forecasting & Smart Reorder
  // ────────────────────────────────────────────────────────────────
  console.log('--- 1. Demand Forecasting & Smart Reorder ---');

  // Seed historical consumption ledger entries for itemA
  const thirtyDaysAgo = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
  await StockLedger.create([
    {
      organizationId: orgA._id,
      transactionType: 'issue',
      documentNumber: 'MOV-TEST-001',
      itemId: itemA._id,
      warehouseId: warehouse._id,
      quantity: -20,
      unitCost: 45.0,
      totalCost: 900.0,
      runningBalanceQty: 35,
      createdAt: thirtyDaysAgo,
    },
    {
      organizationId: orgA._id,
      transactionType: 'issue',
      documentNumber: 'MOV-TEST-002',
      itemId: itemA._id,
      warehouseId: warehouse._id,
      quantity: -20,
      unitCost: 45.0,
      totalCost: 900.0,
      runningBalanceQty: 15,
      createdAt: new Date(),
    },
  ]);

  let forecastResult = null;
  await runAsyncTest('1.1 Demand Forecast Calculation & Run-Rate Analysis', async () => {
    forecastResult = await inventoryForecastService.forecastItemDemand(orgA._id, itemA._id, {
      lookbackDays: 60,
      userId: userA._id,
    });

    assert(forecastResult, 'Forecast result should be defined');
    assert.strictEqual(forecastResult.item.sku, itemA.sku);
    assert.strictEqual(forecastResult.metrics.totalConsumed, 40, 'Should aggregate 40 units consumed');
    assert(forecastResult.metrics.dailyRunRate > 0, 'Daily run rate should be > 0');
    assert(forecastResult.metrics.recommendedOrderQty > 0, 'Should recommend order quantity');
    assert(['critical', 'high'].includes(forecastResult.metrics.urgency), 'Urgency should be high or critical');
    assert(forecastResult.aiAnalysis.explanation.length > 20, 'Should generate an executive explanation');
  });

  let createdPr = null;
  await runAsyncTest('1.2 1-Click Draft Purchase Requisition Creation', async () => {
    createdPr = await inventoryForecastService.createRequisitionFromForecast(orgA._id, userA, {
      itemId: itemA._id,
      quantity: forecastResult.metrics.recommendedOrderQty,
      notes: 'Urgent restocking suggested by AI Copilot.',
    });

    assert(createdPr, 'Requisition should be created');
    assert.strictEqual(createdPr.status, 'draft', 'Generated PR should be draft');
    assert.strictEqual(createdPr.items.length, 1);
    assert.strictEqual(createdPr.items[0].quantity, forecastResult.metrics.recommendedOrderQty);
    assert(createdPr.requisitionNumber.startsWith('PR-'), 'PR number should be formatted');
  });

  // ────────────────────────────────────────────────────────────────
  // 2. Document OCR & PO Line Item Matching
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Document OCR (Invoice/Challan) & PO Tolerance Matching ---');

  // Create a target PO for matching
  const poForOcr = await PurchaseOrder.create({
    organizationId: orgA._id,
    poNumber: `PO-OCR-${Date.now().toString().slice(-4)}`,
    supplierId: supplier._id,
    warehouseId: warehouse._id,
    issueDate: new Date(),
    expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    currency: 'USD',
    status: 'ordered',
    items: [
      {
        itemId: itemA._id,
        description: itemA.name,
        orderedQuantity: 50,
        unitPrice: 45.0,
        lineTotal: 2250.0,
      },
    ],
    subtotal: 2250.0,
    totalAmount: 2250.0,
    createdBy: userA._id,
  });

  await runAsyncTest('2.1 OCR Extraction & PO Discrepancy Matching', async () => {
    const ocrResult = await inventoryOcrService.extractDocumentData({
      organizationId: orgA._id,
      userId: userA._id,
      documentBase64: 'mock_base64_invoice_content',
      mimeType: 'image/jpeg',
      purchaseOrderId: poForOcr._id,
    });

    assert(ocrResult.success, 'OCR extraction should succeed');
    assert(ocrResult.data.documentNumber, 'Should extract document number');
    assert(ocrResult.data.lineItems.length > 0, 'Should extract line items');
    assert(ocrResult.poMatch.matched, 'Should match against target PO');
    assert(ocrResult.prefillGrnPayload.lines.length > 0, 'Should structure GRN prefill lines');
  });

  // ────────────────────────────────────────────────────────────────
  // 3. Anomaly & Shrinkage Detection
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Anomaly & Shrinkage Detection ---');

  // Seed an unusual high shrinkage scrap entry in StockLedger
  await StockLedger.create({
    organizationId: orgA._id,
    transactionType: 'adjustment_out',
    documentNumber: 'ADJ-SHRINK-001',
    itemId: itemA._id,
    warehouseId: warehouse._id,
    quantity: -50,
    unitCost: 45.0,
    totalCost: 2250.0,
    runningBalanceQty: 15,
    createdAt: new Date(),
  });

  let anomalyScanResult = null;
  await runAsyncTest('3.1 Statistical Scan for Shrinkage & Stagnant Stock', async () => {
    anomalyScanResult = await inventoryAnomalyService.scanAnomalies(orgA._id, userA._id);

    assert(anomalyScanResult.scanTime, 'Scan time should be returned');
    assert(anomalyScanResult.anomalies.length > 0, 'Should flag at least one anomaly');
    const shrinkage = anomalyScanResult.anomalies.find((a) => a.anomalyType === 'shrinkage_spike');
    assert(shrinkage, 'Should detect shrinkage_spike anomaly');
    assert.strictEqual(shrinkage.status, 'open', 'Anomaly should be open');
  });

  await runAsyncTest('3.2 Human-in-the-Loop Feedback: Acknowledge / Resolve Anomaly', async () => {
    const targetAnomaly = anomalyScanResult.anomalies[0];
    const updated = await inventoryAnomalyService.recordFeedback(orgA._id, userA, targetAnomaly._id, {
      status: 'acknowledged',
      userFeedback: 'confirmed_issue',
      feedbackNote: 'Water pipe leak confirmed on Dock B; insurance claim filed.',
    });

    assert.strictEqual(updated.status, 'acknowledged');
    assert.strictEqual(updated.userFeedback, 'confirmed_issue');
    assert(updated.feedbackNote.includes('Dock B'));
  });

  // ────────────────────────────────────────────────────────────────
  // 4. Natural-Language Inventory Copilot
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Natural-Language Inventory Copilot (Read-Only Whitelist) ---');

  await runAsyncTest('4.1 Intent Query: "Items below reorder level"', async () => {
    const res = await inventoryCopilotService.queryCopilot(orgA._id, userA, 'Which items are below reorder level?');
    assert(res.answer.includes(itemA.name) || res.data?.length > 0, 'Answer should identify low-stock items');
    assert.strictEqual(res.category, 'low_stock');
    assert(res.suggestedFollowUps.length > 0);
  });

  await runAsyncTest('4.2 Intent Query: "Total inventory valuation"', async () => {
    const res = await inventoryCopilotService.queryCopilot(orgA._id, userA, 'What is our current inventory valuation?');
    assert(res.answer.includes('Inventory Valuation') || res.data?.totalValue !== undefined);
    assert.strictEqual(res.category, 'valuation');
  });

  await runAsyncTest('4.3 Intent Query: General Assistant Help', async () => {
    const res = await inventoryCopilotService.queryCopilot(orgA._id, userA, 'Hello copilot, what is my inventory overview?');
    assert(res.answer && res.answer.length > 0, 'Answer should not be empty');
    assert.strictEqual(res.category, 'general', 'Category should be general');
    assert(res.data.itemCount >= 1, 'Should count active catalog items');
  });

  // ────────────────────────────────────────────────────────────────
  // 5. Supplier Performance Scoring (Rubric + AI Synthesis)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Supplier Performance Scoring & Evaluation ---');

  // Seed a posted GRN for supplier
  await GoodsReceiptNote.create({
    organizationId: orgA._id,
    grnNumber: `GRN-EVAL-${Date.now().toString().slice(-4)}`,
    poId: poForOcr._id,
    supplierId: supplier._id,
    warehouseId: warehouse._id,
    receivedDate: new Date(),
    receivedBy: userA._id,
    status: 'posted_to_ledger',
    items: [
      {
        itemId: itemA._id,
        orderedQuantity: 50,
        receivedQuantity: 50,
        acceptedQuantity: 48,
        rejectedQuantity: 2,
        rejectionReason: 'Damaged packaging in transit',
        unitCost: 45.0,
      },
    ],
  });

  await runAsyncTest('5.1 Evaluate Supplier Performance Multi-Factor Score', async () => {
    const evalResult = await supplierScoringService.evaluateSupplier(orgA._id, supplier._id, {
      userId: userA._id,
    });

    assert(evalResult.supplier, 'Supplier data should be returned');
    assert(evalResult.evaluation.compositeScore >= 0 && evalResult.evaluation.compositeScore <= 100);
    assert(evalResult.evaluation.tier.includes('Tier'), 'Tier classification should be assigned');
    assert(evalResult.evaluation.aiSummary.length > 20, 'AI executive summary should be populated');
    assert(evalResult.evaluation.breakdown.onTimeDelivery, 'On-time breakdown should be present');
    assert(evalResult.evaluation.breakdown.qualityAcceptance, 'Quality acceptance breakdown should be present');
  });

  // ────────────────────────────────────────────────────────────────
  // 6. AiRun Audit Logging & Multi-Tenancy Scoping
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 6. AiRun Audit Logging & Multi-Tenant Isolation ---');

  await runAsyncTest('6.1 Verify Operations Logged in AiRun Collection', async () => {
    const runs = await AiRun.find({ organizationId: orgA._id }).sort({ createdAt: -1 });
    assert(runs.length >= 3, `Expected at least 3 AiRun records, found ${runs.length}`);
    const taskTypes = runs.map((r) => r.task);
    assert(taskTypes.includes('inventory_forecast'), 'Should log inventory_forecast task');
    assert(taskTypes.includes('inventory_copilot'), 'Should log inventory_copilot task');
  });

  await runAsyncTest('6.2 Tenant B Data Isolation: Cannot Access Tenant A Anomalies or Forecasts', async () => {
    // Tenant B attempts to fetch Tenant A item forecast
    let errorCaught = false;
    try {
      await inventoryForecastService.forecastItemDemand(orgB._id, itemA._id);
    } catch (err) {
      errorCaught = true;
      assert(err.message.includes('not found') || err.message.includes('organization'));
    }
    assert(errorCaught, 'Tenant B should be rejected from querying Tenant A item forecast');

    // Tenant B anomaly scan should return 0 Tenant A records
    const tenantBAnomalies = await InventoryAnomaly.find({ organizationId: orgB._id });
    assert.strictEqual(tenantBAnomalies.length, 0, 'Tenant B must have 0 anomalies');
  });

  // ────────────────────────────────────────────────────────────────
  // Clean Up Test Data
  // ────────────────────────────────────────────────────────────────
  await Item.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await ItemCategory.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await Warehouse.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await Supplier.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await StockMovement.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await StockLedger.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await PurchaseOrder.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await GoodsReceiptNote.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await PurchaseRequisition.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await InventoryAnomaly.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await AiRun.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await User.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await Organization.deleteMany({ _id: { $in: [orgA._id, orgB._id] } });

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`🏁 PHASE 5 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! AI FEATURES MODULE FULLY VERIFIED!');
  } else {
    console.log(`⚠️ ${totalTests - passedTests} TESTS FAILED.`);
    process.exit(1);
  }
  console.log('================================================================\n');
}

runSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
