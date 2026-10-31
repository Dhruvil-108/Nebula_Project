# Nebula HUB — Inventory Management (Inventory) Module
## Comprehensive Technical & Feature Documentation

---

## 1. Executive Summary & Module Overview

The **Inventory Management Module** in **Nebula HUB** is an enterprise-grade multi-tenant supply chain, warehouse logistics, procurement, and analytics engine. Designed to seamlessly operate alongside Nebula's existing **CRM**, **HRMS**, **Recruitment (ATS)**, and **Expenses** modules, it unifies physical material tracking with fiscal governance and AI-assisted supply chain automation.

Built to handle high-velocity stock movements, strict financial compliance, and AI-driven forecasting, the module eliminates manual inventory spreadsheets, paper goods receipt notes, and opaque approval delays by offering an immutable event ledger, real-time FIFO and Weighted Average cost layering, role-based equipment kit provisioning, algorithmic 3-way matching, and Pareto ABC-XYZ strategic demand planning.

### Key Objectives
1. **Multi-Tenant Data Isolation**: Complete tenant scoping where every document, aggregation, cache key, file upload, and AI prompt is partitioned by `organizationId`.
2. **Immutable Append-Only Stock Ledger**: Complete historical auditability where stock balances and valuations are derived from transactional event logs (`StockLedger`), prohibiting destructive updates and enforcing compensating reversals.
3. **Dual Inventory Cost Valuation**: Real-time balance sheet inventory valuation supporting both **FIFO (First-In, First-Out)** cost tranche layering and **Moving Weighted Average Cost (WAC)**.
4. **End-to-End Procurement (Procure-to-Pay)**: Structured 2-tier approval workflow for Purchase Requisitions, conversion to legal Purchase Orders with versioned amendments, and physical receiving via Goods Receipt Notes (GRN).
5. **Algorithmic 3-Way Matching**: Tolerance-based automated cross-verification between Purchase Orders, Goods Receipt Notes, and Supplier Invoices with automated Debit Note generation for discrepancies.
6. **Cross-Module Synergies**:
   - **Expenses**: Pre-approval budget checks with automatic hard-blocking when departmental spending limits are exceeded.
   - **HRMS**: Role-based equipment starter kits (e.g. *Software Engineer Kit*) with automated onboarding asset issuance, serial-number tagging, and offboarding exit recovery checklists.
   - **General Ledger Accounting**: Event hooks generating balanced double-entry journal payloads for asset inflows, COGS outflows, scrap write-offs, and in-transit transfers.
7. **AI & Supply Chain Intelligence**: Powered by Google Gemini for demand run-rate forecasting, multi-modal invoice/challan OCR, statistical shrinkage anomaly detection, and natural-language copilot querying.
8. **Executive Analytics & Strategy Matrices**: Real-time 9-cell ABC-XYZ strategic matrix, 4-bucket stock aging (0-30d, 31-60d, 61-90d, >90d dead stock), inventory turnover ratio, Days Sales of Inventory (DSI), supplier OTIF compliance, and streaming CSV exports.

---

## 2. System Architecture & Tech Stack

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NEBULA FRONTEND SPA                                    │
│             React 19  │  TypeScript  │  Vite 6  │  Tailwind CSS  │  Framer Motion       │
│             Theme: Nebula Premium Light 2.0 (Brand Orange / Indigo Accent, Warm Glass) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Overview │ Items & Catalog │ Warehouses & Bins │ Stock Movements │ Procurement │ Assets│
│                                    AI Copilot & Radar  │  Analytics & Executive Reports│
└─────────────┬───────────────────┬─────────────────┬──────────────────┬──────────────┬──┘
              │                   │                 │                  │              │
              ▼                   ▼                 ▼                  ▼              ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        State & Data Layer (TanStack Query v5)                          │
