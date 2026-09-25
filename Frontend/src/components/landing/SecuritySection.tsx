import React from 'react';
import { motion } from 'framer-motion';
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
      icon: <KeyRound className="w-5 h-5 text-amber-500" />,
      badge: 'Access Control'
    },
    {
      title: 'Tamper-Evident Audit Logging',
      desc: 'Every sensitive action—from salary changes and deal edits to expense approvals—is logged with actor, timestamp, and IP.',
      icon: <FileCheck2 className="w-5 h-5 text-emerald-500" />,
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
      icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />,
      badge: 'Data Protection'
    },
    {
      title: 'Intelligent Rate Limiting',
      desc: 'Proactive DDoS mitigation, automated brute-force protection, and strict MIME-type sanitization on all file uploads.',
      icon: <Cpu className="w-5 h-5 text-amber-500" />,
      badge: 'Infrastructure'
    }
  ];

  return (
    <section id="security" className="py-24 relative bg-white border-t border-slate-200/80 scroll-mt-20">
      <div className="w-full max-w-[1650px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <Badge variant="brand" size="md" className="mb-4">
            Enterprise Security & Architecture
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight mb-4">
            Built to meet the strictest security, compliance, and governance standards.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            Your mission-critical operations data is safeguarded with defense-in-depth architecture at every layer.
          </p>
        </motion.div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {securityPillars.map((pillar, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08, duration: 0.4 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="p-7 rounded-3xl bg-slate-50/70 border border-slate-200 hover:border-orange-300 hover:bg-white hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-200 group cursor-default"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm group-hover:border-orange-200 transition-colors">
                  {pillar.icon}
                </div>
                <Badge variant="outline" size="sm">{pillar.badge}</Badge>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#ea580c] transition-colors">
                {pillar.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {pillar.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Enterprise Compliance Assurance Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-700 shadow-sm"
        >
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-slate-900 text-sm">SOC 2 Type II Certified & GDPR Compliant Baseline</span>
              <p className="text-slate-500 text-xs mt-0.5">Continuous automated penetration testing, vulnerability scanning, and isolated tenant databases.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="emerald" size="sm" dot>Security Operations Live</Badge>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
