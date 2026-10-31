const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requireModuleAccess } = require('../middleware/moduleAccess');

// Controllers
const inventoryItemCtrl = require('../controllers/inventoryItemController');
const inventoryWarehouseCtrl = require('../controllers/inventoryWarehouseController');
const inventorySupplierCtrl = require('../controllers/inventorySupplierController');
const inventoryCategoryCtrl = require('../controllers/inventoryCategoryController');
const inventoryStockCtrl = require('../controllers/inventoryStockController');

// All inventory endpoints require valid tenant authentication
router.use(requireAuth);

// ── Categories ──────────────────────────────────────────────────────────
router.get(
  '/categories',
  requireModuleAccess('inventory', 'view'),
  inventoryCategoryCtrl.getCategories
);
router.post(
  '/categories',
  requireModuleAccess('inventory', 'create'),
  inventoryCategoryCtrl.createCategory
);
router.put(
  '/categories/:id',
  requireModuleAccess('inventory', 'edit'),
  inventoryCategoryCtrl.updateCategory
);
router.delete(
  '/categories/:id',
  requireModuleAccess('inventory', 'delete'),
  inventoryCategoryCtrl.deleteCategory
);

// ── Items / Catalog ─────────────────────────────────────────────────────
router.get(
  '/items/export',
  requireModuleAccess('inventory', 'view'),
  inventoryItemCtrl.exportItemsCsv
);
router.post(
  '/items/import/preview',
  requireModuleAccess('inventory', 'create'),
  inventoryItemCtrl.previewCsvImport
);
router.post(
  '/items/import/commit',
  requireModuleAccess('inventory', 'create'),
  inventoryItemCtrl.commitCsvImport
);
router.get(
  '/items',
  requireModuleAccess('inventory', 'view'),
  inventoryItemCtrl.getItems
);
router.get(
  '/items/:id',
  requireModuleAccess('inventory', 'view'),
  inventoryItemCtrl.getItemById
);
router.get(
  '/items/:id/qrcode',
  requireModuleAccess('inventory', 'view'),
  inventoryItemCtrl.getItemQrCode
);
router.post(
  '/items',
  requireModuleAccess('inventory', 'create'),
  inventoryItemCtrl.createItem
);
router.put(
  '/items/:id',
  requireModuleAccess('inventory', 'edit'),
  inventoryItemCtrl.updateItem
);
router.delete(
  '/items/:id',
  requireModuleAccess('inventory', 'delete'),
  inventoryItemCtrl.deleteItem
);

// ── Warehouses, Zones & Bins ───────────────────────────────────────────
router.get(
  '/warehouses',
  requireModuleAccess('inventory', 'view'),
  inventoryWarehouseCtrl.getWarehouses
);
router.post(
  '/warehouses',
  requireModuleAccess('inventory', 'create'),
  inventoryWarehouseCtrl.createWarehouse
);
router.put(
  '/warehouses/:id',
  requireModuleAccess('inventory', 'edit'),
  inventoryWarehouseCtrl.updateWarehouse
);
router.delete(
  '/warehouses/:id',
  requireModuleAccess('inventory', 'delete'),
  inventoryWarehouseCtrl.deleteWarehouse
);

router.get(
  '/warehouses/:warehouseId/zones',
  requireModuleAccess('inventory', 'view'),
  inventoryWarehouseCtrl.getZones
);
router.post(
  '/warehouses/:warehouseId/zones',
  requireModuleAccess('inventory', 'create'),
  inventoryWarehouseCtrl.createZone
);

router.get(
  '/warehouses/:warehouseId/bins',
  requireModuleAccess('inventory', 'view'),
  inventoryWarehouseCtrl.getBins
);
router.post(
  '/warehouses/:warehouseId/bins',
  requireModuleAccess('inventory', 'create'),
  inventoryWarehouseCtrl.createBin
);
router.get(
  '/bins/:binId/qrcode',
  requireModuleAccess('inventory', 'view'),
  inventoryWarehouseCtrl.getBinQrCode
);

// ── Suppliers ──────────────────────────────────────────────────────────
router.get(
  '/suppliers/export',
  requireModuleAccess('inventory', 'view'),
  inventorySupplierCtrl.exportSuppliersCsv
);
router.get(
  '/suppliers',
  requireModuleAccess('inventory', 'view'),
  inventorySupplierCtrl.getSuppliers
);
router.get(
  '/suppliers/:id',
  requireModuleAccess('inventory', 'view'),
  inventorySupplierCtrl.getSupplierById
);
router.post(
  '/suppliers',
  requireModuleAccess('inventory', 'create'),
  inventorySupplierCtrl.createSupplier
);
router.put(
  '/suppliers/:id',
  requireModuleAccess('inventory', 'edit'),
  inventorySupplierCtrl.updateSupplier
);
router.delete(
  '/suppliers/:id',
  requireModuleAccess('inventory', 'delete'),
  inventorySupplierCtrl.deleteSupplier
);
router.post(
  '/suppliers/:id/prices',
  requireModuleAccess('inventory', 'edit'),
  inventorySupplierCtrl.updateItemPrice
);

