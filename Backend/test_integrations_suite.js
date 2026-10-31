/**
 * Comprehensive Automated Test Suite for Nebula Inventory ERP - Phase 4: Integrations
 * Tests:
 * 1. Expenses Bridge: Department Budget Commitments & Hard Block / Warning Enforcement
 * 2. Expenses Bridge: Supplier Invoice Spend Posting against Department Budget
 * 3. Recruitment / HRMS Bridge: Equipment Kit Template Creation
 * 4. Recruitment / HRMS Bridge: Automated Asset Request on Employee Onboarding
 * 5. Recruitment / HRMS Bridge: Asset Physical Issue & Stock Ledger Deduction
 * 6. Offboarding: Exit Asset Return Checklist & Restocking into Warehouse
 * 7. Accounting Hook Layer: Double-Entry Journal Entry Event Emissions
 * 8. Inventory Notifications: Low Stock & Batch Expiration Detection
 * 9. Webhook Subscription & Dispatch Registration
 * 10. Multi-Tenant Isolation for Integrations
 */

const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./src/models/Item');
const Warehouse = require('./src/models/Warehouse');
const Supplier = require('./src/models/Supplier');
const StockLedger = require('./src/models/StockLedger');
const StockMovement = require('./src/models/StockMovement');
const Department = require('./src/models/Department');
const DepartmentBudget = require('./src/models/DepartmentBudget');
const Employee = require('./src/models/Employee');
const Candidate = require('./src/models/Candidate');
const EquipmentKit = require('./src/models/EquipmentKit');
const EmployeeAssetAssignment = require('./src/models/EmployeeAssetAssignment');
const PurchaseRequisition = require('./src/models/PurchaseRequisition');
const StockBatch = require('./src/models/StockBatch');

const procurementService = require('./src/services/procurementService');
const procurementBudgetBridgeService = require('./src/services/procurementBudgetBridgeService');
const hrmsInventoryBridgeService = require('./src/services/hrmsInventoryBridgeService');
const accountingHookService = require('./src/services/accountingHookService');
const inventoryNotificationService = require('./src/services/inventoryNotificationService');
const stockLedgerService = require('./src/services/stockLedgerService');

