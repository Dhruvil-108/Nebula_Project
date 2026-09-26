import React from 'react';
import { NavLink } from 'react-router-dom';
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
          'post-login-nav-item group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm select-none focus-visible:outline-none transition-all duration-150',
          isActive
            ? 'post-login-nav-active bg-white text-slate-900 border border-slate-200/90 shadow-2xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent font-medium'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Subtle 3px active indicator bar on left edge */}
          {isActive && (
            <span
              className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#ea580c]"
              aria-hidden="true"
            />
          )}

          {/* Icon */}
          <span
            className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-150"
            style={{
              color: isActive ? '#ea580c' : emphasized ? '#475569' : '#64748b',
            }}
          >
            {icon}
          </span>

          {/* Label */}
          {!collapsed && (
            <span
              className="flex-1 truncate text-[13px] tracking-tight transition-colors duration-150"
              style={{
                color: isActive ? '#0f172a' : '#475569',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              {label}
            </span>
          )}

          {/* Badge */}
          {!collapsed && badge !== undefined && badge > 0 && (
            <span
              className="flex-shrink-0 min-w-[18px] h-[18px] px-1.5 rounded-full text-white text-[10px] font-semibold flex items-center justify-center bg-[#ea580c]"
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}

          {/* Collapsed tooltip */}
          {collapsed && (
            <div
              className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-md bg-slate-900 text-slate-50 border border-slate-800"
            >
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-1.5 px-1 py-0.2 rounded-full text-white font-medium bg-[#ea580c] text-[9px]">
                  {badge}
                </span>
              )}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-900" />
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};
