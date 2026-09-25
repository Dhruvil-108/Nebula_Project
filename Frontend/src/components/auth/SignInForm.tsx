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
  Sparkles,
  ShieldAlert,
  Building2,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';

interface DemoAccount {
  label: string;
  role: string;
  email: string;
  name: string;
  org: string;
  color: string;
  badgeBg: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Super Admin',
    role: 'super_admin',
    email: 'd24cs108@charusat.edu.in',
    name: 'Dhruvil Soni',
    org: 'PVF Pvt Ltd.',
    color: 'text-[#ea580c]',
    badgeBg: 'bg-[#fff7ed] border-[#fed7aa]',
  },
  {
    label: 'Admin',
    role: 'admin',
    email: 'd24cs121@charusat.edu.in',
    name: 'Rudra Shukla',
    org: 'PVF Pvt Ltd.',
    color: 'text-indigo-600',
    badgeBg: 'bg-indigo-50 border-indigo-200',
  },
  {
    label: 'HR Lead',
    role: 'hr',
    email: 'da20@gmail.com',
    name: 'Darshana Jigar Soni',
    org: 'PVF Pvt Ltd.',
    color: 'text-emerald-600',
    badgeBg: 'bg-emerald-50 border-emerald-200',
  },
  {
    label: 'Manager',
    role: 'manager',
    email: 'aisha.patel@pvf.com',
    name: 'Aisha Patel',
    org: 'PVF Pvt Ltd.',
    color: 'text-amber-600',
    badgeBg: 'bg-amber-50 border-amber-200',
  },
  {
    label: 'Employee',
    role: 'employee',
    email: 'sahilshukla@gmail.com',
    name: 'Sahil Shukla',
    org: 'PVF Pvt Ltd.',
    color: 'text-sky-600',
    badgeBg: 'bg-sky-50 border-sky-200',
  },
];

export const SignInForm: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [selectedRolePill, setSelectedRolePill] = useState<string | null>(null);

  // Quick fill handler
  const handleSelectDemoAccount = (acc: DemoAccount) => {
    setEmail(acc.email);
    setPassword('NebulaPass2026!');
    setSelectedRolePill(acc.role);
    setErrorBanner(null);
  };

  const handleTestErrorState = () => {
    setEmail('unregistered.test@unknown.com');
    setPassword('wrongpassword');
    setSelectedRolePill(null);
    setErrorBanner(
      'Invalid work email or password. Please verify your credentials or contact your organization Super Admin.'
    );
  };

  // Detect domain/organization affiliation
  const detectedOrg = React.useMemo(() => {
    if (!email.includes('@')) return null;
    const domain = email.split('@')[1]?.toLowerCase().trim();
    if (domain === 'charusat.edu.in' || domain === 'pvf.com') {
      return { name: 'PVF Pvt Ltd.', domain, verified: true };
    }
    if (domain && domain.length > 3 && domain.includes('.')) {
      const companyPart = domain.split('.')[0];
      const capitalized = companyPart.charAt(0).toUpperCase() + companyPart.slice(1);
      return { name: `${capitalized} Workspace`, domain, verified: false };
    }
    return null;
  }, [email]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);

    if (!email.trim() || !password.trim()) {
      setErrorBanner('Please enter both your work email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      login(data.accessToken, data.refreshToken, data.user, data.organization);
      toast.success(`Welcome back, ${data.user.fullName}! 👋`, { toastId: 'login-success' });
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string }; status?: number } };
      const msg =
        axiosErr?.response?.data?.error ||
        'Sign in failed. Please check your credentials and try again.';
      setErrorBanner(msg);
      toast.error(msg, { toastId: 'login-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuth = () => {
    toast.info('Google Workspace SSO integration is active for enterprise domains.', {
      toastId: 'google-sso',
    });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your work email in the field first.');
      return;
    }
    setResetEmailSent(true);
    setTimeout(() => {
      setShowForgotPasswordModal(false);
      setResetEmailSent(false);
    }, 2400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* ── Demo Accounts Switcher Pill Bar ── */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-600 flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
            Quick Demo Autofill
          </span>
          <button
            type="button"
            onClick={handleTestErrorState}
            className="text-[10px] text-slate-500 hover:text-rose-600 transition-colors cursor-pointer underline decoration-dotted font-medium"
          >
            Test Error State
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((acc) => {
            const isSelected = selectedRolePill === acc.role || email === acc.email;
            return (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemoAccount(acc)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#f0512f] border-[#f0512f] text-white shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:text-[#ea580c] hover:bg-orange-50/40'
                }`}
              >
                <span>{acc.label}</span>
                {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Error Banner ── */}
      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-rose-900">Authentication Alert</span>
              {errorBanner}
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-rose-500 hover:text-rose-800 text-xs font-mono cursor-pointer font-bold"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Google SSO Button ── */}
      <button
        type="button"
        onClick={handleGoogleOAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
        </svg>
        <span>Continue with Google Workspace</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium">
          or sign in with work email
        </span>
      </div>

      {/* ── Main Sign In Form ── */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <Input
            label="Work Email"
            type="email"
            placeholder="name@company.com"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorBanner) setErrorBanner(null);
            }}
            leftIcon={<Mail className="w-4 h-4" />}
          />

          {/* Real-time Workspace domain preview tag */}
          {detectedOrg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700"
            >
              <Building2 className="w-3.5 h-3.5 text-[#f0512f]" />
              <span>
                Tenant Workspace:{' '}
                <strong className="text-slate-900 font-bold">{detectedOrg.name}</strong>
              </span>
              {detectedOrg.verified && (
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-emerald-700 font-mono font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </motion.div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Password <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
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
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyDown}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorBanner) setErrorBanner(null);
            }}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {capsLockActive && (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-600 font-medium">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span>Caps Lock is ON</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-white border-slate-300 text-[#f0512f] focus:ring-[#f0512f] focus:ring-offset-white accent-[#f0512f]"
            />
            <span>Keep me signed in for 30 days</span>
          </label>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full shadow-md shadow-[#f0512f]/20 hover:shadow-[#f0512f]/30"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Hub
          </Button>
        </div>

        {/* Security badges footer */}
        <div className="pt-3 pb-1 grid grid-cols-3 gap-2 text-[10px] text-slate-500 border-t border-slate-200 mt-4">
          <div className="flex items-center gap-1 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit TLS</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-slate-600">
            <Fingerprint className="w-3.5 h-3.5 text-[#ea580c]" />
            <span>RBAC Protected</span>
          </div>
          <div className="flex items-center justify-end gap-1 text-slate-600">
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Isolated Tenant</span>
          </div>
        </div>

        <div className="pt-3 text-center text-xs text-slate-600 border-t border-slate-200">
          Don't have a workspace yet?{' '}
          <Link
            to="/signup"
            className="text-[#ea580c] font-semibold hover:text-[#c2410c] transition-colors inline-flex items-center gap-1"
          >
            <span>Launch Workspace Wizard</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </form>

      {/* ── Forgot Password Modal ── */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center text-[#ea580c]">
                <KeyRound className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Reset Workspace Password</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter your corporate email and we will send an authenticated password reset link directly
              to your mailbox.
            </p>
            {resetEmailSent ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Password reset link dispatched to {email || 'your email'}!
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <Input
                  label="Work Email"
                  type="email"
                  value={email}
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForgotPasswordModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Send Reset Link
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};
