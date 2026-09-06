import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Building2, 
  User, 
  Mail, 
  Layers, 
  UserPlus, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TeammateInvite } from './WizardStepInvites';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/apiClient';

interface WizardStepReviewProps {
  formData: {
    fullName: string;
    email: string;
    password: string;
    organizationName: string;
    companySize: string;
    industry: string;
    primaryFocus: string[];
    invites: TeammateInvite[];
  };
  onBack: () => void;
  onComplete: () => void;
}

export const WizardStepReview: React.FC<WizardStepReviewProps> = ({
  formData,
  onBack,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validInvites = formData.invites.filter((inv) => inv.email.trim().length > 0);

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    setApiError(null);

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      organizationName: formData.organizationName,
      companySize: formData.companySize || '1-10',
      industry: formData.industry || 'General',
      primaryFocus: formData.primaryFocus.length > 0 ? formData.primaryFocus : ['all'],
      invites: validInvites,
    };

    try {
      const { data } = await apiClient.post('/auth/signup', payload);
      login(data.accessToken, data.refreshToken, data.user, data.organization);
      toast.success(
        `🎉 Workspace "${data.organization.name}" is live! Welcome, ${data.user.fullName}.`,
        { toastId: 'signup-success', autoClose: 5000 }
      );
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      const msg =
        axiosErr?.response?.data?.error ||
        'Workspace creation failed. Please try again.';
      setApiError(msg);
      toast.error(msg, { toastId: 'signup-error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Workspace Summary Card */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 text-xs">
        
        {/* Section 1: Account */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
              Super Admin Account
            </span>
            <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
              <User className="w-4 h-4 text-[#ff7a59]" />
              {formData.fullName || 'Sarah Jenkins'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">{formData.email || 'sarah@company.com'}</div>
          </div>
          <Badge variant="brand" size="sm">Super Admin</Badge>
        </div>

        {/* Section 2: Organization */}
        <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">
              Organization Tenant
            </span>
            <div className="font-semibold text-white flex items-center gap-1.5 text-sm">
              <Building2 className="w-4 h-4 text-[#f0512f]" />
              {formData.organizationName || 'Acme BioCorp'}
            </div>
            <div className="text-slate-400 text-[11px] mt-0.5">
              Company Size: {formData.companySize || '1-10'} · Industry: {formData.industry || 'General'}
            </div>
          </div>
          <Badge variant="emerald" size="sm" dot>Tenant Partitioned</Badge>
        </div>

        {/* Section 3: Focus Modules */}
        <div className="pb-3 border-b border-slate-800">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
            Initial Focus Modules
          </span>
          <div className="flex flex-wrap gap-1.5">
            {formData.primaryFocus.map((f) => (
              <Badge key={f} variant="brand" size="sm">
                {f.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>

        {/* Section 4: Pending Teammates */}
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
            Teammate Invites ({validInvites.length})
          </span>
          {validInvites.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">No teammate invites added. You can invite teammates anytime from workspace settings.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {validInvites.map((inv, i) => (
                <span key={i} className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#ff7a59]" />
                  {inv.email} ({inv.role})
                </span>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          SOC2 Multi-Tenant Encryption Ready
        </span>
        <span className="font-mono text-white">No Credit Card Required</span>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-1/3"
        >
          Back
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          isLoading={isLoading}
          onClick={handleFinalSubmit}
          className="w-2/3 shadow-xl shadow-[#f0512f]/25"
        >
          Create Workspace & Launch Hub
        </Button>
      </div>
    </div>
  );
};
