import React from 'react';
import { Shield, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';
import { ROLE_LABELS, ROLE_COLORS } from '../../types/user';
import type {
  PermissionAction,
  PermissionModule,
  PermissionRole,
  PermissionRow,
} from '../../types/permissions';
import { PermissionCell } from './PermissionCell';

interface PermissionGridRowProps {
  role: PermissionRole;
  modules: PermissionModule[];
  rowValues: Record<PermissionModule, PermissionRow>;
  dirtyCells: Set<string>;
  onToggleEnabled: (role: PermissionRole, module: PermissionModule, enabled: boolean) => void;
  onToggleAction: (
    role: PermissionRole,
    module: PermissionModule,
    action: PermissionAction,
    active: boolean
  ) => void;
  onBatchRow: (role: PermissionRole, enableAll: boolean) => void;
}

export const PermissionGridRow: React.FC<PermissionGridRowProps> = ({
  role,
  modules,
  rowValues,
  dirtyCells,
  onToggleEnabled,
  onToggleAction,
  onBatchRow,
}) => {
  const roleLabel = ROLE_LABELS[role] || role;
  const roleColorClass = ROLE_COLORS[role] || 'text-[#ea580c] bg-[#fff7ed] border-[#fed7aa]';

  const enabledCount = modules.filter((m) => rowValues[m]?.enabled).length;

  return (
    <tr className="group border-b border-[#ece0d6] hover:bg-[#fffbf8] transition-colors">
      {/* Pinned Sticky Left Column for Role */}
      <td className="permissions-role-cell sticky left-0 z-10 bg-white group-hover:bg-[#fffbf8] transition-colors px-4 py-4 min-w-[240px] max-w-[260px] border-r border-[#ece0d6] shadow-[3px_0_10px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={clsx(
                  'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs',
                  roleColorClass
                )}
              >
                <Shield className="w-3 h-3 mr-1 text-[#f97316]" />
                {roleLabel}
              </span>
            </div>

            <span className="text-[11px] text-[#6b6b6b] font-mono font-medium">
              {enabledCount}/{modules.length} active
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onBatchRow(role, true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Grant full access to all modules for this role"
            >
              <CheckSquare className="w-3 h-3 text-emerald-600" />
              All On
            </button>
            <button
              type="button"
              onClick={() => onBatchRow(role, false)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6b6b6b] hover:text-rose-600 bg-stone-100 hover:bg-rose-50 border border-stone-200 hover:border-rose-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              title="Disable all modules for this role"
            >
              <Square className="w-3 h-3 text-[#9b9b9b]" />
              All Off
            </button>
          </div>
        </div>
      </td>

      {/* Module Columns */}
      {modules.map((mod) => {
        const key = `${role}-${mod}`;
        const val = rowValues[mod] || {
          role,
          module: mod,
          enabled: false,
          actions: [],
        };
        const isDirty = dirtyCells.has(key);

        return (
          <td key={mod} className="p-3 min-w-[200px] align-top">
            <PermissionCell
              role={role}
              module={mod}
              value={val}
              isDirty={isDirty}
              onToggleEnabled={onToggleEnabled}
              onToggleAction={onToggleAction}
            />
          </td>
        );
      })}
    </tr>
  );
};
