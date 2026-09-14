import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types/user';

/**
 * Row shape returned by GET /api/v1/permissions (super-admin matrix endpoint).
 * Kept local to avoid coupling to the permissions admin types.
 */
interface PermissionRowDto {
  role: string;
  module: string;
  enabled: boolean;
  actions: string[];
}

/**
 * Default module grants mirrored from the backend permissionController
 * getDefaultActions — used when no explicit row exists for (role, module).
 */
const hasDefaultAccess = (role: Role, module: string): boolean => {
  if (role === 'super_admin' || role === 'admin') return true;
  if (role === 'manager') return ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics'].includes(module);
  if (role === 'hr') return module === 'hrms' || module === 'recruitment';
  if (role === 'recruiter') return module === 'recruitment';
  if (role === 'sales') return module === 'crm';
  if (role === 'finance') return module === 'expenses';
  if (role === 'inventory_manager') return module === 'inventory';
  if (role === 'employee' || role === 'intern') return false;
  return false;
};

/**
 * Returns whether the current user's role has the `crm` module enabled.
 *
 * - super_admin: always true (bypass).
 * - Explicit Permission row: uses `enabled` from the stored matrix.
 * - No stored row: falls back to backend default grants.
 *
 * The matrix endpoint is super_admin-gated, so non-super-admins query it
 * opportunistically — failures leave defaults in charge, which mirror the
 * backend enforcement anyway.
 */
export const useCrmModuleAccess = (): { hasModuleAccess: boolean; isLoading: boolean } => {
  const { user } = useAuth();
  const role = user?.role;

  const { data, isLoading } = useQuery<PermissionRowDto[]>({
    queryKey: ['crmModuleAccess', role],
    queryFn: async () => {
      const res = await apiClient.get<{ matrix: PermissionRowDto[] }>('/permissions');
      return res.data.matrix;
    },
    enabled: !!role && role !== 'super_admin',
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  if (!role) return { hasModuleAccess: false, isLoading };

  // super_admin bypasses all module checks
  if (role === 'super_admin') {
    return { hasModuleAccess: true, isLoading: false };
  }

  const row = data?.find((r) => r.role === role && r.module === 'crm');

  if (row) {
    return { hasModuleAccess: Boolean(row.enabled), isLoading };
  }

  return { hasModuleAccess: hasDefaultAccess(role, 'crm'), isLoading };
};
