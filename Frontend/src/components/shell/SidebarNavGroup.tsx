import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

interface SubItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface SidebarNavGroupProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  subItems: SubItem[];
}

export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  to,
  icon,
  label,
  collapsed,
  subItems,
}) => {
  const location = useLocation();
  const isGroupActive = location.pathname === to || location.pathname.startsWith(to + '/');
  const [open, setOpen] = useState(isGroupActive);

  // Auto-expand group if navigated into
  React.useEffect(() => {
    if (isGroupActive) {
      setOpen(true);
    }
  }, [isGroupActive]);

  if (collapsed) {
    return (
      <NavLink
        to={to}
        className={clsx(
          'post-login-nav-item group relative flex items-center justify-center px-3 py-2 rounded-xl select-none focus-visible:outline-none transition-all duration-150',
          isGroupActive
            ? 'post-login-nav-active bg-white text-slate-900 border border-slate-200/90 shadow-2xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent font-medium'
        )}
      >
        {isGroupActive && (
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#ea580c]"
            aria-hidden="true"
          />
        )}
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-150"
          style={{
            color: isGroupActive ? '#ea580c' : '#64748b',
          }}
        >
          {icon}
        </span>

        {/* Collapsed tooltip */}
        <div
          className="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-md bg-slate-900 text-slate-50 border border-slate-800"
        >
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-900" />
        </div>
      </NavLink>
    );
  }

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'post-login-nav-item w-full group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm select-none focus-visible:outline-none transition-all duration-150',
          isGroupActive
            ? 'post-login-nav-active bg-white text-slate-900 border border-slate-200/90 shadow-2xs font-semibold'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 border border-transparent font-medium'
        )}
        aria-expanded={open}
      >
        {isGroupActive && (
          <span
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-[#ea580c]"
            aria-hidden="true"
          />
        )}

        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-150"
          style={{
            color: isGroupActive ? '#ea580c' : '#64748b',
          }}
        >
          {icon}
        </span>

        <span
          className="flex-1 text-left truncate text-[13px] tracking-tight transition-colors duration-150"
          style={{
            color: isGroupActive ? '#0f172a' : '#475569',
            fontWeight: isGroupActive ? 600 : 500,
          }}
        >
          {label}
        </span>

        <ChevronDown
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            color: isGroupActive ? '#ea580c' : '#94a3b8',
          }}
        />
      </button>

      {/* Sub-items */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 ml-4 pl-3 space-y-0.5" style={{ borderLeft: '1.5px solid #e2e8f0' }}>
              {subItems.map((sub) => {
                const isSubActive =
                  location.pathname === sub.to || location.pathname.startsWith(sub.to + '/');
                return (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    className={clsx(
                      'group flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[13px] select-none focus-visible:outline-none transition-colors duration-150',
                      isSubActive
                        ? 'bg-orange-50/80 text-[#ea580c] font-semibold border border-orange-200/60 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent font-medium'
                    )}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center transition-colors duration-150"
                      style={{ color: isSubActive ? '#ea580c' : '#94a3b8' }}
                    >
                      {sub.icon}
                    </span>
                    <span className="truncate">{sub.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
