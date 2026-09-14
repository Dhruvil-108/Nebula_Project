import React from 'react';
import { Eye, Plus, Pencil, Trash2, CheckCheck } from 'lucide-react';
import { clsx } from 'clsx';
import type {
  PermissionAction,
  PermissionModule,
  PermissionRole,
  PermissionRow,
} from '../../types/permissions';

interface PermissionCellProps {
  role: PermissionRole;
  module: PermissionModule;
  value: PermissionRow;
  isDirty: boolean;
  onToggleEnabled: (role: PermissionRole, module: PermissionModule, enabled: boolean) => void;
  onToggleAction: (
    role: PermissionRole,
    module: PermissionModule,
    action: PermissionAction,
    active: boolean
  ) => void;
}

const ACTION_CONFIG: Array<{
  action: PermissionAction;
  label: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { action: 'view', label: 'View', icon: Eye },
  { action: 'create', label: 'Create', icon: Plus },
  { action: 'edit', label: 'Edit', icon: Pencil },
  { action: 'delete', label: 'Delete', icon: Trash2 },
  { action: 'approve', label: 'Approve', icon: CheckCheck },
];

export const PermissionCell: React.FC<PermissionCellProps> = ({
  role,
  module,
  value,
  isDirty,
  onToggleEnabled,
  onToggleAction,
}) => {
  const { enabled, actions = [] } = value;

  return (
    <div
      className={clsx(
        'relative p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2.5 select-none',
        enabled
          ? 'bg-white border-[#ece0d6] shadow-xs hover:border-[#de7a3d]/50 hover:shadow-sm'
          : 'bg-[#faf8f6]/80 border-[#f0e6de] opacity-65 hover:opacity-90',
        isDirty && 'ring-2 ring-[#f0512f]/40 border-[#de7a3d] bg-[#fffaf7]'
      )}
    >
      {/* Unsaved change indicator dot */}
      {isDirty && (
        <span
          className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-[#f0512f] ring-2 ring-white shadow-xs shadow-[#f0512f]/50 flex items-center justify-center animate-pulse z-10"
          title="Unsaved modification"
        />
      )}

      {/* Module Master Switch row */}
      <div className="flex items-center justify-between gap-2 border-b border-[#ece0d6] pb-2">
        <span className="text-[11px] font-semibold text-[#6b6b6b] uppercase tracking-wider">
          Access
        </span>

        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggleEnabled(role, module, e.target.checked)}
            className="sr-only peer"
            aria-label={`Toggle ${module} module for ${role}`}
          />
          <div
            className={clsx(
              'w-8 h-4.5 rounded-full transition-colors duration-200 ease-in-out relative cursor-pointer',
              'after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all after:duration-200 after:shadow-xs',
              'peer-checked:bg-[#d06b28] peer-checked:after:translate-x-3.5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#f0512f]',
              'bg-[#d6cbbf]'
            )}
          />
        </label>
      </div>

      {/* Action Checkboxes / Icon Toggles */}
      <div
        className={clsx(
          'grid grid-cols-5 gap-1 transition-all duration-200',
          !enabled && 'pointer-events-none grayscale opacity-40'
        )}
      >
        {ACTION_CONFIG.map(({ action, label, icon: Icon }) => {
          const isChecked = enabled && actions.includes(action);

          return (
            <button
              key={action}
              type="button"
              disabled={!enabled}
              onClick={() => onToggleAction(role, module, action, !actions.includes(action))}
              title={`${label} (${action}): ${isChecked ? 'Allowed' : 'Disabled'}`}
              aria-label={`${role} ${module} ${label}`}
              className={clsx(
                'group relative flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-medium transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0512f]',
                isChecked
                  ? 'bg-[#fbeae0] text-[#7a2f05] border-[#de7a3d] font-semibold shadow-2xs'
                  : 'bg-white text-[#9b9b9b] border-[#ece0d6] hover:text-[#1a1a1a] hover:bg-[#fbf0e7] hover:border-[#de7a3d]/50'
              )}
            >
              <Icon className={clsx('w-3.5 h-3.5 mb-0.5 transition-transform group-hover:scale-110', isChecked ? 'text-[#c2540c]' : 'text-[#9b9b9b] group-hover:text-[#1a1a1a]')} />
              <span className="leading-tight text-[9px] capitalize tracking-tight font-mono">
                {label.slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
