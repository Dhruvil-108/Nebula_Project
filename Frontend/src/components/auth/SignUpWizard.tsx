import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Sparkles, Building2, User, Layers, Mail } from 'lucide-react';
import { AuthLayout } from './AuthLayout';
import { WizardStepAccount } from './WizardStepAccount';
import { WizardStepOrganization } from './WizardStepOrganization';
import { WizardStepFocus } from './WizardStepFocus';
import { WizardStepInvites, TeammateInvite } from './WizardStepInvites';
import { WizardStepReview } from './WizardStepReview';
import { Button } from '../ui/Button';

export const SignUpWizard: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    organizationName: '',
    companySize: '11-50',
    industry: 'Technology & SaaS',
    subIndustry: 'Enterprise Software / B2B SaaS',
    logoUrl: '',
    faviconUrl: '',
    website: '',
    brandColor: '#f0512f',
    primaryFocus: ['all'],
    invites: [] as TeammateInvite[],
  });

  const updateFormData = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const stepTitles = [
    {
      title: 'Super Admin Account',
      sub: 'Set up your primary root administrator credential with organization ownership privileges.',
    },
    {
      title: 'Organization & Brand Identity',
      sub: 'Configure your company profile, industry, sub-industry, custom logo, and favicon details.',
    },
    {
      title: 'Operational Focus Modules',
      sub: 'Select the primary operations modules you want to enable in your workspace.',
    },
    {
      title: 'Invite Teammates',
      sub: 'Add department managers and team members (optional, can be done later in settings).',
    },
    {
      title: 'Review & Provision Workspace',
      sub: 'Verify your organization configuration and launch your dedicated tenant partition.',
    },
  ];

  const currentInfo = stepTitles[currentStep - 1];

  if (isSuccess) {
    return (
      <AuthLayout
        title="Workspace Provisioned Successfully"
        subtitle="Your organization tenant is live and ready."
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-2xl bg-white border border-emerald-300 text-center space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Organization Workspace Ready!</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Welcome to Nebula. Your organization tenant{' '}
            <strong className="text-slate-900 font-bold">
              "{formData.organizationName || 'Your Workspace'}"
            </strong>{' '}
            has been initialized with Super Admin privileges and encrypted multi-tenant data
            partitioning.
          </p>
          <div className="pt-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full shadow-lg shadow-[#f0512f]/25"
              onClick={() => navigate('/signin')}
            >
              Sign In to Organization Hub →
            </Button>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={currentInfo.title}
      subtitle={currentInfo.sub}
      currentStep={currentStep}
      totalSteps={5}
    >
      <div className="space-y-6">
        {/* Top Progress Bar Component (Step X of 5) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[#ea580c] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
              Step {currentStep} of 5 · {currentInfo.title}
            </span>
            <span className="text-slate-500 font-mono text-[11px] font-medium">
              {Math.round((currentStep / 5) * 100)}% Complete
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  stepNum <= currentStep
                    ? 'bg-gradient-to-r from-[#f0512f] to-[#ff7a59]'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Animated Wizard Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 1 && (
              <WizardStepAccount
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
              />
            )}

            {currentStep === 2 && (
              <WizardStepOrganization
                formData={formData}
                updateFormData={updateFormData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 3 && (
              <WizardStepFocus
                primaryFocus={formData.primaryFocus}
                updatePrimaryFocus={(primaryFocus) => updateFormData({ primaryFocus })}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 4 && (
              <WizardStepInvites
                invites={formData.invites}
                updateInvites={(invites) => updateFormData({ invites })}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}

            {currentStep === 5 && (
              <WizardStepReview
                formData={formData}
                onBack={handleBack}
                onComplete={() => setIsSuccess(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthLayout>
  );
};
