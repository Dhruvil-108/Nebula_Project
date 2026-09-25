import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserRound,
  UserPlus,
  Briefcase,
  Receipt,
  Package,
  BarChart3,
  Settings,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserPlus as LeadIcon,
  Kanban,
  BookUser,
  Handshake,
  Clock,
  CalendarOff,
  Network,
  CalendarClock as CalendarEvent,
  FileText,
  Gauge,
} from 'lucide-react';
import { clsx } from 'clsx';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarNavGroup } from './SidebarNavGroup';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { UserMenu } from './UserMenu';
import { useAuth } from '../../contexts/AuthContext';
import type { Role } from '../../types/user';
import type { FocusArea } from '../../types/organization';
import type { PermissionModule } from '../../types/permissions';
import { NebulaLogo } from '../ui/NebulaLogo';

// ─────────────────────────────────────────────────────────
// Nav configuration based on role
// ─────────────────────────────────────────────────────────

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  emphasized?: boolean;
}

const pathToModuleMap: Record<string, PermissionModule> = {
  '/dashboard/crm': 'crm',
  '/dashboard/hrms': 'hrms',
  '/dashboard/recruitment': 'recruitment',
  '/dashboard/expenses': 'expenses',
  '/dashboard/inventory': 'inventory',
  '/dashboard/analytics': 'analytics',
};

