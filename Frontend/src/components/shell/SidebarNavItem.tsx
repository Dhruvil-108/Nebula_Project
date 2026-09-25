import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface SidebarNavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  badge?: number;
  emphasized?: boolean;
}

export const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  to,
  icon,
  label,
  collapsed,
  badge,
  emphasized = false,
}) => {
  return (
    <NavLink
      to={to}
      end={to === '/dashboard'}
      className={({ isActive }) =>
        clsx(
          'post-login-nav-item group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0512f]',
          isActive
            ? 'post-login-nav-active bg-[#fff7ed] border border-[#fed7aa] text-[#ea580c] font-semibold shadow-sm'
            : emphasized
              ? 'post-login-nav-emphasized text-slate-700 hover:text-[#1a1a1a] hover:bg-[#fff7ed] font-medium'
              : 'post-login-nav-inactive text-slate-600 hover:text-[#1a1a1a] hover:bg-[#fff7ed] font-medium'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Icon */}
          <span
            className={clsx(
              'flex-shrink-0 w-5 h-5 transition-colors flex items-center justify-center',
              isActive
                ? 'text-[#f97316]'
                : emphasized
                  ? 'text-slate-600 group-hover:text-[#f97316]'
                  : 'text-slate-500 group-hover:text-[#f97316]'
            )}
          >
            {icon}
          </span>

          {/* Label — hidden when collapsed */}
          {!collapsed && (
            <span
              className={clsx(
                'flex-1 truncate tracking-tight text-[13.5px]',
                isActive ? 'text-[#ea580c] font-semibold' : 'text-slate-700 group-hover:text-[#1a1a1a]'
              )}
            >
              {label}
            </span>
          )}

          {/* Badge */}
          {!collapsed && badge !== undefined && badge > 0 && (
            <span className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#f97316] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
              {badge > 99 ? '99+' : badge}
            </span>
          )}

          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-200 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-xl">
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-1.5 px-1 rounded bg-[#f0512f] text-white">{badge}</span>
              )}
              {/* Arrow */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-700/80" />
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};

