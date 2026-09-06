import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserRound,
  Briefcase,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Building2,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';
import { SidebarNavItem } from './SidebarNavItem';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types/user';
import type { FocusArea } from '../../types/organization';

// ─────────────────────────────────────────────────────────
// Nav configuration based on role
// ─────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  emphasized?: boolean;
}

const getNavConfig = (
  role: Role,
  _primaryFocus: FocusArea[]
): { primary: NavItem[]; secondary: NavItem[] } => {
  const isEmployee = role === 'employee';

  const allModules: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/dashboard/crm', icon: <Users className="w-5 h-5" />, label: 'CRM' },
    { to: '/dashboard/hrms', icon: <UserRound className="w-5 h-5" />, label: 'HRMS' },
    { to: '/dashboard/recruitment', icon: <Briefcase className="w-5 h-5" />, label: 'Recruitment' },
    { to: '/dashboard/expenses', icon: <Receipt className="w-5 h-5" />, label: 'Expenses' },
    { to: '/dashboard/inventory', icon: <Package className="w-5 h-5" />, label: 'Inventory' },
    { to: '/dashboard/analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics' },
  ];

  // Employee gets a simplified nav
  if (isEmployee) {
    return {
      primary: [
        { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'My Dashboard' },
        { to: '/dashboard/hrms', icon: <UserRound className="w-5 h-5" />, label: 'Attendance & Leave' },
        { to: '/dashboard/expenses', icon: <Receipt className="w-5 h-5" />, label: 'My Expenses' },
      ],
      secondary: [],
    };
  }

  // Role-based emphasis — put the most relevant module first
  const emphasized: Partial<Record<Role, string>> = {
    sales: '/dashboard/crm',
    manager: '/dashboard/crm',
    hr: '/dashboard/hrms',
    recruiter: '/dashboard/recruitment',
    finance: '/dashboard/expenses',
    inventory_manager: '/dashboard/inventory',
  };

  const emphasizedPath = emphasized[role];
  const primary = allModules.map((item) => ({
    ...item,
    emphasized: item.to === emphasizedPath,
  }));

  const secondary: NavItem[] =
    role === 'super_admin' || role === 'admin'
      ? [
          { to: '/dashboard/org', icon: <Building2 className="w-5 h-5" />, label: 'Organization' },
          { to: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
        ]
      : [{ to: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' }];

  return { primary, secondary };
};

// ─────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) => {
  const { user, organization } = useAuth();
  const navConfig = getNavConfig(
    user?.role ?? 'employee',
    organization?.primaryFocus ?? []
  );

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b0f17] select-none">
      {/* ── Header / Logo ── */}
      <div
        className={clsx(
          'flex items-center border-b border-slate-800/80 py-4 transition-all duration-200',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            className="group relative flex items-center justify-center p-1 rounded-xl hover:bg-slate-800/60 transition-colors focus-visible:outline-none"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <div className="w-8 h-8 rounded-lg bg-[#f0512f] flex items-center justify-center shadow-md shadow-[#f0512f]/30 group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#f0512f] flex items-center justify-center shadow-md shadow-[#f0512f]/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <span className="text-[15px] font-bold text-white tracking-tight whitespace-nowrap leading-none">
                  Nebula
                </span>
                <span className="text-[9px] font-semibold text-[#f0512f] uppercase tracking-widest mt-1 whitespace-nowrap">
                  Ops Hub
                </span>
              </div>
            </div>

            {/* Collapse toggle — hidden on mobile */}
            <button
              onClick={onToggle}
              className="hidden md:flex flex-shrink-0 w-6 h-6 rounded-md hover:bg-slate-800/80 text-slate-500 hover:text-slate-300 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f0512f]"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Workspace Card ── */}
      {!collapsed && organization && (
        <div className="px-3 pt-3 pb-1">
          <div className="px-3 py-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#f0512f]/15 border border-[#f0512f]/30 flex items-center justify-center text-[10px] font-bold text-[#ff8c70] flex-shrink-0">
              {organization.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider leading-none mb-0.5">
                Workspace
              </p>
              <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                {organization.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Primary nav ── */}
      <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest">
            Modules
          </p>
        )}
        {navConfig.primary.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            emphasized={item.emphasized}
          />
        ))}
      </nav>

      {/* ── Secondary nav (settings/org) ── */}
      {navConfig.secondary.length > 0 && (
        <div className="px-3 py-2 border-t border-slate-800/80 space-y-1">
          {navConfig.secondary.map((item) => (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
            />
          ))}
        </div>
      )}

      {/* ── User menu ── */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-800/80">
        <UserMenu collapsed={collapsed} />
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-slate-800/60 md:hidden"
            aria-label="Mobile navigation"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="hidden md:flex flex-col flex-shrink-0 bg-slate-950 border-r border-slate-800/60 overflow-hidden"
        aria-label="Primary navigation"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};