console.log('================================================================');
console.log('🧪 STARTING NEBULA INVENTORY ERP - PHASE 4: INTEGRATIONS TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

async function runAsyncTest(testName, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${testName}:`, error.message);
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nebula');
  console.log('Connected to MongoDB for Phase 4 Integrations Verification.\n');

  await Promise.all([
    EquipmentKit.init(),
    EmployeeAssetAssignment.init(),
    Department.init(),
    DepartmentBudget.init(),
    Employee.init(),
    Candidate.init(),
    Item.init(),
    Warehouse.init(),
    StockLedger.init(),
  ]);

  const tenantA = new mongoose.Types.ObjectId();
  const tenantB = new mongoose.Types.ObjectId();
  const testUser = new mongoose.Types.ObjectId();

  let deptEngineering;
  let budgetEngineering;
  let warehouseA;
  let laptopItem;
  let monitorItem;
  let kitDev;
  let testEmployee;
  let assetAssignment;

  try {
    // ── Fixture Setup ──
    deptEngineering = await Department.create({
      organizationId: tenantA,
      name: 'Cloud Infrastructure & Core Engineering',
      code: 'ENG',
    });

    warehouseA = await Warehouse.create({
      organizationId: tenantA,
      name: 'IT Depot & Logistics Hub',
      code: 'WH-IT-01',
      isDefault: true,
    });

    laptopItem = await Item.create({
      organizationId: tenantA,
      sku: 'SKU-MBP-16',
      name: 'MacBook Pro 16-inch M3 Max',
      baseUom: 'PCS',
      standardCost: 3200,
      minStockLevel: 2,
      reorderLevel: 5,
      trackingType: 'serial',
    });

    monitorItem = await Item.create({
      organizationId: tenantA,
      sku: 'SKU-DELL-U2723QE',
      name: 'Dell UltraSharp 27 4K Monitor',
      baseUom: 'PCS',
      standardCost: 550,
      minStockLevel: 2,
      reorderLevel: 4,
      trackingType: 'none',
    });

    // Stock initial units into warehouse via ledger
    await stockLedgerService.postReceipt({
      organizationId: tenantA,
      documentNumber: 'INIT-STOCK-01',
      itemId: laptopItem._id,
      warehouseId: warehouseA._id,
      quantity: 5,
      unitCost: 3200,
      serialNumbers: ['SN-MBP-001', 'SN-MBP-002', 'SN-MBP-003', 'SN-MBP-004', 'SN-MBP-005'],
      actorId: testUser,
    });

    await stockLedgerService.postReceipt({
      organizationId: tenantA,
      documentNumber: 'INIT-STOCK-02',
      itemId: monitorItem._id,
      warehouseId: warehouseA._id,
      quantity: 10,
      unitCost: 550,
      actorId: testUser,
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 1. EXPENSES & DEPARTMENT BUDGET INTEGRATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Expenses & Department Budget Bridge ---');

    await runAsyncTest('1.1 Create Department Budget with Hard Block Mode', async () => {
      budgetEngineering = await DepartmentBudget.create({
        organizationId: tenantA,
        departmentId: deptEngineering._id,
        fiscalYear: new Date().getFullYear(),
        period: 'annual',
        allocatedAmount: 5000,
        spentAmount: 0,
        controlMode: 'block', // hard block
      });

      assert.strictEqual(budgetEngineering.allocatedAmount, 5000);
      assert.strictEqual(budgetEngineering.controlMode, 'block');
    });

    await runAsyncTest('1.2 Hard Block: Reject PR Exceeding Department Budget', async () => {
      let blocked = false;
      try {
        // Try creating requisition for $6,400 (2 * 3200) which exceeds $5,000 budget
        await procurementService.createRequisition(tenantA, testUser, {
          departmentId: deptEngineering._id,
          items: [{ itemId: laptopItem._id, quantity: 2, estimatedUnitPrice: 3200 }],
        });
      } catch (err) {
        blocked = true;
        assert.ok(err.message.includes('Budget Exceeded'));
      }
      assert.strictEqual(blocked, true, 'Requisition exceeding budget must be blocked');
    });

    await runAsyncTest('1.3 Allow PR Within Department Budget', async () => {
      // Requisition for 1 monitor at $550 is well within $5,000
      const pr = await procurementService.createRequisition(tenantA, testUser, {
        departmentId: deptEngineering._id,
        items: [{ itemId: monitorItem._id, quantity: 1, estimatedUnitPrice: 550 }],
      });
      assert.ok(pr._id);
      assert.strictEqual(pr.totalEstimatedAmount, 550);
    });

    await runAsyncTest('1.4 Post Procurement Spend to Department Budget', async () => {
      const updatedBudget = await procurementBudgetBridgeService.postProcurementSpendToBudget({
        organizationId: tenantA,
        departmentId: deptEngineering._id,
        amount: 550,
      });
      assert.strictEqual(updatedBudget.spentAmount, 550);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. RECRUITMENT / HRMS BRIDGE: EQUIPMENT KITS & PROVISIONING
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. HRMS Bridge: Equipment Kits & Employee Onboarding Provisioning ---');

    await runAsyncTest('2.1 Create Reusable Equipment Kit Template', async () => {
      kitDev = await hrmsInventoryBridgeService.createEquipmentKit(tenantA, {
        name: 'Senior Software Engineer Hardware Kit',
        code: 'KIT-DEV-SR',
        designation: 'Senior Software Engineer',
        departmentId: deptEngineering._id,
        isDefault: true,
        items: [
          { itemId: laptopItem._id, quantity: 1, isMandatory: true, notes: 'Primary workstation' },
          { itemId: monitorItem._id, quantity: 1, isMandatory: true, notes: 'Dual-display setup' },
        ],
      });

      assert.strictEqual(kitDev.items.length, 2);
      assert.strictEqual(kitDev.code, 'KIT-DEV-SR');
    });

    await runAsyncTest('2.2 Auto-Create Asset Request on Employee Creation', async () => {
      testEmployee = await Employee.create({
        organizationId: tenantA,
        employeeCode: 'EMP-ENG-001',
        fullName: 'Alex Mercer',
        email: 'alex.mercer@company.com',
        departmentId: deptEngineering._id,
        designation: 'Senior Software Engineer',
      });

      assetAssignment = await hrmsInventoryBridgeService.autoCreateOnboardingAssetRequest({
        organizationId: tenantA,
        employeeId: testEmployee._id,
        departmentId: deptEngineering._id,
        designation: 'Senior Software Engineer',
        actorId: testUser,
      });

      assert.ok(assetAssignment);
      assert.strictEqual(assetAssignment.status, 'requested');
      assert.strictEqual(assetAssignment.assignedItems.length, 2);
      assert.ok(assetAssignment.assignmentNumber.startsWith('ASST-'));
    });

    await runAsyncTest('2.3 Physical Asset Issue & Stock Ledger Deduction', async () => {
      const balanceBeforeLaptop = await stockLedgerService.getStockBalance(tenantA, laptopItem._id, warehouseA._id);
      const balanceBeforeMonitor = await stockLedgerService.getStockBalance(tenantA, monitorItem._id, warehouseA._id);

      assert.strictEqual(balanceBeforeLaptop.onHand, 5);
      assert.strictEqual(balanceBeforeMonitor.onHand, 10);

      // Issue assets with serial number allocation
      const issuedAssignment = await hrmsInventoryBridgeService.issueAssetsToEmployee({
        organizationId: tenantA,
        assignmentId: assetAssignment._id,
        actorId: testUser,
        warehouseId: warehouseA._id,
        allocations: [
          {
            itemId: laptopItem._id,
            quantity: 1,
            unitCost: 3200,
            serialNumbers: ['SN-MBP-001'],
          },
          {
            itemId: monitorItem._id,
            quantity: 1,
            unitCost: 550,
          },
        ],
      });

      assert.strictEqual(issuedAssignment.status, 'issued');
      assert.strictEqual(issuedAssignment.stockLedgerPosted, true);

      // Verify stock balances decreased
      const balanceAfterLaptop = await stockLedgerService.getStockBalance(tenantA, laptopItem._id, warehouseA._id);
      const balanceAfterMonitor = await stockLedgerService.getStockBalance(tenantA, monitorItem._id, warehouseA._id);

      assert.strictEqual(balanceAfterLaptop.onHand, 4, '1 Laptop issued out of 5');
      assert.strictEqual(balanceAfterMonitor.onHand, 9, '1 Monitor issued out of 10');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 3. OFFBOARDING: EXIT ASSET RETURN CHECKLIST
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Offboarding: Exit Return Checklist & Restocking ---');

    await runAsyncTest('3.1 Initiate Exit Asset Checklist', async () => {
      const exitResult = await hrmsInventoryBridgeService.initiateExitReturnChecklist({
        organizationId: tenantA,
        employeeId: testEmployee._id,
        actorId: testUser,
        remarks: 'Contract completion offboarding',
      });

      assert.strictEqual(exitResult.count, 1);
      const updatedAsst = await EmployeeAssetAssignment.findById(assetAssignment._id);
      assert.strictEqual(updatedAsst.exitChecklist.isCompleted, false);
      assert.ok(updatedAsst.exitChecklist.initiatedAt);
    });

    await runAsyncTest('3.2 Process Return & Restock Good Items to Warehouse', async () => {
      // Alex returns the laptop (good condition) and monitor (good condition)
      const returnedAssignment = await hrmsInventoryBridgeService.processExitAssetReturn({
        organizationId: tenantA,
        assignmentId: assetAssignment._id,
        actorId: testUser,
        warehouseId: warehouseA._id,
        returnsList: [
          { itemId: laptopItem._id, condition: 'good' },
          { itemId: monitorItem._id, condition: 'good' },
        ],
      });

      assert.strictEqual(returnedAssignment.status, 'returned_full');
      assert.strictEqual(returnedAssignment.exitChecklist.isCompleted, true);

      // Verify stock was restored into the warehouse
      const balanceRestoredLaptop = await stockLedgerService.getStockBalance(tenantA, laptopItem._id, warehouseA._id);
      const balanceRestoredMonitor = await stockLedgerService.getStockBalance(tenantA, monitorItem._id, warehouseA._id);

      assert.strictEqual(balanceRestoredLaptop.onHand, 5, 'Laptop restocked back to 5');
      assert.strictEqual(balanceRestoredMonitor.onHand, 10, 'Monitor restocked back to 10');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 4. ACCOUNTING HOOK LAYER
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Accounting Hook Layer: Double-Entry Journal Events ---');

    await runAsyncTest('4.1 Verify Double-Entry Journal Entry Event Generation', async () => {
      const accountingEvents = accountingHookService.getAccountingEvents(tenantA);
      assert.ok(accountingEvents.length >= 2, 'Accounting events must be logged');

      const issueEvent = accountingEvents.find((e) => e.eventType === 'INVENTORY.ISSUE');
      assert.ok(issueEvent, 'INVENTORY.ISSUE event must be present');
      assert.strictEqual(issueEvent.entries.length, 2);
      // Verify Debit matches Credit
      const totalDebit = issueEvent.entries.reduce((a, b) => a + b.debit, 0);
      const totalCredit = issueEvent.entries.reduce((a, b) => a + b.credit, 0);
      assert.strictEqual(totalDebit, totalCredit, 'Debit must equal Credit in double-entry');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 5. NOTIFICATIONS & WEBHOOKS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Notifications & Webhook Dispatch ---');

    await runAsyncTest('5.1 Low Stock Alert Trigger', async () => {
      // Drain laptop stock down to 1 (below minStockLevel 2)
      await stockLedgerService.postIssue({
        organizationId: tenantA,
        documentNumber: 'DRAIN-01',
        itemId: laptopItem._id,
        warehouseId: warehouseA._id,
        quantity: 4,
        actorId: testUser,
      });

      const alert = await inventoryNotificationService.checkLowStockAlerts(
        tenantA,
        laptopItem._id,
        warehouseA._id
      );

      assert.ok(alert);
      assert.strictEqual(alert.severity, 'critical');
      assert.ok(alert.title.includes('Critical Low Stock'));
    });

    await runAsyncTest('5.2 Batch Expiration Scanner', async () => {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + 15); // Expires in 15 days

      await StockBatch.create({
        organizationId: tenantA,
        itemId: laptopItem._id,
        warehouseId: warehouseA._id,
        batchNumber: 'BATCH-EXP-NEAR',
        initialQuantity: 10,
        remainingQuantity: 10,
        costPerUnit: 3200,
        expiryDate: expDate,
        status: 'active',
      });

      const batchAlerts = await inventoryNotificationService.scanExpiringBatches(tenantA, 30);
      assert.ok(batchAlerts.length >= 1);
      assert.ok(batchAlerts[0].title.includes('Batch Expiring'));
    });

    await runAsyncTest('5.3 Webhook Subscription Registration', async () => {
      const webhook = inventoryNotificationService.registerWebhook(tenantA, {
        url: 'https://erp.partner.com/webhooks/inventory',
        secret: 'whsec_test_secret',
        events: ['stock.critical_low', 'INVENTORY.RECEIPT'],
      });

      assert.ok(webhook.id.startsWith('wh_'));
      const activeWebhooks = inventoryNotificationService.getWebhooks(tenantA);
      assert.strictEqual(activeWebhooks.length, 1);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 6. MULTI-TENANCY ISOLATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Multi-Tenant Isolation ---');

    await runAsyncTest('6.1 Tenant B cannot access Tenant A kits, assignments, or events', async () => {
      const tenantBKit = await EquipmentKit.findOne({
        _id: kitDev._id,
        organizationId: tenantB,
      });
      assert.strictEqual(tenantBKit, null, 'Tenant B cannot see Tenant A EquipmentKit');

      const tenantBAssignment = await EmployeeAssetAssignment.findOne({
        _id: assetAssignment._id,
        organizationId: tenantB,
      });
      assert.strictEqual(tenantBAssignment, null, 'Tenant B cannot see Tenant A AssetAssignment');

      const tenantBEvents = accountingHookService.getAccountingEvents(tenantB);
      assert.strictEqual(tenantBEvents.length, 0, 'Tenant B cannot see Tenant A Accounting Events');
    });

  } finally {
    // ── Teardown ──
    await Promise.all([
      EquipmentKit.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      EmployeeAssetAssignment.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Department.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      DepartmentBudget.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Employee.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Item.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Warehouse.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      StockLedger.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      StockMovement.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      StockBatch.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      PurchaseRequisition.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
    ]);
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE 4 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! INTEGRATIONS MODULE FULLY VERIFIED!');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
  }
  console.log('================================================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
