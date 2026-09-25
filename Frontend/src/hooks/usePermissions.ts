import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiClient } from '../lib/apiClient';
import type {
  PermissionCatalog,
  PermissionMatrixResponse,
  PermissionRole,
  PermissionRow,
  PermissionUpdate,
} from '../types/permissions';

export interface PermissionMatrixData {
  catalog: PermissionCatalog;
  matrix: PermissionRow[];
  activeRoles: PermissionRole[];
}

/**
 * Combined TanStack Query hook that fetches both the permissions catalog
 * and current organization matrix.
 */
export const usePermissionMatrix = () => {
  return useQuery<PermissionMatrixData, Error>({
    queryKey: ['permissions', 'matrix'],
    queryFn: async () => {
      const [catalogRes, matrixRes] = await Promise.all([
        apiClient.get<PermissionCatalog>('/permissions/catalog'),
        apiClient.get<PermissionMatrixResponse>('/permissions'),
      ]);

      return {
        catalog: catalogRes.data,
        matrix: matrixRes.data.matrix,
        activeRoles: catalogRes.data.activeRoles || matrixRes.data.activeRoles || [],
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
};

/**
 * TanStack Mutation hook to bulk save diffed permission updates.
 */
export const useUpdatePermissions = () => {
  const queryClient = useQueryClient();

  return useMutation<{ updates: PermissionRow[] }, Error, { updates: PermissionRow[] }>({
    mutationFn: async ({ updates }) => {
      const response = await apiClient.put<PermissionUpdate>('/permissions', { updates });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Permissions updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['permissions', 'matrix'] });
      queryClient.invalidateQueries({ queryKey: ['moduleAccess'] });
      queryClient.invalidateQueries({ queryKey: ['crmModuleAccess'] });
    },
    onError: (err: any) => {
      const serverMessage =
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save permissions. Please try again.';
      toast.error(serverMessage);
    },
  });
};
