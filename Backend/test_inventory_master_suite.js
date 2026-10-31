/**
 * Comprehensive Automated Test Suite for Nebula Inventory ERP - Phase 1: Master Data
 * Tests:
 * 1. Item Category Hierarchy & Uniqueness
 * 2. Warehouse -> Zone -> Bin Location Hierarchy & Scoping
 * 3. Item SKU / Barcode Generation, UoM Conversions, Variant Schema
 * 4. Supplier Master & Item-Supplier Price Lists
 * 5. Multi-Tenant Data Isolation (Tenant A vs Tenant B)
 * 6. Native QR Code Generation for Items and Bins
 * 7. CSV Bulk Import Parsing, Validation Preview, & Batch Commit
 * 8. CSV Master Data Export Formatting
 */

const assert = require('assert');
const mongoose = require('mongoose');
require('dotenv').config();

const Item = require('./src/models/Item');
const ItemCategory = require('./src/models/ItemCategory');
const Warehouse = require('./src/models/Warehouse');
const WarehouseZone = require('./src/models/WarehouseZone');
const WarehouseBin = require('./src/models/WarehouseBin');
const Supplier = require('./src/models/Supplier');
const counterService = require('./src/services/counterService');
const inventoryMasterService = require('./src/services/inventoryMasterService');