│     inventoryApi.ts ──► inventoryAiApi.ts ──► inventoryAnalyticsApi.ts ──► useInventory│
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Axios HTTP Client (Bearer JWT Token)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                NEBULA BACKEND API                                      │
│                             Node.js + Express.js 4.x                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Middlewares: requireAuth ──► scopedFilter (Org Scoping) ──► requireRole / RBAC         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Controllers:                                                                           │
│  ├── inventoryMasterController.js      (Items, Hierarchical Categories, Warehouses, QR)│
│  ├── inventoryStockController.js       (Immutable Ledger, Movements, Transfers, Trace)│
│  ├── procurementController.js          (PRs, POs, Amendments, GRN, 3-Way Match, PDFs) │
│  ├── inventoryIntegrationController.js (Equipment Kits, Asset Bridge, Accounting Events)│
│  ├── inventoryAiController.js           (Gemini Run-Rate, OCR, Anomaly Radar, Copilot) │
│  └── inventoryAnalyticsController.js   (ABC/XYZ Matrix, Valuation, Aging, Turnover, CSV)│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Core Engine Services:                                                                  │
│  ├── stockLedgerService.js             (Append-Only Ledger & Anti-Oversell Safe Guard) │
│  ├── stockValuationService.js          (FIFO Tranche Layering & Moving WAC Engine)     │
│  ├── procurementService.js             (Requisition Lifecycle & 3-Way Match Tolerances)│
│  ├── traceabilityService.js            (Forward/Backward Lot & Serial Lineage Trace)   │
│  ├── inventoryForecastService.js       (Moving Average Run-Rate & 1-Click PR Drafts)   │
│  ├── inventoryOcrService.js            (Multi-Modal Document OCR & PO Line Check)      │
│  ├── inventoryAnomalyService.js        (Shrinkage Radar, Dead Stock, & Human Feedback) │
│  ├── inventoryCopilotService.js        (Parameterized Query Whitelist & Gemini NL)     │
│  ├── supplierScoringService.js         (Objective 4-Factor Vendor Performance Score)   │
│  └── inventoryAnalyticsService.js       (Pareto 80/15/5, 9-Cell Grid, Aging & OTIF)    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ Mongoose 8.x ODM
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MONGODB DATABASE                                       │
│  Item │ ItemCategory │ Warehouse │ WarehouseZone │ WarehouseBin │ Supplier │ StockLedger│
│  StockMovement │ PurchaseRequisition │ PurchaseOrder │ GoodsReceiptNote │ SupplierInv   │
│  EquipmentKit │ AssetAssignment │ InventoryAnomaly │ AiRun │ Counter                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Architectural Principles

### 3.1 Strict Multi-Tenancy & Query Scoping
Data isolation is enforced at every layer:
- Every inventory collection enforces a required and indexed `organizationId: ObjectId` reference.
- Backend controllers extract `req.organizationId` directly from verified session tokens.
- Mongoose queries and aggregation pipelines explicitly prepend tenant filters:
  ```javascript
  const items = await Item.find({ organizationId: req.organizationId, active: { $ne: false } });
  ```
- Inter-tenant data leakage is verified by automated cross-tenant test suites that ensure Tenant B receives 0 records when attempting to query Tenant A entities.

### 3.2 Append-Only Ledger & Anti-Tamper Reversals
Inventory quantities are never modified using arbitrary update queries. Instead:
- Inbound receipts (GRN, adjustments in) append a positive `quantity` entry to `StockLedger`.
- Outbound issues (dispatches, scrap, asset issues) append a negative `quantity` entry.
- Corrective actions append a **Compensating Reversal** entry referencing the historical movement ID:
  ```javascript
  await StockLedger.create({
    organizationId,
    transactionType: 'reversal',
    documentNumber: `REV-${original.documentNumber}`,
    quantity: -original.quantity,
    totalCost: -original.totalCost,
    reversalOfLedgerId: original._id,
  });
  ```

### 3.3 Concurrency & Anti-Oversell Protection
To prevent stock overselling during simultaneous fulfillment transactions, the stock engine verifies available balances atomically:
$$\text{Available Stock} = \text{Total On-Hand Stock} - \text{Allocated / Reserved Stock}$$
If an issue exceeds available balance, the transaction aborts with an `Insufficient stock` error before any ledger entries are appended.

### 3.4 Dual Inventory Cost Valuation (FIFO & WAC)
- **FIFO (First-In, First-Out)**: Unexhausted inbound receipt layers are stored in sequence. When stock is issued, cost is deducted from the oldest available layer first, reflecting precise purchase prices.
- **Weighted Average Cost (WAC)**: A moving average unit cost is updated upon every receipt:
  $$\text{New Average Cost} = \frac{(\text{Current Qty} \times \text{Current WAC}) + (\text{Received Qty} \times \text{Purchase Price})}{\text{Current Qty} + \text{Received Qty}}$$

---

## 4. Functional Capabilities (Phase Breakdown)

### Phase 1: Master Data Management
- **Hierarchical Categories**: Self-referencing tree structure supporting multi-level taxonomy with unique category codes per tenant.
- **Warehouse, Zone & Bin Structure**: 3-tier physical location hierarchy tracking cubic capacity, maximum weight constraints, and zone types (Ambient, Cold Storage, Staging).
- **Item Master**: Full SKU tracking with unit of measure (UoM) conversion factors (e.g. $1\text{ BOX} = 12\text{ PCS}$), barcodes, standard costs, and tracking types (`none`, `batch`, `serial`).
- **Supplier Directory & Rates**: Supplier master with payment terms, delivery lead times, and item-specific contract pricing tables.
- **Native QR Generation**: Generates high-resolution base64 QR codes for instant item scanning and bin coordinate identification.
- **Bulk CSV Import & Export**: 2-stage CSV processor featuring schema validation preview, duplicate detection, batch atomic commits, and master data export.

