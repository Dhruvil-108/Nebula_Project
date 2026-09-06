import React from 'react';

export const TrustStrip: React.FC = () => {
  const companies = [
    { name: 'VANGUARD TECH', symbol: 'VT' },
    { name: 'NEXUS LOGISTICS', symbol: 'NL' },
    { name: 'APEX HEALTH', symbol: 'AH' },
    { name: 'STRATA FINANCE', symbol: 'SF' },
    { name: 'AETHER DIGITAL', symbol: 'AD' },
    { name: 'CYBERION LABS', symbol: 'CL' },
  ];

  return (
    <section className="py-14 border-y border-slate-800/80 bg-slate-950/70 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-500 mb-8">
          Trusted by operations leaders and fast-growing organizations worldwide
        </p>

        {/* Company Wordmarks Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 items-center justify-items-center opacity-70 mb-12">
          {companies.map((company) => (
            <div 
              key={company.name}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors font-mono font-semibold tracking-wider text-xs"
            >
              <div className="w-6 h-6 rounded bg-slate-850 flex items-center justify-center text-[10px] text-[#ff7a59] font-bold border border-slate-750">
                {company.symbol}
              </div>
              <span>{company.name}</span>
            </div>
          ))}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-slate-800/60 text-center">
          
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tracking-tight text-gradient">
              6-in-1
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Modules Unified in One Single Data Fabric
            </p>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#f0512f] font-mono tracking-tight">
              40%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Average Reduction in Admin & Manual Data Overhead
            </p>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-[#ff9b80] font-mono tracking-tight">
              100%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Organization-Level Multi-Tenant Data Isolation
            </p>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tracking-tight">
              99.99%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              High Availability Enterprise SLA Guarantee
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};
