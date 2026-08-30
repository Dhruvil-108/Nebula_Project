import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

// Map routes to human-readable page titles
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/crm': 'CRM',
  '/dashboard/hrms': 'HRMS',
  '/dashboard/recruitment': 'Recruitment',
  '/dashboard/expenses': 'Expenses',
  '/dashboard/inventory': 'Inventory',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/settings': 'Settings',
  '/dashboard/org': 'Organization',
  '/dashboard/profile': 'My Profile',
};

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-collapse on tablet breakpoint
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(false); // Don't collapse on mobile — use drawer instead
      } else if (window.innerWidth < 1024) {
        setCollapsed(true); // Icon-only on tablet
      } else {
        setCollapsed(false); // Full on desktop
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Dashboard';

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          mobileOpen={mobileOpen}
          onMobileToggle={() => setMobileOpen((o) => !o)}
          pageTitle={pageTitle}
        />

        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto bg-slate-950"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
