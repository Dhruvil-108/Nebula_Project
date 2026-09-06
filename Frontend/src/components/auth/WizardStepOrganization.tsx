import React, { useState } from 'react';
import { Building2, Users2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface WizardStepOrganizationProps {
  formData: {
    organizationName: string;
    companySize: string;
    industry: string;
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sizeOptions = ['1-10', '11-50', '51-200', '201-1000', '1000+'];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.organizationName.trim()) {
      newErrors.organizationName = 'Organization/Company name is required';
    }
    if (!formData.companySize) {
      newErrors.companySize = 'Please select a company size range';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <Input
        label="Organization / Company Name"
        type="text"
        placeholder="e.g. Apex BioCorp or Nexus Logistics"
        required
        value={formData.organizationName}
        onChange={(e) => {
          updateFormData({ organizationName: e.target.value });
          if (errors.organizationName) setErrors({ ...errors, organizationName: '' });
        }}
        error={errors.organizationName}
        leftIcon={<Building2 className="w-4 h-4" />}
        helperText="This creates your isolated multi-tenant organization database."
      />

      <div className="space-y-2">
        <label className="block text-xs font-medium text-slate-300">
          Company Size <span className="text-rose-400">*</span>
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'bg-[#f0512f] border-[#f0512f] text-white shadow-md shadow-[#f0512f]/25'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-750 hover:text-white'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
        {errors.companySize && <p className="text-xs text-rose-400">{errors.companySize}</p>}
      </div>

      <Input
        label="Industry (Optional)"
        type="text"
        placeholder="e.g. Enterprise SaaS, Logistics, Healthcare, Retail"
        value={formData.industry}
        onChange={(e) => updateFormData({ industry: e.target.value })}
        helperText="Helps us suggest industry-tailored KPI templates."
      />

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
          className="w-2/3"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue to Focus Areas →
        </Button>
      </div>
    </form>
  );
};
