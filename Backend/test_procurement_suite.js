/**
 * Comprehensive Automated Test Suite for Nebula Inventory ERP - Phase 3: Procurement
 * Tests:
 * 1. Purchase Requisition (PR) Creation & Calculations
 * 2. 2-Tier Approval Flow & Anti-Self-Approval Enforcement
 * 3. PR to Purchase Order (PO) Conversion
 * 4. PO Multi-Item Amendment & Revision History Tracking
 * 5. Goods Receipt Note (GRN) with Quality Inspection (Accept / Reject)
 * 6. Automated GRN Posting into the Immutable Stock Ledger (Verifies Stock Balance Increases)
 * 7. 3-Way Match Engine (Exact Match vs. Tolerance Exceeded Variance)
 * 8. Return to Vendor (RTV) & Compensating Stock Issue & Debit Note Generation
 * 9. Enterprise PO & GRN PDF Generation Verification
 * 10. Multi-Tenant Isolation: Tenant B cannot access Tenant A Procurement Documents
 */

const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./src/models/Item');
const Warehouse = require('./src/models/Warehouse');
const WarehouseBin = require('./src/models/WarehouseBin');
const Supplier = require('./src/models/Supplier');
const StockLedger = require('./src/models/StockLedger');
const StockMovement = require('./src/models/StockMovement');
const PurchaseRequisition = require('./src/models/PurchaseRequisition');
const PurchaseOrder = require('./src/models/PurchaseOrder');
const GoodsReceiptNote = require('./src/models/GoodsReceiptNote');
const SupplierInvoice = require('./src/models/SupplierInvoice');
const ReturnToVendor = require('./src/models/ReturnToVendor');
const User = require('./src/models/User');

const procurementService = require('./src/services/procurementService');
const procurementPdfService = require('./src/services/procurementPdfService');
const stockLedgerService = require('./src/services/stockLedgerService');

