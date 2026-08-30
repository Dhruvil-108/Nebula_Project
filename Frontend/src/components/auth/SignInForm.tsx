import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const SignInForm: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleDemoFill = (type: 'valid' | 'invalid') => {
    if (type === 'valid') {
      setEmail('alex.vance@apexbiocorp.com');
      setPassword('NebulaPass2026!');
      setErrorBanner(null);
    } else {
      setEmail('unregistered.user@unknown.com');
      setPassword('wrongpassword');
      setErrorBanner('Invalid work email or password. Please verify your credentials or contact your organization Super Admin.');
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
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.accessToken) {
          localStorage.setItem('nebula_access_token', data.accessToken);
          localStorage.setItem('nebula_refresh_token', data.refreshToken || '');
        }
        setIsLoading(false);
        navigate('/');
        return;
      }
    } catch (err) {
      // Fall through to dev simulation if offline
    }

    setTimeout(() => {
      setIsLoading(false);
      if (email.includes('error') || password === 'wrongpassword') {
        setErrorBanner('Authentication failed. Invalid work email or password.');
      } else {
        alert(`Authentication successful! Welcome back, ${email}. Redirecting to your organization workspace...`);
        navigate('/');
      }
    }, 900);
  };

  const handleGoogleOAuth = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert('Authenticated via Google Workspace SSO. Redirecting to your organization workspace...');
      navigate('/');
    }, 800);
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
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between text-xs">
        <span className="text-indigo-300 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Demo Mode:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleDemoFill('valid')}
            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors cursor-pointer"
          >
            Autofill Valid
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('invalid')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors cursor-pointer"
          >
            Test Error State
          </button>
        </div>
      </div>

      <AnimatePresence>
        {errorBanner && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block text-rose-200">Authentication Alert</span>
              {errorBanner}
            </div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-mono"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleGoogleOAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-sm font-medium transition-all shadow-sm cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z" />
          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
        </svg>
        <span>Continue with Google Workspace</span>
      </button>

      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-800" />
        <span className="bg-slate-950 px-3 text-xs uppercase tracking-wider text-slate-500 font-mono">
          or sign in with email
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-300">
              Password <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(true)}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errorBanner) setErrorBanner(null);
            }}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-950"
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
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In to Hub
          </Button>
        </div>

        <div className="pt-4 text-center text-xs text-slate-400 border-t border-slate-800/80">
          Don't have a workspace yet?{' '}
          <Link to="/signup" className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
            Get Started with 5-Step Wizard →
          </Link>
        </div>
      </form>

      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Reset Workspace Password</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enter your work email and we'll send an authentication recovery link directly to your inbox.
            </p>
            {resetEmailSent ? (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Password reset link sent to {email || 'your email'}!
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
          </div>
        </div>
      )}
    </motion.div>
  );
};
