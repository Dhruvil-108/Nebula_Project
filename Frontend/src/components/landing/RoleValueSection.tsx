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
  icon: React.ReactNode;
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
      icon: <Building2 className="w-5 h-5 text-[#ff7a59]" />,
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
      icon: <TrendingUp className="w-5 h-5 text-[#f0512f]" />,
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
      icon: <Users className="w-5 h-5 text-amber-400" />,
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
      icon: <DollarSign className="w-5 h-5 text-emerald-400" />,
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
    <section id="roles" className="py-24 relative bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="brand" size="md" className="mb-4">
            Built For The Entire Organization
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Tailored dashboards for every leadership role.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Nebula dynamically adapts to each team member’s role while maintaining a single unified underlying source of truth.
          </p>
        </div>

        {/* Persona Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {personas.map((persona) => {
            const isActive = persona.id === activeRoleId;
            return (
              <button
                key={persona.id}
                onClick={() => setActiveRoleId(persona.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-[#f0512f] text-white shadow-lg shadow-[#f0512f]/25 border border-[#f0512f]' 
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
              >
                {persona.icon}
                <span>{persona.role}</span>
              </button>
            );
          })}
        </div>

        {/* Persona Content Box */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePersona.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="p-6 sm:p-10 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <Badge variant="brand" size="sm">{activePersona.badge}</Badge>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white">
                    {activePersona.title}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {activePersona.description}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {activePersona.keyBenefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-slate-200">{benefit}</span>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs italic text-slate-300">
                  <p className="mb-2">"{activePersona.quote.text}"</p>
                  <div className="not-italic font-semibold text-slate-100 flex items-center gap-2">
                    <span className="text-[#ff7a59]">{activePersona.quote.author}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 font-normal">{activePersona.quote.org}</span>
                  </div>
                </div>

              </div>

              {/* Right Column (5 cols): Metrics preview */}
              <div className="lg:col-span-5 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  Dedicated {activePersona.role} Live KPIs
                </span>

                {activePersona.dashboardMetrics.map((m, idx) => (
                  <div key={idx} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400">{m.label}</div>
                      <div className="text-xl font-bold text-white font-mono mt-0.5">{m.value}</div>
                    </div>
                    <Badge variant="emerald" size="sm">{m.trend}</Badge>
                  </div>
                ))}

                <div className="p-3 rounded-lg bg-[#f0512f]/10 border border-[#f0512f]/20 text-[11px] text-[#ff8c70] flex items-center justify-between">
                  <span>Custom RBAC views enabled</span>
                  <span className="font-semibold text-white">Full Privacy Isolation</span>
                </div>

              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
