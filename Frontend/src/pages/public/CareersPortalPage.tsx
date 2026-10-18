import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Search,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  Globe,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { usePublicTenantInfo, usePublicJobs } from '../../hooks/useRecruitment';
import { PublicApplyModal } from '../../components/public/PublicApplyModal';
import type { JobOpening } from '../../types/recruitment';

export const CareersPortalPage: React.FC = () => {
  const { tenantSlug = '' } = useParams<{ tenantSlug: string }>();

  const [search, setSearch] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState('');
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobOpening | null>(null);

  const { data: tenant, isLoading: tenantLoading } = usePublicTenantInfo(tenantSlug);
  const { data: jobs, isLoading: jobsLoading } = usePublicJobs(tenantSlug, {
    locationType: locationTypeFilter || undefined,
    search: search || undefined,
  });

  const locationTypes = [
    { label: 'All Arrangements', value: '' },
    { label: 'Remote', value: 'remote' },
    { label: 'Hybrid', value: 'hybrid' },
    { label: 'On-Site', value: 'on_site' },
  ];

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#1A1A1A] font-sans antialiased selection:bg-[#f97316]/20">
      {/* ── Top Header / Brand Bar ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#ECE0D6] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-9 h-9 rounded-xl object-contain border border-[#ECE0D6]"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-white shadow-xs"
                style={{ backgroundColor: tenant?.brandColor || '#f97316' }}
              >
                {tenant?.name ? tenant.name.charAt(0) : 'N'}
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-base text-[#111827] tracking-tight">
                {tenant?.name || 'Company Careers'}
              </h1>
              {tenant?.industry && (
                <span className="text-[11px] text-[#64748b] font-medium">{tenant.industry}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {tenant?.website && (
              <a
                href={tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-[#FAF7F2] border border-[#ECE0D6] transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Visit Website
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden pt-12 pb-16 px-6 border-b border-[#ECE0D6] bg-gradient-to-b from-white via-white to-[#FBF8F4]">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100/70 text-orange-800 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#f97316]" />
            We Are Actively Hiring!
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-[#111827] tracking-tight leading-tight"
          >
            Build the Future with <span className="text-[#f97316]">{tenant?.name || 'Our Team'}</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base text-[#64748b] max-w-2xl mx-auto leading-relaxed"
          >
            Explore open opportunities across engineering, product, operations, and leadership. Join a mission-driven culture of high autonomy and impact.
          </motion.p>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Search & Location Filters */}
        <div className="bg-white rounded-2xl border border-[#ECE0D6] p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search positions by title, keyword, or skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4]/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {locationTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setLocationTypeFilter(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  locationTypeFilter === t.value
                    ? 'bg-[#f97316] text-white shadow-2xs'
                    : 'bg-[#FBF8F4] text-slate-600 hover:text-slate-900 border border-[#ECE0D6]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Job Listings Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-[#111827]">
              Open Positions ({jobs?.length || 0})
            </h3>
          </div>

          {jobsLoading ? (
            <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-[#ECE0D6]">
              Loading open opportunities...
            </div>
          ) : (!jobs || jobs.length === 0) ? (
            <div className="p-16 text-center space-y-3 bg-white rounded-3xl border border-[#ECE0D6]">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-base text-slate-800">No Open Roles Found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We don't have active job openings matching your search criteria right now. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => {
                const deptName =
                  typeof job.departmentId === 'object' && job.departmentId
                    ? job.departmentId.name
                    : 'General';

                return (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs hover:shadow-md hover:border-[#fed7aa] transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                          {deptName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {job.jobCode}
                        </span>
                      </div>

                      <h4 className="text-lg font-bold text-[#111827] group-hover:text-[#f97316] transition-colors">
                        {job.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="capitalize">{job.locationType}</span>
                          {job.location ? ` (${job.location})` : ''}
                        </span>

                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="capitalize">{job.employmentType.replace('_', ' ')}</span>
                        </span>

                        {job.salaryRange && (
                          <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            {job.salaryRange.currency} {job.salaryRange.min.toLocaleString()} - {job.salaryRange.max.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {job.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 pt-1 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#ECE0D6]">
                      <Link
                        to={`/careers/${tenantSlug}/jobs/${job._id}`}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 transition-colors"
                      >
                        View Full Details
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedJobForApply(job)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
                      >
                        Apply Now
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="mt-16 py-8 border-t border-[#ECE0D6] bg-white text-center text-xs text-slate-400 space-y-2">
        <p>© {new Date().getFullYear()} {tenant?.name || 'Company'}. Powered by Nebula HUB Recruitment ERP.</p>
        <p className="text-[11px] text-slate-400">All data processing subject to enterprise compliance and candidate privacy policies.</p>
      </footer>

      {/* ── Public Apply Modal ── */}
      {selectedJobForApply && (
        <PublicApplyModal
          isOpen={Boolean(selectedJobForApply)}
          onClose={() => setSelectedJobForApply(null)}
          tenantSlug={tenantSlug}
          job={selectedJobForApply}
        />
      )}
    </div>
  );
};
