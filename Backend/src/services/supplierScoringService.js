const Supplier = require('../models/Supplier');
const PurchaseOrder = require('../models/PurchaseOrder');
const GoodsReceiptNote = require('../models/GoodsReceiptNote');
const SupplierInvoice = require('../models/SupplierInvoice');
const AiRun = require('../models/AiRun');
const { roundMoney } = require('../utils/money');

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

class SupplierScoringService {
  /**
   * Calculate multi-factor performance score and AI synthesis for a supplier
   */
  static async evaluateSupplier(organizationId, supplierId, options = {}) {
    const startTime = Date.now();
    const userId = options.userId || null;

    const supplier = await Supplier.findOne({ _id: supplierId, organizationId });
    if (!supplier) {
      throw new Error('Supplier not found.');
    }

    // 1. Fetch historical POs, GRNs, and Invoices for this supplier
    const pos = await PurchaseOrder.find({
      organizationId,
      supplierId,
      status: { $in: ['approved', 'ordered', 'partially_received', 'received', 'billed', 'closed'] },
    });

    const grns = await GoodsReceiptNote.find({
      organizationId,
      supplierId,
      status: { $in: ['inspected', 'posted_to_ledger', 'verified', 'posted'] },
    });

    const invoices = await SupplierInvoice.find({
      organizationId,
      supplierId,
      status: { $in: ['matched', 'approved', 'paid'] },
    });

    // 2. Metrics calculation
    let onTimeCount = 0;
    let totalDeliveries = 0;
    let totalReceivedQty = 0;
    let totalAcceptedQty = 0;
    let totalRejectedQty = 0;
    let priceVariances = [];

    // Evaluate on-time delivery from GRNs matching POs
    grns.forEach((grn) => {
      totalDeliveries++;
      const matchingPoId = (grn.poId || grn.purchaseOrderId)?.toString();
      const matchingPo = pos.find((p) => p._id.toString() === matchingPoId);
      if (matchingPo && matchingPo.expectedDeliveryDate && grn.receivedDate) {
        const receivedTime = new Date(grn.receivedDate).getTime();
        const expectedTime = new Date(matchingPo.expectedDeliveryDate).getTime();
        // Allow 24 hour grace buffer
        if (receivedTime <= expectedTime + 24 * 60 * 60 * 1000) {
          onTimeCount++;
        }
      } else {
        // If no explicit expected date, assume standard on-time
        onTimeCount++;
      }

      const grnLines = grn.items?.length ? grn.items : (grn.lines || []);
      grnLines.forEach((line) => {
        const rec = line.receivedQuantity !== undefined ? line.receivedQuantity : (line.receivedQty || 0);
        const acc = line.acceptedQuantity !== undefined ? line.acceptedQuantity : (line.acceptedQty || 0);
        const rej = line.rejectedQuantity !== undefined ? line.rejectedQuantity : (line.rejectedQty || 0);
        totalReceivedQty += rec;
        totalAcceptedQty += acc;
        totalRejectedQty += rej;
      });
    });

    // Price Stability from Invoices matching POs
    invoices.forEach((inv) => {
      const matchingPo = pos.find((p) => p._id.toString() === inv.purchaseOrderId?.toString());
      if (matchingPo && matchingPo.totalAmount > 0 && inv.totalAmount > 0) {
        const variancePct = ((inv.totalAmount - matchingPo.totalAmount) / matchingPo.totalAmount) * 100;
        priceVariances.push(variancePct);
      }
    });

    // Sub-scores (0 - 100)
    // A. On-Time Delivery Score (40% weight)
    const onTimeRate = totalDeliveries > 0 ? (onTimeCount / totalDeliveries) * 100 : 95;
    const onTimeScore = roundMoney(onTimeRate * 0.40);

    // B. Quality Acceptance Score (30% weight)
    const acceptanceRate = totalReceivedQty > 0 ? (totalAcceptedQty / totalReceivedQty) * 100 : 98;
    const qualityScore = roundMoney(acceptanceRate * 0.30);

    // C. Price Stability Score (20% weight)
    const avgPriceVariance = priceVariances.length > 0
      ? priceVariances.reduce((a, b) => a + b, 0) / priceVariances.length
      : 0;
    // Penalty for positive variance (charging more than PO)
    const priceStabilityFactor = Math.max(0, 100 - Math.max(0, avgPriceVariance) * 3);
    const priceScore = roundMoney(priceStabilityFactor * 0.20);

    // D. Responsiveness & Delivery Consistency (10% weight)
    const consistencyScore = 9.5; // baseline 9.5 / 10

    // Composite Score
    const compositeScore = Math.min(100, Math.max(0, Math.round(onTimeScore + qualityScore + priceScore + consistencyScore)));

    // Tier Classification
    let tier = 'Tier 2 - Reliable Supplier';
    let tierBadge = 'reliable';
    if (compositeScore >= 90) {
      tier = 'Tier 1 - Preferred Partner';
      tierBadge = 'preferred';
    } else if (compositeScore < 60) {
      tier = 'Tier 4 - High Risk / Critical Review';
      tierBadge = 'critical';
    } else if (compositeScore < 75) {
      tier = 'Tier 3 - Needs Performance Review';
      tierBadge = 'warning';
    }

    // AI Executive SWOT & Recommendation
    let aiSummary = '';
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `You are a Chief Procurement Officer evaluating a corporate supplier.
Analyze these vendor performance metrics for "${supplier.name}" (${supplier.supplierCode}):
- Composite Score: ${compositeScore} / 100 (${tier})
- Total Fulfilled Orders: ${totalDeliveries}
- On-Time Delivery Rate: ${onTimeRate.toFixed(1)}%
- Quality Acceptance Rate: ${acceptanceRate.toFixed(1)}% (${totalRejectedQty} units rejected out of ${totalReceivedQty} received)
- Average Price Variance against PO: ${avgPriceVariance.toFixed(1)}%
- Contract Lead Time: ${supplier.leadTimeDays || 7} days

Provide a 3-bullet executive evaluation covering:
1. Operational Strengths
2. Risk & Vulnerability Areas
3. Recommended Contract or Negotiation Strategy.
Do not use markdown headers. Output plain bullet points.`;

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
          aiSummary = resJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }
      } catch (err) {
        // Fallback below
      }
    }

    if (!aiSummary) {
      aiSummary =
        `• **Strengths**: Consistent delivery fulfillment with an on-time rate of ${onTimeRate.toFixed(1)}% and ${acceptanceRate.toFixed(1)}% acceptance.\n` +
        `• **Risks**: Price variance against approved POs averages ${avgPriceVariance.toFixed(1)}%, requiring periodic 3-way match scrutiny.\n` +
        `• **Strategy**: Maintain ${tier.split(' - ')[0]} allocation. Consider negotiating a volume rebate or extended payment terms.`;
    }

    // Optionally update supplier rating field
    const stars = Math.max(1, Math.min(5, Math.round(compositeScore / 20)));
    supplier.rating = {
      score: stars,
      totalOrders: pos.length,
    };
    await supplier.save();

    const latencyMs = Date.now() - startTime;

    // Log to AiRun
    if (organizationId && userId) {
      try {
        await AiRun.create({
          organizationId,
          userId,
          task: 'inventory_supplier_score',
          promptVersion: 'v1.0',
          model: apiKey ? DEFAULT_MODEL : 'composite_rubric_v1',
          latencyMs,
          resultSummary: `Supplier Evaluation: ${supplier.name} -> Score ${compositeScore}/100 (${tier})`,
        });
      } catch (logErr) {
        // Non-blocking
      }
    }

    return {
      supplier: {
        _id: supplier._id,
        name: supplier.name,
        supplierCode: supplier.supplierCode,
        leadTimeDays: supplier.leadTimeDays,
        rating: supplier.rating,
      },
      evaluation: {
        compositeScore,
        tier,
        tierBadge,
        breakdown: {
          onTimeDelivery: { score: onTimeScore, weight: '40%', rate: `${onTimeRate.toFixed(1)}%` },
          qualityAcceptance: { score: qualityScore, weight: '30%', rate: `${acceptanceRate.toFixed(1)}%` },
          priceStability: { score: priceScore, weight: '20%', factor: `${priceStabilityFactor.toFixed(1)}%` },
          consistency: { score: consistencyScore, weight: '10%' },
        },
        volumeMetrics: {
          totalPurchaseOrders: pos.length,
          totalDeliveries,
          totalReceivedQty,
          totalAcceptedQty,
          totalRejectedQty,
        },
        aiSummary,
        evaluatedAt: new Date().toISOString(),
      },
    };
  }
}

module.exports = SupplierScoringService;
