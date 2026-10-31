import { apiClient } from './apiClient';
import type {
  EquipmentKit,
  EmployeeAssetAssignment,
  AccountingEvent,
  InventoryNotification,
  WebhookSubscription,
} from '../types/inventoryIntegrations';

// ── Equipment Kits ──────────────────────────────────────────────────────────

export async function getEquipmentKits() {
  const { data } = await apiClient.get<{ success: boolean; count: number; kits: EquipmentKit[] }>(
    '/inventory/integrations/kits'
  );
  return data.kits || [];
}

export async function createEquipmentKit(payload: Partial<EquipmentKit>) {
  const { data } = await apiClient.post<{ success: boolean; kit: EquipmentKit }>(
    '/inventory/integrations/kits',
    payload
  );
  return data.kit;
}

// ── Asset Assignments (HRMS Bridge) ─────────────────────────────────────────

export async function getAssetAssignments(params: { employeeId?: string; status?: string; page?: number; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.employeeId) query.append('employeeId', params.employeeId);
  if (params.status) query.append('status', params.status);
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));

  const { data } = await apiClient.get<{
    success: boolean;
    assignments: EmployeeAssetAssignment[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }>(`/inventory/integrations/assets?${query.toString()}`);

  return data;
}

export async function issueAssets(assignmentId: string, payload: { warehouseId: string; allocations: any[] }) {
  const { data } = await apiClient.post<{ success: boolean; message: string; assignment: EmployeeAssetAssignment }>(
    `/inventory/integrations/assets/${assignmentId}/issue`,
    payload
  );
  return data;
}

export async function initiateExitChecklist(payload: { employeeId: string; exitDate?: string; remarks?: string }) {
  const { data } = await apiClient.post<{ success: boolean; count: number; message?: string }>(
    '/inventory/integrations/assets/exit-checklist',
    payload
  );
  return data;
}

export async function processExitReturn(assignmentId: string, payload: { warehouseId?: string; returnsList: any[] }) {
  const { data } = await apiClient.post<{ success: boolean; message: string; assignment: EmployeeAssetAssignment }>(
    `/inventory/integrations/assets/${assignmentId}/process-return`,
    payload
  );
  return data;
}

// ── Accounting Events ───────────────────────────────────────────────────────

export async function getAccountingEvents(eventType?: string) {
  const query = eventType ? `?eventType=${eventType}` : '';
  const { data } = await apiClient.get<{ success: boolean; count: number; events: AccountingEvent[] }>(
    `/inventory/integrations/accounting-events${query}`
  );
  return data.events || [];
}

// ── Notifications & Webhooks ────────────────────────────────────────────────

export async function getInventoryNotifications() {
  const { data } = await apiClient.get<{ success: boolean; count: number; notifications: InventoryNotification[] }>(
    '/inventory/integrations/notifications'
  );
  return data.notifications || [];
}

export async function scanExpiringBatches(days = 30) {
  const { data } = await apiClient.get<{ success: boolean; count: number; alerts: any[] }>(
    `/inventory/integrations/batches/expiring?days=${days}`
  );
  return data.alerts || [];
}

export async function registerWebhook(payload: { url: string; secret?: string; events?: string[] }) {
  const { data } = await apiClient.post<{ success: boolean; subscription: WebhookSubscription }>(
    '/inventory/integrations/webhooks',
    payload
  );
  return data.subscription;
}

export async function getWebhooks() {
  const { data } = await apiClient.get<{ success: boolean; count: number; webhooks: WebhookSubscription[] }>(
    '/inventory/integrations/webhooks'
  );
  return data.webhooks || [];
}
