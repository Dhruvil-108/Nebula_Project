import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  Plus,
  RefreshCw,
  Users,
  MapPin,
  Clock,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { LinkedInIcon } from '../../components/ui/LinkedInIcon';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';
import {
  useJobs,
  useUpdateJobStatus,
  useDeleteJob,
} from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { JobStatusPill } from '../../components/recruitment/JobStatusPill';
import { CreateJobModal } from '../../components/recruitment/CreateJobModal';
import { LinkedInPostModal } from '../../components/recruitment/LinkedInPostModal';
import { FloatingDropdown } from '../../components/ui/FloatingDropdown';
import {
  JOB_STATUSES,
  JOB_STATUS_LABELS,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABELS,
  type JobOpening,
  type JobStatus,
} from '../../types/recruitment';

export const JobsPage: React.FC = () => {
  const { can } = useModuleAccess('recruitment');
  const canCreate = can('create');
  const canEdit = can('edit');
  const canDelete = can('delete');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [linkedInJob, setLinkedInJob] = useState<JobOpening | null>(null);

  // Departments
  const { data: departments } = useQuery<{ _id: string; name: string }[]>({
    queryKey: ['hr', 'departments'],
    queryFn: async () => {
      const res = await apiClient.get<any[]>('/hr/departments');
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: jobs, isLoading, refetch } = useJobs({
    search: search || undefined,
    status: statusFilter || undefined,
    departmentId: deptFilter || undefined,
    employmentType: typeFilter || undefined,
  });

  const updateStatusMutation = useUpdateJobStatus();
  const deleteJobMutation = useDeleteJob();

  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    updateStatusMutation.mutate({ id: jobId, status: newStatus });
  };

  const handleDelete = (job: JobOpening) => {
    if (window.confirm(`Are you sure you want to delete "${job.title}" (${job.jobCode})?`)) {
      deleteJobMutation.mutate(job._id);
    }
  };

  const inputCls =
    'rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all';

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Job Openings
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Manage company job postings, requirements, target closing dates, and open headcounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#fff7ed] border border-[#ECE0D6] transition-colors"
            title="Refresh jobs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-[#f97316]/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Post Job Opening
            </button>
          )}
        </div>
      </motion.div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 flex-wrap">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#9B9B9B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search job title, skills, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} w-full pl-9`}
          />
        </div>

        <div className="w-full sm:w-44">
          <FloatingDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: '', label: 'All Statuses' },
              ...JOB_STATUSES.map((s) => ({
                value: s,
                label: JOB_STATUS_LABELS[s],
                dotColor: s === 'published' ? '#10b981' : s === 'on_hold' ? '#f59e0b' : s === 'closed' ? '#ef4444' : '#64748b',
              })),
            ]}
          />
        </div>

        <div className="w-full sm:w-48">
          <FloatingDropdown
            value={deptFilter}
            onChange={(val) => setDeptFilter(val)}
            options={[
              { value: '', label: 'All Departments' },
              ...(departments || []).map((d) => ({
                value: d._id,
                label: d.name,
              })),
            ]}
            searchable={true}
            searchPlaceholder="Search department..."
          />
        </div>

        <div className="w-full sm:w-44">
          <FloatingDropdown
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: '', label: 'All Employment Types' },
              ...EMPLOYMENT_TYPES.map((t) => ({
                value: t,
                label: EMPLOYMENT_TYPE_LABELS[t],
              })),
            ]}
          />
        </div>
      </div>

      {/* ── Jobs Table / Cards ── */}
      <div className="rounded-2xl border border-[#ECE0D6] bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#ECE0D6] bg-[#FBF8F4] text-[11px] uppercase tracking-wider text-[#6B6B6B]">
                <th className="px-5 py-3.5 font-bold">Role & Code</th>
                <th className="px-5 py-3.5 font-bold">Department</th>
                <th className="px-5 py-3.5 font-bold">Type & Workplace</th>
                <th className="px-5 py-3.5 font-bold">Headcount</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold">Applicants</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3EDE4]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Loading job openings...
                  </td>
                </tr>
              ) : (!jobs || jobs.length === 0) ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    No job openings match the selected filters.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const deptName =
                    typeof job.departmentId === 'object' && job.departmentId
                      ? job.departmentId.name
                      : 'General';

                  return (
                    <tr
                      key={job._id}
                      className="hover:bg-[#FAF7F2] transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200/50 text-orange-600 flex items-center justify-center flex-shrink-0">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#111827]">{job.title}</p>
                            <span className="font-mono text-[10px] text-[#9B9B9B]">
                              {job.jobCode}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#4A4A4A] font-medium">
                        {deptName}
                      </td>

                      <td className="px-5 py-4 space-y-0.5">
                        <span className="text-[#111827] font-semibold block capitalize">
                          {job.employmentType.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-[#6B6B6B] block">
                          {job.locationType} ({job.location || 'Remote'})
                        </span>
                      </td>

                      <td className="px-5 py-4 font-mono font-semibold text-[#111827]">
                        {job.filledPositions} / {job.openPositions}
                        <span className="text-[10px] text-[#9B9B9B] font-normal block font-sans">
                          filled
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {canEdit ? (
                          <div className="w-36">
                            <FloatingDropdown<JobStatus>
                              size="sm"
                              value={job.status}
                              onChange={(val) => handleStatusChange(job._id, val)}
                              options={JOB_STATUSES.map((s) => ({
                                value: s,
                                label: JOB_STATUS_LABELS[s],
                                dotColor: s === 'published' ? '#10b981' : s === 'on_hold' ? '#f59e0b' : s === 'closed' ? '#ef4444' : '#64748b',
                              }))}
                            />
                          </div>
                        ) : (
                          <JobStatusPill status={job.status} />
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          to={`/dashboard/recruitment/pipeline?jobId=${job._id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          {job.applicantCount || 0} applicants
                        </Link>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setLinkedInJob(job)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0077b5] bg-blue-50 hover:bg-[#0077b5] hover:text-white border border-blue-200 transition-all shadow-2xs"
                            title="Generate AI LinkedIn Post"
                          >
                            <LinkedInIcon className="w-3.5 h-3.5 fill-current" />
                            <span className="hidden sm:inline">AI Post</span>
                          </button>

                          <Link
                            to={`/dashboard/recruitment/pipeline?jobId=${job._id}`}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-[#f97316] hover:bg-orange-50 border border-slate-200 transition-colors"
                            title="Open Kanban pipeline"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(job)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
                              title="Delete job opening"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateJobModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <LinkedInPostModal
        open={!!linkedInJob}
        onClose={() => setLinkedInJob(null)}
        job={linkedInJob}
      />
    </div>
  );
};
