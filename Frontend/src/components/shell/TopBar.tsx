import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Search, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileAvatar } from '../profile/ProfileAvatar';

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
  const { organization, user } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  // Notification count (0 for clean slate)
  const notifCount = 0;

  return (
    <header className="post-login-topbar flex-shrink-0 h-16 flex items-center gap-4 px-4 md:px-6 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
      {/* ── Hamburger (mobile only) ── */}
      <button
        onClick={onMobileToggle}
        className="md:hidden flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#fbf0e7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2540c]"
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
                      ? 'text-[#1a1a1a] font-medium'
                      : 'text-[#6b6b6b]'
                  )}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-[#1a1a1a] truncate">{pageTitle}</h1>
            {organization && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#fbeae0] border border-[#de7a3d] text-[10px] font-mono text-[#7a2f05] uppercase tracking-wider">
                {organization.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Global search (visual stub) ── */}
      <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-[#ece0d6] hover:border-[#d06b28] transition-colors w-52 cursor-text focus-within:border-[#c2540c]">
        <Search className="w-3.5 h-3.5 text-[#9b9b9b] flex-shrink-0" />
        <span className="text-sm text-[#9b9b9b] select-none">Search...</span>
        <kbd className="ml-auto text-[10px] text-[#6b6b6b] font-mono bg-[#fbf0e7] px-1.5 py-0.5 rounded border border-[#ece0d6]">
          ⌘K
        </kbd>
      </div>

      {/* ── Profile photo — click to open Profile page ── */}
      {user && (
        <button
          type="button"
          onClick={() => navigate('/dashboard/profile')}
          className="flex-shrink-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2540c] focus-visible:ring-offset-2 focus-visible:ring-offset-white transition-transform hover:scale-105 active:scale-95"
          title={`${user.fullName} — open profile`}
          aria-label="Open profile"
        >
          <ProfileAvatar
            fullName={user.fullName}
            sizeClass="w-9 h-9"
            textClass="text-xs"
            accentColor="#c2540c"
            editable={false}
          />
        </button>
      )}

      {/* ── Notifications ── */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative w-9 h-9 rounded-lg flex items-center justify-center text-[#6b6b6b] hover:text-[#1a1a1a] hover:bg-[#fbf0e7] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2540c]"
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
        >
          <Bell className="w-4.5 h-4.5" />
          {notifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#c2540c] border-2 border-white"
            />
          )}
        </button>

        {/* Notification dropdown */}
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-[#ece0d6] shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-[#ece0d6] flex items-center justify-between">
              <span className="text-sm font-semibold text-[#1a1a1a]">Notifications</span>
            </div>
            <div className="p-6 text-center text-xs text-[#6b6b6b]">
              No new notifications
            </div>
          </motion.div>
        )}
      </div>
    </header>
  );
};
