const Item = require('../models/Item');
const StockMovement = require('../models/StockMovement');
const StockLedger = require('../models/StockLedger');
const Supplier = require('../models/Supplier');
const PurchaseRequisition = require('../models/PurchaseRequisition');
const AiRun = require('../models/AiRun');
const counterService = require('./counterService');
const { roundMoney } = require('../utils/money');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

class InventoryForecastService {
  /**
   * Forecast demand and generate smart reorder metrics for an inventory item
   */
  static async forecastItemDemand(organizationId, itemId, options = {}) {
    const startTime = Date.now();
    const lookbackDays = options.lookbackDays || 60;
    const userId = options.userId || null;

    const item = await Item.findOne({ _id: itemId, organizationId, active: { $ne: false } });
    if (!item) {
      throw new Error('Item not found or does not belong to this organization.');
    }

    const startDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

    // Aggregate consumption from StockLedger (issue, adjustment_out, transfer_out)
    const ledgerEntries = await StockLedger.find({
      organizationId,
      itemId,
      transactionType: { $in: ['issue', 'adjustment_out', 'transfer_out'] },
      createdAt: { $gte: startDate },
    });

    let totalConsumed = ledgerEntries.reduce((sum, l) => sum + Math.abs(l.quantity || 0), 0);

    // Fallback: check StockMovement lines if ledgerEntries is 0
    if (totalConsumed === 0) {
      const movements = await StockMovement.find({
        organizationId,
        'lines.itemId': itemId,
        movementType: { $in: ['issue', 'transfer', 'adjustment'] },
        createdAt: { $gte: startDate },
      });
      movements.forEach((m) => {
        (m.lines || []).forEach((line) => {
          if (line.itemId?.toString() === itemId.toString()) {
            totalConsumed += Math.abs(line.actualQty || line.requestedQty || 0);
          }
        });
      });
    }
    const dailyRunRate = lookbackDays > 0 ? totalConsumed / lookbackDays : 0;
    const weeklyVelocity = dailyRunRate * 7;
    const monthlyVelocity = dailyRunRate * 30;

    const currentOnHand = item.currentStock || 0;
    const reorderLevel = item.reorderLevel || 10;
    const safetyStock = item.safetyStock || 5;
    const leadTimeDays = item.leadTimeDays || 7;

    // Days of supply
    const daysOfSupply = dailyRunRate > 0 ? Math.floor(currentOnHand / dailyRunRate) : (currentOnHand > 0 ? 999 : 0);
    
    // Suggested Reorder Date
    const netBufferDays = Math.max(0, daysOfSupply - leadTimeDays);
    const suggestedReorderDate = new Date(Date.now() + netBufferDays * 24 * 60 * 60 * 1000);

    // Stockout Projected Date
    const stockoutProjectedDate = dailyRunRate > 0
      ? new Date(Date.now() + daysOfSupply * 24 * 60 * 60 * 1000)
      : null;

    // Recommended Order Quantity (EOQ style heuristic)
    // Target buffer is 30 days of consumption + safety stock
    const targetBufferStock = Math.max(reorderLevel * 2, (monthlyVelocity + safetyStock));
    const rawDeficit = targetBufferStock - currentOnHand;
    const recommendedOrderQty = Math.max(reorderLevel, Math.ceil(rawDeficit > 0 ? rawDeficit : reorderLevel));

    // Urgency level
    let urgency = 'normal';
    if (currentOnHand <= safetyStock || daysOfSupply <= leadTimeDays) {
      urgency = 'critical';
    } else if (currentOnHand <= reorderLevel || daysOfSupply <= (leadTimeDays * 1.5)) {
      urgency = 'high';
    } else if (daysOfSupply <= 30) {
      urgency = 'medium';
    }

    // Check preferred supplier
    let supplier = null;
    const prefSupplierId = item.preferredSupplierId || item.preferredSupplier;
    if (prefSupplierId) {
      supplier = await Supplier.findOne({ _id: prefSupplierId, organizationId });
    }

    // Formulate deterministic executive explanation
    let aiExplanation = '';
    let aiConfidence = 0.90;

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `You are an expert supply chain and inventory planning consultant.
Analyze these demand metrics for SKU "${item.sku}" (${item.name}):
- Current On Hand: ${currentOnHand} ${item.unitOfMeasure}
- Reorder Level: ${reorderLevel} ${item.unitOfMeasure}
- Safety Stock: ${safetyStock} ${item.unitOfMeasure}
- Past ${lookbackDays} Days Total Consumption: ${totalConsumed} ${item.unitOfMeasure}
- Daily Run Rate: ${dailyRunRate.toFixed(2)} units/day
- Estimated Days of Supply: ${daysOfSupply} days
- Supplier Lead Time: ${leadTimeDays} days
- Suggested Reorder Date: ${suggestedReorderDate.toISOString().split('T')[0]}
- Recommended Reorder Qty: ${recommendedOrderQty} ${item.unitOfMeasure}
- Urgency: ${urgency}

Provide a concise, professional 2-3 sentence executive recommendation explaining the stock velocity, risk of stockout, and procurement advice.
Do not use markdown headers. Output plain text.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (text) {
            aiExplanation = text;
            aiConfidence = 0.95;
          }
        }
      } catch (err) {
        // Fallback to deterministic narrative
      }
    }

    if (!aiExplanation) {
      if (urgency === 'critical') {
        aiExplanation = `CRITICAL ALERT: Current stock (${currentOnHand} ${item.unitOfMeasure}) provides only ${daysOfSupply} days of buffer against a ${leadTimeDays}-day supplier lead time. Stockout is imminent without an immediate expedited reorder of ${recommendedOrderQty} ${item.unitOfMeasure}.`;
      } else if (urgency === 'high') {
        aiExplanation = `Stock is approaching reorder threshold with an average run-rate of ${dailyRunRate.toFixed(1)} units/day. Initiating procurement of ${recommendedOrderQty} ${item.unitOfMeasure} on or before ${suggestedReorderDate.toLocaleDateString()} will prevent buffer breach.`;
      } else {
        aiExplanation = `Inventory levels are currently healthy with ${daysOfSupply} days of supply on hand. Maintain standard replenishment cycle and schedule next purchase order review for ${suggestedReorderDate.toLocaleDateString()}.`;
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log to AiRun
    if (organizationId && userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'inventory_forecast',
          promptVersion: 'v1.0',
          model: DEFAULT_MODEL,
          latencyMs,
          resultSummary: `Forecast SKU: ${item.sku} (${urgency}) -> Reorder ${recommendedOrderQty} ${item.unitOfMeasure}`,
        });
      } catch (logErr) {
        // Non-blocking
      }
    }

    return {
      item: {
        _id: item._id,
        sku: item.sku,
        name: item.name,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        safetyStock: item.safetyStock,
        unitOfMeasure: item.unitOfMeasure,
        standardCost: item.standardCost || 0,
        preferredSupplier: supplier ? { _id: supplier._id, name: supplier.name, leadTimeDays: supplier.leadTimeDays } : null,
      },
      metrics: {
        lookbackDays,
        totalConsumed,
        dailyRunRate: roundMoney(dailyRunRate),
        weeklyVelocity: roundMoney(weeklyVelocity),
        monthlyVelocity: roundMoney(monthlyVelocity),
        daysOfSupply,
        suggestedReorderDate,
        stockoutProjectedDate,
        recommendedOrderQty,
        urgency,
        estimatedCost: roundMoney(recommendedOrderQty * (item.standardCost || 0)),
      },
      aiAnalysis: {
        explanation: aiExplanation,
        confidence: aiConfidence,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * 1-Click Draft Purchase Requisition Creation from AI Forecast
   */
  static async createRequisitionFromForecast(organizationId, user, { itemId, quantity, departmentId, notes }) {
    const item = await Item.findOne({ _id: itemId, organizationId });
    if (!item) {
      throw new Error('Item not found.');
    }

    const orderQty = quantity || item.reorderLevel || 10;
    const estUnitPrice = item.standardCost || 0;
    const estimatedTotal = roundMoney(orderQty * estUnitPrice);

    const prNumber = await counterService.generatePrNumber(organizationId);

    const requisition = await PurchaseRequisition.create({
      organizationId,
      requisitionNumber: prNumber,
      requestedBy: user._id,
      departmentId: departmentId || user.departmentId || null,
      title: `AI Smart Reorder: ${item.name} (${item.sku})`,
      purpose: notes || `Automated reorder recommendation generated by Nebula Inventory AI Copilot. Current stock: ${item.currentStock} ${item.unitOfMeasure}.`,
      priority: item.currentStock <= (item.safetyStock || 5) ? 'urgent' : 'normal',
      currency: 'USD',
      items: [
        {
          itemId: item._id,
          description: `${item.name} [SKU: ${item.sku}]`,
          quantity: orderQty,
          uom: item.unitOfMeasure || 'PCS',
          estimatedUnitPrice: estUnitPrice,
          estimatedTotal: estimatedTotal,
          notes: 'AI Smart Reorder item line',
        },
      ],
      totalEstimatedAmount: estimatedTotal,
      status: 'draft',
      approvalTiers: [],
    });

    return requisition;
  }
}

module.exports = InventoryForecastService;
