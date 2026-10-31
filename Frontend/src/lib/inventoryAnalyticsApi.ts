import { apiClient } from './apiClient';
import type {
  AnalyticsOverviewResponse,
  ValuationReportResponse,
  AbcAnalysisResponse,
  XyzAnalysisResponse,
  AbcXyzMatrixResponse,
  StockAgingReportResponse,
  TurnoverReportResponse,
  OtifReportResponse,
} from '../types/inventoryAnalytics';

// ── 1. Unified Overview KPI Snapshot ──
export async function getAnalyticsOverview(): Promise<AnalyticsOverviewResponse> {
  const { data } = await apiClient.get<AnalyticsOverviewResponse>('/inventory/analytics/overview');
  return data;
}

// ── 2. Stock Valuation Report ──
export async function getStockValuationReport(): Promise<ValuationReportResponse> {
  const { data } = await apiClient.get<{ success: boolean } & ValuationReportResponse>(
    '/inventory/analytics/valuation'
  );
  return data;
}

// ── 3. ABC / XYZ & 9-Cell Matrix ──
export async function getAbcXyzAnalysis(lookbackDays: number = 180): Promise<{
  abc: AbcAnalysisResponse;
  xyz: XyzAnalysisResponse;
  matrix: AbcXyzMatrixResponse;
}> {
  const { data } = await apiClient.get<{
    success: boolean;
    abc: AbcAnalysisResponse;
    xyz: XyzAnalysisResponse;
    matrix: AbcXyzMatrixResponse;
  }>(`/inventory/analytics/abc-xyz?lookbackDays=${lookbackDays}`);
  return {
    abc: data.abc,
    xyz: data.xyz,
    matrix: data.matrix,
  };
}

// ── 4. Stock Aging & Dead Stock ──
export async function getStockAgingReport(): Promise<StockAgingReportResponse> {
  const { data } = await apiClient.get<{ success: boolean } & StockAgingReportResponse>(
    '/inventory/analytics/aging'
  );
  return data;
}

// ── 5. Inventory Turnover & DSI ──
export async function getInventoryTurnover(days: number = 365): Promise<TurnoverReportResponse> {
  const { data } = await apiClient.get<{ success: boolean } & TurnoverReportResponse>(
    `/inventory/analytics/turnover?days=${days}`
  );
  return data;
}

// ── 6. OTIF & Fulfillment Fill-Rate ──
export async function getFulfillmentOtif(): Promise<OtifReportResponse> {
  const { data } = await apiClient.get<{ success: boolean } & OtifReportResponse>(
    '/inventory/analytics/fulfillment'
  );
  return data;
}

// ── 7. CSV Export Trigger ──
export async function exportAnalyticsCsv(type: 'valuation' | 'abc' | 'aging'): Promise<void> {
  const response = await apiClient.get<string>(`/inventory/analytics/export?type=${type}`, {
    responseType: 'blob' as any,
  });

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `nebula-inventory-${type}-report-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
