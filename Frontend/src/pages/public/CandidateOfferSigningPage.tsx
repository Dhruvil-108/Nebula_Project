import React, { useRef, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  PenTool,
  RotateCcw,
  Printer,
  ShieldCheck,
  Calendar,
  Briefcase,
  DollarSign,
  Building2,
  XCircle,
  Clock,
  Sparkles,
  Download,
} from 'lucide-react';
import {
  usePublicOffer,
  useSignPublicOffer,
  useDeclinePublicOffer,
} from '../../hooks/useRecruitment';
import { recruitmentApi } from '../../lib/recruitmentApi';

export const CandidateOfferSigningPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error, refetch } = usePublicOffer(token || null);
  const signMutation = useSignPublicOffer();
  const declineMutation = useDeclinePublicOffer();

  // Signature state
  const [signerName, setSignerName] = useState('');
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Decline Modal
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('better_offer');
  const [declineNotes, setDeclineNotes] = useState('');

  // Prefill candidate name once data loads
  useEffect(() => {
    if (data?.offer?.candidateName && !signerName) {
      setSignerName(data.offer.candidateName);
    }
  }, [data?.offer?.candidateName, signerName]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Convert typed signature to base64 image
  const generateTypedSignatureImage = (name: string): string => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 100;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';
    ctx.font = '36px "Brush Script MT", "Caveat", cursive';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(name || 'Signature', 20, 60);
    return tempCanvas.toDataURL('image/png');
  };

  const handleSign = () => {
    if (!token || !signerName.trim() || !agreedToTerms) return;

    let signatureImageUrl: string | undefined = undefined;
    if (signatureMode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        signatureImageUrl = canvas.toDataURL('image/png');
      }
    } else {
      signatureImageUrl = generateTypedSignatureImage(signerName.trim());
    }

    signMutation.mutate(
      {
        token,
        signerName: signerName.trim(),
        signatureImageUrl,
      },
      {
        onSuccess: () => {
          refetch();
        },
      }
    );
  };

  const handleDecline = () => {
    if (!token) return;
    declineMutation.mutate(
      {
        token,
        reason: declineReason,
        notes: declineNotes.trim(),
      },
      {
        onSuccess: () => {
          setShowDeclineModal(false);
          refetch();
        },
      }
    );
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center animate-spin mb-4">
          <Clock className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-[#1A1A1A]">Loading Official Offer Letter...</h2>
        <p className="text-xs text-[#6B6B6B] mt-1">Verifying secure signature token...</p>
      </div>
    );
  }

  // Error / Invalid Token state
  if (error || !data || !data.offer) {
    return (
      <div className="min-h-screen bg-[#FBF8F4] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#1A1A1A]">Offer Link Expired or Invalid</h2>
          <p className="text-xs text-[#6B6B6B] mt-2 leading-relaxed">
            The job offer link you requested is either expired, invalid, or has been revoked. Please
            contact your talent acquisition partner or recruiter for an updated offer link.
          </p>
        </div>
      </div>
    );
  }

  const { offer, organization, letterHtml } = data;
  const isAlreadySigned =
    offer.status === 'accepted' || offer.eSignature?.signedAt !== null;
  const isDeclined = offer.status === 'declined';
  const ctc = offer.compensationBreakdown?.totalCtc || offer.offeredSalary || 0;

  return (
    <div className="min-h-screen bg-[#FBF8F4] text-[#1A1A1A] pb-16 font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#ECE0D6] sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {organization?.logo ? (
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-8 h-8 rounded-lg object-contain border border-[#ECE0D6]"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {organization?.name?.[0] || 'N'}
              </div>
            )}
            <div>
              <h1 className="text-sm font-bold text-[#1A1A1A] leading-tight">
                {organization?.name || 'Company Offer Portal'}
              </h1>
              <p className="text-[11px] text-[#6B6B6B]">
                Offer Letter • Reference:{' '}
                <span className="font-mono font-semibold text-orange-600">{offer.offerCode}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={token ? recruitmentApi.getPublicOfferPdfUrl(token) : '#'}
              target="_blank"
              rel="noopener noreferrer"
              download={`Offer_Letter_${offer.offerCode || 'OFFER'}.pdf`}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-700 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              Download Official PDF
            </a>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl border border-[#ECE0D6] bg-white text-xs font-semibold text-[#1A1A1A] hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Banner if already signed */}
        {isAlreadySigned && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 shadow-xs flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">Offer Successfully Signed & Accepted</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-800">
                  Verified Legal Document
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                Thank you, <strong>{offer.eSignature?.signerName || offer.candidateName}</strong>! Your
                digital signature was securely recorded on{' '}
                {offer.eSignature?.signedAt
                  ? new Date(offer.eSignature.signedAt).toLocaleString()
                  : 'recently'}
                . Our People Operations team will reach out shortly regarding onboarding instructions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Banner if declined */}
        {isDeclined && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs flex items-center gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold">Offer Declined</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                This offer was marked as declined. Thank you for considering our organization.
              </p>
            </div>
          </div>
        )}

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-[#ECE0D6] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Role</p>
              <p className="text-xs font-bold text-[#1A1A1A] truncate">{offer.designation}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Total CTC</p>
              <p className="text-xs font-bold text-emerald-700 truncate">
                {offer.currency} {ctc.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Joining Date</p>
              <p className="text-xs font-bold text-[#1A1A1A] truncate">
                {new Date(offer.joiningDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6B6B6B]">Valid Until</p>
              <p className="text-xs font-bold text-[#1A1A1A] truncate">
                {new Date(offer.validUntil).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Offer Letter Document */}
        <div className="bg-white border border-[#ECE0D6] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-3.5 border-b border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-600" />
              <h2 className="text-xs font-bold text-[#1A1A1A]">Official Offer Letter Document</h2>
            </div>
            <span className="text-[11px] text-[#6B6B6B]">Read carefully before signing</span>
          </div>

          {/* Render Letter HTML */}
          <div className="p-8 sm:p-12 overflow-x-auto bg-white">
            <div
              className="prose prose-slate max-w-none text-xs leading-relaxed"
              dangerouslySetInnerHTML={{ __html: letterHtml }}
            />
          </div>
        </div>

        {/* E-Signature Capture Block (Only shown if offer is active and not already signed/declined) */}
        {!isAlreadySigned && !isDeclined && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#ECE0D6] rounded-2xl shadow-md p-6 sm:p-8 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#ECE0D6] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1A1A1A]">Electronic Signature Verification</h3>
                  <p className="text-[11px] text-[#6B6B6B]">
                    Compliant with UETA and ESIGN Act standards.
                  </p>
                </div>
              </div>

              {/* Mode switch */}
              <div className="flex items-center bg-[#FBF8F4] p-1 rounded-xl border border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    signatureMode === 'draw'
                      ? 'bg-white text-orange-600 shadow-2xs'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('type')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    signatureMode === 'type'
                      ? 'bg-white text-orange-600 shadow-2xs'
                      : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                  }`}
                >
                  Type Signature
                </button>
              </div>
            </div>

            {/* Legal Full Name input */}
            <div>
              <label className="block text-xs font-semibold text-[#1A1A1A] mb-1.5">
                Legal Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Enter your legal full name"
                className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3.5 py-2.5 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316] transition-all"
              />
            </div>

            {/* Signature Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[#1A1A1A]">
                  {signatureMode === 'draw' ? 'Draw your signature below' : 'Digital Cursive Preview'}
                </label>
                {signatureMode === 'draw' && (
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>

              {signatureMode === 'draw' ? (
                <div className="border border-dashed border-slate-300 rounded-xl bg-slate-50/50 p-2 relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-36 bg-white rounded-lg cursor-crosshair touch-none border border-slate-200"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-medium">
                      ✍️ Sign here using mouse or finger
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-36 rounded-xl border border-[#ECE0D6] bg-[#FBF8F4] flex items-center justify-center px-4">
                  <span className="font-serif italic text-3xl sm:text-4xl text-[#1A1A1A] tracking-wider select-none">
                    {signerName || 'Your Signature'}
                  </span>
                </div>
              )}
            </div>

            {/* Legal consent checkbox */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FBF8F4] border border-[#ECE0D6]">
              <input
                type="checkbox"
                id="agreeTerms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded text-orange-600 focus:ring-orange-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="agreeTerms" className="text-[11px] text-[#4A4A4A] leading-relaxed cursor-pointer select-none">
                I, <strong>{signerName || 'the undersigned candidate'}</strong>, confirm that I have
                carefully read and accepted all terms, compensation schedules, and contingencies in this
                offer letter. I agree that my electronic signature constitutes a legally binding document
                under applicable laws.
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowDeclineModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
              >
                Decline Offer...
              </button>

              <button
                type="button"
                onClick={handleSign}
                disabled={
                  !agreedToTerms ||
                  !signerName.trim() ||
                  (signatureMode === 'draw' && !hasDrawn) ||
                  signMutation.isPending
                }
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-md shadow-orange-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {signMutation.isPending ? 'Signing Offer...' : 'Sign & Accept Employment Offer'}
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Decline Confirmation Modal */}
      <AnimatePresence>
        {showDeclineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowDeclineModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white border border-[#ECE0D6] rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A1A1A]">Decline Job Offer</h4>
                  <p className="text-[11px] text-[#6B6B6B]">Please provide optional feedback</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">Reason</label>
                <select
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                >
                  <option value="better_offer">Accepted another offer</option>
                  <option value="salary_unmet">Compensation expectations unmet</option>
                  <option value="relocation_issue">Location / Commute constraints</option>
                  <option value="counter_offer">Accepted counter-offer from current employer</option>
                  <option value="personal">Personal reasons</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1A1A] mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={declineNotes}
                  onChange={(e) => setDeclineNotes(e.target.value)}
                  placeholder="Share any additional comments or context..."
                  className="w-full rounded-xl border border-[#ECE0D6] bg-white px-3 py-2 text-xs text-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#f97316]/25 focus:border-[#f97316]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ECE0D6]">
                <button
                  type="button"
                  onClick={() => setShowDeclineModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={declineMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
                >
                  {declineMutation.isPending ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