console.log('================================================================');
console.log('🧪 STARTING NEBULA INVENTORY ERP - PHASE 1: MASTER DATA TEST SUITE');
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
  console.log('Connected to MongoDB for Phase 1 Master Data Verification.\n');

  // Ensure unique indexes are built before testing uniqueness constraints
  await Promise.all([
    ItemCategory.init(),
    Warehouse.init(),
    WarehouseZone.init(),
    WarehouseBin.init(),
    Supplier.init(),
    Item.init(),
  ]);

  const tenantA = new mongoose.Types.ObjectId();
  const tenantB = new mongoose.Types.ObjectId();

  try {
    // ── 1. ITEM CATEGORY TESTS ──────────────────────────────────────────────
    console.log('--- 1. Hierarchical Categories & Validation ---');

    let parentCat;
    let childCat;

    await runAsyncTest('1.1 Create Parent & Child Categories (Hierarchical)', async () => {
      parentCat = await ItemCategory.create({
        organizationId: tenantA,
        name: 'Electronics & Computing',
        code: 'ELEC-01',
        description: 'Electronic components and compute equipment',
      });
      assert.ok(parentCat._id, 'Parent category should be created');
      assert.strictEqual(parentCat.parentId, null);

      childCat = await ItemCategory.create({
        organizationId: tenantA,
        name: 'Enterprise Servers',
        code: 'SRV-01',
        parentId: parentCat._id,
        description: 'Rackmount and blade servers',
      });
      assert.ok(childCat._id, 'Child category should be created');
      assert.strictEqual(childCat.parentId.toString(), parentCat._id.toString());
    });

    await runAsyncTest('1.2 Category Code Uniqueness Enforced per Tenant', async () => {
      let duplicateError = false;
      try {
        await ItemCategory.create({
          organizationId: tenantA,
          name: 'Another Electronics',
          code: 'ELEC-01', // same code in tenant A
        });
      } catch (err) {
        duplicateError = true;
      }
      assert.strictEqual(duplicateError, true, 'Should reject duplicate category code in same tenant');

      // But should ALLOW same code in different tenant (Tenant B)
      const catTenantB = await ItemCategory.create({
        organizationId: tenantB,
        name: 'Tenant B Electronics',
        code: 'ELEC-01',
      });
      assert.ok(catTenantB._id, 'Tenant B should be allowed to use same code ELEC-01');
    });

    // ── 2. WAREHOUSES & LOCATIONS TESTS ─────────────────────────────────────
    console.log('\n--- 2. Warehouse, Zone, and Bin Hierarchy ---');

    let whA;
    let zoneA;
    let binA;

    await runAsyncTest('2.1 Create Warehouse -> Zone -> Bin with Capacity', async () => {
      whA = await Warehouse.create({
        organizationId: tenantA,
        code: 'WH-CENTRAL',
        name: 'Central Distribution Center',
        isDefault: true,
        address: { city: 'Chicago', state: 'IL', country: 'US' },
      });
      assert.ok(whA._id, 'Warehouse should be created');
      assert.strictEqual(whA.isDefault, true);

      zoneA = await WarehouseZone.create({
        organizationId: tenantA,
        warehouseId: whA._id,
        code: 'Z-RECEIVING',
        name: 'Inbound Receiving Dock',
        zoneType: 'receiving',
      });
      assert.ok(zoneA._id, 'Zone should be created');

      binA = await WarehouseBin.create({
        organizationId: tenantA,
        warehouseId: whA._id,
        zoneId: zoneA._id,
        binCode: 'WH-RCV-A01',
        barcode: 'BAR-WH-RCV-A01',
        capacity: { maxWeightKg: 500, maxVolumeCubicM: 10 },
      });
      assert.ok(binA._id, 'Bin should be created');
      assert.strictEqual(binA.binCode, 'WH-RCV-A01');
    });

    // ── 3. ITEM MASTER TESTS ────────────────────────────────────────────────
    console.log('\n--- 3. Items, UoM Conversions, Tracking & Variants ---');

    let itemA;

    await runAsyncTest('3.1 Create Item with SKU, UoM Conversions, & Batch Tracking', async () => {
      const generatedSku = await counterService.generateItemSku(tenantA);
      assert.ok(generatedSku.startsWith('SKU-'), 'Counter should format SKU prefix');

      itemA = await Item.create({
        organizationId: tenantA,
        sku: generatedSku,
        barcode: '8901234567890',
        name: 'PowerEdge R750 Enterprise Server',
        categoryId: childCat._id,
        brand: 'Dell Technologies',
        baseUom: 'PCS',
        uomConversions: [
          { uom: 'BOX', conversionFactor: 1 },
          { uom: 'PALLET', conversionFactor: 8 },
        ],
        trackingType: 'batch',
        hasExpiry: true,
        shelfLifeDays: 1825, // 5 years warranty/lifecycle
        minStockLevel: 2,
        maxStockLevel: 20,
        reorderPoint: 5,
        reorderQuantity: 10,
        standardCost: 2850.0,
        currency: 'USD',
        valuationMethod: 'fifo',
        defaultWarehouseId: whA._id,
        defaultBinId: binA._id,
        variants: [
          { name: 'CPU Cores', options: ['32-Core', '64-Core'] },
          { name: 'RAM', options: ['64GB', '128GB', '256GB'] },
        ],
      });

      assert.ok(itemA._id, 'Item should be created');
      assert.strictEqual(itemA.uomConversions.length, 2);
      assert.strictEqual(itemA.trackingType, 'batch');
      assert.strictEqual(itemA.hasExpiry, true);
    });

    // ── 4. SUPPLIER MASTER & PRICE LISTS ───────────────────────────────────
    console.log('\n--- 4. Supplier Master & Item-Supplier Price Lists ---');

    let supplierA;

    await runAsyncTest('4.1 Create Supplier with Tax Details & Item Price List', async () => {
      const supplierCode = await counterService.generateSupplierCode(tenantA);
      assert.ok(supplierCode.startsWith('SUP-'), 'Counter should format SUP prefix');

      supplierA = await Supplier.create({
        organizationId: tenantA,
        supplierCode,
        name: 'Apex Components Global LLC',
        contactPerson: { name: 'Sarah Jenkins', email: 'sjenkins@apexcomponents.com', phone: '+1-555-0199' },
        taxDetails: { taxId: 'TAX-US-9928172', panNumber: 'APEX9928J' },
        paymentTerms: { paymentTermDays: 45, paymentMethod: 'net_30' },
        leadTimeDays: 10,
        currency: 'USD',
        itemPriceList: [
          {
            itemId: itemA._id,
            supplierPartNumber: 'DL-R750-X64',
            unitPrice: 2700.0,
            currency: 'USD',
            minOrderQty: 2,
            leadTimeDays: 10,
          },
        ],
      });

      assert.ok(supplierA._id, 'Supplier should be created');
      assert.strictEqual(supplierA.itemPriceList.length, 1);
      assert.strictEqual(supplierA.itemPriceList[0].unitPrice, 2700.0);
    });

    // ── 5. MULTI-TENANCY ISOLATION TESTS ───────────────────────────────────
    console.log('\n--- 5. Multi-Tenant Data Isolation ---');

    await runAsyncTest('5.1 Cross-Tenant Isolation: Tenant B cannot read Tenant A Items or Suppliers', async () => {
      // Query Tenant B items
      const itemsTenantB = await Item.find({ organizationId: tenantB }).lean();
      assert.strictEqual(itemsTenantB.length, 0, 'Tenant B must see 0 items');

      // Query Tenant B suppliers
      const suppliersTenantB = await Supplier.find({ organizationId: tenantB }).lean();
      assert.strictEqual(suppliersTenantB.length, 0, 'Tenant B must see 0 suppliers');

      // Attempting to query itemA with Tenant B organizationId returns null
      const isolatedItem = await Item.findOne({ _id: itemA._id, organizationId: tenantB }).lean();
      assert.strictEqual(isolatedItem, null, 'Tenant B cannot read Tenant A item');
    });

    // ── 6. QR CODE GENERATION ──────────────────────────────────────────────
    console.log('\n--- 6. Native QR Code Generation ---');

    await runAsyncTest('6.1 Generate Item and Bin QR Code Data URLs', async () => {
      const itemQr = await inventoryMasterService.generateQrCodeDataUrl({
        type: 'ITEM',
        sku: itemA.sku,
        name: itemA.name,
      });
      assert.ok(itemQr.startsWith('data:image/png;base64,'), 'Item QR should be valid base64 PNG data URL');

      const binQr = await inventoryMasterService.generateQrCodeDataUrl({
        type: 'BIN',
        binCode: binA.binCode,
        warehouse: whA.code,
      });
      assert.ok(binQr.startsWith('data:image/png;base64,'), 'Bin QR should be valid base64 PNG data URL');
    });

    // ── 7. CSV BULK IMPORT PREVIEW & COMMIT ─────────────────────────────────
    console.log('\n--- 7. CSV Bulk Import Parsing, Validation Preview, & Batch Commit ---');

    await runAsyncTest('7.1 Validate CSV with Preview, Error Reporting, and Commit', async () => {
      const validCsv = `sku,name,category,brand,baseUom,standardCost,minStockLevel,reorderPoint,trackingType
SKU-IMP-001,High-Speed HDMI 2.1 Cable,Cables & Accessories,Belkin,PCS,12.50,10,25,none
SKU-IMP-002,Cat6 Ethernet Cable 100m,Cables & Accessories,Monoprice,BOX,45.00,5,15,batch`;

      const preview = await inventoryMasterService.validateItemsCsv(tenantA, validCsv);
      assert.strictEqual(preview.success, true);
      assert.strictEqual(preview.validCount, 2);
      assert.strictEqual(preview.errorCount, 0);
      assert.strictEqual(preview.previewRows.length, 2);
      assert.strictEqual(preview.canCommit, true);

      // Commit import
      const commitRes = await inventoryMasterService.commitItemsImport(tenantA, preview.previewRows);
      assert.strictEqual(commitRes.success, true);
      assert.strictEqual(commitRes.importedCount, 2);

      // Verify items exist in DB
      const importedItem = await Item.findOne({ organizationId: tenantA, sku: 'SKU-IMP-001' });
      assert.ok(importedItem, 'Imported item should exist in database');
      assert.strictEqual(importedItem.standardCost, 12.5);

      // Test duplicate error detection on second run
      const dupPreview = await inventoryMasterService.validateItemsCsv(tenantA, validCsv);
      assert.strictEqual(dupPreview.success, false, 'Should flag duplicate SKUs that now exist');
      assert.ok(dupPreview.errorCount > 0, 'Should have errors reported');
    });

    // ── 8. CSV EXPORT ──────────────────────────────────────────────────────
    console.log('\n--- 8. CSV Master Data Export ---');

    await runAsyncTest('8.1 Export Items and Suppliers CSV strings', async () => {
      const itemsCsv = await inventoryMasterService.exportItemsCsv(tenantA);
      assert.ok(itemsCsv.includes('SKU,Name,Category,Brand'), 'Items CSV header should match');
      assert.ok(itemsCsv.includes('PowerEdge R750 Enterprise Server'), 'Export should contain created item');

      const suppliersCsv = await inventoryMasterService.exportSuppliersCsv(tenantA);
      assert.ok(suppliersCsv.includes('Supplier Code,Name,Contact Person'), 'Suppliers CSV header should match');
      assert.ok(suppliersCsv.includes('Apex Components Global LLC'), 'Export should contain created supplier');
    });

  } finally {
    // Cleanup test records
    await Item.deleteMany({ organizationId: { $in: [tenantA, tenantB] } });
    await ItemCategory.deleteMany({ organizationId: { $in: [tenantA, tenantB] } });
    await Warehouse.deleteMany({ organizationId: { $in: [tenantA, tenantB] } });
    await WarehouseZone.deleteMany({ organizationId: { $in: [tenantA, tenantB] } });
    await WarehouseBin.deleteMany({ organizationId: { $in: [tenantA, tenantB] } });
    await Supplier.deleteMany({ organizationId: { $in: [tenantA, tenantB] } });
    await mongoose.disconnect();
  }

  console.log('\n================================================================');
  console.log(`🏁 PHASE 1 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  if (passedTests === totalTests) {
    console.log('🌟 100% SUITE PASS RATE! MASTER DATA FULLY VERIFIED!');
  } else {
    console.log('⚠️ SOME TESTS FAILED. PLEASE REVIEW ABOVE LOGS.');
  }
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
