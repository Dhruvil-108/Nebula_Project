import { apiClient } from '../lib/apiClient';

// ─────────────────────────────────────────────────────────
// Types — Admin Panel
// ─────────────────────────────────────────────────────────
export interface AdminAuditEntry {
  id: string;
  action: string;
  entity: string;
  actorName: string;
  actorRole: string | null;
  ip: string | null;
  createdAt: string;
}

export interface AdminOverview {
  viewerRole: string;
  organization: {
    id: string;
    name: string;
    industry: string | null;
    companySize: string | null;
    timezone: string;
    shiftStartTime: string;
    primaryFocus: string[];
    createdAt: string;
  };
  accounts: {
    total: number;
    active: number;
    invited: number;
    disabled: number;
    roleDistribution: Record<string, number>;
  };
  today: {
    checkedIn: number;
    onBreak: number;
    checkedOut: 0 | number;
    activeToday: number;
    attendanceRate: number;
  };
  pendingLeaveRequests: number;
  activeHeadcount: number;
  attendanceTrend: Array<{ date: string; label: string; present: number; rate: number }>;
  accountGrowth: Array<{ label: string; count: number }>;
  leaveStats: { pending: number; approved: number; rejected: number };
  // Super Admin exclusive
  superAdmin?: {
    configuredPermissionRows: number;
    pendingInvites: number;
    auditEventsLast30d: number;
    loginTrend: Array<{ date: string; label: string; count: number }>;
    actionBreakdown: Array<{ action: string; count: number }>;
    recentAudit: AdminAuditEntry[];
  };
}

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'invited' | 'disabled';
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface AdminAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  actorName: string;
  actorRole: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────
// API
// ─────────────────────────────────────────────────────────
export const adminApi = {
  getOverview: async () => {
    const res = await apiClient.get<AdminOverview>('/admin/overview');
    return res.data;
  },

  getUsers: async (
    params: { role?: string; status?: string; search?: string } = {}
  ) => {
    const res = await apiClient.get<{ users: AdminUser[] }>('/admin/users', { params });
    return res.data.users;
  },

  updateUserStatus: async (id: string, status: 'active' | 'disabled') => {
    const res = await apiClient.patch<{ message: string; user: AdminUser }>(
      `/admin/users/${id}/status`,
      { status }
    );
    return res.data;
  },

  updateUserRole: async (id: string, role: string) => {
    const res = await apiClient.patch<{ message: string; user: AdminUser }>(
      `/admin/users/${id}/role`,
      { role }
    );
    return res.data;
  },

  getAuditLogs: async (
    params: { page?: number; limit?: number; action?: string } = {}
  ) => {
    const res = await apiClient.get<{
      logs: AdminAuditLog[];
      total: number;
      page: number;
      pages: number;
    }>('/admin/audit-logs', { params });
    return res.data;
  },
};

// Shared with the UI for the role editor
export const ADMIN_ASSIGNABLE_ROLES = [
  'admin',
  'manager',
  'hr',
  'recruiter',
  'sales',
  'finance',
  'inventory_manager',
  'employee',
  'intern',
] as const;
