import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types/user';
import type { PermissionAction, PermissionModule } from '../types/permissions';

export interface PermissionRowDto {
  role: string;
  module: string;
  enabled: boolean;
  actions: string[];
}

/**
 * Default module access fallback matching backend permissionController & moduleAccess
 */
export const hasDefaultAccess = (role: Role, module: string): boolean => {
  if (role === 'super_admin' || role === 'admin') return true;
  if (role === 'manager') {
    return ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics'].includes(module);
  }
  if (role === 'hr') return module === 'hrms' || module === 'recruitment';
  if (role === 'recruiter') return module === 'recruitment';
  if (role === 'sales') return module === 'crm' || module === 'analytics';
  if (role === 'finance') return module === 'expenses' || module === 'analytics';
  if (role === 'inventory_manager') return module === 'inventory';
  if (role === 'employee' || role === 'intern') return module === 'hrms' || module === 'expenses';
  return false;
};

/**
 * Default action access fallback matching backend permissionController & moduleAccess
 */
export const hasDefaultAction = (role: Role, module: string, action: PermissionAction): boolean => {
  if (role === 'super_admin' || role === 'admin') return true;
  if (role === 'manager') {
    const isCore = ['crm', 'hrms', 'recruitment', 'expenses', 'inventory', 'analytics'].includes(module);
    return isCore ? ['view', 'create', 'edit', 'approve'].includes(action) : false;
  }
  if (role === 'hr') {
    return (
      (module === 'hrms' || module === 'recruitment') &&
      ['view', 'create', 'edit', 'approve'].includes(action)
    );
  }
  if (role === 'recruiter') {
    return module === 'recruitment' && ['view', 'create', 'edit'].includes(action);
  }
  if (role === 'sales') {
    if (module === 'crm') return ['view', 'create', 'edit'].includes(action);
    if (module === 'analytics') return action === 'view';
    return false;
  }
  if (role === 'finance') {
    if (module === 'expenses') return ['view', 'create', 'edit', 'delete', 'approve'].includes(action);
    if (module === 'analytics') return action === 'view';
    return false;
  }
  if (role === 'inventory_manager') {
    return module === 'inventory' && ['view', 'create', 'edit', 'approve'].includes(action);
  }
  if (role === 'employee' || role === 'intern') {
    if (module === 'hrms') return action === 'view';
    if (module === 'expenses') return ['view', 'create'].includes(action);
    return false;
  }
  return false;
};

/**
 * Generic TanStack Query hook that provides dynamic RBAC permission checking
 * for all modules based on the organization's stored permissions matrix.
 */
export const useModuleAccess = (targetModule?: PermissionModule) => {
  const { user } = useAuth();
  const role = user?.role;

  const { data, isLoading } = useQuery<PermissionRowDto[]>({
    queryKey: ['moduleAccess', role, user?.id],
    queryFn: async () => {
      const res = await apiClient.get<{ matrix: PermissionRowDto[] }>('/permissions');
      return res.data.matrix;
    },
    enabled: !!role && role !== 'super_admin',
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const checkAccess = (moduleName: PermissionModule): boolean => {
    if (!role) return false;
    if (role === 'super_admin') return true;

    const row = data?.find((r) => r.role === role && r.module === moduleName);
    if (row) {
      return Boolean(row.enabled);
    }
    return hasDefaultAccess(role, moduleName);
  };

  const checkAction = (moduleName: PermissionModule, action: PermissionAction): boolean => {
    if (!role) return false;
    if (role === 'super_admin') return true;

    const row = data?.find((r) => r.role === role && r.module === moduleName);
    if (row) {
      return Boolean(row.enabled) && (row.actions || []).includes(action);
    }
    return hasDefaultAction(role, moduleName, action);
  };

  return {
    hasAccess: targetModule ? checkAccess(targetModule) : false,
    can: (action: PermissionAction, moduleName?: PermissionModule) => {
      const mod = moduleName || targetModule;
      if (!mod) return false;
      return checkAction(mod, action);
    },
    checkAccess,
    checkAction,
    isLoading,
    matrix: data,
  };
};
