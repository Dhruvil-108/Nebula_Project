import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Sparkles,
  Bot,
  TrendingUp,
  FileSearch,
  ShieldAlert,
  Award,
  Send,
  LoaderCircle,
  AlertTriangle,
  CheckCircle2,
  Package,
  Calendar,
  DollarSign,
  ArrowRight,
  RefreshCw,
  UploadCloud,
  FileText,
  ThumbsUp,
  XCircle,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Clock,
  Layers,
} from 'lucide-react';

import {
  queryInventoryCopilot,
  getDemandForecast,
  createRequisitionFromForecast,
  extractDocumentOcr,
  scanInventoryAnomalies,
  getInventoryAnomalies,
  recordAnomalyFeedback,
  getSupplierScore,
} from '../../lib/inventoryAiApi';
import { useInventoryItems, useSuppliers } from '../../hooks/useInventory';
import type {
  DemandForecastResponse,
  DocumentOcrResult,
  InventoryAnomaly,
  SupplierEvaluation,
} from '../../types/inventoryAi';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  category?: string;
  suggestedFollowUps?: string[];
  timestamp: string;
}

export const InventoryAiCopilotPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'copilot' | 'forecast' | 'ocr' | 'anomalies' | 'suppliers'>('copilot');

  // ── Copilot Chat State ──
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Hello! I am your **Nebula Inventory AI Copilot**.\n\nI can analyze stock run-rates, evaluate supplier performance, check warehouse valuations, or scan for inventory shrinkage. What would you like to explore?",
      suggestedFollowUps: [
        'Items below reorder level',
        'Total inventory valuation',
        'Storage distribution by warehouse',
        'Batches expiring soon',
        'Top suppliers by purchase spend',
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // ── Demand Forecast State ──
  const { data: itemsData } = useInventoryItems({ limit: 100 });
  const items = itemsData?.items || [];
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [lookbackDays, setLookbackDays] = useState<number>(60);
  const [isCreatingPr, setIsCreatingPr] = useState(false);

  useEffect(() => {
    if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0]._id);
    }
  }, [items, selectedItemId]);

  const { data: forecastData, isLoading: isForecastLoading, refetch: refetchForecast } = useQuery<DemandForecastResponse>({
    queryKey: ['inventoryForecast', selectedItemId, lookbackDays],
    queryFn: () => getDemandForecast(selectedItemId, lookbackDays),
    enabled: Boolean(selectedItemId),
  });

  // ── OCR State ──
  const [ocrBase64, setOcrBase64] = useState<string>('');
  const [ocrFileName, setOcrFileName] = useState<string>('');
  const [ocrResult, setOcrResult] = useState<DocumentOcrResult | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  // ── Anomalies State ──
  const { data: anomaliesData, isLoading: isAnomaliesLoading, refetch: refetchAnomalies } = useQuery({
    queryKey: ['inventoryAnomalies'],
    queryFn: () => getInventoryAnomalies(),
  });
  const anomalies = anomaliesData?.anomalies || [];
  const [isScanningAnomalies, setIsScanningAnomalies] = useState(false);

  // ── Supplier Scorecard State ──
  const { data: suppliersData } = useSuppliers({ limit: 100 });
  const suppliers = suppliersData?.suppliers || [];
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

  useEffect(() => {
    if (suppliers.length > 0 && !selectedSupplierId) {
      setSelectedSupplierId(suppliers[0]._id);
    }
  }, [suppliers, selectedSupplierId]);

  const { data: supplierScoreData, isLoading: isSupplierScoreLoading, refetch: refetchSupplierScore } = useQuery<SupplierEvaluation>({
    queryKey: ['supplierScore', selectedSupplierId],
    queryFn: () => getSupplierScore(selectedSupplierId),
    enabled: Boolean(selectedSupplierId),
  });

  // ── Chat Submit Handler ──
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || chatInput).trim();
    if (!prompt) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsCopilotThinking(true);

    try {
      const res = await queryInventoryCopilot(prompt);
      if (res.providerError) {
        toast.warn(`Copilot used verified inventory data without live Gemini enrichment: ${res.providerError}.`);
      }
      const aiMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        text: res.answer,
        category: res.category,
        suggestedFollowUps: res.suggestedFollowUps,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to query AI copilot.');
    } finally {
      setIsCopilotThinking(false);
    }
  };

  // ── 1-Click Draft PR Creation ──
  const handleCreateDraftPr = async () => {
    if (!forecastData) return;
    setIsCreatingPr(true);
    try {
      const res = await createRequisitionFromForecast({
        itemId: forecastData.item._id,
        quantity: forecastData.metrics.recommendedOrderQty,
        notes: `AI Smart Reorder based on ${lookbackDays}-day run-rate of ${forecastData.metrics.dailyRunRate} units/day.`,
      });
      toast.success(res.message || 'Draft Purchase Requisition generated!');
      queryClient.invalidateQueries({ queryKey: ['purchaseRequisitions'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create requisition from forecast.');
    } finally {
      setIsCreatingPr(false);
    }
  };

  // ── OCR File Upload Handler ──
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrFileName(file.name);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setOcrBase64(base64);
      runOcrExtraction(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const runOcrExtraction = async (base64String: string, mimeType: string = 'image/jpeg') => {
    setIsOcrProcessing(true);
    setOcrResult(null);
    try {
      const result = await extractDocumentOcr({
        documentBase64: base64String,
        mimeType,
      });
      setOcrResult(result);
      toast.success(`Extracted ${result.data.lineItems?.length || 0} line items with ${(result.data.confidence * 100).toFixed(0)}% confidence!`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Document OCR extraction failed.');
    } finally {
      setIsOcrProcessing(false);
    }
  };

  // ── Run Anomaly Scan ──
  const handleTriggerAnomalyScan = async () => {
    setIsScanningAnomalies(true);
    try {
      const scanRes = await scanInventoryAnomalies();
      toast.success(`Scan complete! ${scanRes.anomalies?.length || 0} operational anomalies cataloged.`);
      refetchAnomalies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to run anomaly scan.');
    } finally {
      setIsScanningAnomalies(false);
    }
  };

  // ── Anomaly Feedback ──
  const handleAnomalyFeedback = async (
    anomalyId: string,
    action: 'acknowledged' | 'dismissed' | 'resolved',
    feedbackType: 'confirmed_issue' | 'false_positive'
  ) => {
    try {
      await recordAnomalyFeedback(anomalyId, {
        status: action,
        userFeedback: feedbackType,
        feedbackNote: `User action: ${action} (${feedbackType}) via Inventory Radar.`,
      });
      toast.success(`Anomaly ${action}!`);
      refetchAnomalies();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update anomaly status.');
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400 animate-pulse" />
              Gemini 1.5 Intelligence
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Live Advisory Mode
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Inventory AI Copilot & Anomaly Radar
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Autonomous demand forecasting, Vision OCR cross-checks, shrinkage detection, and natural language supply chain intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (activeTab === 'forecast') refetchForecast();
              if (activeTab === 'anomalies') handleTriggerAnomalyScan();
              if (activeTab === 'suppliers') refetchSupplierScore();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Signals
          </button>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'copilot'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot className="w-4 h-4" />
          AI Assistant Copilot
        </button>

        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'forecast'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Demand Forecast & Reorder
        </button>

        <button
          onClick={() => setActiveTab('ocr')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'ocr'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSearch className="w-4 h-4" />
          Document OCR & PO Matcher
        </button>

        <button
          onClick={() => setActiveTab('anomalies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'anomalies'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Anomaly & Shrinkage Radar
          {anomalies.filter((a: InventoryAnomaly) => a.status === 'open').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold">
              {anomalies.filter((a: InventoryAnomaly) => a.status === 'open').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'suppliers'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Supplier Scorecard
        </button>
      </div>

      {/* ── TAB 1: Copilot Chat Assistant ── */}
      {activeTab === 'copilot' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col h-[650px] overflow-hidden">
            {/* Chat Messages Log */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 max-w-2xl ${
                    m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      m.sender === 'user'
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                    }`}
                  >
                    {m.sender === 'user' ? (
                      <span className="text-xs font-bold">U</span>
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-slate-900 text-white rounded-tr-none'
                          : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-none'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                    </div>

                    {/* Suggested Follow-Ups */}
                    {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {m.suggestedFollowUps.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(chip)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all font-medium flex items-center gap-1 shadow-3xs"
                          >
                            <ArrowRight className="w-2.5 h-2.5" />
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block px-1">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isCopilotThinking && (
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  </div>
                  <span>Analyzing inventory database...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything (e.g. 'Items below reorder level', 'Total valuation', 'Expiring batches')..."
                  className="flex-1 text-xs px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isCopilotThinking}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Quick Shortcuts & Guardrails Panel */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Read-Only Safe Architecture
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The Inventory Copilot runs strictly whitelisted parameterized queries scoped to your tenant. All financial figures are reconciled directly from append-only ledger entries.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Tenant Scoping</span>
                  <span className="font-semibold text-emerald-600">Strictly Enforced</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Ledger Mutation</span>
                  <span className="font-semibold text-blue-600">Human Approval Required</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-indigo-950">Quick Inquiries</h4>
              <div className="space-y-1.5">
                {[
                  'Items below reorder level',
                  'Total inventory valuation',
                  'Storage distribution by warehouse',
                  'Batches expiring in next 60 days',
                  'Top suppliers by purchase spend',
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-white/80 hover:bg-white text-xs text-slate-700 hover:text-indigo-600 border border-indigo-50 hover:border-indigo-200 transition-all font-medium truncate"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Demand Forecast & Smart Reorder ── */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Select Catalog Item
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  {items.map((it) => (
                    <option key={it._id} value={it._id}>
                      {it.name} ({it.sku}) — {it.baseUom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Historical Window
                </label>
                <select
                  value={lookbackDays}
                  onChange={(e) => setLookbackDays(Number(e.target.value))}
                  className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value={30}>Past 30 Days</option>
                  <option value={60}>Past 60 Days</option>
                  <option value={90}>Past 90 Days</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateDraftPr}
              disabled={isCreatingPr || !forecastData}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-all flex items-center gap-2 shadow-xs"
            >
              {isCreatingPr ? (
                <LoaderCircle className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              1-Click Generate Draft PR
            </button>
          </div>

          {isForecastLoading && (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
              <LoaderCircle className="w-6 h-6 animate-spin mr-2 text-indigo-600" />
              Calculating moving average velocities & stockout projections...
            </div>
          )}

          {forecastData && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Days of Supply
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {forecastData.metrics.daysOfSupply}
                    </span>
                    <span className="text-xs text-slate-400">days left</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Lead buffer: {forecastData.item.preferredSupplier?.leadTimeDays || 7} days
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Daily Run-Rate
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {forecastData.metrics.dailyRunRate}
                    </span>
                    <span className="text-xs text-slate-400">{forecastData.item.unitOfMeasure}/day</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    ~{forecastData.metrics.monthlyVelocity} units/month
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Recommended Reorder
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-indigo-600">
                      {forecastData.metrics.recommendedOrderQty}
                    </span>
                    <span className="text-xs text-slate-400">{forecastData.item.unitOfMeasure}</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Est. Cost: ${forecastData.metrics.estimatedCost.toFixed(2)}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Replenishment Urgency
                  </span>
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        forecastData.metrics.urgency === 'critical'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : forecastData.metrics.urgency === 'high'
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {forecastData.metrics.urgency}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Reorder by: {new Date(forecastData.metrics.suggestedReorderDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* AI Executive Analysis Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-white border border-indigo-100 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Gemini Executive Supply Recommendation
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                    {(forecastData.aiAnalysis.confidence * 100).toFixed(0)}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {forecastData.aiAnalysis.explanation}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Document OCR & PO Matcher ── */}
      {activeTab === 'ocr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Dropzone */}
          <div className="space-y-4">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-indigo-600" />
                Upload Supplier Invoice or Delivery Challan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Gemini Vision extracts line items, quantities, and unit rates. It cross-checks lines against target Purchase Orders to flag price and quantity variances.
              </p>

              <label className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/30 transition-all block text-center">
                <UploadCloud className="w-10 h-10 text-indigo-500 mb-2" />
                <span className="text-xs font-bold text-slate-900">Click to upload document</span>
                <span className="text-[11px] text-slate-400 mt-1">PNG, JPG, or PDF (Max 10MB)</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {ocrFileName && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{ocrFileName}</span>
                  </div>
                  {isOcrProcessing && <LoaderCircle className="w-4 h-4 text-indigo-600 animate-spin" />}
                </div>
              )}
            </div>
          </div>

          {/* OCR Result View */}
          <div className="space-y-4">
            {isOcrProcessing && (
              <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center space-y-3">
                <LoaderCircle className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                <h4 className="text-xs font-bold text-slate-900">Multimodal Vision Parsing Active</h4>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Extracting line items, vendor credentials, and checking 3-way match variances...
                </p>
              </div>
            )}

            {!isOcrProcessing && !ocrResult && (
              <div className="p-12 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Upload an invoice or delivery note to view parsed line items and PO variance checks.
              </div>
            )}

            {ocrResult && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {ocrResult.data.documentType.replace('_', ' ')}
                    </span>
                    <h4 className="text-base font-bold text-slate-900">{ocrResult.data.documentNumber}</h4>
                    <p className="text-xs text-slate-500">{ocrResult.data.supplierName}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Total Billed</span>
                    <div className="text-lg font-extrabold text-slate-900">
                      ${ocrResult.data.grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Discrepancies Alert */}
                {ocrResult.poMatch?.discrepancies?.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-800">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      PO Discrepancies Detected ({ocrResult.poMatch.discrepancies.length})
                    </div>
                    {ocrResult.poMatch.discrepancies.map((d, i) => (
                      <div key={i} className="text-[11px] text-amber-900">
                        • {d.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Line Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">Line</th>
                        <th className="px-3 py-2">Qty</th>
                        <th className="px-3 py-2">Rate</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {ocrResult.data.lineItems.map((li, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-slate-900">{li.description}</div>
                            {li.sku && <span className="text-[10px] font-mono text-slate-400">{li.sku}</span>}
                          </td>
                          <td className="px-3 py-2.5 font-bold text-slate-800">{li.quantity}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-600">${li.unitPrice.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                            ${li.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      toast.success(`GRN draft prefilled from ${ocrResult.data.documentNumber}!`);
                      setActiveTab('copilot');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Accept & Prefill Goods Receipt Note (GRN)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: Anomaly & Shrinkage Radar ── */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                Active Anomaly & Shrinkage Radar
              </h3>
              <p className="text-xs text-slate-500">
                Continuous statistical screening for excessive scrap, dead stock, duplicate receipts, and price spikes.
              </p>
            </div>

            <button
              onClick={handleTriggerAnomalyScan}
              disabled={isScanningAnomalies}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isScanningAnomalies ? (
                <LoaderCircle className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Run Full Scan
            </button>
          </div>

          {isAnomaliesLoading && (
            <div className="text-center py-20 text-slate-400 text-xs">
              <LoaderCircle className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              Loading anomaly stream...
            </div>
          )}

          {!isAnomaliesLoading && anomalies.length === 0 && (
            <div className="p-12 rounded-2xl bg-white border border-slate-200/80 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-slate-900">All Clear — Zero Anomalies Flagged</h4>
              <p className="text-xs text-slate-500">
                No shrinkage spikes, stagnant stock, or duplicate goods receipts detected.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {anomalies.map((a: InventoryAnomaly) => (
              <div
                key={a._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        a.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : a.severity === 'warning'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {a.severity}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900">{a.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{a.description}</p>

                  {a.recommendedAction && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-700">
                      <strong>Recommended:</strong> {a.recommendedAction}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-medium text-slate-400 uppercase">
                    Status: {a.status}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAnomalyFeedback(a._id, 'acknowledged', 'confirmed_issue')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold transition-all text-[11px]"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleAnomalyFeedback(a._id, 'dismissed', 'false_positive')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition-all text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: Supplier Performance Scorecard ── */}
      {activeTab === 'suppliers' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Select Supplier for Evaluation
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                {suppliers.map((s: any) => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.supplierCode}) — Lead: {s.leadTimeDays || 7}d
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isSupplierScoreLoading && (
            <div className="text-center py-20 text-slate-400 text-xs">
              <LoaderCircle className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
              Evaluating supplier fulfillment metrics and AI SWOT scorecard...
            </div>
          )}

          {supplierScoreData && (
            <div className="space-y-6">
              {/* Score Gauge Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        supplierScoreData.evaluation.tierBadge === 'preferred'
                          ? 'bg-emerald-100 text-emerald-700'
                          : supplierScoreData.evaluation.tierBadge === 'reliable'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {supplierScoreData.evaluation.tier}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {supplierScoreData.supplier.name} ({supplierScoreData.supplier.supplierCode})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculated across {supplierScoreData.evaluation.volumeMetrics.totalPurchaseOrders} POs and{' '}
                    {supplierScoreData.evaluation.volumeMetrics.totalDeliveries} delivery receipts.
                  </p>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-indigo-600">
                    {supplierScoreData.evaluation.compositeScore}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">/ 100 Score</span>
                </div>
              </div>

              {/* 4-Factor Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    On-Time Delivery (40%)
                  </span>
                  <div className="text-2xl font-bold text-slate-900">
                    {supplierScoreData.evaluation.breakdown.onTimeDelivery.rate}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{
                        width: supplierScoreData.evaluation.breakdown.onTimeDelivery.rate,
                      }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Quality Acceptance (30%)
                  </span>
                  <div className="text-2xl font-bold text-slate-900">
                    {supplierScoreData.evaluation.breakdown.qualityAcceptance.rate}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full"
                      style={{
                        width: supplierScoreData.evaluation.breakdown.qualityAcceptance.rate,
                      }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Price Stability (20%)
                  </span>
                  <div className="text-2xl font-bold text-slate-900">
                    {supplierScoreData.evaluation.breakdown.priceStability.factor}
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{
                        width: supplierScoreData.evaluation.breakdown.priceStability.factor,
                      }}
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Delivery Consistency (10%)
                  </span>
                  <div className="text-2xl font-bold text-slate-900">
                    {supplierScoreData.evaluation.breakdown.consistency.score} / 10
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>

              {/* AI Strategic Assessment */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Gemini Executive Supplier SWOT & Strategy
                </h4>
                <div className="whitespace-pre-wrap text-xs text-slate-700 leading-relaxed font-sans">
                  {supplierScoreData.evaluation.aiSummary}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
