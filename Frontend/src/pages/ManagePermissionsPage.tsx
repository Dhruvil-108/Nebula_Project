import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Search,
  RotateCcw,
  Sparkles,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissionMatrix, useUpdatePermissions } from '../hooks/usePermissions';
import {
  PermissionGrid,
  PermissionGridSkeleton,
} from '../components/permissions/PermissionGrid';
import { UnsavedChangesBar } from '../components/permissions/UnsavedChangesBar';
import {
  type PermissionAction,
  type PermissionModule,
  type PermissionRole,
  type PermissionRow,
} from '../types/permissions';

/**
 * Utility to compare two action arrays regardless of order.
 */
function areActionsEqual(a: PermissionAction[], b: PermissionAction[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((action) => setB.has(action));
}

export const ManagePermissionsPage: React.FC = () => {
  const { user, organization } = useAuth();
  const { data, isLoading, isError, error, refetch } = usePermissionMatrix();
  const updateMutation = useUpdatePermissions();

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Staged local grid state: key = `${role}-${module}`
  const [stagedGrid, setStagedGrid] = useState<Record<string, PermissionRow>>({});

  // Baseline state from the server
  const baselineMap = useMemo(() => {
    const map: Record<string, PermissionRow> = {};
    if (data?.matrix) {
      data.matrix.forEach((row) => {
        map[`${row.role}-${row.module}`] = {
          role: row.role,
          module: row.module,
          enabled: row.enabled,
          actions: [...row.actions],
        };
      });
    }
    return map;
  }, [data?.matrix]);

  // Sync staged grid with baseline whenever baseline loads or updates
  useEffect(() => {
    if (data?.matrix) {
      const initial: Record<string, PermissionRow> = {};
      data.matrix.forEach((row) => {
        initial[`${row.role}-${row.module}`] = {
          role: row.role,
          module: row.module,
          enabled: row.enabled,
          actions: [...row.actions],
        };
      });
      setStagedGrid(initial);
    }
  }, [data?.matrix]);

  // Determine dirty/modified cells by diffing staged against baseline
  const dirtyCells = useMemo(() => {
    const set = new Set<string>();
    Object.entries(stagedGrid).forEach(([key, staged]) => {
      const base = baselineMap[key];
      if (!base) {
        set.add(key);
        return;
      }
      if (staged.enabled !== base.enabled) {
        set.add(key);
        return;
      }
      if (!areActionsEqual(staged.actions, base.actions)) {
        set.add(key);
      }
    });
    return set;
  }, [stagedGrid, baselineMap]);

  // Diffed updates list for PUT payload
  const diffedUpdates = useMemo(() => {
    const updates: PermissionRow[] = [];
    dirtyCells.forEach((key) => {
      if (stagedGrid[key]) {
        updates.push(stagedGrid[key]);
      }
    });
    return updates;
  }, [dirtyCells, stagedGrid]);

  // Handlers for cell toggles
  const handleToggleEnabled = useCallback(
    (role: PermissionRole, module: PermissionModule, enabled: boolean) => {
      const key = `${role}-${module}`;
      setStagedGrid((prev) => {
        const current = prev[key] || { role, module, enabled: false, actions: [] };
        return {
          ...prev,
          [key]: {
            ...current,
            enabled,
          },
        };
      });
    },
    []
  );

  const handleToggleAction = useCallback(
    (
      role: PermissionRole,
      module: PermissionModule,
      action: PermissionAction,
      active: boolean
    ) => {
      const key = `${role}-${module}`;
      setStagedGrid((prev) => {
        const current = prev[key] || { role, module, enabled: true, actions: [] };
        const currentActions = new Set(current.actions);
        if (active) {
          currentActions.add(action);
        } else {
          currentActions.delete(action);
        }

        return {
          ...prev,
          [key]: {
            ...current,
            actions: Array.from(currentActions) as PermissionAction[],
          },
        };
      });
    },
    []
  );

  // Batch toggle for an entire role row
  const handleBatchRow = useCallback(
    (role: PermissionRole, enableAll: boolean) => {
      if (!data?.catalog.modules) return;
      setStagedGrid((prev) => {
        const next = { ...prev };
        data.catalog.modules.forEach((mod) => {
          const key = `${role}-${mod}`;
          next[key] = {
            role,
            module: mod,
            enabled: enableAll,
            actions: enableAll
              ? ['view', 'create', 'edit', 'delete', 'approve']
              : [],
          };
        });
        return next;
      });
    },
    [data?.catalog.modules]
  );

  // Batch toggle for an entire module column
  const handleBatchColumn = useCallback(
    (module: PermissionModule, enableAll: boolean) => {
      if (!data?.catalog.roles) return;
      setStagedGrid((prev) => {
        const next = { ...prev };
        data.catalog.roles.forEach((r) => {
          const key = `${r}-${module}`;
          next[key] = {
            role: r,
            module,
            enabled: enableAll,
            actions: enableAll
              ? ['view', 'create', 'edit', 'delete', 'approve']
              : [],
          };
        });
        return next;
      });
    },
    [data?.catalog.roles]
  );

  // Save changes
  const handleSave = () => {
    if (diffedUpdates.length === 0) return;
    updateMutation.mutate({ updates: diffedUpdates });
  };

  // Discard changes
  const handleDiscard = () => {
    setStagedGrid(baselineMap);
  };

  // Filter roles and modules based on search
  const filteredRoles = useMemo(() => {
    if (!data?.catalog.roles) return [];
    if (!searchQuery.trim()) return data.catalog.roles;
    const q = searchQuery.toLowerCase();
    return data.catalog.roles.filter((r) => r.toLowerCase().includes(q));
  }, [data?.catalog.roles, searchQuery]);

  const filteredModules = useMemo(() => {
    if (!data?.catalog.modules) return [];
    if (!searchQuery.trim()) return data.catalog.modules;
    const q = searchQuery.toLowerCase();
    // If the query matches module names, filter columns as well
    const matched = data.catalog.modules.filter((m) => m.toLowerCase().includes(q));
    return matched.length > 0 ? matched : data.catalog.modules;
  }, [data?.catalog.modules, searchQuery]);

  // ── Guard: Super Admin only ──
  if (user && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto space-y-6 select-none">
      {/* ── Page Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800/80 pb-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f0512f]/10 border border-[#f0512f]/30 text-[#ff8c70] text-xs font-semibold">
              <Lock className="w-3 h-3 text-[#f0512f]" />
              Super Admin Settings
            </span>
            {organization && (
              <span className="text-xs text-slate-500 font-mono">
                / {organization.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            Manage Permissions
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-medium">
              RBAC v1
            </span>
          </h1>

          <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Control which roles can access each module across your organization.
            Granularly configure module availability and individual action rights.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter roles or modules..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#f0512f] transition-all"
            />
          </div>

          {/* Reset Staged Button */}
          {dirtyCells.size > 0 && (
            <button
              type="button"
              onClick={handleDiscard}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Discard changes ({dirtyCells.size})
            </button>
          )}

          {/* Refresh Data button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading || updateMutation.isPending}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:bg-slate-800/80 transition-colors"
            title="Refresh permissions matrix"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </motion.div>

      {/* ── Super Admin Info Callout ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-900/40 border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-200">
              Super Admin bypass is permanently active
            </p>
            <p className="text-[11px] text-slate-400">
              The <span className="text-amber-400 font-mono font-medium">super_admin</span> role
              is the organization owner and is omitted from the grid because it always retains unrestricted access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-[11px] text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            Available Roles: <span className="text-white font-semibold">{data?.catalog.roles.length ?? 0}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
            Staged Diffs: <span className={dirtyCells.size > 0 ? 'text-[#f0512f] font-bold' : 'text-emerald-400'}>{dirtyCells.size}</span>
          </div>
        </div>
      </motion.div>

      {/* ── Content Area: Loading / Error / Grid ── */}
      {isLoading ? (
        <PermissionGridSkeleton />
      ) : isError ? (
        <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-center max-w-lg mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white mb-2">
            Failed to load permissions
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            {error?.message || 'An error occurred while fetching the permissions catalog and matrix.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#f0512f] hover:bg-[#ff7a59] transition-colors shadow-md shadow-[#f0512f]/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : data ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <PermissionGrid
            roles={filteredRoles}
            modules={filteredModules}
            gridState={stagedGrid}
            dirtyCells={dirtyCells}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onToggleEnabled={handleToggleEnabled}
            onToggleAction={handleToggleAction}
            onBatchRow={handleBatchRow}
            onBatchColumn={handleBatchColumn}
          />
        </motion.div>
      ) : null}

      {/* ── Unsaved Changes Persistent Action Bar ── */}
      <UnsavedChangesBar
        dirtyCount={dirtyCells.size}
        isSaving={updateMutation.isPending}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </div>
  );
};

export default ManagePermissionsPage;
