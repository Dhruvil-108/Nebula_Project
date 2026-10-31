const InventoryAnomaly = require('../models/InventoryAnomaly');
const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const StockLedger = require('../models/StockLedger');
const GoodsReceiptNote = require('../models/GoodsReceiptNote');
const PurchaseOrder = require('../models/PurchaseOrder');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

class InventoryAnomalyService {
  /**
   * Run full inventory anomaly detection scan across the tenant
   */
  static async scanAnomalies(organizationId, userId = null) {
    const startTime = Date.now();
    const anomaliesDetected = [];

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    // ── 1. Shrinkage & High Scrap Detection from StockLedger ──
    const scrapLedgers = await StockLedger.find({
      organizationId,
      transactionType: { $in: ['adjustment_out', 'cycle_count_variance'] },
      createdAt: { $gte: thirtyDaysAgo },
    }).populate('itemId', 'sku name currentStock standardCost');

    for (const l of scrapLedgers) {
      const item = l.itemId;
      if (!item) continue;

      const qty = Math.abs(l.quantity || 0);
      const isHighPercentage = item.currentStock > 0 && (qty / (item.currentStock + qty)) > 0.15;
      const isHighValue = (qty * (item.standardCost || 0)) > 500;

      if (isHighPercentage || isHighValue) {
        anomaliesDetected.push({
          anomalyType: 'shrinkage_spike',
          severity: isHighValue ? 'critical' : 'warning',
          title: `Unusual Stock Shrinkage: ${item.name} (${item.sku})`,
          description: `Logged ${l.transactionType} of ${qty} units (${roundMoney((qty / ((item.currentStock || 1) + qty)) * 100)}% of stock) with estimated impact of $${roundMoney(qty * (item.standardCost || 0))}.`,
          itemId: item._id,
          warehouseId: l.warehouseId || null,
          metrics: {
            ledgerId: l._id,
            transactionType: l.transactionType,
            quantity: qty,
            standardCost: item.standardCost,
            estimatedLoss: roundMoney(qty * (item.standardCost || 0)),
          },
          recommendedAction: 'Conduct physical cycle count audit and review audit log for this adjustment.',
        });
      }
    }

    // ── 2. Dead / Stagnant Stock Detection (> 90 days with positive stock and 0 movements) ──
    const positiveItems = await Item.find({
      organizationId,
      active: { $ne: false },
      currentStock: { $gt: 0 },
    });

    for (const item of positiveItems) {
      const recentMovement = await StockLedger.findOne({
        organizationId,
        itemId: item._id,
        createdAt: { $gte: ninetyDaysAgo },
      });

      if (!recentMovement) {
        const capitalTiedUp = roundMoney(item.currentStock * (item.standardCost || 0));
        anomaliesDetected.push({
          anomalyType: 'dead_stock',
          severity: capitalTiedUp > 1000 ? 'warning' : 'info',
          title: `Stagnant Working Capital: ${item.name} (${item.sku})`,
          description: `No movement recorded in the last 90 days. Holding ${item.currentStock} ${item.unitOfMeasure} tying up $${capitalTiedUp} in working capital.`,
          itemId: item._id,
          warehouseId: null,
          metrics: {
            currentStock: item.currentStock,
            standardCost: item.standardCost,
            capitalTiedUp,
            daysSinceLastMovement: 90,
          },
          recommendedAction: 'Consider promotional clearance, bundling, or liquidation to recover working capital.',
        });
      }
    }

    // ── 3. Duplicate Goods Receipt (GRN) Look-Alike within 48 Hours ──
    const recentGrns = await GoodsReceiptNote.find({
      organizationId,
      createdAt: { $gte: fortyEightHoursAgo },
      status: { $in: ['submitted', 'verified', 'posted'] },
    }).populate('supplierId', 'name');

    for (let i = 0; i < recentGrns.length; i++) {
      for (let j = i + 1; j < recentGrns.length; j++) {
        const g1 = recentGrns[i];
        const g2 = recentGrns[j];

        if (
          g1.supplierId?._id?.toString() === g2.supplierId?._id?.toString() &&
          g1.lines?.length === g2.lines?.length &&
          g1.lines?.length > 0
        ) {
          // Check matching lines
          const sameQty = g1.lines[0]?.receivedQty === g2.lines[0]?.receivedQty;
          const sameItem = g1.lines[0]?.itemId?.toString() === g2.lines[0]?.itemId?.toString();

          if (sameQty && sameItem) {
            anomaliesDetected.push({
              anomalyType: 'duplicate_receipt',
              severity: 'critical',
              title: `Potential Duplicate Receipt: ${g1.grnNumber} & ${g2.grnNumber}`,
              description: `Two goods receipts from supplier ${g1.supplierId?.name || 'Vendor'} recorded within 48h with matching line counts and quantities (${g1.lines[0]?.receivedQty} units).`,
              supplierId: g1.supplierId?._id,
              metrics: {
                grn1: g1.grnNumber,
                grn2: g2.grnNumber,
                receivedQty: g1.lines[0]?.receivedQty,
              },
              recommendedAction: 'Verify physical receiving dock and check for accidental duplicate posting before invoice clearance.',
            });
          }
        }
      }
    }

    // ── 4. Price Spike in Recent POs (> 20% above standard cost) ──
    const recentPos = await PurchaseOrder.find({
      organizationId,
      createdAt: { $gte: thirtyDaysAgo },
      status: { $nin: ['cancelled'] },
    }).populate('items.itemId', 'sku name standardCost');

    for (const po of recentPos) {
      for (const it of po.items || []) {
        const item = it.itemId;
        if (item && item.standardCost > 0 && it.unitPrice > 0) {
          const variancePct = roundMoney(((it.unitPrice - item.standardCost) / item.standardCost) * 100);
          if (variancePct > 20) {
            anomaliesDetected.push({
              anomalyType: 'price_spike',
              severity: variancePct > 40 ? 'critical' : 'warning',
              title: `Purchase Price Spike: ${item.name} (${item.sku})`,
              description: `PO ${po.poNumber} rate of $${it.unitPrice} is ${variancePct}% higher than the standard baseline cost of $${item.standardCost}.`,
              itemId: item._id,
              supplierId: po.supplierId,
              metrics: {
                poNumber: po.poNumber,
                poPrice: it.unitPrice,
                standardCost: item.standardCost,
                variancePct,
              },
              recommendedAction: 'Review supplier contract rate or renegotiate procurement terms.',
            });
          }
        }
      }
    }

    // ── Persist New Anomalies ──
    const persistedAnomalies = [];
    for (const anom of anomaliesDetected) {
      // Check if open alert already exists for same type and item/metrics
      const existing = await InventoryAnomaly.findOne({
        organizationId,
        anomalyType: anom.anomalyType,
        itemId: anom.itemId || null,
        status: 'open',
      });

      if (!existing) {
        const record = await InventoryAnomaly.create({
          ...anom,
          organizationId,
        });
        persistedAnomalies.push(record);
      } else {
        persistedAnomalies.push(existing);
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log to AiRun
    if (organizationId && userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'inventory_anomaly',
          promptVersion: 'v1.0',
          model: 'statistical_heuristic_v1',
          latencyMs,
          resultSummary: `Anomaly scan detected ${anomaliesDetected.length} potential issues (${persistedAnomalies.length} active in tenant)`,
        });
      } catch (logErr) {
        // Non-blocking
      }
    }

    return {
      scanTime: new Date().toISOString(),
      totalScannedAnomalies: anomaliesDetected.length,
      anomalies: persistedAnomalies,
    };
  }

  /**
   * User feedback on an anomaly (Acknowledge, Dismiss, or Resolve)
   */
  static async recordFeedback(organizationId, user, anomalyId, { status, userFeedback, feedbackNote }) {
    const anomaly = await InventoryAnomaly.findOne({ _id: anomalyId, organizationId });
    if (!anomaly) {
      throw new Error('Anomaly record not found.');
    }

    if (status) anomaly.status = status;
    if (userFeedback) anomaly.userFeedback = userFeedback;
    if (feedbackNote !== undefined) anomaly.feedbackNote = feedbackNote;

    if (status === 'resolved' || status === 'dismissed') {
      anomaly.resolvedBy = user._id;
      anomaly.resolvedAt = new Date();
    }

    await anomaly.save();
    return anomaly;
  }
}

module.exports = InventoryAnomalyService;
