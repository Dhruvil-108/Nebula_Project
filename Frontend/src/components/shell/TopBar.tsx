import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Search, Menu, X, Sparkles } from 'lucide-react';
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

  const notifCount = 0;

  return (
    <header
      className="post-login-topbar flex-shrink-0 h-14 flex items-center gap-3 px-4 md:px-6 border-b sticky top-0 z-30"
      style={{
        background: 'var(--pl-topbar-bg)',
        borderColor: 'var(--pl-topbar-border)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        boxShadow: '0 1px 0 0 var(--pl-border), 0 2px 12px -4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMobileToggle}
        className="md:hidden flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 focus-visible:outline-none"
        style={{ color: 'var(--pl-text-muted)', background: 'transparent' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pl-brand-xlight)'; e.currentTarget.style.color = 'var(--pl-text-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pl-text-muted)'; }}
        aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
      >
        {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        {breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span style={{ color: 'var(--pl-border-strong)' }} className="text-xs">/</span>}
                <span
                  className={clsx('text-sm', idx === breadcrumbs.length - 1 ? 'font-semibold' : 'font-normal')}
                  style={{ color: idx === breadcrumbs.length - 1 ? 'var(--pl-text-primary)' : 'var(--pl-text-muted)' }}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <div className="flex items-center gap-2.5">
            <h1 className="text-sm font-semibold truncate" style={{ color: 'var(--pl-text-primary)' }}>
              {pageTitle}
            </h1>
            {organization && (
              <span
                className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                style={{
                  background: 'linear-gradient(135deg, #fff7ed 0%, #fff3e8 100%)',
                  border: '1px solid var(--pl-brand-border)',
                  color: 'var(--pl-text-brand)',
                }}
              >
                {organization.name}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Global search */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-text transition-all duration-150 w-48"
        style={{ background: 'var(--pl-surface)', border: '1px solid var(--pl-border)' }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--pl-brand-border)'; el.style.boxShadow = '0 0 0 3px var(--pl-brand-soft)'; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--pl-border)'; el.style.boxShadow = 'none'; }}
      >
        <Search className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pl-text-faint)' }} />
        <span className="text-[13px] flex-1 select-none" style={{ color: 'var(--pl-text-faint)' }}>Search...</span>
        <kbd
          className="text-[9px] font-mono px-1 py-0.5 rounded"
          style={{ background: 'var(--pl-canvas)', border: '1px solid var(--pl-border-strong)', color: 'var(--pl-text-muted)' }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen((o) => !o)}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 focus-visible:outline-none"
          style={{ color: 'var(--pl-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pl-brand-xlight)'; e.currentTarget.style.color = 'var(--pl-text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pl-text-muted)'; }}
          aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ''}`}
        >
          <Bell className="w-4 h-4" />
          {notifCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full border border-white"
              style={{ background: 'var(--pl-brand)' }}
            />
          )}
        </button>

        <AnimatePresence>
          {notifOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 mt-2 w-80 rounded-2xl overflow-hidden z-50"
              style={{
                background: 'var(--pl-surface)',
                border: '1px solid var(--pl-border)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)',
              }}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--pl-border)' }}>
                <span className="text-sm font-semibold" style={{ color: 'var(--pl-text-primary)' }}>Notifications</span>
                <span className="pl-badge-brand">0 new</span>
              </div>
              <div className="p-8 text-center">
                <div
                  className="w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: 'var(--pl-canvas)', border: '1px solid var(--pl-border)' }}
                >
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--pl-brand)' }} />
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--pl-text-muted)' }}>All caught up!</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--pl-text-faint)' }}>No new notifications</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile avatar */}
      {user && (
        <button
          type="button"
          onClick={() => navigate('/dashboard/profile')}
          className="flex-shrink-0 rounded-xl transition-all duration-150 focus-visible:outline-none hover:scale-105 active:scale-95"
          style={{ boxShadow: '0 0 0 2px transparent' }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--pl-brand-border)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px transparent'; }}
          title={`${user.fullName} — open profile`}
          aria-label="Open profile"
        >
          <ProfileAvatar
            fullName={user.fullName}
            sizeClass="w-8 h-8"
            textClass="text-xs"
            accentColor="#f97316"
            editable={false}
          />
        </button>
      )}
    </header>
  );
};
