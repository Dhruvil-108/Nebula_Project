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
  ChevronsUpDown,
  Search,
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
    <div
      className="post-login-sidebar flex flex-col h-full select-none"
      style={{ background: '#fafafb' }}
    >
      {/* ── Header / Logo ── */}
      <div
        className={clsx(
          'flex items-center py-3.5 transition-all duration-200',
          collapsed ? 'justify-center px-3' : 'justify-between px-4'
        )}
        style={{ borderBottom: '1px solid var(--pl-border-subtle)' }}
      >
        {collapsed ? (
          <button
            onClick={onToggle}
            className="group relative flex items-center justify-center p-1.5 rounded-xl hover:bg-slate-100 focus-visible:outline-none transition-all duration-150"
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
            <button
              onClick={onToggle}
              className="ml-auto hidden md:flex flex-shrink-0 w-7 h-7 rounded-lg items-center justify-center transition-all duration-150 focus-visible:outline-none border border-slate-200/80 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 shadow-2xs"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* ── Workspace Card ── */}
      {!collapsed && organization && (
        <div className="px-3 pt-3 pb-1">
          <div className="group flex items-center justify-between p-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all cursor-pointer">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0">
                {organization.logoUrl ? (
                  <img
                    src={organization.logoUrl}
                    alt={organization.name}
                    className="w-full h-full object-contain p-0.5 rounded-lg"
                  />
                ) : (
                  organization.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight group-hover:text-slate-900">
                  {organization.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[10px] font-medium text-slate-400 truncate">
                    {organization.industry || 'Active Workspace'}
                  </span>
                </div>
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
          </div>
        </div>
      )}

      {/* ── Quick Search Trigger ── */}
      {!collapsed && (
        <div className="px-3 pt-1.5 pb-1">
          <button
            onClick={() => {
              const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search"]') as HTMLInputElement;
              searchInput?.focus();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/80 text-slate-400 hover:text-slate-600 hover:border-slate-300 text-xs shadow-2xs transition-all"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[12px]">Quick jump...</span>
            </div>
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-medium bg-slate-50 border border-slate-200/80 rounded text-slate-400">
              Ctrl K
            </kbd>
          </button>
        </div>
      )}

      {/* ── Primary nav ── */}
      <nav aria-label="Primary navigation" className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-2 space-y-0.5">
        {!collapsed && (
          <p className="px-3 pt-2 pb-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate-400">
            Core Engines
          </p>
        )}
        {navConfig.primary.map((item) => {
          const mod = pathToModuleMap[item.to];
          if (mod && !checkAccess(mod)) return null;

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

        {/* ── Organization nav ── */}
        {navConfig.secondary.length > 0 && (
          <div
            className="pt-3 mt-3 space-y-0.5"
            style={{ borderTop: '1px solid var(--pl-border-subtle)' }}
          >
            {!collapsed && (
              <p className="px-3 pt-2 pb-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                Platform & Admin
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
      <div
        className="px-3 pb-3 pt-2"
        style={{ borderTop: '1px solid var(--pl-border-subtle)' }}
      >
        <UserMenu collapsed={collapsed} />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="post-login-sidebar fixed inset-y-0 left-0 z-50 w-72 md:hidden"
            style={{
              background: 'var(--pl-sidebar-bg)',
              borderRight: '1px solid var(--pl-border-subtle)',
              boxShadow: '4px 0 24px -8px rgba(0,0,0,0.08)',
            }}
            aria-label="Mobile navigation"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="post-login-sidebar hidden md:flex flex-col flex-shrink-0 overflow-hidden"
        style={{
          background: '#fafafb',
          borderRight: '1px solid #e2e8f0',
          boxShadow: '1px 0 2px 0 rgba(0,0,0,0.02)',
        }}
        aria-label="Primary navigation"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};