// ── Stock Engine: Ledger, Movements & Traceability ─────────────────────
router.get(
  '/ledger',
  requireModuleAccess('inventory', 'view'),
  inventoryStockCtrl.getLedgerEntries
);
router.get(
  '/stock-balances',
  requireModuleAccess('inventory', 'view'),
  inventoryStockCtrl.getStockBalances
);
router.post(
  '/movements/receipt',
  requireModuleAccess('inventory', 'create'),
  inventoryStockCtrl.postGoodsReceipt
);
router.post(
  '/movements/issue',
  requireModuleAccess('inventory', 'create'),
  inventoryStockCtrl.postStockIssue
);
router.post(
  '/movements/transfer',
  requireModuleAccess('inventory', 'create'),
  inventoryStockCtrl.postTransferDispatch
);
router.post(
  '/movements/transfer/:movementId/receive',
  requireModuleAccess('inventory', 'create'),
  inventoryStockCtrl.postTransferReceive
);
router.post(
  '/movements/adjustment',
  requireModuleAccess('inventory', 'create'),
  inventoryStockCtrl.postStockAdjustment
);
router.post(
  '/movements/cycle-count',
  requireModuleAccess('inventory', 'create'),
  inventoryStockCtrl.postCycleCount
);
router.post(
  '/ledger/:ledgerId/reverse',
  requireModuleAccess('inventory', 'approve'),
  inventoryStockCtrl.reverseLedgerEntry
);
router.get(
  '/traceability/batch/:batchNumber',
  requireModuleAccess('inventory', 'view'),
  inventoryStockCtrl.getBatchTrace
);
router.get(
  '/traceability/serial/:serialNumber',
  requireModuleAccess('inventory', 'view'),
  inventoryStockCtrl.getSerialTrace
);

// ── Procurement & Purchase-to-Stock Lifecycle ─────────────────────────
const procurementCtrl = require('../controllers/procurementController');

// Requisitions
router.get(
  '/procurement/requisitions',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.getRequisitions
);
router.post(
  '/procurement/requisitions',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.createRequisition
);
router.post(
  '/procurement/requisitions/:id/submit',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.submitRequisition
);
router.post(
  '/procurement/requisitions/:id/approve',
  requireModuleAccess('inventory', 'approve'),
  procurementCtrl.approveRequisition
);
router.post(
  '/procurement/requisitions/:id/reject',
  requireModuleAccess('inventory', 'approve'),
  procurementCtrl.rejectRequisition
);
router.post(
  '/procurement/requisitions/:id/convert-to-po',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.convertRequisitionToPo
);

// Purchase Orders
router.get(
  '/procurement/orders',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.getPurchaseOrders
);
router.get(
  '/procurement/orders/:id',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.getPurchaseOrderById
);
router.post(
  '/procurement/orders',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.createPurchaseOrder
);
router.put(
  '/procurement/orders/:id/amend',
  requireModuleAccess('inventory', 'edit'),
  procurementCtrl.amendPurchaseOrder
);
router.post(
  '/procurement/orders/:id/close',
  requireModuleAccess('inventory', 'edit'),
  procurementCtrl.closePurchaseOrder
);
router.get(
  '/procurement/orders/:id/pdf',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.downloadPoPdf
);
router.post(
  '/procurement/orders/:id/email',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.emailPoToSupplier
);

// Goods Receipt Notes (GRN)
router.get(
  '/procurement/grns',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.getGoodsReceiptNotes
);
router.post(
  '/procurement/grns',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.createGoodsReceiptNote
);
router.post(
  '/procurement/grns/:id/post-ledger',
  requireModuleAccess('inventory', 'approve'),
  procurementCtrl.postGrnToLedger
);
router.get(
  '/procurement/grns/:id/pdf',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.downloadGrnPdf
);

// Supplier Invoices & 3-Way Match
router.get(
  '/procurement/invoices',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.getSupplierInvoices
);
router.post(
  '/procurement/invoices',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.createSupplierInvoice
);
router.post(
  '/procurement/invoices/:id/three-way-match',
  requireModuleAccess('inventory', 'edit'),
  procurementCtrl.runThreeWayMatch
);
router.post(
  '/procurement/invoices/:id/approve-variance',
  requireModuleAccess('inventory', 'approve'),
  procurementCtrl.approveInvoiceVariance
);

