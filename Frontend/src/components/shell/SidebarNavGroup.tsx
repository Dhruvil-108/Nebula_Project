import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { NavLink, useLocation } from 'react-router-dom';

export interface SubNavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
}

interface SidebarNavGroupProps {
  /** Parent item target — first sub-route */
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
  subItems: SubNavItem[];
}

const itemBase =
  'post-login-nav-item group relative flex items-center gap-3 rounded-lg text-sm transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0512f]';

/**
 * Indented sub-item link. Icon/label color via NavLink children-as-function.
 */
const SubNavLink: React.FC<SubNavItem> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150',
          isActive
            ? 'post-login-nav-active bg-[#f0512f]/15 text-white'
            : 'post-login-nav-inactive text-slate-400 hover:text-slate-200'
        )
      }
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span
            className={clsx(
              'flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center',
              isActive ? 'text-[#f0512f]' : 'text-slate-500'
            )}
          >
            {icon}
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
};

/**
 * Expandable nav group.
 * Expanded mode: parent toggles the sub-list (auto-expands when a sub-route is active).
 * Collapsed (icon-only) mode: parent links to the first sub-route; hovering reveals
 * a flyout popover with the sub-items.
 */
export const SidebarNavGroup: React.FC<SidebarNavGroupProps> = ({
  to,
  icon,
  label,
  collapsed,
  subItems,
}) => {
  const [expanded, setExpanded] = useState(false);

  // ── Collapsed (icon-only) mode: parent link + hover flyout ──
  if (collapsed) {
    return (
      <div className="group relative">
        <NavLink
          to={subItems[0]?.to || to}
          className={({ isActive }) =>
            clsx(
              itemBase,
              'justify-center px-3 py-2.5',
              isActive
                ? 'post-login-nav-active bg-[#f0512f]/15 text-white font-medium'
                : 'post-login-nav-inactive text-slate-400 hover:text-slate-200 font-medium'
            )
          }
        >
          {({ isActive }: { isActive: boolean }) => (
            <>
              <span
                className={clsx(
                  'flex-shrink-0 w-5 h-5 flex items-center justify-center',
                  isActive ? 'text-[#f0512f]' : 'text-slate-400 group-hover:text-slate-200'
                )}
              >
                {icon}
              </span>

              {/* Flyout popover with sub-items */}
              <div className="absolute left-full ml-3 top-0 z-50 hidden group-hover:block">
                <div className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 shadow-xl min-w-[180px]">
                  <p className="px-2 pb-1.5 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
                    {label}
                  </p>
                  {subItems.map((sub) => (
                    <FlyoutLink key={sub.to} sub={sub} />
                  ))}
                  {/* Arrow */}
                  <div className="absolute right-full top-4 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-slate-700/80" />
                </div>
              </div>
            </>
          )}
        </NavLink>
      </div>
    );
  }

  // ── Expanded mode: toggle parent + indented sub-items ──
  return <ExpandedGroup to={to} icon={icon} label={label} subItems={subItems} />;
};

/**
 * Flyout sub-item (collapsed mode) — plain links inside the popover.
 */
const FlyoutLink: React.FC<{ sub: SubNavItem }> = ({ sub }) => (
  <NavLink
    to={sub.to}
    className={({ isActive }) =>
      clsx(
        'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
        isActive
          ? 'bg-[#f0512f]/20 text-white'
          : 'text-slate-300 hover:text-white hover:bg-slate-800'
      )
    }
  >
    <span className="flex-shrink-0 w-4 h-4">{sub.icon}</span>
    {sub.label}
  </NavLink>
);

/**
 * Expanded-mode group: toggle button + animated sub-list.
 */
const ExpandedGroup: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  subItems: SubNavItem[];
}> = ({ to, icon, label, subItems }) => {
  const location = useLocationValue();
  const [expanded, setExpanded] = useState(false);

  const groupActive = subItems.some((sub) => location.pathname.startsWith(sub.to));
  const hasActive = groupActive || location.pathname.startsWith(to);

  // Auto-expand when a sub-route is active
  React.useEffect(() => {
    if (groupActive) setExpanded(true);
  }, [groupActive]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className={clsx(
          itemBase,
          'w-full px-3 py-2.5 text-left text-[13.5px] font-medium',
          hasActive
            ? 'post-login-nav-active bg-[#f0512f]/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
            : 'post-login-nav-inactive text-slate-400 hover:text-slate-200'
        )}
        aria-expanded={expanded}
      >
        <span
          className={clsx(
            'flex-shrink-0 w-5 h-5 flex items-center justify-center',
            hasActive ? 'text-[#f0512f]' : 'text-slate-400 group-hover:text-slate-200'
          )}
        >
          {icon}
        </span>
        <span
          className={clsx(
            'flex-1 truncate tracking-tight text-[13.5px]',
            hasActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
          )}
        >
          {label}
        </span>
        <ChevronDown
          className={clsx(
            'w-4 h-4 flex-shrink-0 transition-transform duration-200',
            expanded && 'rotate-180',
            hasActive ? 'text-[#f0512f]' : 'text-slate-500'
          )}
        />
      </button>

      {/* Sub-items with animated collapse */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-4 ml-4 border-l border-slate-800/80 space-y-0.5 py-1">
              {subItems.map((sub) => (
                <SubNavLink key={sub.to} to={sub.to} icon={sub.icon} label={sub.label} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Tiny helper so ExpandedGroup stays declarative
const useLocationValue = () => {
  const location = useLocation();
  return location;
};
