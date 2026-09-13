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
  activeColor: string;
}> = [
    { action: 'view', label: 'View', icon: Eye, activeColor: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]' },
    { action: 'create', label: 'Create', icon: Plus, activeColor: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]' },
    { action: 'edit', label: 'Edit', icon: Pencil, activeColor: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]' },
    { action: 'delete', label: 'Delete', icon: Trash2, activeColor: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]' },
    { action: 'approve', label: 'Approve', icon: CheckCheck, activeColor: 'text-[#7a2f05] bg-[#fbeae0] border-[#de7a3d]' },
  ];

export const PermissionCell: React.FC<PermissionCellProps> = ({
  role,
  module,
  value,
  isDirty,
  onToggleEnabled,
  onToggleAction,
}) => {
  const { enabled, actions } = value;

  return (
    <div
      className={clsx(
        'relative p-3 rounded-xl border transition-all duration-200 flex flex-col gap-2.5',
        enabled
          ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700/80'
          : 'bg-slate-950/40 border-slate-900/90 opacity-60 hover:opacity-85',
        isDirty && 'ring-1 ring-[#f0512f]/60 border-[#f0512f]/40 bg-[#f0512f]/[0.02]'
      )}
    >
      {/* Dirty indicator pill */}
      {isDirty && (
        <span
          className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[#f0512f] ring-2 ring-slate-950 shadow-sm shadow-[#f0512f]/50"
          title="Unsaved change"
        />
      )}

      {/* Module Master Switch row */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
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
              'w-8 h-4.5 rounded-full transition-colors duration-200 ease-in-out relative',
              'after:content-[""] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all after:duration-200',
              'peer-checked:bg-[#f0512f] peer-checked:after:translate-x-3.5 peer-focus-visible:ring-2 peer-focus-visible:ring-[#f0512f]',
              'bg-slate-700'
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
        {ACTION_CONFIG.map(({ action, label, icon: Icon, activeColor }) => {
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
                'group relative flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] font-medium transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0512f]',
                isChecked
                  ? `${activeColor} shadow-sm`
                  : 'text-slate-500 bg-slate-800/40 border-slate-800/60 hover:text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
              )}
            >
              <Icon className="w-3.5 h-3.5 mb-0.5 transition-transform group-hover:scale-110" />
              <span className="leading-tight text-[9px] capitalize tracking-tighter">
                {label.slice(0, 3)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
