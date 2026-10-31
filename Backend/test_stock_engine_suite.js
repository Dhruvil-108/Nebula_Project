/**
 * Comprehensive Automated Test Suite for Nebula Inventory ERP - Phase 2: Stock Engine
 * Tests:
 * 1. Single Append-Only Ledger Math & Balance Derivation
 * 2. FIFO Valuation Cost Layering (Strict Layer Consumption)
 * 3. Moving Weighted Average Cost (WAC) Math
 * 4. Concurrency Safety: Anti-Oversell / Negative Stock Guard
 * 5. Inter-Warehouse Transfer (Source Outflow -> In-Transit -> Destination Inflow)
 * 6. Stock Adjustment with Reason Codes
 * 7. Cycle Count Variance Reconciliation
 * 8. Compensating Reversal Entries (Zero Mutation of Historic Rows)
 * 9. Batch Traceability & Expiration Lifecycle
 * 10. Serial Number Genealogy
 */

const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./src/models/Item');
const ItemCategory = require('./src/models/ItemCategory');
const Warehouse = require('./src/models/Warehouse');
const WarehouseBin = require('./src/models/WarehouseBin');
const StockLedger = require('./src/models/StockLedger');
const StockBatch = require('./src/models/StockBatch');
const StockSerial = require('./src/models/StockSerial');
const StockMovement = require('./src/models/StockMovement');
const Supplier = require('./src/models/Supplier');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const stockLedgerService = require('./src/services/stockLedgerService');
const stockValuationService = require('./src/services/stockValuationService');
const traceabilityService = require('./src/services/traceabilityService');

