import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileCheck2, 
  Server, 
  Eye, 
  Cpu, 
  CheckCircle2 
} from 'lucide-react';
import { Badge } from '../ui/Badge';

export const SecuritySection: React.FC = () => {
  const securityPillars = [
    {
      title: 'Multi-Tenant Data Isolation',
      desc: 'Strict organization-level boundaries guarantee your business data is never co-mingled or accessible by other tenants.',
      icon: <Server className="w-5 h-5 text-[#ff7a59]" />,
      badge: 'Architecture'
    },
    {
      title: 'Granular RBAC Permissioning',
      desc: 'Role-Based Access Control down to the module, view, and specific action level (Create, Read, Update, Delete, Approve).',
      icon: <KeyRound className="w-5 h-5 text-amber-400" />,
      badge: 'Access Control'
    },
    {
      title: 'Tamper-Evident Audit Logging',
      desc: 'Every sensitive action—from salary changes and deal edits to expense approvals—is logged with actor, timestamp, and IP.',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-400" />,
      badge: 'Compliance'
    },
    {
      title: 'JWT Auth & Optional OAuth',
      desc: 'Secure token authentication with short-lived access tokens, refresh token rotation, and Google Workspace OAuth support.',
      icon: <Lock className="w-5 h-5 text-[#f0512f]" />,
      badge: 'Authentication'
    },
    {
      title: 'End-to-End Encryption',
      desc: 'TLS 1.3 encryption in transit for all API traffic and AES-256 encryption at rest for sensitive files and credentials.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      badge: 'Data Protection'
    },
    {
      title: 'Intelligent Rate Limiting',
      desc: 'Proactive DDoS mitigation, automated brute-force protection, and strict MIME-type sanitization on all file uploads.',
      icon: <Cpu className="w-5 h-5 text-amber-400" />,
      badge: 'Infrastructure'
    }
  ];

  return (
    <section id="security" className="py-24 relative bg-slate-950/90 border-t border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="brand" size="md" className="mb-4">
            Enterprise Security & Architecture
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Built to meet the strictest security, compliance, and governance standards.
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Your mission-critical operations data is safeguarded with defense-in-depth architecture at every layer.
          </p>
        </div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((pillar, idx) => (
            <div 
              key={idx}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-[#f0512f]/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#f0512f]/5 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-[#f0512f]/40 transition-colors">
                  {pillar.icon}
                </div>
                <Badge variant="outline" size="sm">{pillar.badge}</Badge>
              </div>
              <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#ff8c70] transition-colors">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {pillar.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Enterprise Compliance Assurance Bar */}
        <div className="mt-12 p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">SOC 2 Type II Certified & GDPR Compliant Baseline</span>
              <p className="text-slate-400 text-[11px]">Continuous automated penetration testing, vulnerability scanning, and isolated tenant databases.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="emerald" size="sm" dot>Security Operations Live</Badge>
          </div>
        </div>

      </div>
    </section>
  );
};
