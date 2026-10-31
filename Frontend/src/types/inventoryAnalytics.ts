export interface AnalyticsKpis {
  totalValuation: number;
  totalStockUnits: number;
  totalActiveSkus: number;
  turnoverRatio: number;
  daysSalesOfInventory: number;
  efficiencyRating: string;
  totalStagnantCapital: number;
  otifRate: number;
  onTimeRate: number;
  inFullRate: number;
}

export interface WarehouseValuationBreakdown {
  _id: string;
  name: string;
  code: string;
  units: number;
  valuation: number;
  skuCount: number;
  percentage: number;
}

export interface CategoryValuationBreakdown {
  _id: string;
  name: string;
  code: string;
  units: number;
  valuation: number;
  skuCount: number;
  percentage: number;
}

export interface ValuationSummary {
  totalValuation: number;
  totalStockUnits: number;
  totalActiveSkus: number;
  fifoValuation: number;
  wacValuation: number;
  warehouseCount: number;
  categoryCount: number;
}

export interface ValuationReportResponse {
  summary: ValuationSummary;
  warehouseBreakdown: WarehouseValuationBreakdown[];
  categoryBreakdown: CategoryValuationBreakdown[];
}

export interface AbcItem {
  _id: string;
  sku: string;
  name: string;
  standardCost: number;
  baseUom: string;
  consumedUnits: number;
  consumptionValue: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
  abcClass: 'A' | 'B' | 'C';
}

export interface AbcClassSummaryItem {
  count: number;
  value: number;
  percentage: number;
}

export interface AbcAnalysisResponse {
  totalConsumptionValue: number;
  totalConsumedUnits: number;
  items: AbcItem[];
  classSummary: {
    A: AbcClassSummaryItem;
    B: AbcClassSummaryItem;
    C: AbcClassSummaryItem;
  };
}

export interface XyzItem {
  _id: string;
  sku: string;
  name: string;
  standardCost: number;
  baseUom: string;
  totalConsumption: number;
  mean: number;
  stdDev: number;
  cv: number;
  xyzClass: 'X' | 'Y' | 'Z';
  predictability: string;
}

export interface XyzAnalysisResponse {
  totalEvaluatedItems: number;
  items: XyzItem[];
  classSummary: {
    X: { count: number; percentage: number };
    Y: { count: number; percentage: number };
    Z: { count: number; percentage: number };
  };
}

export interface MatrixCellItem {
  _id: string;
  sku: string;
  name: string;
  standardCost: number;
  valuation?: number;
  consumptionValue?: number;
  abcClass: string;
  xyzClass: string;
}

export interface MatrixCell {
  cellKey: string;
  abcClass: string;
  xyzClass: string;
  strategy: string;
  count: number;
  items: MatrixCellItem[];
}

export interface AbcXyzMatrixResponse {
  cells: Record<string, MatrixCell>;
  totalMatrixItems: number;
}

export interface AgingBucketItem {
  _id: string;
  sku: string;
  name: string;
  currentStock: number;
  standardCost: number;
  valuation: number;
  ageDays: number;
  lastReceiptDate: string;
}

export interface AgingBucket {
  label: string;
  units: number;
  valuation: number;
  items: AgingBucketItem[];
}

export interface StockAgingReportResponse {
  buckets: {
    under30: AgingBucket;
    thirtyToSixty: AgingBucket;
    sixtyToNinety: AgingBucket;
    over90: AgingBucket;
  };
  totalStagnantCapital: number;
  totalDeadStockUnits: number;
  totalStockUnits: number;
  totalValuation: number;
}

export interface TurnoverReportResponse {
  periodDays: number;
  totalCogs: number;
  avgInventory: number;
  turnoverRatio: number;
  daysSalesOfInventory: number;
  efficiencyRating: string;
}

export interface OtifReportResponse {
  period: string;
  totalEvaluatedPos: number;
  fullyReceivedPos: number;
  onTimePos: number;
  otifPos: number;
  metrics: {
    otifRate: number;
    onTimeRate: number;
    inFullRate: number;
  };
}

export interface AnalyticsOverviewResponse {
  success: boolean;
  kpis: AnalyticsKpis;
  warehouseBreakdown: WarehouseValuationBreakdown[];
  categoryBreakdown: CategoryValuationBreakdown[];
}
