import React, { useState, useRef } from 'react';
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Globe,
  Sparkles,
  Image as ImageIcon,
  Check,
  X,
  Palette,
  ExternalLink,
  Laptop,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface IndustryOption {
  id: string;
  name: string;
  icon: string;
  subIndustries: string[];
}

export const INDUSTRIES: IndustryOption[] = [
  {
    id: 'technology',
    name: 'Technology & SaaS',
    icon: '🚀',
    subIndustries: [
      'Enterprise Software / B2B SaaS',
      'Artificial Intelligence & Machine Learning',
      'Cloud Infrastructure & DevOps',
      'Cybersecurity & Identity',
      'Mobile & Consumer Applications',
      'IT Services & Managed Solutions',
      'FinTech Software',
    ],
  },
  {
    id: 'logistics',
    name: 'Logistics & Supply Chain',
    icon: '🚚',
    subIndustries: [
      'Freight Forwarding & Global Shipping',
      'Warehousing & 3PL / 4PL Fulfillment',
      'Fleet Management & Telematics',
      'Cold Chain Logistics & Distribution',
      'Last-Mile Delivery & Courier',
      'Supply Chain Analytics & Optimization',
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare & Life Sciences',
    icon: '🏥',
    subIndustries: [
      'Digital Health & Telemedicine',
      'Biotechnology & Clinical Research',
      'Medical Devices & Diagnostics',
      'Hospitals & Healthcare Provider Networks',
      'Pharmaceuticals & Therapeutics',
      'HealthTech SaaS',
    ],
  },
  {
    id: 'finance',
    name: 'Financial Services & FinTech',
    icon: '💳',
    subIndustries: [
      'Digital Banking & Neo-banking',
      'Payment Processing & Gateways',
      'Wealth & Asset Management',
      'Accounting, Tax & Audit Practice',
      'Insurance Tech (InsurTech)',
      'Lending & Credit Platforms',
    ],
  },
  {
    id: 'retail',
    name: 'Retail & E-Commerce',
    icon: '🛍️',
    subIndustries: [
      'Direct-to-Consumer (D2C) Brands',
      'Multi-Channel Retail Operations',
      'B2B Wholesale & Distribution',
      'Marketplace Platform',
      'Fast-Moving Consumer Goods (FMCG)',
      'Apparel & Luxury Goods',
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing & Industrial',
    icon: '🏭',
    subIndustries: [
      'High-Tech Electronics & Hardware',
      'Industrial Machinery & Automation',
      'Automotive & Aerospace Components',
      'Chemicals & Materials Processing',
      'Food & Beverage Production',
      'Renewable Energy & CleanTech',
    ],
  },
  {
    id: 'creative',
    name: 'Media, Creative & Studio',
    icon: '📸',
    subIndustries: [
      'Photography & Visual Studio Production',
      'Digital Advertising & Media Agency',
      'Film, Video & Animation Studio',
      'Publishing & Digital Content',
      'Branding & Design Consultancy',
    ],
  },
  {
    id: 'services',
    name: 'Professional & Business Services',
    icon: '💼',
    subIndustries: [
      'Management & Strategy Consulting',
      'Legal & Compliance Services',
      'Human Resources & Executive Staffing',
      'Architecture & Engineering Consulting',
      'Real Estate & Property Management',
    ],
  },
  {
    id: 'education',
    name: 'Education & EdTech',
    icon: '🎓',
    subIndustries: [
      'Higher Education & Universities',
      'EdTech Learning Platforms',
      'Corporate Learning & Talent Upskilling',
      'K-12 Educational Institutions',
      'Vocational & Technical Training',
    ],
  },
  {
    id: 'other',
    name: 'Other Industry',
    icon: '🌐',
    subIndustries: ['General Business', 'Non-Profit / NGO', 'Government & Public Sector', 'Custom Sector'],
  },
];

const PRESET_BRAND_COLORS = [
  { name: 'Nebula Sunset', value: '#f0512f' },
  { name: 'Ocean Cyan', value: '#0284c7' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Royal Violet', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Amber Gold', value: '#d97706' },
];

interface WizardStepOrganizationProps {
  formData: {
    organizationName: string;
    companySize: string;
    industry: string;
    subIndustry: string;
    logoUrl: string;
    faviconUrl: string;
    website: string;
    brandColor: string;
  };
  updateFormData: (fields: Partial<WizardStepOrganizationProps['formData']>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const WizardStepOrganization: React.FC<WizardStepOrganizationProps> = ({
  formData,
  updateFormData,
  onNext,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'branding'>('profile');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [faviconInputMode, setFaviconInputMode] = useState<'auto' | 'upload' | 'url'>('auto');

  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const faviconFileInputRef = useRef<HTMLInputElement | null>(null);

  const sizeOptions = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

  // Current industry object
  const currentIndustryObj = INDUSTRIES.find(
    (ind) => ind.name.toLowerCase() === formData.industry?.toLowerCase()
  ) || INDUSTRIES[0];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization/Company name is required';
      setActiveTab('profile');
    }
    if (!formData.companySize) {
      newErrors.companySize = 'Please select a company size range';
      setActiveTab('profile');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  // Handle Logo Upload (read file as Data URL)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateFormData({ logoUrl: dataUrl });
      // If favicon is set to auto or empty, also sync favicon
      if (faviconInputMode === 'auto' || !formData.faviconUrl) {
        updateFormData({ faviconUrl: dataUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Favicon Upload
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert('Favicon file size must be less than 1MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      updateFormData({ faviconUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const companyInitial = formData.organizationName.trim()
    ? formData.organizationName.trim().charAt(0).toUpperCase()
    : 'N';

  return (
    <form onSubmit={handleNextClick} className="space-y-5" noValidate>
      {/* ── Sub-step switcher tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'profile'
              ? 'bg-[#f0512f] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>1. Profile & Industry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('branding')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'branding'
              ? 'bg-[#f0512f] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>2. Logo & Favicon Details</span>
          {(formData.logoUrl || formData.faviconUrl) && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          )}
        </button>
      </div>

      {activeTab === 'profile' ? (
        <div className="space-y-4">
          {/* Organization Name */}
          <Input
            label="Organization / Company Name"
            type="text"
            placeholder="e.g. Acme Dynamics or PVF Studio"
            required
            value={formData.organizationName}
            onChange={(e) => {
              updateFormData({ organizationName: e.target.value });
              if (errors.organizationName) setErrors({ ...errors, organizationName: '' });
            }}
            error={errors.organizationName}
            leftIcon={<Building2 className="w-4 h-4" />}
            helperText="Creates your dedicated, isolated multi-tenant organization partition."
          />

          {/* Company Size */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Company Size <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {sizeOptions.map((size) => {
                const isSelected = formData.companySize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      updateFormData({ companySize: size });
                      if (errors.companySize) setErrors({ ...errors, companySize: '' });
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#f0512f] border-[#f0512f] text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-orange-300 hover:text-[#ea580c] hover:bg-orange-50/40'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {errors.companySize && <p className="text-xs text-rose-500">{errors.companySize}</p>}
          </div>

          {/* Industry Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Industry Sector <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={formData.industry || 'Technology & SaaS'}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const matched = INDUSTRIES.find((ind) => ind.name === selectedName);
                  updateFormData({
                    industry: selectedName,
                    subIndustry: matched?.subIndustries[0] || 'General',
                  });
                }}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#f0512f] focus:ring-2 focus:ring-[#f0512f]/20 transition-all appearance-none cursor-pointer pr-10 shadow-xs"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.name} className="bg-white text-slate-800">
                    {ind.icon} {ind.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sub-Industry Selection (Dynamic) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Sub-Industry / Specialization
              </label>
              <span className="text-[10px] text-slate-500 font-medium">Contextual templates</span>
            </div>
            <div className="relative">
              <select
                value={formData.subIndustry || currentIndustryObj.subIndustries[0]}
                onChange={(e) => updateFormData({ subIndustry: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#f0512f] focus:ring-2 focus:ring-[#f0512f]/20 transition-all appearance-none cursor-pointer pr-10 shadow-xs"
              >
                {currentIndustryObj.subIndustries.map((sub, idx) => (
                  <option key={idx} value={sub} className="bg-white text-slate-800">
                    {sub}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Website / Domain */}
          <Input
            label="Company Website / Domain (Optional)"
            type="url"
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            leftIcon={<Globe className="w-4 h-4" />}
            helperText="Allows domain-level auto-detection for employee sign-in invitations."
          />

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (validate()) setActiveTab('branding');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#ea580c] hover:text-[#c2410c] bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Next: Customize Logo & Favicon</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* ── Branding, Logo & Favicon Tab ── */
        <div className="space-y-4">
          {/* Company Logo Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#f0512f]" />
                <span>Company Logo</span>
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setLogoInputMode('upload')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium ${
                    logoInputMode === 'upload'
                      ? 'bg-[#f0512f] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setLogoInputMode('url')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium ${
                    logoInputMode === 'url'
                      ? 'bg-[#f0512f] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Image URL
                </button>
              </div>
            </div>

            {logoInputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  ref={logoFileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                />
                <div
                  onClick={() => logoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#f0512f] rounded-xl p-4 text-center cursor-pointer transition-colors bg-white group shadow-xs"
                >
                  <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#f0512f] mx-auto mb-1 transition-colors" />
                  <p className="text-xs text-slate-700 font-semibold">
                    Click or drag image file here
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    PNG, SVG, or JPG (max 2MB, transparent background recommended)
                  </p>
                </div>
              </div>
            ) : (
              <Input
                label="Logo Image URL"
                type="url"
                placeholder="https://yourcompany.com/assets/logo.png"
                value={formData.logoUrl}
                onChange={(e) => updateFormData({ logoUrl: e.target.value })}
                leftIcon={<ImageIcon className="w-4 h-4" />}
              />
            )}

            {formData.logoUrl && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-xs shadow-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded bg-slate-50 p-1 flex items-center justify-center overflow-hidden border border-slate-200">
                    <img
                      src={formData.logoUrl}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-xs text-slate-700 font-medium truncate">Logo active</span>
                </div>
                <button
                  type="button"
                  onClick={() => updateFormData({ logoUrl: '' })}
                  className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Favicon Details Section */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Favicon Details & Tab Icon</span>
              </label>

              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setFaviconInputMode('auto')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium ${
                    faviconInputMode === 'auto'
                      ? 'bg-[#f0512f] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Auto-Badge
                </button>
                <button
                  type="button"
                  onClick={() => setFaviconInputMode('upload')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium ${
                    faviconInputMode === 'upload'
                      ? 'bg-[#f0512f] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setFaviconInputMode('url')}
                  className={`px-2 py-0.5 rounded cursor-pointer font-medium ${
                    faviconInputMode === 'url'
                      ? 'bg-[#f0512f] text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  URL
                </button>
              </div>
            </div>

            {faviconInputMode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={faviconFileInputRef}
                  onChange={handleFaviconUpload}
                  accept="image/png,image/x-icon,image/svg+xml"
                  className="hidden"
                />
                <div
                  onClick={() => faviconFileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#f0512f] rounded-xl p-3 text-center cursor-pointer transition-colors bg-white shadow-xs"
                >
                  <p className="text-xs text-slate-700 font-semibold">Click to upload 32x32 Favicon</p>
                  <p className="text-[10px] text-slate-500">.ico, .png, or .svg</p>
                </div>
              </div>
            )}

            {faviconInputMode === 'url' && (
              <Input
                label="Favicon URL"
                type="url"
                placeholder="https://yourcompany.com/favicon.ico"
                value={formData.faviconUrl}
                onChange={(e) => updateFormData({ faviconUrl: e.target.value })}
                leftIcon={<Globe className="w-4 h-4" />}
              />
            )}

            {/* Simulated Live Browser Tab Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold block">
                Live Browser Tab Mockup
              </span>
              <div className="p-2 rounded-xl bg-slate-100 border border-slate-200">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 w-fit max-w-full text-xs shadow-xs">
                  {/* Favicon Preview */}
                  <div
                    className="w-4 h-4 rounded-xs flex items-center justify-center overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: formData.brandColor || '#f0512f' }}
                  >
                    {formData.faviconUrl || formData.logoUrl ? (
                      <img
                        src={formData.faviconUrl || formData.logoUrl}
                        alt="favicon"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[9px] font-bold text-white leading-none">
                        {companyInitial}
                      </span>
                    )}
                  </div>

                  {/* Tab Title */}
                  <span className="text-[11px] text-slate-800 truncate font-semibold">
                    {formData.organizationName || 'My Workspace'} — Nebula Hub
                  </span>

                  <X className="w-3 h-3 text-slate-400 hover:text-slate-600 ml-1 cursor-pointer flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>

          {/* Brand Accent Color */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-xs">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#f0512f]" />
              <span>Workspace Brand Tint</span>
            </label>
            <div className="flex items-center gap-2">
              {PRESET_BRAND_COLORS.map((col) => (
                <button
                  key={col.value}
                  type="button"
                  onClick={() => updateFormData({ brandColor: col.value })}
                  style={{ backgroundColor: col.value }}
                  className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                    formData.brandColor === col.value
                      ? 'ring-2 ring-slate-900 scale-110 shadow-sm'
                      : 'hover:scale-105 opacity-85'
                  }`}
                  title={col.name}
                >
                  {formData.brandColor === col.value && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-1/3"
        >
          Back
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="w-2/3 shadow-md shadow-[#f0512f]/25"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Focus Areas →
        </Button>
      </div>
    </form>
  );
};
