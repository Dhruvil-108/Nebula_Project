import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  Receipt, 
  Package, 
  Sparkles, 
  BarChart3, 
  ArrowRight, 
  Check, 
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { CrmKanbanMock } from '../mockups/CrmKanbanMock';
import { HrmsCardMock } from '../mockups/HrmsCardMock';
import { ExpenseFlowMock } from '../mockups/ExpenseFlowMock';
import { InventoryAlertMock } from '../mockups/InventoryAlertMock';
import { AiInsightMock } from '../mockups/AiInsightMock';

interface ModuleData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeText: string;
  features: string[];
  capabilities: { title: string; detail: string }[];
  mockup: React.ReactNode;
}

export const ModuleShowcase: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<string>('crm');

  const modules: ModuleData[] = [
    {
      id: 'crm',
      name: 'CRM & Pipeline',
      tagline: 'Full sales lifecycle management from initial lead capture to closed-won deals.',
      description: 'Streamline your sales process with a multi-stage visual deal pipeline (New → Contacted → Qualified → Proposal → Negotiation → Won/Lost). Track customer interaction histories, deal probabilities, and revenue forecasts with zero manual spreadsheet wrangling.',
      icon: <TrendingUp className="w-5 h-5 text-indigo-400" />,
      accentColor: 'indigo',
      badgeText: 'Module 01',
      features: [
        'Visual 6-stage deal pipeline with drag-and-drop velocity',
        'Lead scoring & automated contact enrichment',
        'Real-time weighted ARR & quarterly revenue forecasting',
        'Cross-sync with inventory availability and finance invoicing'
      ],
      capabilities: [
        { title: 'Pipeline Stages', detail: 'New → Contacted → Qualified → Proposal → Negotiation → Won' },
        { title: 'Contact Timeline', detail: 'Consolidated email logs, notes, and activity history' },
        { title: 'Deal Conversion', detail: 'Instant customer account provisioning upon deal win' }
      ],
      mockup: <CrmKanbanMock />
    },
    {
      id: 'hrms',
      name: 'HRMS & People Ops',
      tagline: 'Modern workforce management, time tracking, and team directory.',
      description: 'Maintain secure digital employee records, track daily attendance and shift schedules, process leave requests with customized approval policies, and manage company documents in a single compliant system.',
      icon: <Users className="w-5 h-5 text-cyan-400" />,
      accentColor: 'cyan',
      badgeText: 'Module 02',
      features: [
        'Comprehensive employee profiles with role & team mappings',
        'Automated attendance tracking and shift management',
        'Leave requests & multi-step manager approval workflows',
        'Secure digital document vault with role-based access'
      ],
      capabilities: [
        { title: 'Employee Directory', detail: 'Department hierarchy, reporting lines, contact cards' },
        { title: 'Leave Management', detail: 'PTO, sick leaves, parental leave accrual policies' },
        { title: 'Document Vault', detail: 'Contracts, NDAs, and performance reviews with RBAC' }
      ],
      mockup: <HrmsCardMock />
    },
    {
      id: 'ats',
      name: 'Recruitment & ATS',
      tagline: 'End-to-end applicant tracking and streamlined hiring workflows.',
      description: 'Post open requisitions, capture candidates across channels, collaborate on candidate evaluations, schedule structured interviews, and instantly convert accepted offers into new employee profiles in HRMS.',
      icon: <Briefcase className="w-5 h-5 text-violet-400" />,
      accentColor: 'violet',
      badgeText: 'Module 03',
      features: [
        'Multi-channel job posting and candidate pipeline stages',
        'Resume parsing & structured interview scorecards',
        'Automated candidate communication & interview scheduling',
        '1-click conversion from accepted candidate to HRMS employee'
      ],
      capabilities: [
        { title: 'Candidate Pipeline', detail: 'Applied → Screened → Interviewed → Offer → Hired' },
        { title: 'Scorecards', detail: 'Standardized evaluation metrics for hiring panels' },
        { title: 'Instant Onboarding', detail: 'Zero data re-entry when onboarding new hires' }
      ],
      mockup: (
        <div className="w-full bg-slate-900/90 rounded-xl border border-slate-800 p-4 text-xs font-sans shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="font-semibold text-slate-200 text-sm">Recruitment (ATS)</span>
              <Badge variant="indigo" size="sm">5 Open Requisitions</Badge>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">38 Active Candidates</span>
          </div>
          <div className="space-y-2">
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 text-[11px]">Senior Frontend Architect</div>
                <div className="text-[10px] text-slate-400">Engineering · Stage: Final Executive Round</div>
              </div>
              <Badge variant="emerald" size="sm">Offer Stage</Badge>
            </div>
            <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-200 text-[11px]">Enterprise Account Executive</div>
                <div className="text-[10px] text-slate-400">Sales · Stage: Technical Demo & Case Study</div>
              </div>
              <Badge variant="cyan" size="sm">Interview (3/4)</Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'expenses',
      name: 'Expense Management',
      tagline: 'Multi-tier expense submission, receipt OCR, and finance approvals.',
      description: 'Empower employees to submit expenses with receipt attachments, enforce company spending policies automatically, and route claims through a structured 3-tier approval hierarchy (Employee → Manager → Finance).',
      icon: <Receipt className="w-5 h-5 text-emerald-400" />,
      accentColor: 'emerald',
      badgeText: 'Module 04',
      features: [
        'Frictionless expense submission with digital receipt uploads',
        'Automatic category tagging and General Ledger (GL) mapping',
        '3-tier approval hierarchy (Employee → Manager → Finance)',
        'Live budget tracking and expense policy violation alerts'
      ],
      capabilities: [
        { title: 'Multi-Tier Flow', detail: 'Employee submission → Manager approval → Finance payout' },
        { title: 'Policy Engine', detail: 'Automatic flagging of out-of-policy spending limits' },
        { title: 'Audit Trail', detail: 'Immutable record of every expense approval and timestamp' }
      ],
      mockup: <ExpenseFlowMock />
    },
    {
      id: 'inventory',
      name: 'Inventory & Stock',
      tagline: 'Real-time stock monitoring, supplier management, and automated POs.',
      description: 'Track products across warehouses, monitor real-time stock levels, maintain supplier relationships, issue purchase orders (POs), and trigger proactive low-stock pulse alerts to eliminate inventory stockouts.',
      icon: <Package className="w-5 h-5 text-amber-400" />,
      accentColor: 'amber',
      badgeText: 'Module 05',
      features: [
        'Real-time SKU and warehouse stock tracking',
        'Supplier directory with lead times and cost agreements',
        'Automated Purchase Order (PO) generation on low thresholds',
        'Sync with CRM deals to reserve stock for enterprise proposals'
      ],
      capabilities: [
        { title: 'Stock Monitoring', detail: 'Live threshold monitoring with automated warnings' },
        { title: 'Supplier POs', detail: 'Integrated purchase order lifecycle and invoice matching' },
        { title: 'Cross-Sync', detail: 'Direct link between closed sales deals and warehouse stock' }
      ],
      mockup: <InventoryAlertMock />
    },
    {
      id: 'analytics',
      name: 'Unified Analytics & AI',
      tagline: 'Cross-department executive KPIs with plain-language AI recommendations.',
      description: 'Break data silos with unified executive dashboards that synthesize sales, HR, expense, and inventory metrics. Receive plain-language AI operational recommendations that tell you not just what happened, but what to do next.',
      icon: <Sparkles className="w-5 h-5 text-sky-400" />,
      accentColor: 'sky',
      badgeText: 'Module 06',
      features: [
        'Cross-department KPI dashboards (Revenue, CAC, Headcount, Runway)',
        'Plain-language AI operational explanations and forecasts',
        'Proactive anomaly detection across all 6 business modules',
        'Exportable executive board reports and customized charts'
      ],
      capabilities: [
        { title: 'Cross-Module KPIs', detail: 'Synthesize data across all 6 tools into unified metrics' },
        { title: 'AI Decision Support', detail: 'Plain-language summaries of operational bottlenecks' },
        { title: 'Predictive Forecasts', detail: 'Forecast revenue, headcount growth, and replenishment' }
      ],
      mockup: <AiInsightMock />
    }
  ];

  const activeModule = modules.find((m) => m.id === activeModuleId) || modules[0];

  return (
    <section id="modules" className="py-24 relative overflow-hidden bg-slate-950/90 border-t border-slate-800/80">
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <Badge variant="indigo" size="md" className="mb-4">
            The 6 Core Modules
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Six enterprise-grade modules. <br />
            <span className="text-gradient-accent">One cohesive operating system.</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Each module is fully featured to stand alone, yet designed from the ground up to share a single unified data fabric.
          </p>
        </div>

        {/* Module Selector Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-10">
          {modules.map((mod) => {
            const isActive = mod.id === activeModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/15 ring-1 ring-indigo-500/50' 
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80">
                    {mod.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-semibold ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                    {mod.badgeText}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-200">{mod.name.split('&')[0].trim()}</div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{mod.tagline.slice(0, 24)}...</div>
              </button>
            );
          })}
        </div>

        {/* Active Module Detailed Showcase Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeModule.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 sm:p-8 lg:p-10 backdrop-blur-xl shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Description & Capabilities (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="indigo" size="sm">{activeModule.badgeText}</Badge>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                      Module Deep Dive
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                    {activeModule.name}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {activeModule.description}
                  </p>
                </div>

                {/* Key Features Bullet List */}
                <div className="space-y-2.5 pt-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Core Functionality
                  </span>
                  {activeModule.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-500/30">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-200">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Module Architecture Highlights Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
                  {activeModule.capabilities.map((cap, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80">
                      <div className="text-xs font-semibold text-indigo-300 mb-1">{cap.title}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{cap.detail}</div>
                    </div>
                  ))}
                </div>

              </div>

              {/* Right Column: Live Mockup Widget Preview (5 cols) */}
              <div className="lg:col-span-5">
                <div className="relative">
                  <div className="absolute -inset-2 bg-indigo-500/10 rounded-2xl blur-xl pointer-events-none" />
                  <div className="relative">
                    {activeModule.mockup}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
};
