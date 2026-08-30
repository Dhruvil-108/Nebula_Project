import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

interface TopBarProps {
  mobileOpen: boolean;
  onMobileToggle: () => void;
  pageTitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
}

export const TopBar: React.FC<TopBarProps> = ({
  mobileOpen,
  onMobileToggle,
  pageTitle = 'Dashboard',
  breadcrumbs = [],
}) => {
  const { organization } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);

  // Notification count (0 for clean slate)
  const notifCount = 0;

  return (
    <header className="flex-shrink-0 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={onMobileToggle}
        className="md:hidden flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── Page title / breadcrumbs ── */}
      <div className="flex-1 min-w-0">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-600">/</span>}
                <span
                  className={clsx(
                    idx === breadcrumbs.length - 1
                      ? 'text-slate-200 font-medium'
                      : 'text-slate-500'
                  )}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-slate-100 truncate">{pageTitle}</h1>
            {organization && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                {organization.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Global search (visual stub) ── */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors w-52 cursor-text">
        <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
        <span className="text-sm text-slate-500 select-none">Search...</span>
        <kbd className="ml-auto text-[10px] text-slate-600 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
          ⌘K
        </kbd>
      </div>

      {/* ── Notifications ── */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
        >
          <Bell className="w-4.5 h-4.5" />
          {notifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 border-2 border-slate-950"
            />
          )}
        </button>

        {/* Notification dropdown */}
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-80 rounded-xl bg-slate-900 border border-slate-700/60 shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-100">Notifications</span>
            </div>
            <div className="p-6 text-center text-xs text-slate-500">
              No new notifications
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};
