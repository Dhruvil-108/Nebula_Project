const Item = require('../models/Item');
const Warehouse = require('../models/Warehouse');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');
const StockBatch = require('../models/StockBatch');
const StockLedger = require('../models/StockLedger');
const PurchaseOrder = require('../models/PurchaseOrder');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const GEMINI_TIMEOUT_MS = 15000;

async function getStockSnapshot(organizationId, items) {
  const ledgerRows = await StockLedger.find({
    organizationId,
    itemId: { $in: items.map((item) => item._id) },
  }).select('itemId quantity').lean();
  const ledgerTotals = new Map();

  ledgerRows.forEach((row) => {
    const itemId = String(row.itemId);
    ledgerTotals.set(itemId, (ledgerTotals.get(itemId) || 0) + (row.quantity || 0));
  });

  return items.map((item) => {
    const itemId = String(item._id);
    return {
      item,
      currentStock: Math.max(0, ledgerTotals.has(itemId) ? ledgerTotals.get(itemId) : (item.currentStock || 0)),
      reorderLevel: item.reorderLevel > 0 ? item.reorderLevel : (item.reorderPoint || 0),
      unit: item.unitOfMeasure || item.baseUom || 'units',
    };
  });
}

class InventoryCopilotService {
  /**
   * Process a natural language query with strict tenant scoping and whitelisted queries
   */
  static async queryCopilot(organizationId, user, prompt) {
    const startTime = Date.now();
    const query = (prompt || '').toLowerCase().trim();
    const userId = user?.id || user?._id;

    let answer = '';
    let data = null;
    let category = 'general';
    let providerError = null;
    let suggestedFollowUps = [
      'Items below reorder level',
      'Total inventory valuation',
      'Stock distribution by warehouse',
      'Batches expiring in next 60 days',
      'Top suppliers by purchase spend',
    ];

    // ── Intent 1: Low Stock / Reorder Needed ──
    if (query.includes('reorder') || query.includes('low stock') || query.includes('shortage') || query.includes('stockout')) {
      category = 'low_stock';
      const itemRecords = await Item.find({
        organizationId,
        active: { $ne: false },
      }).select('sku name currentStock reorderLevel reorderPoint safetyStock unitOfMeasure baseUom standardCost').lean();
      const items = (await getStockSnapshot(organizationId, itemRecords))
        .filter(({ currentStock, reorderLevel }) => currentStock <= reorderLevel)
        .slice(0, 15);

      if (items.length === 0) {
        answer = 'All inventory items are currently stocked above their reorder thresholds. No stockout risks detected.';
      } else {
        answer = `Found **${items.length} items** at or below their reorder points:\n\n` +
          items
            .map(
              ({ item: it, currentStock, reorderLevel, unit }) =>
                `• **${it.name}** (\`${it.sku}\`): **${currentStock} ${unit}** on hand (Reorder Level: ${reorderLevel}, Safety: ${it.safetyStock})`
            )
            .join('\n');
        data = items.map(({ item, currentStock, reorderLevel, unit }) => ({
          ...item,
          currentStock,
          reorderLevel,
          unitOfMeasure: unit,
        }));
      }
    }
    // ── Intent 2: Total Inventory Valuation ──
    else if (query.includes('valuation') || query.includes('worth') || query.includes('asset value') || query.includes('total value')) {
      category = 'valuation';
      const itemRecords = await Item.find({ organizationId, active: { $ne: false } })
        .select('currentStock standardCost unitOfMeasure baseUom')
        .lean();
      const items = (await getStockSnapshot(organizationId, itemRecords))
        .filter(({ currentStock }) => currentStock > 0);
      let totalValue = 0;
      let totalUnits = 0;

      items.forEach(({ item: it, currentStock }) => {
        const itemVal = currentStock * (it.standardCost || 0);
        totalValue += itemVal;
        totalUnits += currentStock;
      });

      const warehouses = await Warehouse.find({ organizationId, active: { $ne: false } }).select('name code');

      answer = `Enterprise Inventory Valuation Summary:\n\n` +
        `• **Total Inventory Value**: **$${roundMoney(totalValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}**\n` +
        `• **Total Active Stock Units**: **${totalUnits.toLocaleString()} units** across **${items.length} distinct SKUs**\n` +
        `• **Storage Facilities**: Managed across **${warehouses.length} active warehouses**\n\n` +
        `Valuation calculation is based on standard unit cost and append-only ledger balances.`;
      data = { totalValue: roundMoney(totalValue), totalUnits, activeSkuCount: items.length, warehouseCount: warehouses.length };
    }
    // ── Intent 3: Warehouse & Facility Breakdown ──
    else if (query.includes('warehouse') || query.includes('facility') || query.includes('storage') || query.includes('bins')) {
      category = 'warehouses';
      const warehouses = await Warehouse.find({ organizationId, active: { $ne: false } });
      if (warehouses.length === 0) {
        answer = 'No active warehouses configured in this organization.';
      } else {
        answer = `Your organization operates **${warehouses.length} active facilities**:\n\n` +
          warehouses
            .map((w) => `• **${w.name}** (\`${w.code}\`): Located in ${w.address?.city || 'HQ'}, ${w.address?.country || 'USA'} (Zones configured: ${w.zones?.length || 0})`)
            .join('\n');
        data = warehouses;
      }
    }
    // ── Intent 4: Expiring Lots / Batches ──
    else if (query.includes('expir') || query.includes('shelf life') || /\blots?\b/i.test(query) || query.includes('batch')) {
      category = 'batches';
      const sixtyDaysAhead = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const expiringBatches = await StockBatch.find({
        organizationId,
        quantityRemaining: { $gt: 0 },
        expiryDate: { $lte: sixtyDaysAhead },
      }).populate('itemId', 'sku name').limit(10);

      if (expiringBatches.length === 0) {
        answer = 'Good news! No active stock batches are expiring within the next 60 days.';
      } else {
        answer = `Found **${expiringBatches.length} batches** expiring within 60 days:\n\n` +
          expiringBatches
            .map(
              (b) =>
                `• **${b.itemId?.name || 'Item'}** (Batch: \`${b.batchNumber}\`): **${b.quantityRemaining} units** remaining — Expires on **${new Date(b.expiryDate).toLocaleDateString()}**`
            )
            .join('\n');
        data = expiringBatches;
      }
    }
    // ── Intent 5: Suppliers & Purchase Orders ──
    else if (query.includes('supplier') || query.includes('vendor') || query.includes('spend') || query.includes('po')) {
      category = 'suppliers';
      const pos = await PurchaseOrder.find({
        organizationId,
        status: { $nin: ['cancelled'] },
      }).populate('supplierId', 'name supplierCode');

      const supplierSpend = {};
      pos.forEach((po) => {
        const sName = po.supplierId?.name || 'General Supplier';
        supplierSpend[sName] = (supplierSpend[sName] || 0) + (po.totalAmount || 0);
      });

      const topSuppliers = Object.entries(supplierSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, spend]) => ({ name, spend: roundMoney(spend) }));

