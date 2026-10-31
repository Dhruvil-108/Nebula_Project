const Item = require('../models/Item');
const Warehouse = require('../models/Warehouse');
const ItemCategory = require('../models/ItemCategory');
const StockLedger = require('../models/StockLedger');
const StockMovement = require('../models/StockMovement');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceiptNote = require('../models/GoodsReceiptNote');
const { roundMoney } = require('../utils/money');

class InventoryAnalyticsService {
  /**
   * 1. Stock Valuation Report (by Warehouse, Category, and Valuation Method)
   */
  static async getStockValuationReport(organizationId) {
    const items = await Item.find({
      organizationId,
      active: { $ne: false },
    })
      .populate('categoryId', 'name code')
      .populate('defaultWarehouseId', 'name code');

    const warehouses = await Warehouse.find({ organizationId, active: { $ne: false } });
    const categories = await ItemCategory.find({ organizationId, active: { $ne: false } });

    let totalValuation = 0;
    let totalStockUnits = 0;
    let fifoValuation = 0;
    let wacValuation = 0;

    const warehouseMap = {};
    warehouses.forEach((w) => {
      warehouseMap[w._id.toString()] = {
        _id: w._id,
        name: w.name,
        code: w.code,
        units: 0,
        valuation: 0,
        skuCount: 0,
      };
    });

    const categoryMap = {};
    categories.forEach((c) => {
      categoryMap[c._id.toString()] = {
        _id: c._id,
        name: c.name,
        code: c.code,
        units: 0,
        valuation: 0,
        skuCount: 0,
      };
    });

    items.forEach((item) => {
      const stock = item.currentStock || 0;
      const cost = item.standardCost || 0;
      const val = roundMoney(stock * cost);

      totalStockUnits += stock;
      totalValuation += val;

      if (item.valuationMethod === 'weighted_average') {
        wacValuation += val;
      } else {
        fifoValuation += val;
      }

      // Warehouse allocation
      const whId = item.defaultWarehouseId?._id?.toString() || warehouses[0]?._id?.toString();
      if (whId && warehouseMap[whId]) {
        warehouseMap[whId].units += stock;
        warehouseMap[whId].valuation += val;
        warehouseMap[whId].skuCount += 1;
      }

      // Category allocation
      const catId = item.categoryId?._id?.toString() || categories[0]?._id?.toString();
      if (catId && categoryMap[catId]) {
        categoryMap[catId].units += stock;
        categoryMap[catId].valuation += val;
        categoryMap[catId].skuCount += 1;
      }
    });

    totalValuation = roundMoney(totalValuation);

    // Compute percentages
    const warehouseBreakdown = Object.values(warehouseMap).map((w) => ({
      ...w,
      valuation: roundMoney(w.valuation),
      percentage: totalValuation > 0 ? roundMoney((w.valuation / totalValuation) * 100) : 0,
    }));

    const categoryBreakdown = Object.values(categoryMap).map((c) => ({
      ...c,
      valuation: roundMoney(c.valuation),
      percentage: totalValuation > 0 ? roundMoney((c.valuation / totalValuation) * 100) : 0,
    }));

    return {
      summary: {
        totalValuation,
        totalStockUnits,
        totalActiveSkus: items.length,
        fifoValuation: roundMoney(fifoValuation),
        wacValuation: roundMoney(wacValuation),
        warehouseCount: warehouses.length,
        categoryCount: categories.length,
      },
      warehouseBreakdown,
      categoryBreakdown,
    };
  }