const getNavConfig = (
  role: Role,
  _primaryFocus: FocusArea[]
): { primary: NavItem[]; secondary: NavItem[] } => {
  const isEmployee = role === 'employee' || role === 'intern';

  const allModules: NavItem[] = [
    { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
    { to: '/dashboard/crm', icon: <Users className="w-5 h-5" />, label: 'CRM' },
    { to: '/dashboard/hrms', icon: <UserRound className="w-5 h-5" />, label: 'HRMS' },
    { to: '/dashboard/recruitment', icon: <Briefcase className="w-5 h-5" />, label: 'Recruitment' },
    { to: '/dashboard/expenses', icon: <Receipt className="w-5 h-5" />, label: 'Expenses' },
    { to: '/dashboard/inventory', icon: <Package className="w-5 h-5" />, label: 'Inventory' },
    { to: '/dashboard/analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics' },
  ];

  // Employee and Intern get a simplified nav
  if (isEmployee) {
    return {
      primary: [
        { to: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'My Dashboard' },
        { to: '/dashboard/crm', icon: <Users className="w-5 h-5" />, label: 'CRM' },
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
    role === 'super_admin'
      ? [
        { to: '/dashboard/admin-panel', icon: <Gauge className="w-5 h-5" />, label: 'Admin Panel' },
        { to: '/dashboard/accounts', icon: <UserPlus className="w-5 h-5" />, label: 'Create Account' },
        { to: '/dashboard/org', icon: <Building2 className="w-5 h-5" />, label: 'Organization' },
        { to: '/dashboard/permissions', icon: <ShieldCheck className="w-5 h-5" />, label: 'Permissions' },
        { to: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
      ]
      : role === 'admin'
        ? [
          { to: '/dashboard/admin-panel', icon: <Gauge className="w-5 h-5" />, label: 'Admin Panel' },
          { to: '/dashboard/accounts', icon: <UserPlus className="w-5 h-5" />, label: 'Create Account' },
          { to: '/dashboard/org', icon: <Building2 className="w-5 h-5" />, label: 'Organization' },
          { to: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'Settings' },
        ]
        : role === 'hr'
          ? [
            { to: '/dashboard/accounts', icon: <UserPlus className="w-5 h-5" />, label: 'Create Account' },
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
  const { checkAccess } = useModuleAccess();
  const navConfig = getNavConfig(
    user?.role ?? 'employee',
    organization?.primaryFocus ?? []
  );

  const sidebarContent = (
    <div className="post-login-sidebar flex flex-col h-full bg-white select-none">
      {/* ── Header / Logo ── */}
      <div
        className={clsx(
          'flex items-center border-b border-[#ece0d6] py-4 transition-all duration-200',
          collapsed ? 'justify-center px-2' : 'justify-between px-4'
        )}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            className="group relative flex items-center justify-center p-1 rounded-xl hover:bg-[#fbf0e7] transition-colors focus-visible:outline-none"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <NebulaLogo compact showWordmark={false} className="group-hover:scale-105 transition-transform" />
          </button>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-center">
              <NebulaLogo className="max-w-full" />
            </div>

            {/* Collapse toggle — hidden on mobile */}
            <button
              onClick={onToggle}
              className="ml-auto hidden md:flex flex-shrink-0 w-6 h-6 rounded-md hover:bg-[#fff7ed] text-slate-400 hover:text-slate-700 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#f97316]"
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
          <div className="px-3 py-2.5 rounded-lg bg-[#fff7ed] border border-[#fed7aa] flex items-center gap-2.5 shadow-2xs">
            <div className="sidebar-workspace-mark w-7 h-7 rounded-lg bg-white border border-[#fed7aa] flex items-center justify-center text-xs font-bold text-[#f97316] flex-shrink-0 overflow-hidden shadow-xs">
              {organization.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="w-full h-full object-contain p-0.5"
                />
              ) : (
                organization.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-mono font-medium text-slate-500 uppercase tracking-wider leading-none mb-0.5 truncate">
                {organization.industry ? `${organization.industry}` : 'Workspace'}
              </p>
              <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                {organization.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Primary nav ── */}
      <nav aria-label="Primary navigation" className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 space-y-1">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
            Modules
          </p>
        )}
        {navConfig.primary.map((item) => {
          const mod = pathToModuleMap[item.to];
          if (mod && !checkAccess(mod)) {
            return null;
          }

          if (item.to === '/dashboard/crm') {
            return (
              <SidebarNavGroup
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                subItems={[
                  { to: '/dashboard/crm/leads', icon: <LeadIcon className="w-3.5 h-3.5" />, label: 'Leads' },
                  { to: '/dashboard/crm/pipeline', icon: <Kanban className="w-3.5 h-3.5" />, label: 'Pipeline' },
                  { to: '/dashboard/crm/contacts', icon: <BookUser className="w-3.5 h-3.5" />, label: 'Contacts' },
                  { to: '/dashboard/crm/companies', icon: <Building2 className="w-3.5 h-3.5" />, label: 'Companies' },
                  { to: '/dashboard/crm/deals', icon: <Handshake className="w-3.5 h-3.5" />, label: 'Deals' },
                ]}
              />
            );
          }

          if (item.to === '/dashboard/hrms') {
            return (
              <SidebarNavGroup
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                collapsed={collapsed}
                subItems={[
                  { to: '/dashboard/hrms/employees', icon: <Users className="w-3.5 h-3.5" />, label: 'Employees' },
                  { to: '/dashboard/hrms/attendance', icon: <Clock className="w-3.5 h-3.5" />, label: 'Attendance' },
                  { to: '/dashboard/hrms/leave', icon: <CalendarOff className="w-3.5 h-3.5" />, label: 'Leave' },
                  { to: '/dashboard/hrms/departments', icon: <Network className="w-3.5 h-3.5" />, label: 'Departments' },
                  { to: '/dashboard/hrms/holidays', icon: <CalendarEvent className="w-3.5 h-3.5" />, label: 'Holidays' },
                  { to: '/dashboard/hrms/documents', icon: <FileText className="w-3.5 h-3.5" />, label: 'Documents' },
                ]}
              />
            );
          }

          return (
            <SidebarNavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              collapsed={collapsed}
              emphasized={item.emphasized}
            />
          );
        })}
        {/* ── Organization nav (directly after modules) ── */}
        {navConfig.secondary.length > 0 && (
          <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
            {!collapsed && (
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-widest">
                Organization
              </p>
            )}
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
      </nav>

      {/* ── User menu ── */}
      <div className="px-3 pb-3 pt-2 border-t border-slate-100">
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
            className="post-login-sidebar fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#ece0d6] md:hidden"
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
        className="post-login-sidebar hidden md:flex flex-col flex-shrink-0 bg-white border-r border-[#ece0d6] overflow-hidden"
        aria-label="Primary navigation"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};
