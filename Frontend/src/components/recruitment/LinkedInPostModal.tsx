import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Building2,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import { LinkedInIcon } from '../ui/LinkedInIcon';
import { recruitmentApi } from '../../lib/recruitmentApi';
import type { JobOpening } from '../../types/recruitment';
import { FloatingDropdown } from '../ui/FloatingDropdown';
import { toast } from 'react-toastify';

interface LinkedInPostModalProps {
  open: boolean;
  onClose: () => void;
  job: JobOpening | null;
}

export const LinkedInPostModal: React.FC<LinkedInPostModalProps> = ({
  open,
  onClose,
  job,
}) => {
  const [tone, setTone] = useState<'dynamic' | 'engineering' | 'professional'>('dynamic');
  const [customNotes, setCustomNotes] = useState('');
  const [postContent, setPostContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState<string>('');

  const handleGenerate = async (selectedTone = tone) => {
    if (!job) return;
    setIsGenerating(true);
    try {
      const data = await recruitmentApi.generateLinkedInPost(job._id, {
        tone: selectedTone,
        customNotes: customNotes.trim(),
      });
      setPostContent(data.post);
      setProvider(data.provider);
    } catch (err: any) {
      console.error('Failed to generate post:', err);
      toast.error(err.response?.data?.message || 'Failed to generate LinkedIn post');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open && job) {
      handleGenerate();
    } else {
      setPostContent('');
      setCopied(false);
    }
  }, [open, job]);

  if (!open || !job) return null;

  const handleCopy = () => {
    if (!postContent) return;
    navigator.clipboard.writeText(postContent);
    setCopied(true);
    toast.success('LinkedIn post copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareOnLinkedIn = () => {
    // Copy content first for easy pasting
    navigator.clipboard.writeText(postContent);
    toast.info('Post text copied! Opening LinkedIn sharing window...');

    // Open LinkedIn Share dialog
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      window.location.origin
    )}`;
    window.open(shareUrl, '_blank', 'width=650,height=600');
  };

  const deptName =
    typeof job.departmentId === 'object' && job.departmentId
      ? job.departmentId.name
      : 'Engineering';

  return (
    <AnimatePresence>
      {open && job && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/45 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#ECE0D6] bg-gradient-to-r from-blue-500/10 via-orange-500/10 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0077b5] text-white flex items-center justify-center shadow-xs">
                <LinkedInIcon className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-[#1A1A1A]">AI LinkedIn Job Post Creator</h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-[#ea580c] border border-orange-200">
                    <Sparkles className="w-2.5 h-2.5" /> AI Powered
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6B6B]">
                  Job: <strong className="text-[#1A1A1A]">{job.title}</strong> · {deptName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            {/* Tone Selector & Custom Instructions */}
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#ECE0D6] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1A1A]">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#f97316]" />
                  Tone & Perspective
                </div>
                <div className="w-full sm:w-60">
                  <FloatingDropdown
                    value={tone}
                    onChange={(val) => {
                      setTone(val as any);
                      handleGenerate(val as any);
                    }}
                    options={[
                      { value: 'dynamic', label: '🚀 Exciting & Startup' },
                      { value: 'engineering', label: '🛠️ High-Tech & Engineering' },
                      { value: 'professional', label: '💼 Corporate & Formal' },
                    ]}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Optional custom instructions (e.g. emphasize equity, mention signing bonus, target seniors)..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-1.5 text-xs text-[#1A1A1A] placeholder:text-[#9B9B9B] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all"
                />
              </div>
            </div>

            {/* LinkedIn Post Mock Preview Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xs p-4 space-y-3">
              {/* LinkedIn User Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0077b5] to-blue-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 leading-tight">
                      Nebula Talent Hub
                    </h4>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      Hiring · Just now · <Globe className="w-2.5 h-2.5 text-slate-400" />
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleGenerate()}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#f97316] hover:text-[#ea580c] px-2.5 py-1 rounded-lg hover:bg-orange-50 border border-orange-200/60 transition-all disabled:opacity-50"
                  title="Regenerate with AI"
                >
                  <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Drafting...' : 'Regenerate'}
                </button>
              </div>

              {/* Editable Post Text Body */}
              <div className="relative">
                {isGenerating ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Sparkles className="w-6 h-6 text-[#f97316] animate-pulse" />
                    <p className="text-xs font-medium">Crafting high-converting LinkedIn post with AI...</p>
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed font-sans focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0077b5]/20 focus:border-[#0077b5] transition-all resize-none"
                    placeholder="Click regenerate to generate your post..."
                  />
                )}
              </div>

              {/* Post Metadata & Quick Stats */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  {postContent.length} characters · {postContent.split(/\s+/).filter(Boolean).length} words
                </span>
                {provider && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                    Engine: {provider}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 border-t border-[#ECE0D6] bg-[#FBF8F4] flex flex-wrap items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!postContent || isGenerating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#ECE0D6] hover:bg-slate-50 text-[#1A1A1A] shadow-2xs transition-all disabled:opacity-50"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copy Content
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleShareOnLinkedIn}
                disabled={!postContent || isGenerating}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#0077b5] hover:bg-[#006097] text-white shadow-md shadow-[#0077b5]/20 transition-all disabled:opacity-50"
              >
                <LinkedInIcon className="w-3.5 h-3.5 fill-current" />
                Share on LinkedIn
                <Share2 className="w-3 h-3 opacity-75" />
              </button>
            </div>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