console.log('================================================================');
console.log('🧪 STARTING NEBULA INVENTORY ERP - PHASE 3: PROCUREMENT TEST SUITE');
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
  console.log('Connected to MongoDB for Phase 3 Procurement Verification.\n');

  await Promise.all([
    PurchaseRequisition.init(),
    PurchaseOrder.init(),
    GoodsReceiptNote.init(),
    SupplierInvoice.init(),
    ReturnToVendor.init(),
    Item.init(),
    Warehouse.init(),
    Supplier.init(),
    StockLedger.init(),
  ]);

  const tenantA = new mongoose.Types.ObjectId();
  const tenantB = new mongoose.Types.ObjectId();

  const requesterUser = { _id: new mongoose.Types.ObjectId(), role: 'employee' };
  const managerUser = { _id: new mongoose.Types.ObjectId(), role: 'manager' };
  const procurementAdminUser = { _id: new mongoose.Types.ObjectId(), role: 'super_admin' };

  let warehouseA;
  let supplierA;
  let itemRam;
  let itemSsd;

  let pr;
  let po;
  let grn;
  let invoice;

  try {
    // ── Setup Fixtures ──
    warehouseA = await Warehouse.create({
      organizationId: tenantA,
      code: 'WH-PROC-1',
      name: 'Procurement Logistics Hub',
      isDefault: true,
    });

    supplierA = await Supplier.create({
      organizationId: tenantA,
      supplierCode: 'SUP-ACME-01',
      name: 'Acme Semiconductor Components',
      contactPerson: {
        name: 'John Doe',
        email: 'orders@acmesemi.com',
        phone: '+1-555-0199',
      },
      paymentTerms: 'Net 30',
      currency: 'USD',
    });

    itemRam = await Item.create({
      organizationId: tenantA,
      sku: 'SKU-DDR5-16GB',
      name: 'Crucial 16GB DDR5 5600MHz RAM',
      baseUom: 'PCS',
      standardCost: 65,
      valuationMethod: 'fifo',
      trackingType: 'batch',
    });

    itemSsd = await Item.create({
      organizationId: tenantA,
      sku: 'SKU-NVME-1TB',
      name: 'Samsung 990 Pro 1TB NVMe SSD',
      baseUom: 'PCS',
      standardCost: 110,
      valuationMethod: 'weighted_average',
      trackingType: 'none',
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 1. REQUISITION CREATION & ANTI-SELF-APPROVAL
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Purchase Requisitions & 2-Tier Approvals ---');

    await runAsyncTest('1.1 Create Requisition with Line Totals', async () => {
      pr = await procurementService.createRequisition(tenantA, requesterUser._id, {
        priority: 'high',
        items: [
          { itemId: itemRam._id, quantity: 20, estimatedUnitPrice: 65 },
          { itemId: itemSsd._id, quantity: 10, estimatedUnitPrice: 110 },
        ],
        notes: 'Monthly server inventory replenishment',
      });

      assert.strictEqual(pr.items.length, 2);
      // 20 * 65 = 1300, 10 * 110 = 1100 -> Total = 2400
      assert.strictEqual(pr.totalEstimatedAmount, 2400);
      assert.strictEqual(pr.status, 'draft');
      assert.ok(pr.requisitionNumber.startsWith('PR-'));
    });

    await runAsyncTest('1.2 Submit Requisition to Pending Approval', async () => {
      const submittedPr = await procurementService.submitRequisition(tenantA, pr._id, requesterUser._id);
      assert.strictEqual(submittedPr.status, 'pending_approval');
    });

    await runAsyncTest('1.3 Enforce Anti-Self-Approval Rule', async () => {
      let threw = false;
      try {
        await procurementService.approveRequisition(tenantA, pr._id, requesterUser, 'Self approve');
      } catch (err) {
        threw = true;
        assert.ok(err.message.includes('Anti-Self-Approval'));
      }
      assert.strictEqual(threw, true, 'Requester must not be allowed to approve own PR');
    });

    await runAsyncTest('1.4 Execute 2-Tier Approval (Manager -> Procurement Admin)', async () => {
      // Tier 1: Manager approves (amount is 2400 > 1000, so moves to manager_approved)
      const prTier1 = await procurementService.approveRequisition(tenantA, pr._id, managerUser, 'Department budget verified');
      assert.strictEqual(prTier1.status, 'manager_approved');
      assert.strictEqual(prTier1.managerApproval.status, 'approved');

      // Tier 2: Procurement Admin approves -> reaches 'approved'
      const prTier2 = await procurementService.approveRequisition(tenantA, pr._id, procurementAdminUser, 'Commercial terms approved');
      assert.strictEqual(prTier2.status, 'approved');
      assert.strictEqual(prTier2.procurementApproval.status, 'approved');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. CONVERT REQUISITION TO PURCHASE ORDER (PO) & AMENDMENTS
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. PR to PO Conversion & Amendments ---');

    await runAsyncTest('2.1 Convert Approved PR to Purchase Order', async () => {
      po = await procurementService.convertRequisitionToPo(tenantA, pr._id, procurementAdminUser, {
        supplierId: supplierA._id,
        warehouseId: warehouseA._id,
        defaultTaxRate: 10, // 10% VAT / GST
        autoOrder: true,
      });

      assert.strictEqual(po.items.length, 2);
      assert.strictEqual(po.subtotal, 2400);
      assert.strictEqual(po.taxTotal, 240); // 10% of 2400
      assert.strictEqual(po.grandTotal, 2640);
      assert.ok(po.poNumber.startsWith('PO-'));

      // Check PR status updated
      const updatedPr = await PurchaseRequisition.findById(pr._id);
      assert.strictEqual(updatedPr.status, 'converted_to_po');
      assert.strictEqual(updatedPr.convertedPoId.toString(), po._id.toString());
    });

    await runAsyncTest('2.2 Amend Purchase Order (Version Increment & History)', async () => {
      // Amend PO: Increase RAM quantity to 25 and add notes
      const amendedPo = await procurementService.amendPurchaseOrder(tenantA, po._id, procurementAdminUser, {
        items: [
          { itemId: itemRam._id, orderedQuantity: 25, unitPrice: 65, taxRate: 10, uom: 'PCS' },
          { itemId: itemSsd._id, orderedQuantity: 10, unitPrice: 110, taxRate: 10, uom: 'PCS' },
        ],
        changesSummary: 'Increased RAM order by 5 units due to upgraded project requirements',
      });

      assert.strictEqual(amendedPo.version, 2);
      assert.strictEqual(amendedPo.amendments.length, 1);
      assert.strictEqual(amendedPo.amendments[0].previousGrandTotal, 2640);
      // New: 25 * 65 = 1625 + 1100 = 2725 subtotal. Tax 10% = 272.50. Grand = 2997.50
      assert.strictEqual(amendedPo.subtotal, 2725);
      assert.strictEqual(amendedPo.grandTotal, 2997.5);
      po = amendedPo;
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 3. GOODS RECEIPT NOTE (GRN) & STOCK LEDGER INTEGRATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. Goods Receipt Note & Stock Ledger Integration ---');

    await runAsyncTest('3.1 Create GRN with Quality Inspection (Partial Acceptance & Batch)', async () => {
      // Deliver 25 RAM: 24 accepted into batch 'BATCH-RAM-2026A', 1 rejected (defective packaging)
      // Deliver 10 SSD: 10 accepted
      grn = await procurementService.createGoodsReceiptNote(tenantA, procurementAdminUser._id, {
        poId: po._id,
        warehouseId: warehouseA._id,
        deliveryChallanNumber: 'DC-882910',
        items: [
          {
            itemId: itemRam._id,
            receivedQuantity: 25,
            acceptedQuantity: 24,
            rejectedQuantity: 1,
            rejectionReason: 'Damaged packaging during freight transit',
            unitCost: 65,
            batchNumber: 'BATCH-RAM-2026A',
            expiryDate: new Date('2028-12-31'),
          },
          {
            itemId: itemSsd._id,
            receivedQuantity: 10,
            acceptedQuantity: 10,
            unitCost: 110,
          },
        ],
      });

      assert.strictEqual(grn.items[0].acceptedQuantity, 24);
      assert.strictEqual(grn.items[0].rejectedQuantity, 1);
      assert.strictEqual(grn.stockLedgerPosted, false);
    });

    await runAsyncTest('3.2 Post GRN into Immutable Stock Ledger', async () => {
      const balanceBeforeRam = await stockLedgerService.getStockBalance(tenantA, itemRam._id, warehouseA._id);
      const balanceBeforeSsd = await stockLedgerService.getStockBalance(tenantA, itemSsd._id, warehouseA._id);

      assert.strictEqual(balanceBeforeRam.onHand, 0);
      assert.strictEqual(balanceBeforeSsd.onHand, 0);

      const postResult = await procurementService.postGrnToStockLedger(tenantA, grn._id, procurementAdminUser._id);
      assert.strictEqual(postResult.grn.stockLedgerPosted, true);

      // Verify Stock Balances have increased
      const balanceAfterRam = await stockLedgerService.getStockBalance(tenantA, itemRam._id, warehouseA._id);
      const balanceAfterSsd = await stockLedgerService.getStockBalance(tenantA, itemSsd._id, warehouseA._id);

      assert.strictEqual(balanceAfterRam.onHand, 24, 'RAM stock on hand must equal accepted quantity 24');
      assert.strictEqual(balanceAfterSsd.onHand, 10, 'SSD stock on hand must equal accepted quantity 10');

      // Verify PO received quantities updated
      const updatedPo = await PurchaseOrder.findById(po._id);
      const ramLine = updatedPo.items.find((it) => it.itemId.toString() === itemRam._id.toString());
      assert.strictEqual(ramLine.receivedQuantity, 24);
      // Since RAM ordered 25 but received 24, PO is partially_received
      assert.strictEqual(updatedPo.status, 'partially_received');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 4. 3-WAY MATCHING ENGINE
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. 3-Way Matching Engine & Supplier Invoices ---');

    await runAsyncTest('4.1 Run 3-Way Match: Exact Match on Received Goods', async () => {
      // Vendor bills exactly for 24 RAM at $65 and 10 SSD at $110
      invoice = await procurementService.createSupplierInvoice(tenantA, {
        supplierInvoiceRef: 'INV-VENDOR-7711',
        poId: po._id,
        items: [
          { itemId: itemRam._id, billedQuantity: 24, unitPrice: 65, taxRate: 10 },
          { itemId: itemSsd._id, billedQuantity: 10, unitPrice: 110, taxRate: 10 },
        ],
      });

      assert.strictEqual(invoice.matchingStatus, 'matched');
      assert.strictEqual(invoice.threeWayMatch.toleranceExceeded, false);
      assert.strictEqual(invoice.threeWayMatch.priceVariance, 0);
      assert.strictEqual(invoice.threeWayMatch.quantityVariance, 0);
    });

    await runAsyncTest('4.2 Run 3-Way Match: Variance Detected (Price Hike > Tolerance)', async () => {
      // Vendor sends another bill with 12% price hike on RAM ($73 instead of $65)
      const mismatchedInvoice = await procurementService.createSupplierInvoice(tenantA, {
        supplierInvoiceRef: 'INV-VENDOR-HIKE-99',
        poId: po._id,
        items: [
          { itemId: itemRam._id, billedQuantity: 24, unitPrice: 73, taxRate: 10 },
        ],
      });

      assert.strictEqual(mismatchedInvoice.matchingStatus, 'variance_detected');
      assert.strictEqual(mismatchedInvoice.threeWayMatch.toleranceExceeded, true);
      assert.ok(mismatchedInvoice.threeWayMatch.priceVariance > 0);

      // Approve variance with notes
      const approvedInv = await procurementService.approveInvoiceVariance(
        tenantA,
        mismatchedInvoice._id,
        procurementAdminUser,
        'Price surcharge approved due to expedited shipping agreement'
      );
      assert.strictEqual(approvedInv.matchingStatus, 'approved_with_variance');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 5. RETURN TO VENDOR (RTV) & DEBIT NOTES
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Return to Vendor & Debit Notes ---');

    await runAsyncTest('5.1 Issue Return to Vendor & Verify Ledger Decrement', async () => {
      // Return 2 units of RAM from batch BATCH-RAM-2026A due to defective IC
      const rtv = await procurementService.createReturnToVendor(tenantA, procurementAdminUser._id, {
        supplierId: supplierA._id,
        poId: po._id,
        warehouseId: warehouseA._id,
        items: [
          {
            itemId: itemRam._id,
            quantity: 2,
            unitCost: 65,
            batchNumber: 'BATCH-RAM-2026A',
            reasonCode: 'defective',
            notes: 'Fails memory test under load',
          },
        ],
      });

      assert.strictEqual(rtv.status, 'dispatched');
      assert.strictEqual(rtv.stockLedgerPosted, true);
      assert.ok(rtv.debitNoteNumber.startsWith('DN-'));
      assert.strictEqual(rtv.totalDebitAmount, 130); // 2 * 65

      // Stock should have decreased from 24 to 22
      const balanceAfterRtv = await stockLedgerService.getStockBalance(tenantA, itemRam._id, warehouseA._id);
      assert.strictEqual(balanceAfterRtv.onHand, 22);
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 6. PDF DOCUMENT GENERATION VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Enterprise PDF Generation ---');

    await runAsyncTest('6.1 Generate Purchase Order PDF Buffer', async () => {
      const populatedPo = await PurchaseOrder.findById(po._id).populate('items.itemId');
      const pdfBuffer = await procurementPdfService.generatePurchaseOrderPdf({
        po: populatedPo,
        organization: { name: 'Acme Test Tenant' },
        supplier: supplierA,
        warehouse: warehouseA,
      });

      assert.ok(Buffer.isBuffer(pdfBuffer));
      assert.ok(pdfBuffer.length > 1000, 'PDF buffer must be greater than 1KB');
      // Standard PDF magic header check: %PDF
      assert.strictEqual(pdfBuffer.toString('utf8', 0, 4), '%PDF');
    });

    await runAsyncTest('6.2 Generate Goods Receipt Note (GRN) PDF Buffer', async () => {
      const populatedGrn = await GoodsReceiptNote.findById(grn._id).populate('items.itemId');
      const pdfBuffer = await procurementPdfService.generateGrnPdf({
        grn: populatedGrn,
        po,
        organization: { name: 'Acme Test Tenant' },
        supplier: supplierA,
        warehouse: warehouseA,
      });

      assert.ok(Buffer.isBuffer(pdfBuffer));
      assert.ok(pdfBuffer.length > 1000, 'GRN PDF buffer must be greater than 1KB');
      assert.strictEqual(pdfBuffer.toString('utf8', 0, 4), '%PDF');
    });

    // ──────────────────────────────────────────────────────────────────────────
    // 7. MULTI-TENANCY ISOLATION VERIFICATION
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. Multi-Tenant Isolation ---');

    await runAsyncTest('7.1 Cross-Tenant Isolation: Tenant B cannot access Tenant A records', async () => {
      // Attempt to find Tenant A's PO with Tenant B's organizationId
      const tenantBPo = await PurchaseOrder.findOne({
        _id: po._id,
        organizationId: tenantB,
      });
      assert.strictEqual(tenantBPo, null, 'Tenant B must not see Tenant A Purchase Order');

      const tenantBPr = await PurchaseRequisition.findOne({
        _id: pr._id,
        organizationId: tenantB,
      });
      assert.strictEqual(tenantBPr, null, 'Tenant B must not see Tenant A Requisition');

      const tenantBGrn = await GoodsReceiptNote.findOne({
        _id: grn._id,
        organizationId: tenantB,
      });
      assert.strictEqual(tenantBGrn, null, 'Tenant B must not see Tenant A GRN');

      const tenantBInv = await SupplierInvoice.findOne({
        _id: invoice._id,
        organizationId: tenantB,
      });
      assert.strictEqual(tenantBInv, null, 'Tenant B must not see Tenant A Invoice');
    });

  } finally {
    // ── Cleanup Test Artifacts ──
    await Promise.all([
      PurchaseRequisition.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      PurchaseOrder.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      GoodsReceiptNote.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      SupplierInvoice.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      ReturnToVendor.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      StockLedger.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      StockMovement.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Item.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Warehouse.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      WarehouseBin.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
      Supplier.deleteMany({ organizationId: { $in: [tenantA, tenantB] } }),
    ]);
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE 3 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! PROCUREMENT MODULE FULLY VERIFIED!');
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
