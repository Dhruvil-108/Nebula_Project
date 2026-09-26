import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  ChevronUp,
  Shield,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '../../types/user';

interface UserMenuProps {
  collapsed: boolean;
}

export const UserMenu: React.FC<UserMenuProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.fullName
    ? user.fullName
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'U';

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate('/signin');
  };

  if (!user) return null;

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'w-full flex items-center gap-3 p-2 rounded-xl transition-all duration-150 focus-visible:outline-none border',
          open
            ? 'bg-white border-slate-200 shadow-2xs'
            : 'bg-transparent hover:bg-white/90 border-transparent hover:border-slate-200/80 hover:shadow-2xs'
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar with live status ring */}
        <div className="relative flex-shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-xs"
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            }}
          >
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        </div>

        {/* Name + role */}
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-semibold text-slate-900 truncate leading-tight">{user.fullName}</p>
            <p className="text-[10px] font-mono font-medium text-slate-400 truncate mt-0.5">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        )}

        {!collapsed && (
          <ChevronUp
            className={clsx(
              'w-3.5 h-3.5 transition-transform duration-200 text-slate-400',
              open ? 'rotate-180 text-slate-700' : 'rotate-0'
            )}
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute z-50 mb-2 w-56 rounded-2xl overflow-hidden',
              collapsed ? 'bottom-full left-full ml-3' : 'bottom-full left-0 right-0'
            )}
            style={{
              background: 'var(--pl-surface)',
              border: '1px solid var(--pl-border)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 20px 40px -12px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)',
            }}
          >
            {/* User info header */}
            <div
              className="px-4 py-3"
              style={{
                borderBottom: '1px solid var(--pl-border)',
                background: 'linear-gradient(135deg, #fff7ed 0%, #fef3e8 100%)',
              }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--pl-text-primary)' }}>{user.fullName}</p>
              <p className="text-xs truncate" style={{ color: 'var(--pl-text-muted)' }}>{user.email}</p>
              <span
                className={clsx(
                  'inline-flex mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                  ROLE_COLORS[user.role]
                )}
              >
                <Shield className="w-2.5 h-2.5 mr-1" />
                {ROLE_LABELS[user.role]}
              </span>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => { setOpen(false); navigate('/dashboard/profile'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--pl-text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pl-canvas)'; e.currentTarget.style.color = 'var(--pl-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pl-text-secondary)'; }}
              >
                <User className="w-4 h-4" style={{ color: 'var(--pl-text-faint)' }} />
                Profile
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/dashboard/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--pl-text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--pl-canvas)'; e.currentTarget.style.color = 'var(--pl-text-primary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--pl-text-secondary)'; }}
              >
                <Settings className="w-4 h-4" style={{ color: 'var(--pl-text-faint)' }} />
                Organization Settings
              </button>
            </div>

            <div className="py-1" style={{ borderTop: '1px solid var(--pl-border)' }}>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