  /**
   * 2. ABC Analysis (Pareto 80/15/5 Distribution by Consumption Value)
   */
  static async getAbcAnalysis(organizationId, options = {}) {
    const lookbackDays = options.lookbackDays || 365;
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const items = await Item.find({ organizationId, active: { $ne: false } }).select(
      'sku name standardCost baseUom unitOfMeasure currentStock'
    );

    // Fetch outflows from StockLedger (or StockMovement)
    const ledgerOutflows = await StockLedger.find({
      organizationId,
      transactionType: { $in: ['issue', 'adjustment_out', 'transfer_out'] },
      createdAt: { $gte: startDate },
    });

    const consumptionMap = {};
    items.forEach((it) => {
      consumptionMap[it._id.toString()] = {
        item: it,
        consumedUnits: 0,
        consumptionValue: 0,
      };
    });

    ledgerOutflows.forEach((l) => {
      const itId = l.itemId?.toString();
      if (consumptionMap[itId]) {
        const qty = Math.abs(l.quantity || 0);
        consumptionMap[itId].consumedUnits += qty;
        consumptionMap[itId].consumptionValue += roundMoney(qty * (l.unitCost || consumptionMap[itId].item.standardCost || 0));
      }
    });

    // If historical ledger has low/zero entries (e.g. fresh items), fall back to current inventory value as proxy
    let totalValue = Object.values(consumptionMap).reduce((s, c) => s + c.consumptionValue, 0);
    if (totalValue === 0) {
      Object.values(consumptionMap).forEach((c) => {
        c.consumptionValue = roundMoney((c.item.currentStock || 0) * (c.item.standardCost || 0));
        c.consumedUnits = c.item.currentStock || 0;
      });
      totalValue = Object.values(consumptionMap).reduce((s, c) => s + c.consumptionValue, 0);
    }

    // Sort descending by consumption value
    const sorted = Object.values(consumptionMap).sort((a, b) => b.consumptionValue - a.consumptionValue);

    let cumulativeValue = 0;
    const classifiedItems = sorted.map((entry) => {
      cumulativeValue += entry.consumptionValue;
      const cumulativePercentage = totalValue > 0 ? (cumulativeValue / totalValue) * 100 : 100;

      let abcClass = 'C';
      let policy = 'Bulk purchase, simplified controls, low monitoring';
      if (cumulativePercentage <= 80 || sorted.indexOf(entry) === 0) {
        abcClass = 'A';
        policy = 'Tight control, frequent cycle counts, rigorous demand forecasting';
      } else if (cumulativePercentage <= 95) {
        abcClass = 'B';
        policy = 'Moderate control, periodic review, standard buffer replenishment';
      }

      return {
        _id: entry.item._id,
        sku: entry.item.sku,
        name: entry.item.name,
        standardCost: entry.item.standardCost || 0,
        consumedUnits: entry.consumedUnits,
        consumptionValue: roundMoney(entry.consumptionValue),
        cumulativePercentage: roundMoney(cumulativePercentage),
        abcClass,
        policy,
      };
    });

    const countA = classifiedItems.filter((i) => i.abcClass === 'A').length;
    const countB = classifiedItems.filter((i) => i.abcClass === 'B').length;
    const countC = classifiedItems.filter((i) => i.abcClass === 'C').length;

    const valA = roundMoney(classifiedItems.filter((i) => i.abcClass === 'A').reduce((s, i) => s + i.consumptionValue, 0));
    const valB = roundMoney(classifiedItems.filter((i) => i.abcClass === 'B').reduce((s, i) => s + i.consumptionValue, 0));
    const valC = roundMoney(classifiedItems.filter((i) => i.abcClass === 'C').reduce((s, i) => s + i.consumptionValue, 0));

    return {
      totalValue: roundMoney(totalValue),
      itemCount: classifiedItems.length,
      distribution: {
        A: { count: countA, value: valA, pctValue: totalValue > 0 ? roundMoney((valA / totalValue) * 100) : 0 },
        B: { count: countB, value: valB, pctValue: totalValue > 0 ? roundMoney((valB / totalValue) * 100) : 0 },
        C: { count: countC, value: valC, pctValue: totalValue > 0 ? roundMoney((valC / totalValue) * 100) : 0 },
      },
      items: classifiedItems,
    };
  }

