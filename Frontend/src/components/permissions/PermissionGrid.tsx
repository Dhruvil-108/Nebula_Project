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
    <div className="w-full overflow-hidden rounded-2xl border border-[#ece0d6] bg-white shadow-xs animate-pulse">
      <div className="h-16 bg-[#fbf5f0] border-b border-[#ece0d6]" />
      <div className="divide-y divide-[#ece0d6]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-5">
            <div className="w-44 h-9 bg-[#fbf0e7] rounded-xl" />
            <div className="flex-1 grid grid-cols-4 gap-4">
              <div className="h-16 bg-[#faf8f6] rounded-xl border border-[#ece0d6]/50" />
              <div className="h-16 bg-[#faf8f6] rounded-xl border border-[#ece0d6]/50" />
              <div className="h-16 bg-[#faf8f6] rounded-xl border border-[#ece0d6]/50" />
              <div className="h-16 bg-[#faf8f6] rounded-xl border border-[#ece0d6]/50" />
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
    <div className="permissions-grid w-full overflow-x-auto rounded-2xl border border-[#ece0d6] bg-white shadow-sm scrollbar-thin">
      <table className="w-full border-collapse text-left min-w-[900px]">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-[#ece0d6] bg-[#fbf5f0] text-[#6b6b6b]">
            {/* Pinned Sticky Header for Role Column */}
            <th className="sticky left-0 z-30 bg-[#fbf5f0] px-4 py-4 text-xs font-semibold tracking-wider uppercase min-w-[240px] max-w-[260px] border-r border-[#ece0d6] shadow-[3px_0_10px_rgba(0,0,0,0.03)]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#c2540c]" />
                <span className="text-[#1a1a1a] font-bold">Role / Module Matrix</span>
              </div>
              <p className="text-[10px] text-[#6b6b6b] font-normal lowercase tracking-normal mt-0.5 font-mono">
                {roles.length} {roles.length === 1 ? 'available role' : 'available roles'}
              </p>
            </th>

            {/* Module Column Headers */}
            {modules.map((mod) => {
              const meta = MODULE_METADATA[mod];
              return (
                <th key={mod} className="px-3 py-3 min-w-[200px] align-top bg-[#fbf5f0]">
                  <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-white border border-[#ece0d6] shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border shadow-2xs',
                          meta?.badgeBg || 'bg-[#fbeae0]',
                          meta?.color || 'text-[#7a2f05]',
                          meta?.badgeBorder || 'border-[#de7a3d]'
                        )}
                      >
                        {meta?.label || mod.toUpperCase()}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onBatchColumn(mod, true)}
                          title={`Enable ${meta?.label || mod} for all roles`}
                          className="p-1 rounded-md text-[#6b6b6b] hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onBatchColumn(mod, false)}
                          title={`Disable ${meta?.label || mod} for all roles`}
                          className="p-1 rounded-md text-[#6b6b6b] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[#6b6b6b] line-clamp-1 font-normal leading-tight" title={meta?.description}>
                      {meta?.description}
                    </p>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#ece0d6] bg-white">
          {roles.length === 0 ? (
            <tr>
              <td
                colSpan={modules.length + 1}
                className="px-6 py-16 text-center text-[#6b6b6b] bg-[#faf8f6]/50"
              >
                <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-[#fbf0e7] border border-[#ece0d6] flex items-center justify-center text-[#c2540c]">
                    <Users className="w-6 h-6 text-[#c2540c]" />
                  </div>
                  <h4 className="text-base font-semibold text-[#1a1a1a]">
                    {searchQuery ? 'No matching roles found' : 'No Role Accounts Available'}
                  </h4>
                  <p className="text-xs text-[#6b6b6b] leading-relaxed">
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
                      className="mt-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#1a1a1a] hover:bg-[#fbf0e7] border border-[#ece0d6] transition-colors cursor-pointer"
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
