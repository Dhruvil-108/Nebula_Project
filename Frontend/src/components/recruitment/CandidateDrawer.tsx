import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  Building2,
  Briefcase,
  Star,
  FileText,
  CalendarClock,
  Award,
  UserCheck,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Video,
} from 'lucide-react';
import { LinkedInIcon } from '../ui/LinkedInIcon';
import { clsx } from 'clsx';
import { useCandidate, useMoveCandidateStage } from '../../hooks/useRecruitment';
import { useModuleAccess } from '../../hooks/useModuleAccess';
import { CandidateStagePill } from './CandidateStagePill';
import { FloatingDropdown } from '../ui/FloatingDropdown';
import {
  CANDIDATE_STAGES,
  STAGE_LABELS,
  type Candidate,
  type CandidateStage,
} from '../../types/recruitment';

interface CandidateDrawerProps {
  candidateId: string | null;
  onClose: () => void;
  onScheduleInterview?: (candidate: Candidate) => void;
  onCreateOffer?: (candidate: Candidate) => void;
  onOnboardEmployee?: (candidate: Candidate) => void;
}

export const CandidateDrawer: React.FC<CandidateDrawerProps> = ({
  candidateId,
  onClose,
  onScheduleInterview,
  onCreateOffer,
  onOnboardEmployee,
}) => {
  const { can } = useModuleAccess('recruitment');
  const canEdit = can('edit');
  const canApprove = can('approve');

  const { data: candidate, isLoading } = useCandidate(candidateId);
  const moveStageMutation = useMoveCandidateStage();
  const [activeTab, setActiveTab] = useState<'details' | 'interviews' | 'offer' | 'activity'>('details');

  if (!candidateId) return null;

  const jobTitle =
    typeof candidate?.jobOpeningId === 'object' && candidate.jobOpeningId
      ? candidate.jobOpeningId.title
      : 'Open Position';

  const handleStageChange = (newStage: CandidateStage) => {
    if (!candidate || newStage === candidate.stage) return;
    moveStageMutation.mutate({
      id: candidate._id,
      stage: newStage,
      note: `Stage changed to ${STAGE_LABELS[newStage]} via Candidate Drawer`,
    });
  };

  return (
    <AnimatePresence>
      {Boolean(candidateId) && (
        <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-2xl bg-white border-l border-[#ECE0D6] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {candidate?.fullName.charAt(0) || 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1A1A1A] truncate">
                      {candidate?.fullName || 'Loading candidate...'}
                    </h3>
                    {candidate && (
                      <span className="font-mono text-xs text-[#9B9B9B] px-1.5 py-0.5 rounded bg-white border border-[#ECE0D6]">
                        {candidate.candidateCode}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6B6B] truncate mt-0.5">{jobTitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#FBEAE0] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Bar & Stage Bar */}
            {candidate && (
              <div className="px-6 py-3 border-b border-[#ECE0D6] bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[#6B6B6B]">Stage:</span>
                  {canEdit ? (
                    <div className="w-48">
                      <FloatingDropdown<CandidateStage>
                        size="sm"
                        value={candidate.stage}
                        onChange={(val) => handleStageChange(val)}
                        options={CANDIDATE_STAGES.map((s) => ({
                          value: s,
                          label: STAGE_LABELS[s],
                          dotColor:
                            s === 'hired'
                              ? '#059669'
                              : s === 'offer_sent'
                              ? '#ea580c'
                              : s === 'rejected'
                              ? '#dc2626'
                              : s === 'screening'
                              ? '#7c3aed'
                              : s === 'technical_assessment'
                              ? '#d97706'
                              : '#2563eb',
                        }))}
                      />
                    </div>
                  ) : (
                    <CandidateStagePill stage={candidate.stage} />
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {canEdit && candidate.stage !== 'hired' && (
                    <button
                      type="button"
                      onClick={() => onScheduleInterview?.(candidate)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                    >
                      <CalendarClock className="w-3.5 h-3.5 text-slate-600" />
                      Schedule Interview
                    </button>
                  )}

                  {canEdit && candidate.stage !== 'hired' && (
                    <button
                      type="button"
                      onClick={() => onCreateOffer?.(candidate)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      Make Offer
                    </button>
                  )}

                  {canApprove && (
                    candidate.convertedEmployeeId ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg border border-emerald-200">
                        <UserCheck className="w-3.5 h-3.5" />
                        Onboarded to HRMS
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOnboardEmployee?.(candidate)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 rounded-lg shadow-sm transition-all"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Onboard to HRMS
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center px-6 border-b border-[#ECE0D6] bg-white gap-6 text-xs font-medium text-[#6B6B6B]">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={clsx(
                  'py-3 border-b-2 font-semibold transition-colors',
                  activeTab === 'details'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent hover:text-[#1A1A1A]'
                )}
              >
                Overview & Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('interviews')}
                className={clsx(
                  'py-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5',
                  activeTab === 'interviews'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent hover:text-[#1A1A1A]'
                )}
              >
                Interviews
                <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
                  {candidate?.interviews?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('offer')}
                className={clsx(
                  'py-3 border-b-2 font-semibold transition-colors flex items-center gap-1.5',
                  activeTab === 'offer'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent hover:text-[#1A1A1A]'
                )}
              >
                Offer Details
                {candidate?.offer && (
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('activity')}
                className={clsx(
                  'py-3 border-b-2 font-semibold transition-colors',
                  activeTab === 'activity'
                    ? 'border-[#f97316] text-[#f97316]'
                    : 'border-transparent hover:text-[#1A1A1A]'
                )}
              >
                Timeline
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {isLoading || !candidate ? (
                <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
                  Loading candidate details...
                </div>
              ) : activeTab === 'details' ? (
                <div className="space-y-6">
                  {/* Contact & Professional Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="p-3.5 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4]">
                      <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#6B6B6B]">
                        Contact
                      </span>
                      <div className="mt-2 space-y-1.5 text-xs text-[#1A1A1A]">
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-[#9B9B9B]" />
                          <a href={`mailto:${candidate.email}`} className="text-[#f97316] hover:underline">
                            {candidate.email}
                          </a>
                        </div>
                        {candidate.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-[#9B9B9B]" />
                            <span>{candidate.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4]">
                      <span className="text-[10.5px] uppercase tracking-wider font-semibold text-[#6B6B6B]">
                        Experience & Notice
                      </span>
                      <div className="mt-2 space-y-1.5 text-xs text-[#1A1A1A]">
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Total Experience:</span>
                          <span className="font-semibold">{candidate.totalExperienceYears} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Notice Period:</span>
                          <span className="font-semibold">{candidate.noticePeriodDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#6B6B6B]">Expected Salary:</span>
                          <span className="font-semibold">${candidate.expectedSalary.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resume and Links */}
                  <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#1A1A1A]">
                          {candidate.resumeFileName || `${candidate.fullName} Resume`}
                        </p>
                        <p className="text-[10px] text-[#6B6B6B]">Attached application document</p>
                      </div>
                    </div>
                    {candidate.resumeUrl ? (
                      <a
                        href={candidate.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View CV
                      </a>
                    ) : (
                      <span className="text-xs text-[#9B9B9B]">No URL attached</span>
                    )}
                  </div>

                  {/* LinkedIn Profile */}
                  {candidate.linkedinUrl && (
                    <div className="p-4 rounded-xl border border-[#ECE0D6] bg-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#0077b5] flex items-center justify-center border border-blue-200">
                          <LinkedInIcon className="w-4 h-4 fill-current" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#1A1A1A]">LinkedIn Profile</p>
                          <p className="text-[10px] text-[#6B6B6B] truncate max-w-[220px]">
                            {candidate.linkedinUrl}
                          </p>
                        </div>
                      </div>
                      <a
                        href={
                          candidate.linkedinUrl.startsWith('http')
                            ? candidate.linkedinUrl
                            : `https://${candidate.linkedinUrl}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0077b5] bg-blue-50 hover:bg-[#0077b5] hover:text-white rounded-lg border border-blue-200 transition-colors shadow-2xs"
                      >
                        <LinkedInIcon className="w-3.5 h-3.5 fill-current" />
                        View Profile
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </div>
                  )}

                  {/* Skills tags */}
                  {candidate.skills && candidate.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-[#1A1A1A] mb-2 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[#f97316]" />
                        Skills & Competencies
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {candidate.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#FAF7F2] border border-[#ECE0D6] text-[#4A4A4A]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recruiter Notes */}
                  {candidate.notes && (
                    <div className="p-4 rounded-xl border border-[#ECE0D6] bg-[#FAF7F2]">
                      <h4 className="text-xs font-bold text-[#1A1A1A] mb-1">Recruiter Notes</h4>
                      <p className="text-xs text-[#4A4A4A] leading-relaxed whitespace-pre-wrap">
                        {candidate.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : activeTab === 'interviews' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#1A1A1A]">Scheduled & Past Rounds</h4>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onScheduleInterview?.(candidate)}
                        className="text-xs font-semibold text-[#f97316] hover:underline"
                      >
                        + Schedule Round
                      </button>
                    )}
                  </div>

                  {(!candidate.interviews || candidate.interviews.length === 0) ? (
                    <div className="p-8 text-center border border-dashed border-[#ECE0D6] rounded-xl text-slate-400 text-xs">
                      No interviews scheduled yet.
                    </div>
                  ) : (
                    candidate.interviews.map((iv) => (
                      <div
                        key={iv._id}
                        className="p-4 rounded-xl border border-[#ECE0D6] bg-white space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-[#1A1A1A]">{iv.title}</p>
                            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                              {new Date(iv.scheduledStart).toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {iv.meetingLink && (
                              <a
                                href={iv.meetingLink}
                                target="_blank"
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors shadow-2xs ${
                                  iv.meetingLink.includes('meet.google.com')
                                    ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200'
                                }`}
                              >
                                <Video className="w-3 h-3" />
                                {iv.meetingLink.includes('meet.google.com') ? 'Meet' : 'Join'}
                              </a>
                            )}
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {iv.status}
                            </span>
                          </div>
                        </div>

                        {iv.scorecard?.rating && (
                          <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-amber-800">Scorecard: {iv.scorecard.decision}</span>
                              <span className="font-bold text-amber-600">{iv.scorecard.rating} / 5 ★</span>
                            </div>
                            {iv.scorecard.notes && (
                              <p className="text-[11px] text-amber-700 italic">"{iv.scorecard.notes}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : activeTab === 'offer' ? (
                <div className="space-y-4">
                  {candidate.offer ? (
                    <div className="p-5 rounded-xl border border-[#ECE0D6] bg-white space-y-4">
                      <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-3">
                        <div>
                          <p className="text-xs font-mono font-bold text-[#f97316]">{candidate.offer.offerCode}</p>
                          <h4 className="text-sm font-bold text-[#1A1A1A] mt-0.5">{candidate.offer.designation}</h4>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                          {candidate.offer.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#6B6B6B]">Offered Salary:</span>
                          <p className="font-bold text-sm text-[#1A1A1A] mt-0.5">
                            {candidate.offer.currency} {candidate.offer.offeredSalary.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#6B6B6B]">Proposed Joining Date:</span>
                          <p className="font-semibold text-[#1A1A1A] mt-0.5">
                            {new Date(candidate.offer.joiningDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {candidate.offer.notes && (
                        <p className="text-xs text-[#6B6B6B] italic bg-[#FAF7F2] p-2.5 rounded-lg border border-[#ECE0D6]">
                          {candidate.offer.notes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center border border-dashed border-[#ECE0D6] rounded-xl text-slate-400 text-xs space-y-3">
                      <p>No job offer generated for this candidate yet.</p>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => onCreateOffer?.(candidate)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#f97316] hover:bg-[#ea580c] rounded-lg shadow-sm"
                        >
                          Create Offer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#1A1A1A] mb-3">Activity & Stage Progression</h4>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#ECE0D6]">
                    {(candidate.activities || []).map((act) => (
                      <div key={act._id} className="relative">
                        <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#f97316] ring-4 ring-white" />
                        <div className="text-xs">
                          <p className="font-semibold text-[#1A1A1A]">{act.title}</p>
                          <p className="text-[11px] text-[#6B6B6B] mt-0.5">{act.description}</p>
                          <span className="text-[10px] text-[#9B9B9B] mt-1 block">
                            {new Date(act.createdAt).toLocaleString()} by {act.performedBy?.fullName || 'User'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        </div>
      )}
    </AnimatePresence>
  );
};
