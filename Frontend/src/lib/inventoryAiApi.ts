import { apiClient } from './apiClient';
import type {
  DemandForecastResponse,
  DocumentOcrResult,
  InventoryAnomaly,
  CopilotQueryResponse,
  SupplierEvaluation,
} from '../types/inventoryAi';

// ── 1. Demand Forecasting ──
export async function getDemandForecast(itemId: string, lookbackDays: number = 60) {
  const { data } = await apiClient.get<{ success: boolean; forecast: DemandForecastResponse }>(
    `/inventory/ai/forecast/${itemId}?lookbackDays=${lookbackDays}`
  );
  return data.forecast;
}

export async function createRequisitionFromForecast(payload: {
  itemId: string;
  quantity?: number;
  departmentId?: string;
  notes?: string;
}) {
  const { data } = await apiClient.post<{
    success: boolean;
    message: string;
    requisition: any;
  }>('/inventory/ai/forecast/create-requisition', payload);
  return data;
}

// ── 2. Document OCR ──
export async function extractDocumentOcr(payload: {
  documentBase64: string;
  mimeType?: string;
  purchaseOrderId?: string;
}) {
  const { data } = await apiClient.post<DocumentOcrResult>(
    '/inventory/ai/ocr/extract',
    payload
  );
  return data;
}

// ── 3. Anomaly Detection ──
export async function scanInventoryAnomalies() {
  const { data } = await apiClient.get<{
    success: boolean;
    scanTime: string;
    totalScannedAnomalies: number;
    anomalies: InventoryAnomaly[];
  }>('/inventory/ai/anomalies/scan');
  return data;
}

export async function getInventoryAnomalies(params?: {
  status?: string;
  severity?: string;
  anomalyType?: string;
}) {
  const { data } = await apiClient.get<{
    success: boolean;
    count: number;
    anomalies: InventoryAnomaly[];
  }>('/inventory/ai/anomalies', { params });
  return data;
}

export async function recordAnomalyFeedback(
  id: string,
  payload: {
    status?: string;
    userFeedback?: string;
    feedbackNote?: string;
  }
) {
  const { data } = await apiClient.patch<{
    success: boolean;
    anomaly: InventoryAnomaly;
  }>(`/inventory/ai/anomalies/${id}/feedback`, payload);
  return data.anomaly;
}

// ── 4. Natural-Language Copilot ──
export async function queryInventoryCopilot(prompt: string) {
  const { data } = await apiClient.post<{ success: boolean } & CopilotQueryResponse>(
    '/inventory/ai/copilot/query',
    { prompt }
  );
  return data;
}

// ── 5. Supplier Scoring ──
export async function getSupplierScore(supplierId: string) {
  const { data } = await apiClient.get<{ success: boolean } & SupplierEvaluation>(
    `/inventory/ai/suppliers/${supplierId}/score`
  );
  return data;
}
