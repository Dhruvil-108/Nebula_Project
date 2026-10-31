import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Send,
  Bot,
  User,
  TrendingUp,
  Clock,
  Building2,
  HelpCircle,
} from 'lucide-react';
import { useSpendCopilot } from '../../hooks/useExpenses';

interface Message {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
  suggestedFollowUps?: string[];
}

interface SpendCopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpendCopilotDrawer: React.FC<SpendCopilotDrawerProps> = ({ isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-welcome',
      sender: 'copilot',
      text: "👋 Hi! I am your **Nebula Spend Copilot**. Ask me anything about your team's expenses, department budgets, vendor spend, or approval cycle times.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedFollowUps: [
        'Top 5 vendors by spend',
        'Claims waiting over 3 days',
        'Department budget utilization',
      ],
    },
  ]);

  const copilotMutation = useSpendCopilot();

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend || copilotMutation.isPending) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const res = await copilotMutation.mutateAsync(textToSend);
      const copilotMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: 'copilot',
        text: res.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: res.suggestedFollowUps,
      };
      setMessages((prev) => [...prev, copilotMessage]);
    } catch (err) {
      // Error handled by mutation toast
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-[#ECE0D6]"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-orange-50/70 to-amber-50/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      Spend Copilot
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-100 text-orange-700 font-extrabold uppercase border border-orange-200">
                        AI Analyst
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-500">Real-time spend & budget insights</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.sender === 'copilot' && (
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div className="max-w-[85%] space-y-2">
                      <div
                        className={`p-3 rounded-2xl ${
                          m.sender === 'user'
                            ? 'bg-orange-600 text-white rounded-br-xs shadow-2xs'
                            : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        <p className="whitespace-pre-line leading-relaxed text-[12px]">{m.text}</p>
                        <span
                          className={`block text-[10px] mt-1.5 ${
                            m.sender === 'user' ? 'text-orange-200 text-right' : 'text-slate-400'
                          }`}
                        >
                          {m.timestamp}
                        </span>
                      </div>

                      {/* Suggested Follow-Ups */}
                      {m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {m.suggestedFollowUps.map((chip, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSend(chip)}
                              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-orange-50 hover:text-orange-700 border border-slate-200 rounded-lg shadow-2xs transition-all"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {m.sender === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {copilotMutation.isPending && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs shadow-2xs flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <span className="animate-spin w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full" />
                      <span>Copilot analyzing company records...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Ask about spending, budgets, aging claims..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="flex-1 h-10 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || copilotMutation.isPending}
                    className="h-10 w-10 flex items-center justify-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-40 transition-colors shadow-2xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
