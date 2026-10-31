# Nebula HUB - Inventory Management API Reference

## 1. Authentication & Global Conventions

All Inventory API endpoints require authentication via Bearer JWT tokens. Multi-tenancy is enforced server-side by extracting `organizationId` from the authenticated user's session claims.

```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

### Standard Response Envelope
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Standard Error Envelope
```json
{
  "success": false,
  "message": "Detailed error explanation",
  "errors": []
}
```

---

## 2. Master Data Endpoints (`/api/inventory/*`)

### 2.1 Item Catalog & Categories
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/items` | List items with filters (`search`, `categoryId`, `trackingType`, `status`) |
| `POST` | `/api/inventory/items` | Create new item SKU with UoM conversions and tracking type |
| `GET` | `/api/inventory/items/:id` | Get detailed item profile with current stock and supplier list |
| `PUT` | `/api/inventory/items/:id` | Update item specifications and thresholds |
| `DELETE` | `/api/inventory/items/:id` | Soft delete item (`active: false`) |
| `GET` | `/api/inventory/categories` | List hierarchical category tree |
| `POST` | `/api/inventory/categories` | Create category (supports `parentId` for nesting) |

### 2.2 Warehouse, Zone & Bin Hierarchy
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/warehouses` | List warehouses with active stock summaries |
| `POST` | `/api/inventory/warehouses` | Create warehouse location |
| `GET` | `/api/inventory/warehouses/:id/zones` | List storage zones in warehouse |
| `POST` | `/api/inventory/warehouses/:id/zones` | Create zone (Ambient, Cold Storage, etc.) |
| `GET` | `/api/inventory/warehouses/:id/bins` | List storage bins with capacity and coordinates |
| `POST` | `/api/inventory/warehouses/:id/bins` | Create bin with max volume & weight limits |

### 2.3 Suppliers & Price Lists
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/suppliers` | List approved vendors and lead times |
| `POST` | `/api/inventory/suppliers` | Create supplier profile |
| `GET` | `/api/inventory/suppliers/:id/prices` | Get supplier contracted item pricing |
| `POST` | `/api/inventory/suppliers/:id/prices` | Update or append item contract rate |

### 2.4 QR Code & CSV Bulk Import/Export
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/items/:id/qrcode` | Generate base64 Data URL QR code for SKU |
| `GET` | `/api/inventory/bins/:id/qrcode` | Generate base64 Data URL QR code for Bin |
| `POST` | `/api/inventory/master/csv-preview` | Upload CSV and preview row validations |
| `POST` | `/api/inventory/master/csv-commit` | Commit validated CSV rows in batch transaction |
| `GET` | `/api/inventory/master/export?type=items` | Download items master as CSV |

---

## 3. Stock Engine & Ledger Endpoints (`/api/inventory/stock/*`)

### 3.1 Immutable Ledger & Stock Movements
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/stock/ledger` | Query immutable stock ledger transactions |
| `GET` | `/api/inventory/stock/balance` | Real-time on-hand, allocated, and available balances |
| `POST` | `/api/inventory/stock/movements` | Create stock movement (`issue`, `adjustment`, `receipt`) |
| `POST` | `/api/inventory/stock/reversals` | Append compensating reversal entry for a past transaction |

### 3.2 Inter-Warehouse Transfers
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inventory/stock/transfers/dispatch` | Dispatch stock (deducts source, sets status `in_transit`) |
| `POST` | `/api/inventory/stock/transfers/receive` | Receive in-transit stock into destination warehouse |

### 3.3 Batch & Serial Traceability
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/stock/trace/batch/:batchNo` | Forward/backward lineage trace of a batch number |
| `GET` | `/api/inventory/stock/trace/serial/:serialNo`| Full chronological lifecycle trace of a serial number |

---

## 4. Procurement & 3-Way Match Endpoints (`/api/inventory/procurement/*`)

### 4.1 Purchase Requisitions (PR)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/procurement/requisitions` | List requisitions by status |
| `POST` | `/api/inventory/procurement/requisitions` | Create draft purchase requisition |
| `POST` | `/api/inventory/procurement/requisitions/:id/submit` | Submit PR for approval workflow |
| `POST` | `/api/inventory/procurement/requisitions/:id/approve` | Approve PR (enforces 2-tier and anti-self-approval) |
| `POST` | `/api/inventory/procurement/requisitions/:id/reject` | Reject PR with audit reason |

### 4.2 Purchase Orders (PO) & Amendments
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/procurement/orders` | List purchase orders |
| `POST` | `/api/inventory/procurement/orders/from-pr/:prId` | Convert approved PR to legal PO |
| `POST` | `/api/inventory/procurement/orders/:id/amend` | Create amended version of PO |
| `GET` | `/api/inventory/procurement/orders/:id/pdf` | Download formatted enterprise PDF of PO |

### 4.3 Goods Receipt Notes (GRN) & Inspections
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/procurement/grn` | List goods receipt notes |
| `POST` | `/api/inventory/procurement/grn` | Record inbound shipment and quality inspection |
| `POST` | `/api/inventory/procurement/grn/:id/post-to-ledger` | Post accepted quantities into immutable `StockLedger` |
| `GET` | `/api/inventory/procurement/grn/:id/pdf` | Download formatted enterprise PDF of GRN |

### 4.4 3-Way Match & Supplier Invoices
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inventory/procurement/invoices` | Log supplier invoice for matching |
| `POST` | `/api/inventory/procurement/invoices/:id/match` | Run algorithmic 3-way match (PO vs GRN vs Invoice) |
| `POST` | `/api/inventory/procurement/returns` | Generate Return to Vendor & Debit Note |

---

## 5. Cross-Module Integration Endpoints (`/api/inventory/integrations/*`)

### 5.1 HRMS Equipment Kits & Asset Lifecycle
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/integrations/equipment-kits` | List job-role equipment kit templates |
| `POST` | `/api/inventory/integrations/equipment-kits` | Create equipment kit for job role |
| `POST` | `/api/inventory/integrations/assets/provision` | Auto-provision asset kit for newly hired employee |
| `POST` | `/api/inventory/integrations/assets/issue` | Physically dispatch and assign serial numbers |
| `POST` | `/api/inventory/integrations/assets/exit-return` | Process offboarding asset return & warehouse restock |

### 5.2 Accounting & Alerts
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/integrations/accounting/events` | Query double-entry journal payloads |
| `GET` | `/api/inventory/integrations/alerts/low-stock` | Retrieve SKUs falling below reorder points |
| `GET` | `/api/inventory/integrations/alerts/expiring` | Scan batches nearing expiration dates |

---

## 6. AI & Supply Chain Intelligence Endpoints (`/api/inventory/ai/*`)

### 6.1 Demand Forecasting
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/ai/forecast/:itemId` | Generate run-rate and demand forecast |
| `POST` | `/api/inventory/ai/forecast/create-requisition` | 1-click draft PR creation from AI recommendation |

### 6.2 Invoice/Challan Multi-Modal OCR
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inventory/ai/ocr/extract` | Extract line items and match PO tolerances from base64 document |

### 6.3 Anomaly Radar & Human Feedback
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/ai/anomalies/scan` | Execute statistical anomaly sweep (shrinkage, dead stock) |
| `GET` | `/api/inventory/ai/anomalies` | Query flagged anomalies with status filters |
| `POST` | `/api/inventory/ai/anomalies/:id/feedback` | Human feedback (`acknowledged`, `dismissed`, `resolved`) |

### 6.4 Copilot & Supplier Scoring
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/inventory/ai/copilot/query` | Natural language inventory inquiry engine |
| `GET` | `/api/inventory/ai/supplier-score/:supplierId` | Compute objective multi-factor score (OTIF, Quality, Price) |

---

## 7. Analytics & Executive Reports Endpoints (`/api/inventory/analytics/*`)

### 7.1 Real-Time Analytics & Matrices
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/inventory/analytics/overview` | Executive KPI dashboard snapshot |
| `GET` | `/api/inventory/analytics/valuation` | Multi-warehouse & category valuation (FIFO vs WAC) |
| `GET` | `/api/inventory/analytics/abc-xyz` | Pareto ABC distribution and 9-cell ABC-XYZ strategy matrix |
| `GET` | `/api/inventory/analytics/aging` | Stock aging buckets (0-30d, 31-60d, 61-90d, >90d dead stock) |
| `GET` | `/api/inventory/analytics/turnover` | Inventory turnover ratio, DSI, and COGS velocity |
| `GET` | `/api/inventory/analytics/fulfillment` | Supplier OTIF delivery and fill-rate metrics |
| `GET` | `/api/inventory/analytics/export?type=...` | Stream CSV report (`valuation`, `abc`, `aging`) |
