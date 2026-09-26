import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface RolePersona {
  id: string;
  role: string;
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  keyBenefits: string[];
  quote: {
    text: string;
    author: string;
    org: string;
  };
  dashboardMetrics: { label: string; value: string; trend: string }[];
}

export const RoleValueSection: React.FC = () => {
  const [activeRoleId, setActiveRoleId] = useState<string>('ceo');

  const personas: RolePersona[] = [
    {
      id: 'ceo',
      role: 'Founders & CEOs',
      badge: 'Executive Command',
      title: 'Full operational clarity with zero departmental blind spots.',
      description: 'Stop waiting for weekly synthesis meetings and outdated slide decks. Get continuous real-time visibility across customer acquisition, employee capacity, cash burn, and operational fulfillment.',
      icon: Building2,
      iconColor: 'text-[#ea580c]',
      keyBenefits: [
        'Single pane of glass unifying revenue, headcount, spend, and inventory',
        'AI plain-language briefings delivered automatically each morning',
        'Role-based governance protecting sensitive financial and payroll data'
      ],
      quote: {
        text: "Nebula replaced 5 fragmented tools in our stack. I now know our exact cash runway, deal pipeline, and hiring status in under 10 seconds every morning.",
        author: "Marcus Vance",
        org: "CEO at HyperScale Global"
      },
      dashboardMetrics: [
        { label: 'Unified Net Margin', value: '+31.4%', trend: '+4.2% YoY' },
        { label: 'Total Org Headcount', value: '142 Staff', trend: '4 In Offer Stage' },
        { label: 'Blended Burn Multiple', value: '0.8x', trend: 'Top Decile' }
      ]
    },
    {
      id: 'sales',
      role: 'Sales Leaders & AEs',
      badge: 'Revenue Velocity',
      title: 'Close enterprise deals faster with automated operations sync.',
      description: 'Move deals seamlessly through the 6-stage pipeline. Automatically check warehouse inventory availability before committing delivery dates, and hand off closed accounts directly to finance for billing.',
      icon: TrendingUp,
      iconColor: 'text-[#ea580c]',
      keyBenefits: [
        'Visual 6-stage deal pipeline with automated contact enrichment',
        'Real-time inventory stock checks embedded in deal proposal views',
        'Zero manual handoff friction when converting closed deals to invoices'
      ],
      quote: {
        text: "Our AEs save at least 4 hours every week by avoiding double-entry between CRM and inventory. Deals move faster from proposal to closed-won.",
        author: "Devon Chen",
        org: "VP of Sales at Horizon SaaS"
      },
      dashboardMetrics: [
        { label: 'Q3 Win Rate', value: '44.8%', trend: '+6.1% vs Q2' },
        { label: 'Avg Deal Cycle', value: '18 Days', trend: '-5 Days' },
        { label: 'Weighted Pipeline', value: '$840k', trend: '112% Quota' }
      ]
    },
    {
      id: 'hr',
      role: 'HR & People Ops',
      badge: 'People & Culture',
      title: 'Seamless recruitment, attendance, and leave management.',
      description: 'Run smooth candidate hiring pipelines in ATS, then transition new hires into HRMS with a single click. Keep employee records, leave requests, and company policies organized in one compliant vault.',
      icon: Users,
      iconColor: 'text-amber-600',
      keyBenefits: [
        '1-click candidate to employee profile generation without duplicate data',
        'Customizable multi-tier leave approval policies & automated balance tracking',
        'Secure document storage with strict RBAC permissioning'
      ],
      quote: {
        text: "The ATS to HRMS handoff is magic. When an offer is signed, their records, tax documents, and equipment allocations are instantly prepared.",
        author: "Sophia Sterling",
        org: "Head of People at Lattice Bio"
      },
      dashboardMetrics: [
        { label: 'Time-to-Hire', value: '14 Days', trend: '-35% faster' },
        { label: 'Attendance Rate', value: '98.2%', trend: 'Healthy' },
        { label: 'Offer Acceptance', value: '92%', trend: 'Top tier' }
      ]
    },
    {
      id: 'finance',
      role: 'Finance & Operations',
      badge: 'Financial Governance',
      title: 'Automated 3-tier expense approvals and instant spend audit trails.',
      description: 'Enforce spend limits with automated policy checks. Route expense submissions smoothly through Employee → Manager → Finance approval stages, matched to General Ledger codes.',
      icon: DollarSign,
      iconColor: 'text-emerald-600',
      keyBenefits: [
        'Structured 3-tier approval hierarchy with receipt OCR matching',
        'Cross-check supplier purchase orders directly against warehouse deliveries',
        'Tamper-evident audit logs of every financial transaction and payout'
      ],
      quote: {
        text: "Closing month-end books used to take 9 days of chasing managers for receipts. With Nebula's structured approval flow, it takes less than 24 hours.",
        author: "Julian Reynolds",
        org: "CFO at Apex Enterprise"
      },
      dashboardMetrics: [
        { label: 'Month-End Close', value: '1.2 Days', trend: 'Down from 9' },
        { label: 'Expense Audit Pass', value: '99.4%', trend: 'Automated' },
        { label: 'Cost Savings', value: '$38,200', trend: 'Duplicate claims blocked' }
      ]
    }
  ];

  const activePersona = personas.find((p) => p.id === activeRoleId) || personas[0];

  return (
    <section id="roles" className="py-24 relative bg-slate-50/80 border-t border-slate-200/80 scroll-mt-20">
      <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <Badge variant="brand" size="md" className="mb-4">
            Built For The Entire Organization
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4">
            Tailored dashboards for every leadership role.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Nebula dynamically adapts to each team member’s role while maintaining a single unified underlying source of truth.
          </p>
        </motion.div>

        {/* Persona Tabs (Smooth Motion Pill Switcher) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {personas.map((persona) => {
            const isActive = persona.id === activeRoleId;
            const Icon = persona.icon;
            return (
              <motion.button
                key={persona.id}
                onClick={() => setActiveRoleId(persona.id)}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                whileTap={{ scale: 0.98 }}
                className={`relative flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                  isActive 
                    ? 'text-white shadow-sm' 
                    : 'text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="roleActivePill"
                    className="absolute inset-0 bg-[#f0512f] rounded-full shadow-md shadow-[#f0512f]/25"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-white' : persona.iconColor}`} />
                  <span>{persona.role}</span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Persona Content Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona.id}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/5"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <Badge variant="brand" size="sm">{activePersona.badge}</Badge>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                    {activePersona.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                    {activePersona.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {activePersona.keyBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-slate-800 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs italic text-slate-700">
                  <p className="mb-2">"{activePersona.quote.text}"</p>
                  <div className="not-italic font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-[#ea580c]">{activePersona.quote.author}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-normal">{activePersona.quote.org}</span>
                  </div>
                </div>

              </div>

              {/* Right Column (5 cols): Metrics preview */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  Dedicated {activePersona.role} Live KPIs
                </span>

                {activePersona.dashboardMetrics.map((m, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">{m.label}</div>
                      <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{m.value}</div>
                    </div>
                    <Badge variant="emerald" size="sm">{m.trend}</Badge>
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 text-[11px] text-[#ea580c] flex items-center justify-between">
                  <span>Custom RBAC views enabled</span>
                  <span className="font-semibold text-slate-900">Full Privacy Isolation</span>
                </div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
