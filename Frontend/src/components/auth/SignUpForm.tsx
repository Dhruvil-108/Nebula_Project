import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Building2, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export const SignUpForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    organizationName: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  // Password strength calculation
  const calculateStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordScore = calculateStrength(formData.password);

  const getStrengthLabel = () => {
    if (!formData.password) return { label: 'None', color: 'bg-slate-700', text: 'text-slate-500' };
    if (passwordScore <= 1) return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-400' };
    if (passwordScore === 2) return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-400' };
    if (passwordScore === 3) return { label: 'Good', color: 'bg-[#ff7a59]', text: 'text-[#ff7a59]' };
    return { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  };

  const strength = getStrengthLabel();

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid work email address';
    }
    if (!formData.organizationName.trim()) newErrors.organizationName = 'Organization/Company name is required';
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);

    // Simulate realistic tenant provisioning
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 1200);
  };

  const handleOAuthGoogle = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
    }, 800);
  };

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-4 shadow-xl"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Workspace Provisioned!</h3>
        <p className="text-xs text-slate-300">
          Welcome to Nebula. Your organization tenant <strong className="text-white">"{formData.organizationName || 'Your Workspace'}"</strong> has been created with full multi-tenant isolation.
        </p>
        <div className="pt-2">
          <Button 
            variant="primary" 
            className="w-full"
            onClick={() => navigate('/signin')}
          >
            Continue to Sign In →
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-5"
    >
      {/* OAuth Button */}
      <button
        type="button"
        onClick={handleOAuthGoogle}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
          />
          <path
            fill="#FBBC05"
            d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
          />
        </svg>
        <span>Continue with Google Workspace</span>
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="w-full border-t border-slate-200" />
        <span className="bg-white px-3 text-xs uppercase tracking-wider text-slate-500 font-mono font-medium">
          or register with work email
        </span>
      </div>

      {/* Main Sign Up Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        
        {/* Full Name */}
        <Input
          label="Full Name"
          type="text"
          placeholder="Sarah Jenkins"
          required
          value={formData.fullName}
          onChange={(e) => {
            setFormData({ ...formData, fullName: e.target.value });
            if (errors.fullName) setErrors({ ...errors, fullName: '' });
          }}
          error={errors.fullName}
          leftIcon={<User className="w-4 h-4" />}
        />

        {/* Work Email */}
        <Input
          label="Work Email"
          type="email"
          placeholder="sarah@company.com"
          required
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: '' });
          }}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          helperText="We use your work domain to auto-configure team settings."
        />

        {/* Organization / Tenant Name */}
        <Input
          label="Organization / Company Name"
          type="text"
          placeholder="Acme BioCorp or Global Tech Inc."
          required
          value={formData.organizationName}
          onChange={(e) => {
            setFormData({ ...formData, organizationName: e.target.value });
            if (errors.organizationName) setErrors({ ...errors, organizationName: '' });
          }}
          error={errors.organizationName}
          leftIcon={<Building2 className="w-4 h-4" />}
          helperText="Creates your isolated organization tenant."
        />

        {/* Password */}
        <div className="space-y-2">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••••••"
            required
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            error={errors.password}
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

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Security Strength:</span>
                <span className={`font-semibold font-mono ${strength.text}`}>
                  {strength.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div className={`h-full rounded-full transition-all ${passwordScore >= 1 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all ${passwordScore >= 2 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all ${passwordScore >= 3 ? strength.color : 'bg-slate-200'}`} />
                <div className={`h-full rounded-full transition-all ${passwordScore >= 4 ? strength.color : 'bg-slate-200'}`} />
              </div>
              
              {/* Checklist */}
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 pt-1">
                <span className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {formData.password.length >= 8 ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 text-center">•</span>}
                  8+ characters
                </span>
                <span className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {/[0-9]/.test(formData.password) ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 text-center">•</span>}
                  Numbers included
                </span>
                <span className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {/[A-Z]/.test(formData.password) ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 text-center">•</span>}
                  Uppercase letters
                </span>
                <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-emerald-600 font-medium' : 'text-slate-400'}`}>
                  {/[^A-Za-z0-9]/.test(formData.password) ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 text-center">•</span>}
                  Symbols (@$!%*#)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create Organization Workspace
          </Button>
        </div>

        {/* Trust microcopy */}
        <p className="text-[11px] text-center text-slate-500 leading-relaxed pt-1">
          SOC2-style security · Your data is isolated per organization · No credit card required
        </p>

        {/* Footer Link */}
        <div className="pt-4 text-center text-xs text-slate-500 border-t border-slate-200">
          Already have an account?{' '}
          <Link to="/signin" className="text-[#ea580c] font-semibold hover:text-[#c2410c] transition-colors">
            Sign in to your workspace →
          </Link>
        </div>

      </form>
    </motion.div>
  );
};
