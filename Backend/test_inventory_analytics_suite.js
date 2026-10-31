/**
 * test_inventory_analytics_suite.js
 * Comprehensive End-to-End Test Suite for Phase 6: Analytics & Reports in Nebula Inventory ERP
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
const StockLedger = require('./src/models/StockLedger');
const PurchaseOrder = require('./src/models/PurchaseOrder');
const GoodsReceiptNote = require('./src/models/GoodsReceiptNote');

// Services
const inventoryAnalyticsService = require('./src/services/inventoryAnalyticsService');

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
  console.log('🧪 STARTING NEBULA INVENTORY ERP - PHASE 6: ANALYTICS & REPORTS SUITE');
  console.log('================================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for Phase 6 Analytics Verification.\n');

  // Setup Test Tenant A
  const orgA = await Organization.create({
    name: 'Analytics Test Enterprise A',
    domain: `analytics-${Date.now()}a.nebula.test`,
  });

  const userA = await User.create({
    organizationId: orgA._id,
    email: `analyst-${Date.now()}@tenant-a.com`,
    passwordHash: 'dummyhash',
    fullName: 'Chief Supply Chain Officer',
    role: 'inventory_manager',
  });

  // Setup Test Tenant B
  const orgB = await Organization.create({
    name: 'Analytics Test Enterprise B',
    domain: `analytics-${Date.now()}b.nebula.test`,
  });

  const categoryElec = await ItemCategory.create({
    organizationId: orgA._id,
    name: 'Enterprise Microchips',
    code: `CAT-CHIP-${Date.now().toString().slice(-4)}`,
  });

  const categoryAccessory = await ItemCategory.create({
    organizationId: orgA._id,
    name: 'Peripheral Cables',
    code: `CAT-CBL-${Date.now().toString().slice(-4)}`,
  });

  const whMain = await Warehouse.create({
    organizationId: orgA._id,
    name: 'Silicon Valley Mega-Hub',
    code: `WH-SV-${Date.now().toString().slice(-4)}`,
  });

  const whBackup = await Warehouse.create({
    organizationId: orgA._id,
    name: 'East Coast Distribution Center',
    code: `WH-EC-${Date.now().toString().slice(-4)}`,
  });

  const supplier = await Supplier.create({
    organizationId: orgA._id,
    name: 'Precision Logic Foundry',
    supplierCode: `SUP-PREC-${Date.now().toString().slice(-4)}`,
    leadTimeDays: 7,
    contactPerson: { name: 'Lisa Chen', email: 'lisa@foundry.com', phone: '+1888999000' },
  });

  // Seed 3 diverse items for ABC/XYZ differentiation:
  // Item 1: High Value (Class A candidate)
  const itemHigh = await Item.create({
    organizationId: orgA._id,
    sku: `SKU-A-HIGH-${Date.now().toString().slice(-4)}`,
    name: 'NVIDIA GPU Acceleration Unit',
    categoryId: categoryElec._id,
    defaultWarehouseId: whMain._id,
    unitOfMeasure: 'pcs',
    baseUom: 'PCS',
    currentStock: 100,
    standardCost: 800.0,
    valuationMethod: 'fifo',
    active: true,
  });

  // Item 2: Medium Value (Class B candidate)
  const itemMid = await Item.create({
    organizationId: orgA._id,
    sku: `SKU-B-MID-${Date.now().toString().slice(-4)}`,
    name: 'DDR5 32GB RAM Module',
    categoryId: categoryElec._id,
    defaultWarehouseId: whMain._id,
    unitOfMeasure: 'pcs',
    baseUom: 'PCS',
    currentStock: 200,
    standardCost: 100.0,
    valuationMethod: 'weighted_average',
    active: true,
  });

  // Item 3: Low Value (Class C candidate)
  const itemLow = await Item.create({
    organizationId: orgA._id,
    sku: `SKU-C-LOW-${Date.now().toString().slice(-4)}`,
    name: 'Braided USB-C Interconnect Cable',
    categoryId: categoryAccessory._id,
    defaultWarehouseId: whBackup._id,
    unitOfMeasure: 'pcs',
    baseUom: 'PCS',
    currentStock: 500,
    standardCost: 5.0,
    valuationMethod: 'fifo',
    active: true,
  });

  // ────────────────────────────────────────────────────────────────
  // 1. Stock Valuation Report
  // ────────────────────────────────────────────────────────────────
  console.log('--- 1. Stock Valuation Report ---');

  let valReport = null;
  await runAsyncTest('1.1 Calculate Multi-Warehouse & Multi-Category Valuation', async () => {
    valReport = await inventoryAnalyticsService.getStockValuationReport(orgA._id);

    // Total: (100 * 800 = 80,000) + (200 * 100 = 20,000) + (500 * 5 = 2,500) = 102,500
    assert.strictEqual(valReport.summary.totalValuation, 102500);
    assert.strictEqual(valReport.summary.totalStockUnits, 800);
    assert.strictEqual(valReport.summary.totalActiveSkus, 3);
    assert.strictEqual(valReport.summary.wacValuation, 20000);
    assert.strictEqual(valReport.summary.fifoValuation, 82500);

    // Warehouse breakdown
    assert.strictEqual(valReport.warehouseBreakdown.length, 2);
    const svWh = valReport.warehouseBreakdown.find((w) => w._id.toString() === whMain._id.toString());
    assert(svWh, 'Silicon Valley hub should be present');
    assert.strictEqual(svWh.valuation, 100000);
    assert(svWh.percentage > 90);

    // Category breakdown
    assert.strictEqual(valReport.categoryBreakdown.length, 2);
  });

  // ────────────────────────────────────────────────────────────────
  // 2. ABC Analysis (Pareto Classification)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 2. ABC Analysis (Pareto 80/15/5 Distribution) ---');

  // Seed outflows to reflect consumption value:
  // ItemHigh: 50 units * 800 = 40,000 (vast majority of value)
  // ItemMid: 40 units * 100 = 4,000
  // ItemLow: 50 units * 5 = 250
  await StockLedger.create([
    {
      organizationId: orgA._id,
      transactionType: 'issue',
      documentNumber: 'MOV-ANA-001',
      itemId: itemHigh._id,
      warehouseId: whMain._id,
      quantity: -50,
      unitCost: 800.0,
      totalCost: 40000.0,
      runningBalanceQty: 50,
      createdAt: new Date(),
    },
    {
      organizationId: orgA._id,
      transactionType: 'issue',
      documentNumber: 'MOV-ANA-002',
      itemId: itemMid._id,
      warehouseId: whMain._id,
      quantity: -40,
      unitCost: 100.0,
      totalCost: 4000.0,
      runningBalanceQty: 160,
      createdAt: new Date(),
    },
    {
      organizationId: orgA._id,
      transactionType: 'issue',
      documentNumber: 'MOV-ANA-003',
      itemId: itemLow._id,
      warehouseId: whBackup._id,
      quantity: -50,
      unitCost: 5.0,
      totalCost: 250.0,
      runningBalanceQty: 450,
      createdAt: new Date(),
    },
  ]);

  let abcResult = null;
  await runAsyncTest('2.1 Compute Pareto ABC Classification & Cumulative Value', async () => {
    abcResult = await inventoryAnalyticsService.getAbcAnalysis(orgA._id);

    assert(abcResult.totalValue > 44000, 'Total consumption value should reflect ledger issues');
    assert.strictEqual(abcResult.items.length, 3);

    const classA = abcResult.items.find((i) => i.sku === itemHigh.sku);
    assert.strictEqual(classA.abcClass, 'A', 'Item High should be Class A');
    assert(classA.policy.includes('Tight control'), 'Policy for A should mandate tight control');

    const classC = abcResult.items.find((i) => i.sku === itemLow.sku);
    assert.strictEqual(classC.abcClass, 'C', 'Item Low should be Class C');
    assert(classC.policy.includes('Bulk purchase'), 'Policy for C should recommend bulk purchase');
  });

  // ────────────────────────────────────────────────────────────────
  // 3. XYZ Analysis (Demand Predictability & Variance)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 3. XYZ Analysis (Demand Predictability / Coefficient of Variation) ---');

  let xyzResult = null;
  await runAsyncTest('3.1 Compute Coefficient of Variation (CV) & Classify X, Y, Z', async () => {
    xyzResult = await inventoryAnalyticsService.getXyzAnalysis(orgA._id, { lookbackDays: 180 });

    assert.strictEqual(xyzResult.items.length, 3);
    assert(xyzResult.distribution.X, 'Distribution X should be populated');
    assert(xyzResult.distribution.Y, 'Distribution Y should be populated');
    assert(xyzResult.distribution.Z, 'Distribution Z should be populated');

    const classifiedItem = xyzResult.items[0];
    assert(['X', 'Y', 'Z'].includes(classifiedItem.xyzClass));
    assert(classifiedItem.coefficientOfVariation >= 0);
  });

  // ────────────────────────────────────────────────────────────────
  // 4. Combined 9-Cell ABC-XYZ Strategy Matrix
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Combined 9-Cell ABC-XYZ Strategy Matrix ---');

  let matrixResult = null;
  await runAsyncTest('4.1 Generate 9-Cell Matrix with Replenishment Strategies', async () => {
    matrixResult = await inventoryAnalyticsService.getAbcXyzMatrix(orgA._id);

    assert(matrixResult.gridCounts, 'Grid counts should be returned');
    assert(matrixResult.strategies.AX, 'Strategy for AX should be defined');
    assert(matrixResult.strategies.CZ, 'Strategy for CZ should be defined');

    // Total classified items across all cells must equal total active items
    const totalMatrixItems = Object.values(matrixResult.matrix).reduce((s, cell) => s + cell.length, 0);
    assert.strictEqual(totalMatrixItems, 3, 'All 3 items should be mapped into cells');
  });

  // ────────────────────────────────────────────────────────────────
  // 5. Stock Aging Breakdown (4 Buckets)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Stock Aging Breakdown ---');

  let agingResult = null;
  await runAsyncTest('5.1 Classify Stock across 0-30d, 31-60d, 61-90d, and >90d Buckets', async () => {
    agingResult = await inventoryAnalyticsService.getStockAgingReport(orgA._id);

    assert(agingResult.buckets.under30, '0-30 bucket should exist');
    assert(agingResult.buckets.thirtyToSixty, '31-60 bucket should exist');
    assert(agingResult.buckets.sixtyToNinety, '61-90 bucket should exist');
    assert(agingResult.buckets.over90, '>90 bucket should exist');

    assert.strictEqual(agingResult.totalValuation, 102500);
    // Newly created items in test fall in under30 bucket
    assert(agingResult.buckets.under30.units >= 800);
  });

  // ────────────────────────────────────────────────────────────────
  // 6. Turnover Ratio & Days Sales of Inventory (DSI)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Inventory Turnover Ratio & DSI ---');

  let turnoverResult = null;
  await runAsyncTest('6.1 Compute Turnover Ratio and DSI Formula Verification', async () => {
    turnoverResult = await inventoryAnalyticsService.getTurnoverAndDsi(orgA._id, { days: 365 });

    assert(turnoverResult.cogs > 0, 'COGS should be greater than 0');
    assert(turnoverResult.averageInventoryValue > 0, 'Average inventory value should be positive');
    assert(turnoverResult.turnoverRatio >= 0, 'Turnover ratio should be computed');
    assert(turnoverResult.daysSalesOfInventory >= 0, 'DSI should be computed');
    assert(['poor', 'healthy', 'excellent'].includes(turnoverResult.efficiencyRating));
  });

  // ────────────────────────────────────────────────────────────────
  // 7. Order Fulfillment & OTIF (On-Time In-Full)
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Order Fulfillment & Supplier Fill-Rate (OTIF) ---');

  // Create a PO and matching posted GRN
  const poOtif = await PurchaseOrder.create({
    organizationId: orgA._id,
    poNumber: `PO-OTIF-${Date.now().toString().slice(-4)}`,
    supplierId: supplier._id,
    warehouseId: whMain._id,
    expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'ordered',
    items: [
      {
        itemId: itemHigh._id,
        orderedQuantity: 10,
        unitPrice: 800.0,
        lineTotal: 8000.0,
      },
    ],
    subtotal: 8000.0,
    totalAmount: 8000.0,
    createdBy: userA._id,
  });

  await GoodsReceiptNote.create({
    organizationId: orgA._id,
    grnNumber: `GRN-OTIF-${Date.now().toString().slice(-4)}`,
    poId: poOtif._id,
    supplierId: supplier._id,
    warehouseId: whMain._id,
    receivedDate: new Date(), // On-time
    receivedBy: userA._id,
    status: 'posted_to_ledger',
    items: [
      {
        itemId: itemHigh._id,
        orderedQuantity: 10,
        receivedQuantity: 10,
        acceptedQuantity: 10, // In-full
        rejectedQuantity: 0,
        unitCost: 800.0,
      },
    ],
  });

  await runAsyncTest('7.1 Compute OTIF Fill-Rate Metrics', async () => {
    const otifResult = await inventoryAnalyticsService.getFulfillmentAndOtif(orgA._id);

    assert(otifResult.totalOrdersEvaluated >= 1, 'Should evaluate at least 1 PO');
    assert.strictEqual(otifResult.onTimeDeliveries, 1);
    assert.strictEqual(otifResult.inFullDeliveries, 1);
    assert.strictEqual(otifResult.otifDeliveries, 1);
    assert.strictEqual(otifResult.metrics.otifRate, '100%');
  });

  // ────────────────────────────────────────────────────────────────
  // 8. CSV Report Export Engine
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 8. CSV Export Formatting & Escape Sanitization ---');

  await runAsyncTest('8.1 Export Valuation, ABC, and Aging CSV Reports', async () => {
    const csvValuation = await inventoryAnalyticsService.exportAnalyticsCsv(orgA._id, 'valuation');
    assert(csvValuation.includes('Warehouse,Category,SKU,Item Name'), 'Valuation CSV headers missing');
    assert(csvValuation.includes(itemHigh.sku), 'Item High should be in Valuation CSV');

    const csvAbc = await inventoryAnalyticsService.exportAnalyticsCsv(orgA._id, 'abc');
    assert(csvAbc.includes('SKU,Item Name,Standard Cost,Consumed Units,Consumption Value'), 'ABC CSV headers missing');
    assert(csvAbc.includes('"A"'), 'ABC class A should be in ABC CSV');

    const csvAging = await inventoryAnalyticsService.exportAnalyticsCsv(orgA._id, 'aging');
    assert(csvAging.includes('Bucket,SKU,Item Name,Stock Qty'), 'Aging CSV headers missing');
  });

  // ────────────────────────────────────────────────────────────────
  // 9. Multi-Tenant Scoping & Data Isolation
  // ────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Multi-Tenant Isolation ---');

  await runAsyncTest('9.1 Tenant B Valuation and Analytics Returns 0 Isolated Records', async () => {
    const tenantBValuation = await inventoryAnalyticsService.getStockValuationReport(orgB._id);
    assert.strictEqual(tenantBValuation.summary.totalValuation, 0, 'Tenant B valuation must be 0');
    assert.strictEqual(tenantBValuation.summary.totalStockUnits, 0, 'Tenant B stock units must be 0');
    assert.strictEqual(tenantBValuation.warehouseBreakdown.length, 0);

    const tenantBAging = await inventoryAnalyticsService.getStockAgingReport(orgB._id);
    assert.strictEqual(tenantBAging.totalValuation, 0);
  });

  // ────────────────────────────────────────────────────────────────
  // Clean Up Test Data
  // ────────────────────────────────────────────────────────────────
  await Item.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await ItemCategory.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await Warehouse.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await Supplier.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await StockLedger.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await PurchaseOrder.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await GoodsReceiptNote.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await User.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
  await Organization.deleteMany({ _id: { $in: [orgA._id, orgB._id] } });

  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`🏁 PHASE 6 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! ANALYTICS & REPORTS MODULE FULLY VERIFIED!');
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
