const StockLedger = require('../models/StockLedger');
const StockBatch = require('../models/StockBatch');
const Item = require('../models/Item');

/**
 * Stock Valuation Engine
 * Supports FIFO (First-In, First-Out) cost layering and Weighted Average Cost (WAC) calculations.
 */
class StockValuationService {
  /**
   * Calculate issue cost and consumed cost layers using FIFO
   * @param {Object} params
   * @param {string|ObjectId} params.organizationId
   * @param {string|ObjectId} params.itemId
   * @param {string|ObjectId} params.warehouseId
   * @param {number} params.quantityToIssue
   */
  async calculateFifoCost({ organizationId, itemId, warehouseId, quantityToIssue }) {
    if (quantityToIssue <= 0) {
      return { totalCost: 0, unitCost: 0, layers: [] };
    }

    // 1. Fetch all positive inbound ledger records (receipts, transfer_in, adjustment_in)
    // in chronological order (FIFO)
    const inboundEntries = await StockLedger.find({
      organizationId,
      itemId,
      warehouseId,
      quantity: { $gt: 0 },
      isReversed: false,
    })
      .sort({ createdAt: 1 })
      .lean();

    // 2. Fetch all previous negative outbound ledger records (issues, transfer_out, adjustment_out)
    const outboundEntries = await StockLedger.find({
      organizationId,
      itemId,
      warehouseId,
      quantity: { $lt: 0 },
      isReversed: false,
    })
      .sort({ createdAt: 1 })
      .lean();

    let totalHistoricalOutbound = outboundEntries.reduce(
      (sum, row) => sum + Math.abs(row.quantity),
      0
    );

    // 3. Skip already consumed historical inbound layers
    let remainingToIssue = quantityToIssue;
    let totalCost = 0;
    const consumedLayers = [];

    for (const inbound of inboundEntries) {
      if (remainingToIssue <= 0) break;

      let layerAvailable = inbound.quantity;

      // If historical outbound previously consumed part/all of this layer
      if (totalHistoricalOutbound > 0) {
        if (totalHistoricalOutbound >= layerAvailable) {
          totalHistoricalOutbound -= layerAvailable;
          continue; // Layer completely consumed in the past
        } else {
          layerAvailable -= totalHistoricalOutbound;
          totalHistoricalOutbound = 0;
        }
      }

      const takeFromLayer = Math.min(layerAvailable, remainingToIssue);
      const layerCost = takeFromLayer * inbound.unitCost;

      consumedLayers.push({
        ledgerId: inbound._id,
        documentNumber: inbound.documentNumber,
        unitCost: inbound.unitCost,
        quantity: takeFromLayer,
        cost: layerCost,
      });

      totalCost += layerCost;
      remainingToIssue -= takeFromLayer;
    }

    // Fallback if stock was issued beyond historical inbound (e.g. initial setup)
    if (remainingToIssue > 0) {
      const item = await Item.findOne({ _id: itemId, organizationId }).lean();
      const standardCost = item?.standardCost || 0;
      const fallbackCost = remainingToIssue * standardCost;
      consumedLayers.push({
        ledgerId: null,
        documentNumber: 'STANDARD-FALLBACK',
        unitCost: standardCost,
        quantity: remainingToIssue,
        cost: fallbackCost,
      });
      totalCost += fallbackCost;
    }

    const effectiveUnitCost = quantityToIssue > 0 ? totalCost / quantityToIssue : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      unitCost: Math.round(effectiveUnitCost * 100) / 100,
      layers: consumedLayers,
    };
  }

  /**
   * Calculate current Weighted Average Cost (WAC) and total valuation
   * @param {Object} params
   * @param {string|ObjectId} params.organizationId
   * @param {string|ObjectId} params.itemId
   * @param {string|ObjectId} params.warehouseId
   */
  async getCurrentWeightedAverageCost({ organizationId, itemId, warehouseId }) {
    const ledgerRows = await StockLedger.find({
      organizationId,
      itemId,
      warehouseId,
      isReversed: false,
    }).lean();

    let totalQty = 0;
    let totalValue = 0;

    for (const row of ledgerRows) {
      totalQty += row.quantity;
      totalValue += row.totalCost;
    }

    // Avoid division by zero or negative valuations
    if (totalQty <= 0 || totalValue <= 0) {
      const item = await Item.findOne({ _id: itemId, organizationId }).lean();
      return {
        currentQty: Math.max(0, totalQty),
        unitCost: item?.standardCost || 0,
        totalValuation: 0,
      };
    }

    const avgUnitCost = totalValue / totalQty;
    return {
      currentQty: totalQty,
      unitCost: Math.round(avgUnitCost * 100) / 100,
      totalValuation: Math.round(totalValue * 100) / 100,
    };
  }

  /**
   * Recalculate Weighted Average Cost on inbound receipt
   */
  calculateNewWeightedAverage({ currentQty, currentValuation, inboundQty, inboundUnitCost }) {
    if (inboundQty <= 0) return { newAvgCost: currentValuation / (currentQty || 1), newTotalValuation: currentValuation };

    const newTotalValuation = currentValuation + inboundQty * inboundUnitCost;
    const newTotalQty = currentQty + inboundQty;
    const newAvgCost = newTotalQty > 0 ? newTotalValuation / newTotalQty : inboundUnitCost;

    return {
      newAvgCost: Math.round(newAvgCost * 100) / 100,
      newTotalValuation: Math.round(newTotalValuation * 100) / 100,
      newTotalQty,
    };
  }
}

module.exports = new StockValuationService();
