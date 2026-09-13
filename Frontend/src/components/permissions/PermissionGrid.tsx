import React from 'react';
import { ShieldCheck, CheckCheck, XCircle, Users } from 'lucide-react';
import { clsx } from 'clsx';
import {
  MODULE_METADATA,
  type PermissionAction,
  type PermissionModule,
  type PermissionRole,
  type PermissionRow,
} from '../../types/permissions';
import { PermissionGridRow } from './PermissionGridRow';

interface PermissionGridProps {
  roles: PermissionRole[];
  modules: PermissionModule[];
  gridState: Record<string, PermissionRow>;
  dirtyCells: Set<string>;
  searchQuery?: string;
  onClearSearch?: () => void;
  onToggleEnabled: (role: PermissionRole, module: PermissionModule, enabled: boolean) => void;
  onToggleAction: (
    role: PermissionRole,
    module: PermissionModule,
    action: PermissionAction,
    active: boolean
  ) => void;
  onBatchRow: (role: PermissionRole, enableAll: boolean) => void;
  onBatchColumn: (module: PermissionModule, enableAll: boolean) => void;
}

export const PermissionGridSkeleton: React.FC = () => {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 animate-pulse">
      <div className="h-16 bg-slate-900/80 border-b border-slate-800" />
      <div className="divide-y divide-slate-800/60">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5">
            <div className="w-40 h-8 bg-slate-800/80 rounded-xl" />
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div className="h-14 bg-slate-800/40 rounded-xl" />
              <div className="h-14 bg-slate-800/40 rounded-xl" />
              <div className="h-14 bg-slate-800/40 rounded-xl" />
              <div className="h-14 bg-slate-800/40 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PermissionGrid: React.FC<PermissionGridProps> = ({
  roles,
  modules,
  gridState,
  dirtyCells,
  searchQuery,
  onClearSearch,
  onToggleEnabled,
  onToggleAction,
  onBatchRow,
  onBatchColumn,
}) => {
  return (
    <div className="permissions-grid w-full overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/60 shadow-xl scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      <table className="w-full border-collapse text-left min-w-[900px]">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-900/90 text-slate-400">
            {/* Pinned Sticky Header for Role Column */}
            <th className="sticky left-0 z-30 bg-slate-900 px-4 py-4 text-xs font-semibold tracking-wider uppercase min-w-[240px] max-w-[260px] border-r border-slate-800/80 shadow-[4px_0_12px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#f0512f]" />
                <span className="text-slate-200">Role / Module Matrix</span>
              </div>
              <p className="text-[10px] text-slate-500 font-normal lowercase tracking-normal mt-0.5">
                {roles.length} {roles.length === 1 ? 'available role' : 'available roles'}
              </p>
            </th>

            {/* Module Column Headers */}
            {modules.map((mod) => {
              const meta = MODULE_METADATA[mod];
              return (
                <th key={mod} className="px-3 py-3 min-w-[200px] align-top">
                  <div className="flex flex-col gap-1.5 p-2 rounded-xl bg-slate-900/50 border border-slate-800/60">
                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border',
                          meta?.badgeBg || 'bg-slate-800',
                          meta?.color || 'text-slate-200',
                          meta?.badgeBorder || 'border-slate-700'
                        )}
                      >
                        {meta?.label || mod.toUpperCase()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onBatchColumn(mod, true)}
                          title={`Enable ${meta?.label || mod} for all roles`}
                          className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-slate-800/80 transition-colors"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onBatchColumn(mod, false)}
                          title={`Disable ${meta?.label || mod} for all roles`}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 font-normal" title={meta?.description}>
                      {meta?.description}
                    </p>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-800/40">
          {roles.length === 0 ? (
            <tr>
              <td
                colSpan={modules.length + 1}
                className="px-6 py-16 text-center text-slate-400 bg-slate-950/30"
              >
                <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-200">
                    {searchQuery ? 'No matching roles found' : 'No Role Accounts Available'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {searchQuery ? (
                      <>
                        No active role accounts match &ldquo;{searchQuery}&rdquo;. Try clearing your search query.
                      </>
                    ) : (
                      'Only roles with active user accounts in your organization are shown in this matrix. Once accounts with designated roles (e.g. Employee, Manager, HR) are created, their permission controls will appear here automatically.'
                    )}
                  </p>
                  {searchQuery && onClearSearch && (
                    <button
                      type="button"
                      onClick={onClearSearch}
                      className="mt-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                    >
                      Clear search filter
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            roles.map((role) => {
              const rowValues = {} as Record<PermissionModule, PermissionRow>;
              modules.forEach((mod) => {
                const key = `${role}-${mod}`;
                rowValues[mod] = gridState[key] || {
                  role,
                  module: mod,
                  enabled: false,
                  actions: [],
                };
              });

              return (
                <PermissionGridRow
                  key={role}
                  role={role}
                  modules={modules}
                  rowValues={rowValues}
                  dirtyCells={dirtyCells}
                  onToggleEnabled={onToggleEnabled}
                  onToggleAction={onToggleAction}
                  onBatchRow={onBatchRow}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
