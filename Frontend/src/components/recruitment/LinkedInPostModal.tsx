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
  Send,
  MessageSquare,
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

type ChannelType = 'linkedin' | 'naukri' | 'indeed' | 'whatsapp' | 'x';

export const LinkedInPostModal: React.FC<LinkedInPostModalProps> = ({
  open,
  onClose,
  job,
}) => {
  const [tone, setTone] = useState<'dynamic' | 'engineering' | 'professional'>('dynamic');
  const [customNotes, setCustomNotes] = useState('');
  const [activeChannel, setActiveChannel] = useState<ChannelType>('linkedin');
  const [channelPosts, setChannelPosts] = useState<Record<ChannelType, string>>({
    linkedin: '',
    naukri: '',
    indeed: '',
    whatsapp: '',
    x: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [provider, setProvider] = useState<string>('');

  const handleGenerate = async (selectedTone = tone) => {
    if (!job) return;
    setIsGenerating(true);
    try {
      const data = await recruitmentApi.generateMultiChannelPosts(job._id, {
        tone: selectedTone,
        channels: ['linkedin', 'naukri', 'indeed', 'whatsapp', 'x'],
        customNotes: customNotes.trim(),
      });

      if (data && data.channels) {
        setChannelPosts({
          linkedin: data.channels.linkedin || '',
          naukri: data.channels.naukri || '',
          indeed: data.channels.indeed || '',
          whatsapp: data.channels.whatsapp || '',
          x: data.channels.x || data.channels.twitter || '',
        });
      }
      setProvider(data?.provider || 'AI Engine');
    } catch (err: any) {
      console.warn('Multi-channel generation fallback to single LinkedIn post:', err);
      try {
        const legacyData = await recruitmentApi.generateLinkedInPost(job._id, {
          tone: selectedTone,
          customNotes: customNotes.trim(),
        });
        setChannelPosts((prev) => ({
          ...prev,
          linkedin: legacyData.post,
        }));
        setProvider(legacyData.provider);
      } catch (legacyErr: any) {
        toast.error('Failed to generate multi-channel post');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (open && job) {
      handleGenerate();
    } else {
      setChannelPosts({
        linkedin: '',
        naukri: '',
        indeed: '',
        whatsapp: '',
        x: '',
      });
      setCopied(false);
    }
  }, [open, job]);

  if (!open || !job) return null;

  const currentContent = channelPosts[activeChannel] || '';

  const handleCopy = () => {
    if (!currentContent) return;
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    toast.success(`${activeChannel.toUpperCase()} post copied to clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectShare = () => {
    navigator.clipboard.writeText(currentContent);

    if (activeChannel === 'linkedin') {
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        window.location.origin
      )}`;
      window.open(shareUrl, '_blank', 'width=650,height=600');
    } else if (activeChannel === 'whatsapp') {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(currentContent)}`;
      window.open(whatsappUrl, '_blank');
    } else if (activeChannel === 'x') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        currentContent.slice(0, 280)
      )}`;
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    } else {
      toast.info(`Text copied! Paste directly into ${activeChannel.toUpperCase()} employer portal.`);
    }
  };

  const deptName =
    typeof job.departmentId === 'object' && job.departmentId
      ? job.departmentId.name
      : 'Engineering';

  const channels: { id: ChannelType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'linkedin', label: 'LinkedIn', icon: <LinkedInIcon className="w-3.5 h-3.5 fill-current" />, color: '#0077b5' },
    { id: 'naukri', label: 'Naukri.com', icon: <Globe className="w-3.5 h-3.5" />, color: '#2752cf' },
    { id: 'indeed', label: 'Indeed', icon: <Building2 className="w-3.5 h-3.5" />, color: '#003a9b' },
    { id: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-3.5 h-3.5" />, color: '#25D366' },
    {
      id: 'x',
      label: 'X / Twitter',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: '#000000',
    },
  ];

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
            <div className="px-6 py-4 border-b border-[#ECE0D6] bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#f97316] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-[#1A1A1A]">AI Multi-Channel Job Marketer</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-100 text-[#ea580c]">
                      Phase 2 AI
                    </span>
                  </div>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Generate platform-optimized job promotion copy across 5 major distribution channels.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Job Info Strip */}
            <div className="px-6 py-2.5 bg-[#FBF8F4] border-b border-[#ECE0D6] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1A1A1A]">{job.title}</span>
                <span className="text-slate-400">·</span>
                <span className="text-[#6B6B6B] flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {deptName}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-[#6B6B6B] flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  {job.location}
                </span>
              </div>
            </div>

            {/* Channel Tabs */}
            <div className="px-6 pt-3 bg-slate-50/60 border-b border-[#ECE0D6] flex items-center gap-1.5 overflow-x-auto">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setActiveChannel(ch.id);
                    setCopied(false);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer border-t border-x ${
                    activeChannel === ch.id
                      ? 'bg-white border-[#ECE0D6] border-b-transparent text-[#111827] shadow-2xs -mb-px'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/60'
                  }`}
                >
                  <span style={{ color: activeChannel === ch.id ? ch.color : undefined }}>
                    {ch.icon}
                  </span>
                  <span>{ch.label}</span>
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Tone Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Copywriting Tone
                  </label>
                  <FloatingDropdown
                    value={tone}
                    onChange={(val) => {
                      setTone(val as any);
                      handleGenerate(val as any);
                    }}
                    options={[
                      { value: 'dynamic', label: '🚀 Dynamic & High-Growth' },
                      { value: 'engineering', label: '🛠 Deep Tech & Pragmatic' },
                      { value: 'professional', label: '👔 Corporate & Executive' },
                    ]}
                    className="w-full"
                  />
                </div>

                {/* Custom Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Extra Context or Perks
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="e.g. $10k sign-on bonus, 100% remote..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:bg-white focus:border-[#f97316]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleGenerate();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerate()}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#f97316] hover:bg-orange-50 border border-orange-200 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>

              {/* Editable Post Text Area */}
              <div className="relative">
                {isGenerating ? (
                  <div className="h-60 flex flex-col items-center justify-center text-slate-400 space-y-2">
                    <Sparkles className="w-6 h-6 text-[#f97316] animate-pulse" />
                    <p className="text-xs font-medium">Drafting multi-channel copy with AI...</p>
                  </div>
                ) : (
                  <textarea
                    rows={11}
                    value={currentContent}
                    onChange={(e) =>
                      setChannelPosts((prev) => ({
                        ...prev,
                        [activeChannel]: e.target.value,
                      }))
                    }
                    className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#f97316]/20 focus:border-[#f97316] transition-all resize-none"
                    placeholder={`Click regenerate to generate your ${activeChannel.toUpperCase()} post...`}
                  />
                )}
              </div>

              {/* Word & Char Counts */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  {currentContent.length} characters ·{' '}
                  {currentContent.split(/\s+/).filter(Boolean).length} words
                  {activeChannel === 'x' && (
                    <span className={currentContent.length > 280 ? ' text-rose-600 font-bold ml-1.5' : ' ml-1.5'}>
                      (Limit: 280 chars)
                    </span>
                  )}
                </span>
                {provider && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                    Engine: {provider}
                  </span>
                )}
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
                  disabled={!currentContent || isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-[#ECE0D6] hover:bg-slate-50 text-[#1A1A1A] shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
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
                  onClick={handleDirectShare}
                  disabled={!currentContent || isGenerating}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#f97316] hover:bg-[#ea580c] text-white shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share to {activeChannel.toUpperCase()}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
