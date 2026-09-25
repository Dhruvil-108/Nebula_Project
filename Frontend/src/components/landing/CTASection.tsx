import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const CTASection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden bg-white border-t border-slate-200/80">
      {/* Background Gradient Halo with gentle float */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/40 via-white to-slate-50/60 pointer-events-none" />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#f0512f]/10 rounded-full blur-3xl pointer-events-none" 
      />

      <div className="w-full max-w-[1450px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 relative text-center z-10">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="p-8 sm:p-16 lg:p-20 rounded-3xl bg-gradient-to-b from-orange-50/90 via-white to-white border-2 border-orange-200/90 shadow-2xl shadow-orange-500/10 backdrop-blur-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-400/5 rounded-full blur-2xl pointer-events-none" />
          
          <Badge variant="brand" size="md" className="mb-6">
            Ready to Unify Your Business?
          </Badge>

          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-tight mb-6 max-w-3xl mx-auto">
            Experience the all-in-one business operating hub.
          </h2>

          <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Consolidate your CRM, HRMS, ATS, Expenses, Inventory, and Analytics into one lightning-fast workspace today.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="primary"
                onClick={() => navigate('/signup')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full sm:w-auto px-9 py-4 text-base shadow-xl shadow-[#f0512f]/25 font-bold"
              >
                Start 14-Day Free Trial
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate('/signin')}
                className="w-full sm:w-auto px-8 py-4 text-base bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Sign In to Existing Workspace
              </Button>
            </motion.div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-8 text-xs sm:text-sm text-slate-600">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              14-day full access trial
            </span>
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Instant tenant provisioning
            </span>
            <span className="flex items-center gap-2 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#ea580c]" />
              Enterprise-grade encryption
            </span>
          </div>

        </motion.div>

      </div>
    </section>
  );
};
