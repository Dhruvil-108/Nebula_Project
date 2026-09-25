import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Building2,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Globe,
  Sparkles,
  Palette,
  ExternalLink,
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
    subIndustry: string;
    logoUrl: string;
    faviconUrl: string;
    website: string;
    brandColor: string;
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
      companySize: formData.companySize || '11-50',
      industry: formData.industry || 'Technology & SaaS',
      subIndustry: formData.subIndustry || null,
      logoUrl: formData.logoUrl || null,
      faviconUrl: formData.faviconUrl || null,
      website: formData.website || null,
      brandColor: formData.brandColor || '#f0512f',
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

  const initial = formData.organizationName?.trim()
    ? formData.organizationName.trim().charAt(0).toUpperCase()
    : 'N';

  return (
    <div className="space-y-4">
      {apiError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Workspace Summary Card */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 text-xs overflow-hidden relative shadow-md shadow-slate-900/5">
        {/* Brand Accent Stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: formData.brandColor || '#f0512f' }}
        />

        {/* Section 1: Super Admin Account */}
        <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block mb-0.5">
              Super Admin Account
            </span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <User className="w-4 h-4 text-[#f0512f]" />
              {formData.fullName || 'Dhruvil Soni'}
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5">
              {formData.email || 'admin@company.com'}
            </div>
          </div>
          <Badge variant="brand" size="sm">
            Super Admin
          </Badge>
        </div>

        {/* Section 2: Organization & Branding */}
        <div className="pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              {/* Logo / Monogram Thumbnail */}
              <div
                className="w-10 h-10 rounded-xl bg-slate-50 border p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs"
                style={{ borderColor: formData.brandColor || '#f0512f' }}
              >
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Company logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span
                    className="text-base font-extrabold text-white w-full h-full rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: formData.brandColor || '#f0512f' }}
                  >
                    {initial}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block mb-0.5">
                  Tenant Organization
                </span>
                <div className="font-bold text-slate-900 text-sm">
                  {formData.organizationName || 'My Organization'}
                </div>
              </div>
            </div>

            <Badge variant="emerald" size="sm" dot>
              Tenant Partitioned
            </Badge>
          </div>

          {/* Industry & Sub-Industry Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-700 font-medium">
              🏢 {formData.industry || 'Technology & SaaS'}
            </span>
            {formData.subIndustry && (
              <span className="px-2 py-0.5 rounded-md bg-orange-50 border border-orange-200 text-[11px] text-[#ea580c] font-semibold">
                ⚡ {formData.subIndustry}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 font-medium">
              👥 {formData.companySize || '11-50'} team
            </span>
            {formData.website && (
              <a
                href={formData.website}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
              >
                <Globe className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[140px]">{formData.website}</span>
              </a>
            )}
          </div>

          {/* Favicon Browser Tab Simulation preview strip */}
          <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-[11px]">
            <span className="text-[10px] font-mono text-slate-500 font-medium">Tab Icon Preview:</span>
            <div
              className="w-3.5 h-3.5 rounded-xs flex items-center justify-center overflow-hidden flex-shrink-0"
              style={{ backgroundColor: formData.brandColor || '#f0512f' }}
            >
              {formData.faviconUrl || formData.logoUrl ? (
                <img
                  src={formData.faviconUrl || formData.logoUrl}
                  alt="favicon"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[8px] font-bold text-white leading-none">{initial}</span>
              )}
            </div>
            <span className="text-slate-700 font-mono text-[10px] font-medium truncate">
              {formData.organizationName || 'Workspace'} — Nebula Hub
            </span>
          </div>
        </div>

        {/* Section 3: Focus Modules */}
        <div className="pb-3 border-b border-slate-100">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block mb-1.5">
            Initial Operational Focus Modules
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
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block mb-1.5">
            Teammate Invites ({validInvites.length})
          </span>
          {validInvites.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic">
              No teammate invites staged. You can add department managers and employees at any time
              from the workspace accounts console.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {validInvites.map((inv, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-700 flex items-center gap-1 font-medium"
                >
                  <Mail className="w-3 h-3 text-[#f0512f]" />
                  {inv.email} ({inv.role})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
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
          onClick={handleFinalSubmit}
          isLoading={isLoading}
          className="w-2/3 shadow-lg shadow-[#f0512f]/25"
          rightIcon={!isLoading ? <CheckCircle2 className="w-4 h-4" /> : undefined}
        >
          {isLoading ? 'Provisioning Workspace...' : 'Launch Workspace Hub 🚀'}
        </Button>
      </div>
    </div>
  );
};
