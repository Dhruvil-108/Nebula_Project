import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  Building2,
  Calendar,
  Share2,
  Sparkles,
  CheckCircle2,
  Check,
  ShieldCheck,
  Award,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { usePublicJobDetails, usePublicTenantInfo } from '../../hooks/useRecruitment';
import { PublicApplyModal } from '../../components/public/PublicApplyModal';
import { toast } from 'react-toastify';

export const PublicJobDetailsPage: React.FC = () => {
  const { tenantSlug = '', jobId = '' } = useParams<{ tenantSlug: string; jobId: string }>();

  const { data: tenant, isLoading: isTenantLoading } = usePublicTenantInfo(tenantSlug);
  const { data: job, isLoading: isJobLoading, error } = usePublicJobDetails(tenantSlug, jobId);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success('Job link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  if (isTenantLoading || isJobLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-3 border-[#f97316] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#6B6B6B]">Loading job opening details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-[#111827] mb-2">Position Not Found</h2>
        <p className="text-sm text-[#6B6B6B] max-w-md mb-6">
          This position may have been filled, closed, or the link might be expired.
        </p>
        <Link
          to={`/careers/${tenantSlug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-semibold shadow-md shadow-orange-500/20 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          View All Opportunities
        </Link>
      </div>
    );
  }

  const workPolicyLabels: Record<string, string> = {
    remote: 'Fully Remote',
    hybrid: 'Hybrid',
    on_site: 'On-Site',
  };

  const jobTypeLabels: Record<string, string> = {
    full_time: 'Full Time',
    part_time: 'Part Time',
    contract: 'Contract',
    internship: 'Internship',
  };

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#111827] selection:bg-orange-100 selection:text-orange-900">
      {/* ── Top Bar / Tenant Navigation ── */}
      <header className="sticky top-0 z-30 bg-[#FBF8F4]/90 backdrop-blur-md border-b border-[#ECE0D6]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logoUrl ? (
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-8 h-8 rounded-lg object-contain border border-[#ECE0D6] bg-white p-1"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#f97316] flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                {tenant?.name?.charAt(0) || 'N'}
              </div>
            )}
            <span className="font-bold text-sm text-[#111827]">{tenant?.name || 'Company Careers'}</span>
          </div>

          <Link
            to={`/careers/${tenantSlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#f97316] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All Opportunities
          </Link>
        </div>
      </header>

      {/* ── Main Content Container ── */}
      <main className="max-w-5xl mx-auto px-6 py-8 md:py-12">
        {/* Job Header Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-[#ECE0D6] shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 text-[#f97316] border border-orange-200">
                  {typeof job.departmentId === 'object' && job.departmentId !== null
                    ? (job.departmentId as any).name
                    : 'Open Position'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {jobTypeLabels[job.type] || job.type}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {workPolicyLabels[job.workPolicy || 'on_site']}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-[#111827] tracking-tight">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#6B6B6B]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{job.location || 'Flexible Location'}</span>
                </div>
                {job.experienceLevel && (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="capitalize">{job.experienceLevel} Level</span>
                  </div>
                )}
                {job.salaryRange?.min !== undefined && job.salaryRange?.max !== undefined && (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>
                      {job.salaryRange.currency || 'USD'} {job.salaryRange.min.toLocaleString()} –{' '}
                      {job.salaryRange.max.toLocaleString()} / year
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-2xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Apply for this Position
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white border border-[#ECE0D6] hover:bg-slate-50 text-xs font-semibold text-[#111827] transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-400" />}
                {copied ? 'Link Copied!' : 'Share Position'}
              </button>
            </div>
          </div>
        </div>

        {/* Job Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Description Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About the Role */}
            <section className="p-6 md:p-8 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs space-y-4">
              <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#f97316]" />
                About the Role
              </h2>
              <div className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </section>

            {/* Key Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <section className="p-6 md:p-8 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs space-y-4">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#f97316]" />
                  What You'll Do
                </h2>
                <ul className="space-y-2.5">
                  {job.responsibilities.map((resp: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Requirements & Qualifications */}
            {job.requirements && job.requirements.length > 0 && (
              <section className="p-6 md:p-8 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs space-y-4">
                <h2 className="text-base font-bold text-[#111827] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-[#f97316]" />
                  What We're Looking For
                </h2>
                <ul className="space-y-2.5">
                  {job.requirements.map((req: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0 mt-2" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Required Skills Badges */}
            {job.skills && job.skills.length > 0 && (
              <section className="p-6 md:p-8 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs space-y-3">
                <h2 className="text-base font-bold text-[#111827]">Required Technologies & Skills</h2>
                <div className="flex flex-wrap gap-2 pt-1">
                  {job.skills.map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl bg-orange-50/70 border border-orange-200/60 text-xs font-semibold text-orange-900"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-6">
            {/* Quick Apply Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white/90" />
                <h3 className="font-bold text-sm">Ready to Apply?</h3>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Our application takes under 2 minutes. Upload your CV and let our AI parser auto-fill your profile instantly.
              </p>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(true)}
                className="w-full py-3 rounded-2xl bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Apply Now
              </button>
            </div>

            {/* Diversity & Algorithmic Fairness Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Inclusive & Blind Screening
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {tenant?.name || 'Our organization'} is an equal opportunity employer. Applications are evaluated blindly on merit, capabilities, and relevant experience.
              </p>
            </div>

            {/* Company Info Card */}
            <div className="p-5 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-[#111827]">
                <Building2 className="w-4 h-4 text-[#f97316]" />
                About {tenant?.name}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {tenant?.tagline || 'Building the future of enterprise software with high-velocity talent.'}
              </p>
              {tenant?.website && (
                <a
                  href={tenant.website.startsWith('http') ? tenant.website : `https://${tenant.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs font-semibold text-[#f97316] hover:underline"
                >
                  Visit Company Website →
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Public Candidate Apply Modal ── */}
      <PublicApplyModal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        tenantSlug={tenantSlug}
        job={job}
      />
    </div>
  );
};
