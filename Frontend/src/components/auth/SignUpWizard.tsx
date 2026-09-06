import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
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
    industry: '',
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
    { title: 'Account Basics', sub: 'Create your primary Super Admin user credential.' },
    { title: 'Organization Details', sub: 'Specify your company name and team size for multi-tenant isolation.' },
    { title: 'Primary Focus Areas', sub: 'Select the operational modules most important to you right now.' },
    { title: 'Invite Teammates', sub: 'Add department managers and team members (optional, skippable).' },
    { title: 'Review & Provision Workspace', sub: 'Confirm workspace details and launch your unified hub.' },
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
          className="p-6 rounded-2xl bg-slate-900/90 border border-emerald-500/40 text-center space-y-4 shadow-xl"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-white">Organization Workspace Ready!</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Welcome to Nebula. Your organization tenant <strong className="text-white">"{formData.organizationName || 'Your Workspace'}"</strong> has been created with Super Admin privileges and encrypted database isolation.
          </p>
          <div className="pt-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full"
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
            <span className="font-mono text-[#ff8c70] font-semibold uppercase tracking-wider">
              Step {currentStep} of 5
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {Math.round((currentStep / 5) * 100)}% Complete
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden flex gap-1 p-0.5">
            {[1, 2, 3, 4, 5].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                  stepNum <= currentStep ? 'bg-gradient-to-r from-[#f0512f] to-[#ff8c70]' : 'bg-slate-800'
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