// Return to Vendor & Debit Notes
router.get(
  '/procurement/returns',
  requireModuleAccess('inventory', 'view'),
  procurementCtrl.getReturnToVendors
);
router.post(
  '/procurement/returns',
  requireModuleAccess('inventory', 'create'),
  procurementCtrl.createReturnToVendor
);

// ── Integrations: HRMS Bridge, Accounting Hooks & Notifications ─────────
const integrationCtrl = require('../controllers/inventoryIntegrationController');

// Equipment Kits
router.get(
  '/integrations/kits',
  requireModuleAccess('inventory', 'view'),
  integrationCtrl.getEquipmentKits
);
router.post(
  '/integrations/kits',
  requireModuleAccess('inventory', 'create'),
  integrationCtrl.createEquipmentKit
);

// Asset Assignments
router.get(
  '/integrations/assets',
  requireModuleAccess('inventory', 'view'),
  integrationCtrl.getAssetAssignments
);
router.post(
  '/integrations/assets/:id/issue',
  requireModuleAccess('inventory', 'create'),
  integrationCtrl.issueAssets
);
router.post(
  '/integrations/assets/exit-checklist',
  requireModuleAccess('inventory', 'create'),
  integrationCtrl.initiateExitChecklist
);
router.post(
  '/integrations/assets/:id/process-return',
  requireModuleAccess('inventory', 'create'),
  integrationCtrl.processExitReturn
);

// Accounting Events
router.get(
  '/integrations/accounting-events',
  requireModuleAccess('inventory', 'view'),
  integrationCtrl.getAccountingEvents
);

// Notifications & Webhooks
router.get(
  '/integrations/notifications',
  requireModuleAccess('inventory', 'view'),
  integrationCtrl.getNotifications
);
router.get(
  '/integrations/batches/expiring',
  requireModuleAccess('inventory', 'view'),
  integrationCtrl.scanExpiringBatches
);
router.post(
  '/integrations/webhooks',
  requireModuleAccess('inventory', 'create'),
  integrationCtrl.registerWebhook
);
router.get(
  '/integrations/webhooks',
  requireModuleAccess('inventory', 'view'),
  integrationCtrl.getWebhooks
);

// ── AI Copilot, OCR, Forecasting, Anomaly & Scoring ─────────────────────
const inventoryAiCtrl = require('../controllers/inventoryAiController');

// Demand Forecasting & Smart Reorder
router.get(
  '/ai/forecast/:itemId',
  requireModuleAccess('inventory', 'view'),
  inventoryAiCtrl.getDemandForecast
);
router.post(
  '/ai/forecast/create-requisition',
  requireModuleAccess('inventory', 'create'),
  inventoryAiCtrl.createRequisitionFromForecast
);

// Document OCR (Invoices & Delivery Challans)
router.post(
  '/ai/ocr/extract',
  requireModuleAccess('inventory', 'create'),
  inventoryAiCtrl.extractDocument
);

// Anomaly Detection & Shrinkage Scans
router.get(
  '/ai/anomalies/scan',
  requireModuleAccess('inventory', 'view'),
  inventoryAiCtrl.scanAnomalies
);
router.get(
  '/ai/anomalies',
  requireModuleAccess('inventory', 'view'),
  inventoryAiCtrl.getAnomalies
);
router.patch(
  '/ai/anomalies/:id/feedback',
  requireModuleAccess('inventory', 'edit'),
  inventoryAiCtrl.recordAnomalyFeedback
);

// Natural Language Inventory Copilot
router.post(
  '/ai/copilot/query',
  requireModuleAccess('inventory', 'view'),
  inventoryAiCtrl.queryCopilot
);

// Supplier Scoring & Review
router.get(
  '/ai/suppliers/:supplierId/score',
  requireModuleAccess('inventory', 'view'),
  inventoryAiCtrl.getSupplierScore
);

// ── Analytics & Executive Reports ──────────────────────────────────────
const inventoryAnalyticsCtrl = require('../controllers/inventoryAnalyticsController');

router.get(
  '/analytics/overview',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.getOverview
);
router.get(
  '/analytics/valuation',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.getStockValuation
);
router.get(
  '/analytics/abc-xyz',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.getAbcXyz
);
router.get(
  '/analytics/aging',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.getStockAging
);
router.get(
  '/analytics/turnover',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.getTurnover
);
router.get(
  '/analytics/fulfillment-otif',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.getFulfillmentOtif
);
router.get(
  '/analytics/export',
  requireModuleAccess('inventory', 'view'),
  inventoryAnalyticsCtrl.exportReport
);

module.exports = router;

