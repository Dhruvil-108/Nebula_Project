import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Database,
  Plus,
  Search,
  Tag,
  Lock,
  Globe,
  MoreVertical,
  X,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  useTalentPools,
  useCreateTalentPool,
  useTalentPool,
  useRemoveCandidateFromPool,
} from '../../hooks/useRecruitment';
import type { TalentPool } from '../../types/recruitment';
import { toast } from 'react-toastify';

export const TalentPoolsPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  const { data: pools, isLoading, refetch } = useTalentPools();
  const createPoolMutation = useCreateTalentPool();
  const { data: selectedPool, isLoading: isSelectedPoolLoading } = useTalentPool(selectedPoolId || '');
  const removeCandidateMutation = useRemoveCandidateFromPool();

  // Create form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    isPrivate: false,
  });

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter a pool name');
      return;
    }

    try {
      await createPoolMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        isPrivate: formData.isPrivate,
      });
      toast.success('Talent pool created successfully!');
      setIsCreateModalOpen(false);
      setFormData({ name: '', description: '', tags: '', isPrivate: false });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create talent pool');
    }
  };

  const handleRemoveCandidate = async (candidateId: string) => {
    if (!selectedPoolId) return;
    if (!window.confirm('Remove candidate from this talent pool?')) return;

    try {
      await removeCandidateMutation.mutateAsync({
        poolId: selectedPoolId,
        candidateId,
      });
      toast.success('Candidate removed from pool');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove candidate');
    }
  };

  const filteredPools = (pools || []).filter((p) => {
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term)) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(term)))
    );
  });

  const totalCandidatesAcrossPools = (pools || []).reduce(
    (acc, p) => acc + (p.candidates?.length || 0),
    0
  );

  return (
    <div className="p-6 md:p-8 space-y-8 bg-[#FBF8F4] min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-[#f97316]">
              <Database className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black text-[#111827] tracking-tight">
              Talent Pools CRM
            </h1>
          </div>
          <p className="text-xs text-[#6B6B6B] mt-1">
            Curate, categorize, and nurture qualified silver-medalist and passive candidate pipelines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Pool
        </button>
      </div>

      {/* ── Metric Highlights ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Total Pools</p>
          <p className="text-2xl font-black text-[#111827] mt-1">{pools?.length || 0}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Sourced Candidates</p>
          <p className="text-2xl font-black text-[#f97316] mt-1">{totalCandidatesAcrossPools}</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B]">Public / Shared Pools</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">
            {pools?.filter((p) => !p.isPrivate).length || 0}
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pools by name, tag, or description..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-[#ECE0D6] focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all text-[#111827]"
          />
        </div>
      </div>

      {/* ── Pools Grid ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-[#6B6B6B]">
          <div className="w-8 h-8 border-3 border-[#f97316] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Loading talent pools...</p>
        </div>
      ) : filteredPools.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs">
          <Database className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#111827]">No talent pools found</h3>
          <p className="text-xs text-[#6B6B6B] mt-1 max-w-sm mx-auto">
            {search ? 'Try adjusting your search criteria.' : 'Create a pool to start archiving high-potential talent.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPools.map((pool) => (
            <div
              key={pool._id}
              className="p-6 rounded-3xl bg-white border border-[#ECE0D6] shadow-2xs hover:shadow-md hover:border-orange-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-bold text-sm text-[#111827] line-clamp-1">{pool.name}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      pool.isPrivate
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {pool.isPrivate ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                    {pool.isPrivate ? 'Private' : 'Shared'}
                  </span>
                </div>

                <p className="text-xs text-[#6B6B6B] line-clamp-2 mb-4 leading-relaxed">
                  {pool.description || 'No description provided.'}
                </p>

                {pool.tags && pool.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {pool.tags.slice(0, 4).map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] font-medium text-slate-600"
                      >
                        #{tag}
                      </span>
                    ))}
                    {pool.tags.length > 4 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{pool.tags.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#ECE0D6] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Users className="w-4 h-4 text-[#f97316]" />
                  <span>{pool.candidates?.length || 0} Candidates</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPoolId(pool._id)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#f97316] hover:text-[#ea580c] transition-colors cursor-pointer"
                >
                  <span>View Pool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Slide-Over / Candidate Drawer for Selected Pool ── */}
      <AnimatePresence>
        {selectedPoolId && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPoolId(null)}
              className="absolute inset-0 bg-black/30 backdrop-blur-xs"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-white shadow-2xl h-full flex flex-col z-10 border-l border-[#ECE0D6]"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#111827]">
                    {selectedPool?.name || 'Talent Pool'}
                  </h2>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    {selectedPool?.candidates?.length || 0} candidate(s) archived
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPoolId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Candidates List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {isSelectedPoolLoading ? (
                  <div className="text-center py-12 text-slate-400">Loading candidates...</div>
                ) : !selectedPool?.candidates || selectedPool.candidates.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">No candidates in this pool yet</p>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto mt-1">
                      Add candidates from the ATS pipeline to nurture them for future requisitions.
                    </p>
                  </div>
                ) : (
                  selectedPool.candidates.map((cand: any) => {
                    const candidateObj = cand.candidateId || cand;
                    return (
                      <div
                        key={candidateObj._id}
                        className="p-4 rounded-2xl bg-white border border-[#ECE0D6] shadow-2xs hover:border-orange-200 transition-all flex items-start justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-xs text-[#111827]">
                            {candidateObj.firstName} {candidateObj.lastName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            {candidateObj.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {candidateObj.email}
                              </span>
                            )}
                            {candidateObj.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {candidateObj.phone}
                              </span>
                            )}
                          </div>
                          {candidateObj.currentTitle && (
                            <p className="text-[11px] text-slate-600 flex items-center gap-1 pt-1">
                              <Briefcase className="w-3 h-3 text-[#f97316]" />
                              {candidateObj.currentTitle}
                              {candidateObj.currentCompany && ` at ${candidateObj.currentCompany}`}
                            </p>
                          )}
                          {cand.notes && (
                            <p className="text-[11px] text-orange-900 bg-orange-50/70 border border-orange-200/50 p-2 rounded-lg mt-2">
                              {cand.notes}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(candidateObj._id)}
                          className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded-md border border-rose-200/60 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Create Pool Modal ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-[#ECE0D6] shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-[#ECE0D6] flex items-center justify-between bg-[#FBF8F4]">
                <h3 className="font-bold text-sm text-[#111827]">Create Talent Pool</h3>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePool} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pool Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Senior Frontend React Specialists"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Purpose of this pool and target candidate profile..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="frontend, react, typescript, lead"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/20 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="w-4 h-4 rounded text-[#f97316] focus:ring-[#f97316]"
                  />
                  <label htmlFor="isPrivate" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Private pool (visible only to you and recruitment leads)
                  </label>
                </div>

                <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#ECE0D6]">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPoolMutation.isPending}
                    className="px-5 py-2 rounded-xl bg-[#f97316] hover:bg-[#ea580c] text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    {createPoolMutation.isPending ? 'Creating...' : 'Create Pool'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
