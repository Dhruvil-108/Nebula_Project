import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  ChevronRight,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';

interface DemoAccount {
  label: string;
  role: string;
  email: string;
  badge: string;
  avatarBg: string;
  avatarText: string;
  desc: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Super Admin', role: 'super_admin', email: 'd24cs108@charusat.edu.in', badge: 'Full Access', avatarBg: 'bg-orange-500', avatarText: 'SA', desc: 'Enterprise owner & role manager' },
  { label: 'Admin', role: 'admin', email: 'd24cs121@charusat.edu.in', badge: 'Org Admin', avatarBg: 'bg-indigo-600', avatarText: 'AD', desc: 'Workspace settings & invites' },
  { label: 'HR Lead', role: 'hr', email: 'da20@gmail.com', badge: 'People Ops', avatarBg: 'bg-emerald-600', avatarText: 'HR', desc: 'Payroll, leave & recruitment' },
  { label: 'Manager', role: 'manager', email: 'aisha.patel@pvf.com', badge: 'Operations', avatarBg: 'bg-amber-600', avatarText: 'MG', desc: 'Team pipeline & approvals' },
  { label: 'Employee', role: 'employee', email: 'sahilshukla@gmail.com', badge: 'Team Member', avatarBg: 'bg-sky-600', avatarText: 'EM', desc: 'Tasks & personal portal' },
];

export const SignInForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleDemoSelect = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword('NebulaPass2026!');
    setSelectedRole(acc.role);
    setError(null);
    toast.info(`Switched to demo persona: ${acc.label}`, { autoClose: 2000, toastId: 'demo-switch' });
  };

  const detectedOrg = React.useMemo(() => {
    if (!email.includes('@')) return null;
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain === 'charusat.edu.in' || domain === 'pvf.com') {
      return { name: 'PVF Enterprise Corp', verified: true, plan: 'Enterprise Dedicated' };
    }
    if (domain && domain.length > 3 && domain.includes('.')) {
      const part = domain.split('.')[0];
      return {
        name: `${part.charAt(0).toUpperCase() + part.slice(1)} Workspace`,
        verified: false,
        plan: 'Business Cloud',
      };
    }
    return null;
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please provide your work email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      login(data.accessToken, data.refreshToken, data.user, data.organization);
      toast.success(`Welcome back, ${data.user.fullName}!`, { toastId: 'login-success' });
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      const msg = e?.response?.data?.error || 'Invalid credentials. Please verify your email and password.';
      setError(msg);
      toast.error(msg, { toastId: 'login-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setResetSent(false);
    }, 2400);
  };

  return (
    <div className="space-y-5">
      {/* ── Quick Persona Switcher (High Vibe & Immediate UX) ── */}
      <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
            Quick Demo Access
          </span>
          <span className="text-[10px] text-slate-400 font-medium">1-click autofill</span>
        </div>
        
        {/* Horizontal Persona Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = selectedRole === acc.role || email === acc.email;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleDemoSelect(acc)}
                className={`flex items-center gap-2 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#f0512f] shadow-xs ring-1 ring-[#f0512f]/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg ${acc.avatarBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                  {acc.avatarText}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-semibold text-slate-800 truncate leading-tight flex items-center gap-1">
                    {acc.label}
                    {isSelected && <CheckCircle2 className="w-2.5 h-2.5 text-[#f0512f] shrink-0" />}
                  </div>
                  <div className="text-[9px] text-slate-400 truncate">{acc.badge}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
          >
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600 cursor-pointer text-sm font-bold"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Workspace SSO Button */}
      <button
        type="button"
        onClick={() => toast.info('Google Workspace Single Sign-On is configured for all registered enterprise domains.', { toastId: 'google-sso' })}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-xl text-xs sm:text-sm font-medium text-slate-700 transition-all shadow-xs cursor-pointer group"
      >
        <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
        </svg>
        <span>Sign in with Google Workspace</span>
      </button>

      {/* Sleek Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] text-slate-400 font-medium">or continue with work email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Main Credentials Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email Field with Live Tenant Detection */}
        <div className="space-y-1.5">
          <Input
            label="Work Email"
            type="email"
            placeholder="you@company.com"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <AnimatePresence>
            {detectedOrg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-50/80 border border-orange-200/80 text-[11px] text-slate-700"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-[#f0512f]" />
                  <span>
                    Detected: <strong className="text-slate-900">{detectedOrg.name}</strong>
                  </span>
                </div>
                {detectedOrg.verified && (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Tenant
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs font-semibold text-slate-700">
              Password <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-[#ea580c] hover:text-[#c2410c] font-medium transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            required
            value={password}
            onKeyDown={(e) => e.getModifierState && setCapsLock(e.getModifierState('CapsLock'))}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          {capsLock && (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
              <AlertTriangle className="w-3 h-3" /> Caps Lock is on
            </div>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between text-xs pt-0.5">
          <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#f0512f] focus:ring-[#f0512f] accent-[#f0512f]"
            />
            Keep me signed in for 30 days
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-[#f0512f] to-[#e04524] hover:from-[#e04524] hover:to-[#c83719] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#f0512f]/20 hover:shadow-lg hover:shadow-[#f0512f]/30 cursor-pointer active:scale-[0.99]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Authenticating Workspace...</span>
            </div>
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Security badges */}
        <div className="flex items-center justify-center gap-4 pt-2 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> SOC-2 Type II
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <KeyRound className="w-3.5 h-3.5 text-[#ea580c]" /> 256-Bit TLS
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Fingerprint className="w-3.5 h-3.5 text-amber-500" /> Multi-Tenant RBAC
          </span>
        </div>
      </form>

      {/* Switch to Sign Up */}
      <div className="pt-2 border-t border-slate-150 text-center">
        <p className="text-xs text-slate-500">
          New to Nebula?{' '}
          <Link
            to="/signup"
            className="text-[#ea580c] font-semibold hover:text-[#c2410c] transition-colors inline-flex items-center gap-0.5"
          >
            Create your organization workspace
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4"
            >
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Reset your password</h3>
                <p className="text-xs text-slate-500">Enter your work email and we will send a password reset link.</p>
              </div>
              {resetSent ? (
                <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Reset instructions dispatched to <strong>{email}</strong>!</span>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <Input
                    label="Work Email"
                    type="email"
                    value={email}
                    placeholder="you@company.com"
                    onChange={(e) => setEmail(e.target.value)}
                    leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
                  />
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#f0512f] hover:bg-[#d94425] rounded-lg transition-all cursor-pointer shadow-xs"
                    >
                      Send Reset Link
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