  /**
   * 3. XYZ Analysis (Demand Predictability & Coefficient of Variation)
   */
  static async getXyzAnalysis(organizationId, options = {}) {
    const lookbackDays = options.lookbackDays || 180;
    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    const items = await Item.find({ organizationId, active: { $ne: false } }).select(
      'sku name standardCost baseUom currentStock'
    );

    // Group ledger consumption into 4 bi-weekly / monthly intervals to calculate variance
    const ledgerOutflows = await StockLedger.find({
      organizationId,
      transactionType: { $in: ['issue', 'adjustment_out', 'transfer_out'] },
      createdAt: { $gte: startDate },
    });

    const intervalCount = 4;
    const intervalMs = (lookbackDays * 24 * 60 * 60 * 1000) / intervalCount;

    const classified = items.map((item) => {
      const itemLogs = ledgerOutflows.filter((l) => l.itemId?.toString() === item._id.toString());
      const buckets = [0, 0, 0, 0];

      itemLogs.forEach((l) => {
        const ageMs = Date.now() - new Date(l.createdAt).getTime();
        const bIdx = Math.min(intervalCount - 1, Math.max(0, Math.floor(ageMs / intervalMs)));
        buckets[bIdx] += Math.abs(l.quantity || 0);
      });

      const totalConsumed = buckets.reduce((a, b) => a + b, 0);
      const mean = totalConsumed / intervalCount;

      let stdDev = 0;
      if (mean > 0) {
        const variance = buckets.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / intervalCount;
        stdDev = Math.sqrt(variance);
      }

      const cv = mean > 0 ? roundMoney(stdDev / mean) : (item.currentStock > 0 ? 0.35 : 1.5);

      let xyzClass = 'X';
      let description = 'Constant and predictable demand (Low risk, low safety buffer)';
      if (cv > 1.0) {
        xyzClass = 'Z';
        description = 'Sporadic, erratic demand (High risk, order on demand)';
      } else if (cv > 0.5) {
        xyzClass = 'Y';
        description = 'Fluctuating, seasonal demand (Moderate safety buffer)';
      }

      return {
        _id: item._id,
        sku: item.sku,
        name: item.name,
        currentStock: item.currentStock || 0,
        meanIntervalDemand: roundMoney(mean),
        stdDev: roundMoney(stdDev),
        coefficientOfVariation: cv,
        xyzClass,
        description,
      };
    });

    const countX = classified.filter((i) => i.xyzClass === 'X').length;
    const countY = classified.filter((i) => i.xyzClass === 'Y').length;
    const countZ = classified.filter((i) => i.xyzClass === 'Z').length;

    return {
      distribution: {
        X: { count: countX, label: 'Predictable Demand (CV <= 0.5)' },
        Y: { count: countY, label: 'Fluctuating Demand (0.5 < CV <= 1.0)' },
        Z: { count: countZ, label: 'Erratic / Sporadic (CV > 1.0)' },
      },
      items: classified,
    };
  }

  /**
   * 4. Combined 9-Cell ABC-XYZ Strategy Matrix
   */
  static async getAbcXyzMatrix(organizationId, options = {}) {
    const abc = await this.getAbcAnalysis(organizationId, options);
    const xyz = await this.getXyzAnalysis(organizationId, options);

    const xyzMap = {};
    xyz.items.forEach((x) => {
      xyzMap[x._id.toString()] = x;
    });

    const matrix = {
      AX: [], AY: [], AZ: [],
      BX: [], BY: [], BZ: [],
      CX: [], CY: [], CZ: [],
    };

    const strategies = {
      AX: 'High value, predictable demand -> Just-In-Time (JIT), automated replenishment',
      AY: 'High value, fluctuating demand -> Flexible safety stock, collaborative supplier planning',
      AZ: 'High value, erratic demand -> Strict human approval, order strictly on confirmed demand',
      BX: 'Medium value, predictable demand -> Standard reorder point replenishment',
      BY: 'Medium value, fluctuating demand -> Buffer safety stock with periodic reviews',
      BZ: 'Medium value, erratic demand -> Low buffer stock, review quarterly',
      CX: 'Low value, predictable demand -> Bulk orders, automated replenishment',
      CY: 'Low value, fluctuating demand -> Economical order quantity (EOQ) with safety buffer',
      CZ: 'Low value, erratic demand -> Spot buy / minimum stock, consider drop-ship or vendor managed',
    };

    abc.items.forEach((item) => {
      const xMatch = xyzMap[item._id.toString()];
      const xClass = xMatch ? xMatch.xyzClass : 'X';
      const cell = `${item.abcClass}${xClass}`;

      if (matrix[cell]) {
        matrix[cell].push({
          ...item,
          xyzClass: xClass,
          coefficientOfVariation: xMatch?.coefficientOfVariation || 0.2,
          matrixCell: cell,
          strategy: strategies[cell],
        });
      }
    });

    const gridCounts = {};
    Object.keys(matrix).forEach((key) => {
      gridCounts[key] = matrix[key].length;
    });

    return {
      gridCounts,
      strategies,
      matrix,
    };
  }

  /**
   * 5. Stock Aging Breakdown (0-30d, 31-60d, 61-90d, >90d Dead Stock)
   */
  static async getStockAgingReport(organizationId) {
    const items = await Item.find({
      organizationId,
      active: { $ne: false },
      currentStock: { $gt: 0 },
    });

    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const sixtyDays = 60 * 24 * 60 * 60 * 1000;
    const ninetyDays = 90 * 24 * 60 * 60 * 1000;

    const buckets = {
      under30: { label: '0 - 30 Days (Fresh)', units: 0, valuation: 0, items: [] },
      thirtyToSixty: { label: '31 - 60 Days (Normal Turn)', units: 0, valuation: 0, items: [] },
      sixtyToNinety: { label: '61 - 90 Days (Slow Moving)', units: 0, valuation: 0, items: [] },
      over90: { label: '> 90 Days (Stagnant / Dead Stock)', units: 0, valuation: 0, items: [] },
    };

    for (const item of items) {
      // Find latest inbound movement (receipt or adjustment_in)
      const latestReceipt = await StockLedger.findOne({
        organizationId,
        itemId: item._id,
        quantity: { $gt: 0 },
      }).sort({ createdAt: -1 });

      const lastDate = latestReceipt ? new Date(latestReceipt.createdAt).getTime() : new Date(item.createdAt).getTime();
      const ageMs = Math.max(0, now - lastDate);
      const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));