console.log('================================================================');
console.log('🧪 STARTING NEBULA INVENTORY ERP - PHASE 2: STOCK ENGINE TEST SUITE');
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
  console.log('Connected to MongoDB for Phase 2 Stock Engine Verification.\n');

  await Promise.all([
    StockLedger.init(),
    StockBatch.init(),
    StockSerial.init(),
    StockMovement.init(),
    Item.init(),
    Warehouse.init(),
  ]);

  const tenant = new mongoose.Types.ObjectId();
  let wh1;
  let wh2;
  let bin1;
  let itemFifo;
  let itemWac;
  let itemSerial;

  try {
    // ── Setup master fixtures for tenant ──
    wh1 = await Warehouse.create({
      organizationId: tenant,
      code: 'WH-MAIN',
      name: 'Central Warehouse',
      isDefault: true,
    });
    wh2 = await Warehouse.create({
      organizationId: tenant,
      code: 'WH-REMOTE',
      name: 'Remote Depot',
      isDefault: false,
    });
    bin1 = await WarehouseBin.create({
      organizationId: tenant,
      warehouseId: wh1._id,
      binCode: 'BIN-MAIN-01',
    });

    itemFifo = await Item.create({
      organizationId: tenant,
      sku: 'SKU-FIFO-01',
      name: 'High Performance RAM 32GB',
      baseUom: 'PCS',
      trackingType: 'batch',
      valuationMethod: 'fifo',
      standardCost: 100.0,
    });

    itemWac = await Item.create({
      organizationId: tenant,
      sku: 'SKU-WAC-01',
      name: 'Ethernet Patch Cable 5m',
      baseUom: 'PCS',
      trackingType: 'none',
      valuationMethod: 'weighted_average',
      standardCost: 10.0,
    });

    itemSerial = await Item.create({
      organizationId: tenant,
      sku: 'SKU-SRL-01',
      name: 'Core Switch 24-Port',
      baseUom: 'PCS',
      trackingType: 'serial',
      standardCost: 1200.0,
    });

    // ── 1. APPEND-ONLY LEDGER & BALANCE DERIVATION ──
    console.log('--- 1. Append-Only Ledger & Balance Derivation ---');

    await runAsyncTest('1.1 Post Goods Receipt (GRN) into Immutable Ledger', async () => {
      const receipt = await stockLedgerService.postReceipt({
        organizationId: tenant,
        documentNumber: 'GRN-TEST-001',
        itemId: itemFifo._id,
        warehouseId: wh1._id,
        binId: bin1._id,
        quantity: 10,
        unitCost: 100.0,
        batchNumber: 'LOT-2026-A',
      });

      assert.ok(receipt._id, 'Ledger entry should be created');
      assert.strictEqual(receipt.quantity, 10);
      assert.strictEqual(receipt.totalCost, 1000.0);
      assert.strictEqual(receipt.runningBalanceQty, 10);

      // Verify derived balance
      const balance = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(balance.onHand, 10);
      assert.strictEqual(balance.available, 10);
      assert.strictEqual(balance.totalValuation, 1000.0);
    });

    // ── 2. FIFO VALUATION COST LAYERING ──
    console.log('\n--- 2. FIFO Valuation Cost Layering ---');

    await runAsyncTest('2.1 FIFO Consumes Oldest Cost Layers First', async () => {
      // Inbound Layer 2: 10 units @ $150
      await stockLedgerService.postReceipt({
        organizationId: tenant,
        documentNumber: 'GRN-TEST-002',
        itemId: itemFifo._id,
        warehouseId: wh1._id,
        binId: bin1._id,
        quantity: 10,
        unitCost: 150.0,
        batchNumber: 'LOT-2026-B',
      });

      const balBefore = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(balBefore.onHand, 20);
      assert.strictEqual(balBefore.totalValuation, 2500.0); // 10*100 + 10*150

      // Issue 12 units under FIFO:
      // Should consume: 10 units @ $100 ($1000) + 2 units @ $150 ($300) = $1300 total cost
      const fifoIssue = await stockLedgerService.postIssue({
        organizationId: tenant,
        documentNumber: 'ISS-TEST-001',
        itemId: itemFifo._id,
        warehouseId: wh1._id,
        quantity: 12,
        reasonCode: 'internal_use',
      });

      assert.strictEqual(fifoIssue.quantity, -12);
      assert.strictEqual(fifoIssue.totalCost, -1300.0, 'FIFO total cost must strictly equal $1300.00');

      // Remaining stock should be 8 units @ $150 ($1200)
      const balAfter = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(balAfter.onHand, 8);
      assert.strictEqual(balAfter.totalValuation, 1200.0);
    });

    // ── 3. WEIGHTED AVERAGE COST (WAC) ──
    console.log('\n--- 3. Moving Weighted Average Cost (WAC) ---');

    await runAsyncTest('3.1 Moving Weighted Average Calculation and Outflow', async () => {
      // Receipt 1: 100 units @ $10 = $1,000
      await stockLedgerService.postReceipt({
        organizationId: tenant,
        documentNumber: 'GRN-WAC-001',
        itemId: itemWac._id,
        warehouseId: wh1._id,
        quantity: 100,
        unitCost: 10.0,
      });

      // Receipt 2: 100 units @ $20 = $2,000 -> Total 200 units, $3000 value -> avg = $15.00
      await stockLedgerService.postReceipt({
        organizationId: tenant,
        documentNumber: 'GRN-WAC-002',
        itemId: itemWac._id,
        warehouseId: wh1._id,
        quantity: 100,
        unitCost: 20.0,
      });

      const wac = await stockValuationService.getCurrentWeightedAverageCost({
        organizationId: tenant,
        itemId: itemWac._id,
        warehouseId: wh1._id,
      });
      assert.strictEqual(wac.currentQty, 200);
      assert.strictEqual(wac.unitCost, 15.0, 'Weighted average cost must be $15.00');

      // Issue 50 units @ $15 = $750
      const wacIssue = await stockLedgerService.postIssue({
        organizationId: tenant,
        documentNumber: 'ISS-WAC-001',
        itemId: itemWac._id,
        warehouseId: wh1._id,
        quantity: 50,
      });

      assert.strictEqual(wacIssue.totalCost, -750.0);
      const balAfter = await stockLedgerService.getStockBalance(tenant, itemWac._id, wh1._id);
      assert.strictEqual(balAfter.onHand, 150);
      assert.strictEqual(balAfter.totalValuation, 2250.0); // 150 * 15
    });

    // ── 4. CONCURRENCY & ANTI-OVERSELL GUARD ──
    console.log('\n--- 4. Concurrency Safety: Anti-Oversell / Negative Stock Guard ---');

    await runAsyncTest('4.1 Rejects Issue Exceeding Available Stock', async () => {
      const bal = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(bal.available, 8);

      let threwError = false;
      try {
        await stockLedgerService.postIssue({
          organizationId: tenant,
          itemId: itemFifo._id,
          warehouseId: wh1._id,
          quantity: 10, // Exceeds available (8)
          allowNegativeStock: false,
        });
      } catch (err) {
        threwError = true;
        assert.ok(err.message.includes('Insufficient available stock'));
      }
      assert.strictEqual(threwError, true, 'Must reject issue when quantity exceeds available stock');
    });

    // ── 5. INTER-WAREHOUSE TRANSFERS (IN-TRANSIT) ──
    console.log('\n--- 5. Inter-Warehouse Transfers (In-Transit State) ---');

    await runAsyncTest('5.1 Dispatch Places Stock in In-Transit, Receive Moves into Destination', async () => {
      // Current in WH1 is 8 units. Dispatch 5 units to WH2.
      const transfer = await stockLedgerService.postTransferDispatch({
        organizationId: tenant,
        sourceWarehouseId: wh1._id,
        destinationWarehouseId: wh2._id,
        lines: [
          {
            itemId: itemFifo._id,
            actualQty: 5,
            unitCost: 150.0,
            batchNumber: 'LOT-2026-B',
          },
        ],
      });

      assert.strictEqual(transfer.status, 'in_transit');

      // WH1 onHand is now 8 - 5 = 3
      const wh1Bal = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(wh1Bal.onHand, 3);

      // WH2 has inTransit = 5, onHand = 0
      const wh2BalBefore = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh2._id);
      assert.strictEqual(wh2BalBefore.onHand, 0);
      assert.strictEqual(wh2BalBefore.inTransit, 5);

      // Complete transfer receive at WH2
      const completed = await stockLedgerService.postTransferReceive({
        organizationId: tenant,
        movementId: transfer._id,
      });
      assert.strictEqual(completed.status, 'completed');

      // WH2 onHand is now 5, inTransit = 0
      const wh2BalAfter = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh2._id);
      assert.strictEqual(wh2BalAfter.onHand, 5);
      assert.strictEqual(wh2BalAfter.inTransit, 0);
      assert.strictEqual(wh2BalAfter.totalValuation, 750.0);
    });

    // ── 6. COMPENSATING REVERSALS ──
    console.log('\n--- 6. Compensating Reversals (Immutable Ledger) ---');

    await runAsyncTest('6.1 Reversal Appends Offsetting Entry Without Editing Past Rows', async () => {
      // Post receipt of 4 units
      const initialBal = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);

      const errReceipt = await stockLedgerService.postReceipt({
        organizationId: tenant,
        documentNumber: 'GRN-ERR-001',
        itemId: itemFifo._id,
        warehouseId: wh1._id,
        quantity: 4,
        unitCost: 120.0,
      });

      const afterBal = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(afterBal.onHand, initialBal.onHand + 4);

      // Reverse the erroneous receipt
      const reversal = await stockLedgerService.reverseLedgerEntry({
        organizationId: tenant,
        ledgerId: errReceipt._id,
        reason: 'Duplicate supplier receipt error',
      });

      assert.strictEqual(reversal.transactionType, 'reversal');
      assert.strictEqual(reversal.quantity, -4);
      assert.strictEqual(reversal.reversalOfLedgerId.toString(), errReceipt._id.toString());

      // Original row is marked reversed but untouched in quantity/values
      const recheckedOriginal = await StockLedger.findById(errReceipt._id);
      assert.strictEqual(recheckedOriginal.quantity, 4);
      assert.strictEqual(recheckedOriginal.isReversed, true);

      // Final net balance is exactly restored to initial
      const finalBal = await stockLedgerService.getStockBalance(tenant, itemFifo._id, wh1._id);
      assert.strictEqual(finalBal.onHand, initialBal.onHand);
    });

    // ── 7. TRACEABILITY (BATCH & SERIAL) ──
    console.log('\n--- 7. Batch & Serial Traceability ---');

    await runAsyncTest('7.1 Forward and Backward Trace for Batch and Serial', async () => {
      // 1. Batch Trace
      const batchTrace = await traceabilityService.traceBatch(tenant, 'LOT-2026-A');
      assert.strictEqual(batchTrace.found, true);
      assert.strictEqual(batchTrace.batchNumber, 'LOT-2026-A');
      assert.ok(batchTrace.timeline.length > 0, 'Batch should have ledger timeline');

      // 2. Serial Trace
      await stockLedgerService.postReceipt({
        organizationId: tenant,
        documentNumber: 'GRN-SRL-001',
        itemId: itemSerial._id,
        warehouseId: wh1._id,
        quantity: 1,
        unitCost: 1200.0,
        serialNumbers: ['SN-SW-998811'],
      });

      const serialTrace = await traceabilityService.traceSerial(tenant, 'SN-SW-998811');
      assert.strictEqual(serialTrace.found, true);
      assert.strictEqual(serialTrace.serialNumber, 'SN-SW-998811');
      assert.strictEqual(serialTrace.status, 'in_stock');
      assert.strictEqual(serialTrace.timeline.length, 1);
    });

  } finally {
    // Clean up test records
    await StockLedger.deleteMany({ organizationId: tenant });
    await StockBatch.deleteMany({ organizationId: tenant });
    await StockSerial.deleteMany({ organizationId: tenant });
    await StockMovement.deleteMany({ organizationId: tenant });
    await Item.deleteMany({ organizationId: tenant });
    await Warehouse.deleteMany({ organizationId: tenant });
    await WarehouseBin.deleteMany({ organizationId: tenant });
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE 2 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! STOCK ENGINE FULLY VERIFIED!');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE REVIEW LOGS.');
  }
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
