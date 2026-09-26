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
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Shield,
  Layers,
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { NebulaLogo } from '../components/ui/NebulaLogo';
import { BorderBeam } from '../components/ui/BorderBeam';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

interface DemoAccount {
  label: string;
  role: string;
  email: string;
  badge: string;
  avatarBg: string;
  avatarText: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { label: 'Super Admin', role: 'super_admin', email: 'd24cs108@charusat.edu.in', badge: 'Full Access', avatarBg: 'bg-orange-500', avatarText: 'SA' },
  { label: 'Admin', role: 'admin', email: 'd24cs121@charusat.edu.in', badge: 'Org Admin', avatarBg: 'bg-indigo-600', avatarText: 'AD' },
  { label: 'HR Lead', role: 'hr', email: 'da20@gmail.com', badge: 'People Ops', avatarBg: 'bg-emerald-600', avatarText: 'HR' },
  { label: 'Manager', role: 'manager', email: 'aisha.patel@pvf.com', badge: 'Operations', avatarBg: 'bg-amber-600', avatarText: 'MG' },
  { label: 'Employee', role: 'employee', email: 'sahilshukla@gmail.com', badge: 'Member', avatarBg: 'bg-sky-600', avatarText: 'EM' },
];

export const SignInPage: React.FC = () => {
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
      return { name: 'PVF Enterprise Corp', verified: true };
    }
    if (domain && domain.length > 3 && domain.includes('.')) {
      const part = domain.split('.')[0];
      return {
        name: `${part.charAt(0).toUpperCase() + part.slice(1)} Workspace`,
        verified: false,
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
    <div className="h-screen w-full bg-white text-slate-900 selection:bg-[#f0512f]/20 selection:text-[#c2410c] relative flex flex-col justify-between overflow-hidden">

      {/* ── Background: Subtle warm grid from Landing Page ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -5%, rgba(240,81,47,0.07) 0%, transparent 65%),
            linear-gradient(rgba(30,20,10,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,20,10,0.035) 1px, transparent 1px)
          `,
          backgroundSize: 'auto, 40px 40px, 40px 40px',
        }}
      />

      {/* ── Polished Top Header Bar (Full-width edge-to-edge) ── */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-16 pt-3.5 pb-2.5 flex items-center justify-between gap-4 border-b border-slate-200/40 bg-white/40 backdrop-blur-xs">
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <NebulaLogo />
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-slate-50 border border-slate-200 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse mr-1.5" />
            Operations Gateway
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0">
          <span className="text-slate-500 font-medium hidden sm:inline">Need an account?</span>
          <Link
            to="/signup"
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f0512f] hover:bg-[#d94425] text-white font-semibold rounded-xl shadow-xs transition-colors"
          >
            <span>Start Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* ── Main Section: Centered 75% Wide Rectangle Card (No Scrolling) ── */}
      <main className="relative z-10 w-full flex-1 flex items-center justify-center px-4 py-2">
        {/* ── Left Side: Enterprise Architectural Telemetry Pillar ── */}
        <div className="hidden xl:flex flex-col justify-between h-[380px] w-44 absolute left-4 2xl:left-8 top-1/2 -translate-y-1/2 z-10 select-none">
          {/* Node 1 */}
          <div className="space-y-1 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              <span>Telemetry // 01</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-slate-800">99.98% SLA Cluster</div>
            <div className="text-[10px] font-mono text-emerald-600 font-semibold">Live Latency: 8.4ms</div>
            <div className="text-[9px] text-slate-400">Node: us-east-prod</div>
          </div>

          {/* Vertical Connecting Laser Guide */}
          <div className="flex-1 flex justify-center py-2 relative">
            <div className="w-px h-full bg-gradient-to-b from-slate-200 via-orange-300 to-slate-200" />
            <motion.div
              animate={{ y: [0, 80, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute w-1.5 h-3 rounded-full bg-[#f0512f] shadow-xs"
            />
          </div>

          {/* Node 2 */}
          <div className="space-y-1 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              Zero-Trust // 02
            </div>
            <div className="text-xs font-bold text-slate-800">Tenant Isolation</div>
            <div className="text-[10px] font-mono text-slate-500">AES-256 Encryption</div>
            <div className="text-[9px] text-slate-400">Role-Based Access Armed</div>
          </div>
        </div>

        {/* ── Right Side: Enterprise Compliance & Verification Pillar ── */}
        <div className="hidden xl:flex flex-col justify-between h-[380px] w-44 absolute right-4 2xl:right-8 top-1/2 -translate-y-1/2 z-10 select-none">
          {/* Node 3 */}
          <div className="space-y-1 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              <span>Security // 03</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            </div>
            <div className="text-xs font-bold text-slate-800">SOC 2 Type II</div>
            <div className="text-[10px] font-mono text-indigo-600 font-semibold">Continuous Audit</div>
            <div className="text-[9px] text-slate-400">ISO 27001 Aligned</div>
          </div>

          {/* Vertical Connecting Laser Guide */}
          <div className="flex-1 flex justify-center py-2 relative">
            <div className="w-px h-full bg-gradient-to-b from-slate-200 via-indigo-300 to-slate-200" />
            <motion.div
              animate={{ y: [0, 80, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute w-1.5 h-3 rounded-full bg-indigo-500 shadow-xs"
            />
          </div>

          {/* Node 4 */}
          <div className="space-y-1 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              Architecture // 04
            </div>
            <div className="text-xs font-bold text-slate-800">6 Core Engines</div>
            <div className="text-[10px] font-mono text-orange-600 font-semibold">Sub-ms Event Mesh</div>
            <div className="text-[9px] text-slate-400">CRM • HRMS • ERP • AI</div>
          </div>
        </div>

        {/* ── Center 75% Rectangle Card with Moving Border Beam ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-[94%] sm:w-[88%] lg:w-[75%] max-w-5xl relative z-10"
        >
          {/* Main Card with clean border + Active Moving Border Beam */}
          <div className="relative rounded-[24px] border border-slate-200/90 shadow-2xl shadow-slate-900/10 bg-white">
            {/* The Moving Orange Border Beam traveling around the border */}
            <BorderBeam duration={7} size={32} strokeWidth={2.5} />

            <div className="relative z-10 bg-white rounded-[23px] overflow-hidden grid grid-cols-1 lg:grid-cols-12">

              {/* ── Left Half of Rectangle: Brand & 1-Click Quick Demo Access ── */}
              <div className="lg:col-span-5 bg-gradient-to-br from-slate-50/90 via-orange-50/20 to-white p-6 sm:p-7 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col justify-between">
                <div>
                  {/* Eyebrow Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#ea580c] text-[11px] font-semibold mb-3 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse" />
                    v2.4 Unified Business Hub
                  </div>

                  <h1 className="text-2xl sm:text-[1.75rem] font-bold tracking-tight text-slate-950 leading-tight">
                    Sign in to{' '}
                    <span className="relative inline-block text-[#f0512f]">
                      Nebula
                      <svg
                        viewBox="0 0 120 8"
                        className="absolute -bottom-1 left-0 w-full overflow-visible"
                      >
                        <path
                          d="M 2 5 C 30 1, 80 8, 118 4"
                          stroke="#f0512f"
                          strokeWidth="2"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.4"
                        />
                      </svg>
                    </span>
                  </h1>

                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Single gateway to your CRM, HRMS, Inventory, and Financial command center.
                  </p>

                  {/* 1-Click Persona Switcher */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
                        Quick Demo Personas
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">1-click autofill</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5">
                      {DEMO_ACCOUNTS.map((acc) => {
                        const isSelected = selectedRole === acc.role || email === acc.email;
                        return (
                          <button
                            key={acc.role}
                            type="button"
                            onClick={() => handleDemoSelect(acc)}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                                ? 'bg-orange-50/80 border-[#f0512f] shadow-2xs ring-1 ring-[#f0512f]/20'
                                : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className={`w-6 h-6 rounded-lg ${acc.avatarBg} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                              {acc.avatarText}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-slate-800 truncate flex items-center gap-1">
                                {acc.label}
                                {isSelected && <CheckCircle2 className="w-3 h-3 text-[#f0512f] shrink-0" />}
                              </div>
                              <div className="text-[10px] text-slate-400 truncate">{acc.email}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-4 mt-4 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> SOC-2 Type II
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-[#ea580c]" /> 256-Bit TLS
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Fingerprint className="w-3 h-3 text-amber-500" /> Multi-Tenant
                  </span>
                </div>
              </div>

              {/* ── Right Half of Rectangle: Form Inputs & Submit ── */}
              <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-center">

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-start gap-2.5 px-3.5 py-2.5 mb-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700"
                    >
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span className="flex-1">{error}</span>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-600 cursor-pointer font-bold"
                      >
                        ×
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Google SSO Button */}
                <button
                  type="button"
                  onClick={() => toast.info('Google Workspace SSO is configured for all registered enterprise domains.', { toastId: 'google-sso' })}
                  className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-xl text-xs sm:text-sm font-medium text-slate-700 transition-all shadow-2xs cursor-pointer group"
                >
                  <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                    <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
                  </svg>
                  <span>Continue with Google Workspace</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-slate-200/80" />
                  <span className="text-[11px] text-slate-400 font-medium">or continue with work email</span>
                  <div className="flex-1 h-px bg-slate-200/80" />
                </div>

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
                  {/* Email with Tenant Tag */}
                  <div className="space-y-1">
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
                          className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200/80 text-[11px] text-slate-700"
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-[#f0512f]" />
                            <span>Workspace: <strong className="text-slate-900">{detectedOrg.name}</strong></span>
                          </div>
                          {detectedOrg.verified && (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-[11px] text-[#ea580c] hover:text-[#c2410c] font-medium transition-colors cursor-pointer"
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
                      <div className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Caps Lock is on
                      </div>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <label className="flex items-center gap-2 text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-[#f0512f] focus:ring-[#f0512f] accent-[#f0512f]"
                      />
                      Remember me for 30 days
                    </label>
                  </div>

                  {/* Primary Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-[#f0512f] to-[#e04524] hover:from-[#e04524] hover:to-[#c83719] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-[#f0512f]/20 hover:shadow-lg hover:shadow-[#f0512f]/30 cursor-pointer"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Authenticating...</span>
                      </div>
                    ) : (
                      <>
                        <span>Sign In to Workspace</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

              </div>

            </div>
          </div>
        </motion.div>
      </main>

      {/* ── Minimal Footer (Full-width edge-to-edge) ── */}
      <footer className="relative z-10 w-full px-6 sm:px-10 lg:px-16 py-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-200/50">
        <div>
          <span>© {new Date().getFullYear()} Nebula Hub Inc.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/" className="hover:text-slate-600 transition-colors">Home</Link>
          <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-slate-600 transition-colors">Security</a>
        </div>
      </footer>

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
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
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
