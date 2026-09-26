import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  User,
  Building2,
  Layers,
  Mail,
  ClipboardList,
  Rocket,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Check,
  Sparkles,
} from 'lucide-react';
import { NebulaLogo } from '../ui/NebulaLogo';
import { BorderBeam } from '../ui/BorderBeam';
import { WizardStepAccount } from './WizardStepAccount';
import { WizardStepOrganization } from './WizardStepOrganization';
import { WizardStepFocus } from './WizardStepFocus';
import { WizardStepInvites, TeammateInvite } from './WizardStepInvites';
import { WizardStepReview } from './WizardStepReview';

const STEPS = [
  { num: 1, label: 'Super Admin', icon: User, title: 'Create your Super Admin account', sub: 'Your master identity for tenant roles, access keys, and security.' },
  { num: 2, label: 'Brand & Industry', icon: Building2, title: 'Organization & Brand Identity', sub: 'Company profile, sector workflows, logo, favicon, and brand color.' },
  { num: 3, label: 'Module Suite', icon: Layers, title: 'Configure operational engines', sub: 'Enable CRM, HRMS, Recruitment, Inventory, and AI Analytics.' },
  { num: 4, label: 'Teammates', icon: Mail, title: 'Invite founding teammates', sub: 'Add administrators, department leads, or members.' },
  { num: 5, label: 'Launchpad', icon: ClipboardList, title: 'Review & Provision Workspace', sub: 'Instant multi-tenant container deployment with sub-millisecond sync.' },
];