### Phase 2: Stock Engine & Traceability
- **Append-Only Stock Ledger**: Transaction-driven running balances with real-time on-hand calculation.
- **Inter-Warehouse Transfers**: Two-phase transfer workflow tracking `in_transit` state between dispatch and receipt.
- **Cycle Counts & Adjustments**: Discrepancy reconciliation with automated general ledger write-off hooks.
- **Forward & Backward Traceability**: Chronological lineage tracking for batch numbers (supplier to customer) and serialized assets.

### Phase 3: Procurement & 3-Way Matching
- **Purchase Requisitions (PR)**: Multi-item demand requests with departmental budget checks and anti-self-approval enforcement.
- **Purchase Orders (PO)**: Automated conversion from approved PRs, version-controlled amendments, and legal PO PDF generation.
- **Goods Receipt Notes (GRN)**: Formal receiving documentation with quality control inspection (`receivedQuantity`, `acceptedQuantity`, `rejectedQuantity`) and direct posting to the stock ledger.
- **Algorithmic 3-Way Match**: Automated comparison of PO, GRN, and Supplier Invoice line items with configurable percentage tolerances.
- **Return to Vendor (RTV)**: Defective shipment returns generating formal debit notes and stock ledger deductions.

### Phase 4: Cross-Module Integrations
- **Expenses & Department Budgets**: Direct bridge to the Expenses module verifying available departmental allocations before PR approval, with hard-blocking mode.
- **HRMS Equipment Provisioning**: Role-based starter kit templates automatically triggering asset reservations upon employee hiring.
- **Offboarding Return Checklist**: Automated exit asset return inspection with automated restocking of good items and payroll deduction alerts for lost hardware.
- **Double-Entry Accounting Hook**: Generates balanced journal payloads ready for General Ledger sync.
- **Proactive Alerts**: Background scanners for low stock thresholds and expiring batches.

### Phase 5: AI & Supply Chain Intelligence
- **Demand Forecasting**: 60-day moving average run-rate analysis projecting days of supply on hand with 1-click draft PR creation.
- **Multi-Modal Document OCR**: Gemini-powered extraction of invoice line items, pricing, and PO matching.
- **Shrinkage & Anomaly Radar**: Statistical sweep detecting scrap spikes ($>15\%$), dead stock ($>90\text{ days}$), and price shocks ($>20\%$).
- **Natural Language Copilot**: Parameterized read-only query engine with grounded conversational synthesis.
- **Supplier Evaluation**: Objective 4-factor vendor performance scoring (On-Time 40%, Quality 30%, Price Stability 20%, Delivery Consistency 10%).

### Phase 6: Analytics & Strategic Reports
- **Stock Valuation Report**: Balance sheet inventory asset breakdown by warehouse and category under FIFO and WAC methods.
- **Pareto ABC Analysis**: 80/15/5 distribution of annual consumption value.
- **XYZ Volatility Analysis**: Coefficient of variation ($\text{CV}$) measuring demand predictability.
- **Strategic 9-Cell ABC-XYZ Matrix**: Interactive visual 3x3 decision grid mapping SKUs to replenishment policies.
- **Stock Aging & Dead Stock**: Classification into 4 aging buckets (0-30d, 31-60d, 61-90d, >90d).
- **Turnover Ratio & DSI**: Inventory velocity analysis and days required to liquidate stock.
- **Supplier OTIF**: On-Time In-Full delivery rate tracking.
- **Streaming CSV Export**: Native generation of Valuation, ABC, and Aging spreadsheets.

---

## 5. Verification & Test Suite Summary

The entire module is validated by 6 comprehensive automated test suites covering all phases:

| Phase | Test Suite Script | Test Count | Pass Rate | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Phase 1** | `test_inventory_master_suite.js` | 9 | 100% | ✅ Passed |
| **Phase 2** | `test_stock_engine_suite.js` | 7 | 100% | ✅ Passed |
| **Phase 3** | `test_procurement_suite.js` | 14 | 100% | ✅ Passed |
| **Phase 4** | `test_integrations_suite.js` | 14 | 100% | ✅ Passed |
| **Phase 5** | `test_inventory_ai_suite.js` | 11 | 100% | ✅ Passed |
| **Phase 6** | `test_inventory_analytics_suite.js` | 9 | 100% | ✅ Passed |
| **Total** | **All 6 Module Suites** | **64** | **100%** | **🌟 Complete** |

Frontend verification via `npm run build` (`tsc -b && vite build`) passed with **0 TypeScript and Vite compilation errors**.

---

## 6. Seed Data & Local Execution

To populate a local development tenant with realistic inventory catalogs, warehouse hierarchies, historical ledger movements, and purchase orders:

```bash
# In Backend/ directory
node src/seed_inventory_data.js
```

To run all automated test suites:
```bash
# In Backend/ directory
node test_inventory_master_suite.js
node test_stock_engine_suite.js
node test_procurement_suite.js
node test_integrations_suite.js
node test_inventory_ai_suite.js
node test_inventory_analytics_suite.js
```

---

*Documentation compiled October 2026 for Nebula HUB ERP.*