      const stock = item.currentStock || 0;
      const cost = item.standardCost || 0;
      const val = roundMoney(stock * cost);

      const entry = {
        _id: item._id,
        sku: item.sku,
        name: item.name,
        currentStock: stock,
        standardCost: cost,
        valuation: val,
        ageDays,
        lastReceiptDate: new Date(lastDate).toISOString(),
      };

      if (ageMs <= thirtyDays) {
        buckets.under30.units += stock;
        buckets.under30.valuation += val;
        buckets.under30.items.push(entry);
      } else if (ageMs <= sixtyDays) {
        buckets.thirtyToSixty.units += stock;
        buckets.thirtyToSixty.valuation += val;
        buckets.thirtyToSixty.items.push(entry);
      } else if (ageMs <= ninetyDays) {
        buckets.sixtyToNinety.units += stock;
        buckets.sixtyToNinety.valuation += val;
        buckets.sixtyToNinety.items.push(entry);
      } else {
        buckets.over90.units += stock;
        buckets.over90.valuation += val;
        buckets.over90.items.push(entry);
      }
    }

    Object.keys(buckets).forEach((k) => {
      buckets[k].valuation = roundMoney(buckets[k].valuation);
    });

    const totalValuation = Object.values(buckets).reduce((s, b) => s + b.valuation, 0);

    return {
      totalValuation: roundMoney(totalValuation),
      totalStagnantCapital: buckets.over90.valuation,
      buckets,
    };
  }

  /**
   * 6. Inventory Turnover Ratio & Days Sales of Inventory (DSI)
   */
  static async getTurnoverAndDsi(organizationId, options = {}) {
    const daysInPeriod = options.days || 365;
    const startDate = new Date(Date.now() - daysInPeriod * 24 * 60 * 60 * 1000);

    // Sum all COGS (consumption out of ledger)
    const outflows = await StockLedger.find({
      organizationId,
      transactionType: { $in: ['issue', 'adjustment_out', 'transfer_out'] },
      createdAt: { $gte: startDate },
    });

    const cogs = outflows.reduce((sum, l) => sum + Math.abs(l.totalCost || (l.quantity * (l.unitCost || 0)) || 0), 0);

    // Get current inventory value as proxy for average inventory
    const valReport = await this.getStockValuationReport(organizationId);
    const avgInventory = valReport.summary.totalValuation || 1;

    // Turnover = COGS / Avg Inventory
    const turnoverRatio = avgInventory > 0 ? roundMoney(cogs / avgInventory) : 0;

    // DSI = (Avg Inventory / COGS) * daysInPeriod = daysInPeriod / turnoverRatio
    const dsi = turnoverRatio > 0 ? Math.round(daysInPeriod / turnoverRatio) : (avgInventory > 0 ? daysInPeriod : 0);

    let efficiencyRating = 'healthy';
    if (turnoverRatio < 1.0) efficiencyRating = 'poor';
    else if (turnoverRatio >= 4.0) efficiencyRating = 'excellent';

    return {
      periodDays: daysInPeriod,
      cogs: roundMoney(cogs),
      averageInventoryValue: avgInventory,
      turnoverRatio,
      daysSalesOfInventory: dsi,
      efficiencyRating,
      benchmarkTargetTurnover: 4.0,
      benchmarkTargetDsi: 90,
    };
  }

  /**
   * 7. Order Fulfillment & Supplier Fill-Rate (OTIF: On-Time In-Full)
   */
  static async getFulfillmentAndOtif(organizationId) {
    const pos = await PurchaseOrder.find({
      organizationId,
      status: { $in: ['approved', 'ordered', 'partially_received', 'received', 'billed', 'closed'] },
    }).populate('supplierId', 'name supplierCode');

    const grns = await GoodsReceiptNote.find({
      organizationId,
      status: { $in: ['inspected', 'posted_to_ledger', 'verified', 'posted'] },
    });

    let totalOrders = 0;
    let onTimeOrders = 0;
    let inFullOrders = 0;
    let otifOrders = 0;

    pos.forEach((po) => {
      totalOrders++;
      const relatedGrns = grns.filter((g) => (g.poId || g.purchaseOrderId)?.toString() === po._id.toString());

      if (relatedGrns.length === 0) {
        return; // Pending delivery
      }

      let isOnTime = false;
      let isInFull = true;

      // Check on-time
      const latestGrn = relatedGrns[relatedGrns.length - 1];
      if (po.expectedDeliveryDate && latestGrn.receivedDate) {
        const graceTime = new Date(po.expectedDeliveryDate).getTime() + 24 * 60 * 60 * 1000;
        if (new Date(latestGrn.receivedDate).getTime() <= graceTime) {
          isOnTime = true;
        }
      } else {
        isOnTime = true; // No delivery date constraint
      }

      // Check in-full
      let totalReceived = 0;
      let totalAccepted = 0;
      let totalOrdered = (po.items || []).reduce((s, it) => s + (it.orderedQuantity || it.quantity || 0), 0);

      relatedGrns.forEach((g) => {
        const lines = g.items?.length ? g.items : (g.lines || []);
        lines.forEach((l) => {
          totalReceived += (l.receivedQuantity !== undefined ? l.receivedQuantity : (l.receivedQty || 0));
          totalAccepted += (l.acceptedQuantity !== undefined ? l.acceptedQuantity : (l.acceptedQty || 0));
        });
      });

      if (totalAccepted >= totalOrdered && totalOrdered > 0) {
        isInFull = true;
      } else {
        isInFull = false;
      }

      if (isOnTime) onTimeOrders++;
      if (isInFull) inFullOrders++;
      if (isOnTime && isInFull) otifOrders++;
    });

    const onTimeRate = totalOrders > 0 ? roundMoney((onTimeOrders / totalOrders) * 100) : 100;
    const inFullRate = totalOrders > 0 ? roundMoney((inFullOrders / totalOrders) * 100) : 100;
    const otifRate = totalOrders > 0 ? roundMoney((otifOrders / totalOrders) * 100) : 100;

    return {
      totalOrdersEvaluated: totalOrders,
      onTimeDeliveries: onTimeOrders,
      inFullDeliveries: inFullOrders,
      otifDeliveries: otifOrders,
      metrics: {
        onTimeRate: `${onTimeRate}%`,
        inFullRate: `${inFullRate}%`,
        otifRate: `${otifRate}%`,
      },
    };
  }

  /**
   * 8. CSV Export Engine for Analytics & Reports
   */
  static async exportAnalyticsCsv(organizationId, reportType = 'valuation') {
    if (reportType === 'abc') {
      const data = await this.getAbcAnalysis(organizationId);
      const headers = ['SKU,Item Name,Standard Cost,Consumed Units,Consumption Value,Cumulative %,ABC Class,Policy'];
      const rows = data.items.map((i) =>
        `"${i.sku}","${i.name.replace(/"/g, '""')}",${i.standardCost},${i.consumedUnits},${i.consumptionValue},${i.cumulativePercentage}%,"${i.abcClass}","${i.policy}"`
      );
      return [headers, ...rows].join('\n');
    }

    if (reportType === 'aging') {
      const data = await this.getStockAgingReport(organizationId);
      const headers = ['Bucket,SKU,Item Name,Stock Qty,Standard Cost,Valuation ($),Age (Days),Last Receipt'];
      const rows = [];
      Object.keys(data.buckets).forEach((bKey) => {
        const b = data.buckets[bKey];
        b.items.forEach((it) => {
          rows.push(
            `"${b.label}","${it.sku}","${it.name.replace(/"/g, '""')}",${it.currentStock},${it.standardCost},${it.valuation},${it.ageDays},"${it.lastReceiptDate}"`
          );
        });
      });
      return [headers, ...rows].join('\n');
    }

    // Default: Valuation report
    const data = await this.getStockValuationReport(organizationId);
    const headers = ['Warehouse,Category,SKU,Item Name,Stock Qty,Unit Cost,Total Valuation ($)'];
    const items = await Item.find({ organizationId, active: { $ne: false } })
      .populate('categoryId', 'name')
      .populate('defaultWarehouseId', 'name');

    const rows = items.map((it) => {
      const stock = it.currentStock || 0;
      const cost = it.standardCost || 0;
      return `"${it.defaultWarehouseId?.name || 'Main Warehouse'}","${it.categoryId?.name || 'General'}","${it.sku}","${it.name.replace(/"/g, '""')}",${stock},${cost},${roundMoney(stock * cost)}`;
    });

    return [headers, ...rows].join('\n');
  }
}

module.exports = InventoryAnalyticsService;
