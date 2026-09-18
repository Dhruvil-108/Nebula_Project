import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  adminApi,
  type AdminUser,
} from '../lib/adminApi';

const getErrMessage = (err: unknown, fallback: string): string => {
  const e = err as { response?: { data?: { error?: string } }; message?: string };
  return e?.response?.data?.error || e?.message || fallback;
};

// Shared query keys
export const adminKeys = {
  overview: ['admin', 'overview'] as const,
  users: (params: Record<string, unknown>) => ['admin', 'users', params] as const,
  auditLogs: (params: Record<string, unknown>) => ['admin', 'auditLogs', params] as const,
};

export const useAdminOverview = (enabled = true) =>
  useQuery({
    queryKey: adminKeys.overview,
    queryFn: () => adminApi.getOverview(),
    enabled,
    refetchInterval: 30000, // live admin metrics
  });

export const useAdminUsers = (
  params: { role?: string; status?: string; search?: string } = {}
) =>
  useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
  });

export const useAdminAuditLogs = (
  params: { page?: number; limit?: number; action?: string } = {}
) =>
  useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminApi.getAuditLogs(params),
  });

export const useUpdateUserStatus = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string; user: AdminUser }, Error, { id: string; status: 'active' | 'disabled' }>({
    mutationFn: ({ id, status }) => adminApi.updateUserStatus(id, status),
    onSuccess: (data, vars) => {
      toast.success(data.message);
      // Optimistic-consistent cache refresh across the panel
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      void vars;
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update account status.')),
  });
};

export const useUpdateUserRole = () => {
  const qc = useQueryClient();
  return useMutation<{ message: string; user: AdminUser }, Error, { id: string; role: string }>({
    mutationFn: ({ id, role }) => adminApi.updateUserRole(id, role),
    onSuccess: (data) => {
      toast.success(data.message);
      // The target user's permissions changed — flush everything admin touches
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      qc.invalidateQueries({ queryKey: ['moduleAccess'] });
    },
    onError: (err) => toast.error(getErrMessage(err, 'Failed to update account role.')),
  });
};
