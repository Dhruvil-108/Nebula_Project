export interface DemandForecastItem {
  _id: string;
  sku: string;
  name: string;
  currentStock: number;
  reorderLevel: number;
  safetyStock: number;
  unitOfMeasure: string;
  standardCost: number;
  preferredSupplier?: {
    _id: string;
    name: string;
    leadTimeDays: number;
  } | null;
}

export interface DemandForecastMetrics {
  lookbackDays: number;
  totalConsumed: number;
  dailyRunRate: number;
  weeklyVelocity: number;
  monthlyVelocity: number;
  daysOfSupply: number;
  suggestedReorderDate: string;
  stockoutProjectedDate: string | null;
  recommendedOrderQty: number;
  urgency: 'normal' | 'medium' | 'high' | 'critical';
  estimatedCost: number;
}

export interface DemandForecastResponse {
  item: DemandForecastItem;
  metrics: DemandForecastMetrics;
  aiAnalysis: {
    explanation: string;
    confidence: number;
    generatedAt: string;
  };
}

export interface OcrLineItem {
  sku?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OcrDiscrepancy {
  lineIndex: number;
  type: 'unmatched_item' | 'quantity_exceeded' | 'price_variance';
  severity: 'warning' | 'critical';
  message: string;
  poQuantity?: number;
  extractedQuantity?: number;
  poPrice?: number;
  extractedPrice?: number;
  variancePct?: number;
}

export interface DocumentOcrResult {
  success: boolean;
  source: string;
  latencyMs: number;
  data: {
    documentType: string;
    documentNumber: string;
    documentDate: string;
    supplierName: string;
    currency: string;
    lineItems: OcrLineItem[];
    taxAmount: number;
    grandTotal: number;
    confidence: number;
  };
  poMatch: {
    matched: boolean;
    poNumber: string | null;
    discrepancies: OcrDiscrepancy[];
    matchScore: number;
  };
  prefillGrnPayload: {
    purchaseOrderId: string | null;
    supplierId: string | null;
    supplierChallanNumber: string;
    challanDate: string;
    lines: Array<{
      description: string;
      sku?: string;
      receivedQty: number;
      acceptedQty: number;
      rejectedQty: number;
      unitPrice: number;
    }>;
  };
}

export interface InventoryAnomaly {
  _id: string;
  anomalyType:
    | 'shrinkage_spike'
    | 'price_spike'
    | 'duplicate_receipt'
    | 'dead_stock'
    | 'stockout_risk'
    | 'unusual_adjustment';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  itemId?: {
    _id: string;
    sku: string;
    name: string;
    currentStock: number;
    standardCost: number;
  } | null;
  warehouseId?: {
    _id: string;
    name: string;
    code: string;
  } | null;
  supplierId?: {
    _id: string;
    name: string;
    supplierCode: string;
  } | null;
  metrics?: Record<string, any>;
  recommendedAction?: string;
  status: 'open' | 'acknowledged' | 'dismissed' | 'resolved';
  userFeedback: 'none' | 'confirmed_issue' | 'false_positive';
  feedbackNote?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface CopilotQueryResponse {
  answer: string;
  data: any;
  category: string;
  provider?: 'gemini' | 'rule_based_assistant';
  providerError?: string | null;
  suggestedFollowUps: string[];
  timestamp: string;
}

export interface SupplierEvaluation {
  supplier: {
    _id: string;
    name: string;
    supplierCode: string;
    leadTimeDays: number;
    rating?: { score: number; totalOrders: number };
  };
  evaluation: {
    compositeScore: number;
    tier: string;
    tierBadge: 'preferred' | 'reliable' | 'warning' | 'critical';
    breakdown: {
      onTimeDelivery: { score: number; weight: string; rate: string };
      qualityAcceptance: { score: number; weight: string; rate: string };
      priceStability: { score: number; weight: string; factor: string };
      consistency: { score: number; weight: string };
    };
    volumeMetrics: {
      totalPurchaseOrders: number;
      totalDeliveries: number;
      totalReceivedQty: number;
      totalAcceptedQty: number;
      totalRejectedQty: number;
    };
    aiSummary: string;
    evaluatedAt: string;
  };
}
