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
          'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
          open && 'bg-slate-800/60'
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
          {initials}
        </div>

        {/* Name + role */}
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-slate-100 truncate">{user.fullName}</p>
            <p className={clsx('text-[10px] font-medium truncate', ROLE_COLORS[user.role])}>
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        )}

        {!collapsed && (
          <ChevronUp
            className={clsx(
              'w-4 h-4 text-slate-500 transition-transform duration-200',
              open ? 'rotate-180' : 'rotate-0'
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
              'absolute z-50 mb-2 w-56 rounded-xl bg-slate-900 border border-slate-700/60 shadow-2xl overflow-hidden',
              collapsed ? 'bottom-full left-full ml-3' : 'bottom-full left-0 right-0'
            )}
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-slate-800">
              <p className="text-sm font-semibold text-white">{user.fullName}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
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
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile
              </button>
              <button
                onClick={() => { setOpen(false); navigate('/dashboard/settings'); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                Organization Settings
              </button>
            </div>

            <div className="py-1 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
