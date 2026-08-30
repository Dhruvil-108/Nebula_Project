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
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          isActive
            ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/25 shadow-glow-sm'
            : emphasized
            ? 'text-slate-200 hover:bg-slate-800/60 hover:text-white border border-transparent'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar */}
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}

          {/* Icon */}
          <span
            className={clsx(
              'flex-shrink-0 w-5 h-5 transition-colors',
              isActive ? 'text-indigo-400' : emphasized ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-300'
            )}
          >
            {icon}
          </span>

          {/* Label — hidden when collapsed */}
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className={clsx(
                'flex-1 text-sm font-medium truncate',
                emphasized && !isActive && 'font-semibold'
              )}
            >
              {label}
            </motion.span>
          )}

          {/* Badge */}
          {!collapsed && badge !== undefined && badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600/80 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {badge > 99 ? '99+' : badge}
            </motion.span>
          )}

          {/* Tooltip when collapsed */}
          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-xl">
              {label}
              {badge !== undefined && badge > 0 && (
                <span className="ml-1.5 px-1 rounded bg-indigo-600 text-white">{badge}</span>
              )}
              {/* Arrow */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-700" />
            </div>
          )}
        </>
      )}
    </NavLink>
  );
};