      if (topSuppliers.length === 0) {
        answer = 'No purchase order spend recorded yet.';
      } else {
        answer = `Top **${topSuppliers.length} Suppliers** by Procurement Spend:\n\n` +
          topSuppliers.map((s, i) => `${i + 1}. **${s.name}**: $${s.spend.toLocaleString('en-US', { minimumFractionDigits: 2 })}`).join('\n');
        data = topSuppliers;
      }
    }
    // ── Intent 6: General Overview / Default Assistant ──
    else {
      const itemCount = await Item.countDocuments({ organizationId, active: { $ne: false } });
      const warehouseCount = await Warehouse.countDocuments({ organizationId, active: { $ne: false } });
      const openPoCount = await PurchaseOrder.countDocuments({ organizationId, status: { $in: ['issued', 'partially_received'] } });
      const itemRecords = await Item.find({
        organizationId,
        active: { $ne: false },
      }).select('currentStock reorderLevel reorderPoint unitOfMeasure baseUom').lean();
      const stockSnapshot = await getStockSnapshot(organizationId, itemRecords);
      const lowStockCount = stockSnapshot.filter(({ currentStock, reorderLevel }) => currentStock <= reorderLevel).length;

      answer =
        `Hello! I am your **Nebula Inventory AI Copilot**.\n\n` +
        `Current supply chain posture:\n` +
        `• **Catalog SKUs**: ${itemCount} items managed\n` +
        `• **Active Facilities**: ${warehouseCount} warehouses\n` +
        `• **Open Purchase Orders**: ${openPoCount} awaiting delivery\n` +
        `• **Items Needing Reorder**: ${lowStockCount} items at or below threshold\n\n` +
        `Ask me anything about your stock balances, valuations, suppliers, reorder alerts, or batch expirations!`;
      data = { itemCount, warehouseCount, openPoCount, lowStockCount };
    }

    // Optional Gemini natural tone enrichment if API key configured
    const apiKey = process.env.GEMINI_API_KEY;
    let provider = 'rule_based_assistant';
    if (apiKey && prompt.length > 5) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
      try {
        const synthesisPrompt = `You are the executive AI copilot for Nebula Hub Enterprise Inventory ERP.
A user asked: "${prompt}"
The underlying database returned this structured verified data:
${answer}

Synthesize a friendly, crisp, professional executive answer. Preserve all numerical figures and bullet points accurately.
Do not invent any data not present above. Output markdown format.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: synthesisPrompt }] }],
            }),
            signal: controller.signal,
          }
        );

        if (response.ok) {
          const resJson = await response.json();
          const geminiAnswer = resJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (geminiAnswer) {
            answer = geminiAnswer;
            provider = 'gemini';
          }
        } else {
          providerError = `Gemini enrichment returned HTTP ${response.status}`;
          console.warn(`[inventoryCopilot] ${providerError}`);
        }
      } catch (geminiErr) {
        providerError =
          geminiErr.name === 'AbortError'
            ? `Gemini enrichment timed out after ${GEMINI_TIMEOUT_MS}ms`
            : 'Gemini enrichment request failed';
        console.warn(
          `[inventoryCopilot] ${providerError}: ${geminiErr.message}`
        );
      } finally {
        clearTimeout(timeout);
      }
    }

    const latencyMs = Date.now() - startTime;

    // Log to AiRun
    if (organizationId && userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'inventory_copilot',
          promptVersion: 'v1.0',
          model: apiKey ? DEFAULT_MODEL : 'rule_based_assistant',
          latencyMs,
          resultSummary: `Copilot query: "${prompt.slice(0, 50)}" -> [${category}] (${latencyMs}ms)`,
        });
      } catch (logErr) {
        // Non-blocking
      }
    }

    return {
      answer,
      data,
      category,
      provider,
      providerError,
      suggestedFollowUps,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = InventoryCopilotService;
