import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden bg-slate-950">
      {/* Background Gradient Halo (Zorvi warm ambient) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-[#f0512f]/10 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#f0512f]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-slate-900/90 via-slate-900/70 to-slate-950 border border-[#f0512f]/30 backdrop-blur-2xl shadow-2xl shadow-[#f0512f]/10">
          
          <Badge variant="brand" size="md" className="mb-6">
            Ready to Unify Your Business?
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight mb-6 max-w-2xl mx-auto">
            Experience the all-in-one business operating hub.
          </h2>

          <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Consolidate your CRM, HRMS, ATS, Expenses, Inventory, and Analytics into one lightning-fast workspace today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button
              size="lg"
              variant="primary"
              onClick={() => navigate('/signup')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto px-8 py-3.5 shadow-xl shadow-[#f0512f]/25"
            >
              Start 14-Day Free Trial
            </Button>

            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/signin')}
              className="w-full sm:w-auto px-7 py-3.5 hover:border-[#f0512f]/40"
            >
              Sign In to Existing Workspace
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              14-day full access trial
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Instant tenant provisioning
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#ff7a59]" />
              Enterprise-grade encryption
            </span>
          </div>

        </div>

      </div>
    </section>
  );
};