export const SignUpWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);

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

  const update = (fields: Partial<typeof formData>) =>
    setFormData((prev) => ({ ...prev, ...fields }));

  const next = () => setStep((p) => Math.min(p + 1, 5));
  const back = () => setStep((p) => Math.max(p - 1, 1));

  const current = STEPS[step - 1];
  const progressPercent = Math.round((step / 5) * 100);

  /* ── Success Celebration Screen (75% Wide Rectangle, No Scrolling) ── */
  if (done) {
    return (
      <div className="h-screen w-full bg-white flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: `
              radial-gradient(ellipse 80% 50% at 50% -5%, rgba(240,81,47,0.08) 0%, transparent 65%),
              linear-gradient(rgba(30,20,10,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30,20,10,0.035) 1px, transparent 1px)
            `,
            backgroundSize: 'auto, 40px 40px, 40px 40px',
          }}
        />

        <div className="relative z-10 w-[94%] sm:w-[88%] lg:w-[75%] max-w-4xl mx-auto my-auto">
          <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-orange-200/90 via-slate-200/90 to-slate-200 shadow-2xl shadow-slate-900/10">
            <div className="bg-white rounded-[23px] p-6 sm:p-8 text-center space-y-5">

              <motion.div
                initial={{ scale: 0, rotate: -25 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                className="w-16 h-16 rounded-2xl bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/15"
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </motion.div>

              <div className="space-y-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Cluster Deployed • Ready for Production
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                  Your Workspace is Live!
                </h1>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Dedicated multi-tenant partition created, security roles established, and all 6 modules are operational.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-2 max-w-md mx-auto text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Organization</span>
                  <span className="font-bold text-slate-900">{formData.organizationName || 'Acme Workspace'}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Super Admin</span>
                  <span className="font-semibold text-slate-800">{formData.fullName || formData.email}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Sector Profile</span>
                  <span className="font-semibold text-slate-800">{formData.industry}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Operational Engines</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> All 6 Engines Active
                  </span>
                </div>
              </div>

              <div className="pt-2 max-w-md mx-auto">
                <button
                  onClick={() => navigate('/signin')}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-[#f0512f] hover:bg-[#d94425] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#f0512f]/25 transition-all cursor-pointer"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Enter Your Nebula Workspace</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Interactive Setup Studio: 75% Wide Rectangle Card with NO SCROLLING ── */
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
        {/* Left: Logo & Context Tag */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <NebulaLogo />
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-slate-50 border border-slate-200 text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse mr-1.5" />
            Setup Studio
          </span>
        </div>

        {/* Center: Clean, Non-Wrapping Stepper */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50/90 border border-slate-200/80 shadow-2xs">
          {[
            { num: 1, label: 'Account' },
            { num: 2, label: 'Brand & Org' },
            { num: 3, label: 'Modules' },
            { num: 4, label: 'Team' },
            { num: 5, label: 'Launch' },
          ].map((s, idx) => {
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => s.num < step && setStep(s.num)}
                  disabled={s.num > step}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all whitespace-nowrap ${isCurrent
                      ? 'bg-[#f0512f] text-white font-semibold shadow-xs'
                      : isDone
                        ? 'text-emerald-700 hover:bg-emerald-50 cursor-pointer font-medium'
                        : 'text-slate-400 cursor-default'
                    }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${isCurrent
                        ? 'bg-white/25 text-white'
                        : isDone
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200/80 text-slate-500'
                      }`}
                  >
                    {isDone ? '✓' : s.num}
                  </span>
                  <span>{s.label}</span>
                </button>
                {idx < 4 && (
                  <div
                    className={`w-2.5 h-0.5 rounded-full ${isDone ? 'bg-emerald-400' : 'bg-slate-200'
                      }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right: Sign In Link */}
        <div className="flex items-center gap-2.5 text-xs shrink-0">
          <span className="text-slate-500 font-medium hidden lg:inline">Already registered?</span>
          <Link
            to="/signin"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 shadow-2xs transition-all hover:bg-slate-50 cursor-pointer text-xs"
          >
            <span>Sign In</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#f0512f]" />
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
              <span>Setup // 01</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse" />
            </div>
            <div className="text-xs font-bold text-slate-800">Auto Provisioning</div>
            <div className="text-[10px] font-mono text-[#ea580c] font-semibold">Under 2 Mins Go-Live</div>
            <div className="text-[9px] text-slate-400">Cluster: multi-tenant</div>
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
              Database // 02
            </div>
            <div className="text-xs font-bold text-slate-800">Isolated Partition</div>
            <div className="text-[10px] font-mono text-slate-500">AES-256 Multi-Tenant</div>
            <div className="text-[9px] text-slate-400">Zero-Trust Role Mapping</div>
          </div>
        </div>

        {/* ── Right Side: Enterprise Compliance & Verification Pillar ── */}
        <div className="hidden xl:flex flex-col justify-between h-[380px] w-44 absolute right-4 2xl:right-8 top-1/2 -translate-y-1/2 z-10 select-none">
          {/* Node 3 */}
          <div className="space-y-1 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-200/70 shadow-2xs">
            <div className="flex items-center justify-between text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase">
              <span>Security // 03</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-bold text-slate-800">SOC 2 Certified</div>
            <div className="text-[10px] font-mono text-emerald-600 font-semibold">14-Day Full Trial</div>
            <div className="text-[9px] text-slate-400">No Credit Card Needed</div>
          </div>

          {/* Vertical Connecting Laser Guide */}
          <div className="flex-1 flex justify-center py-2 relative">
            <div className="w-px h-full bg-gradient-to-b from-slate-200 via-emerald-300 to-slate-200" />
            <motion.div
              animate={{ y: [0, 80, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute w-1.5 h-3 rounded-full bg-emerald-500 shadow-xs"
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

            <div className="relative z-10 bg-white rounded-[23px] overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-h-[82vh]">

              {/* ── Left Rail of Rectangle: Step Milestone Summary ── */}
              <div className="lg:col-span-4 bg-gradient-to-br from-slate-50/90 via-orange-50/20 to-white p-5 sm:p-6 border-b lg:border-b-0 lg:border-r border-slate-200/80 flex flex-col justify-between">
                <div>
                  {/* Step Eyebrow Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#ea580c] text-[11px] font-semibold mb-2.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f0512f] animate-pulse" />
                    Step {step} of 5 • {current.label}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 leading-tight">
                    {current.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {current.sub}
                  </p>

                  {/* Readiness & Progress Meter */}
                  <div className="mt-4 p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-[#f0512f]" />
                        Workspace Readiness
                      </span>
                      <span className="font-bold text-[#ea580c] font-mono">{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-[#f0512f] to-amber-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Vertical Step Nodes for instant overview */}
                  <div className="mt-4 space-y-1.5 hidden sm:block">
                    {STEPS.map((s) => {
                      const isDone = s.num < step;
                      const isCurrent = s.num === step;
                      const Icon = s.icon;
                      return (
                        <div
                          key={s.num}
                          className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${isCurrent
                              ? 'bg-orange-50/80 text-[#ea580c] font-semibold border border-orange-200/60'
                              : isDone
                                ? 'text-emerald-700 font-medium'
                                : 'text-slate-400'
                            }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-[#f0512f]' : 'text-slate-400'}`} />
                          )}
                          <span className="truncate">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Trust Footer */}
                <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Isolated Partition
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-[#ea580c]" /> 256-Bit TLS
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Fingerprint className="w-3 h-3 text-amber-500" /> Zero-Trust
                  </span>
                </div>
              </div>

              {/* ── Right Half of Rectangle: Active Step Form (Clean, No Page Scroll) ── */}
              <div className="lg:col-span-8 p-5 sm:p-7 overflow-y-auto max-h-[78vh] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
                    {step === 1 && (
                      <WizardStepAccount
                        formData={formData}
                        updateFormData={update}
                        onNext={next}
                      />
                    )}
                    {step === 2 && (
                      <WizardStepOrganization
                        formData={formData}
                        updateFormData={update}
                        onNext={next}
                        onBack={back}
                      />
                    )}
                    {step === 3 && (
                      <WizardStepFocus
                        primaryFocus={formData.primaryFocus}
                        updatePrimaryFocus={(pf) => update({ primaryFocus: pf })}
                        onNext={next}
                        onBack={back}
                      />
                    )}
                    {step === 4 && (
                      <WizardStepInvites
                        invites={formData.invites}
                        updateInvites={(inv) => update({ invites: inv })}
                        onNext={next}
                        onBack={back}
                      />
                    )}
                    {step === 5 && (
                      <WizardStepReview
                        formData={formData}
                        onBack={back}
                        onComplete={() => setDone(true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
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

    </div>
  );
};
