import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Loader2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { useEvent } from '../../context/EventContext.js';
import { ProposedAction } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ActionConfirmationModal } from '../common/ActionConfirmationModal.js';

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  proposedActions?: ProposedAction[];
  timestamp: string;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({ isOpen, onClose }) => {
  const { currentEvent, refreshEvent } = useEvent();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<ProposedAction | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      content: `👋 Hello! I am **ClubOps Chatbot**, your assistant for this entire website and event operations.\n\n` +
        `You can ask me **anything**:\n` +
        `• 🌐 **About Website**: How to create tasks, add volunteers, log risks, calculate health score, or use announcements.\n` +
        `• 📋 **Live Operations**: Ask about today's priorities, overdue deliverables, team workload, or risks.\n\n` +
        `What can I help you with today?`,
      timestamp: 'Just now',
    },
  ]);

  if (!isOpen) return null;

  const chips = [
    "What is ClubOps AI?",
    "How to create a task?",
    "Today's priorities",
    "How is health calculated?",
    "Event summary",
    "Critical risks",
    "Volunteer workload",
  ];

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend || query).trim();
    if (!messageText) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      sender: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const eventId = currentEvent?.id || 'general';
      const res: any = await api.copilotQuery(eventId, messageText);
      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        sender: 'assistant',
        content: res.content,
        proposedActions: res.proposedActions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'assistant',
          content: `Apologies, I encountered an issue: ${err.message}`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: ProposedAction) => {
    setSelectedAction(action);
    setConfirmOpen(true);
  };

  const handleActionSuccess = (result: any) => {
    setToastMessage(result.message || 'Action executed successfully!');
    refreshEvent();
    setTimeout(() => setToastMessage(null), 5000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden bg-black/30 backdrop-blur-sm animate-fade-in">
        <div className="absolute inset-0" onClick={onClose} />
        <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-white border-l border-[#EAEFF7] shadow-2xl flex flex-col z-10 animate-scale-in">
          {/* Header */}
          <div className="p-4 border-b border-[#EAEFF7] flex items-center justify-between bg-[#F4F5FB]">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5 flex items-center justify-center flex-shrink-0">
                <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                  <Bot className="w-5 h-5 text-violet-600" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-sm font-bold text-[#191E35]">AI Chatbot</h2>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-mono font-semibold">
                    WEBSITE &amp; OPS
                  </span>
                </div>
                <p className="text-xs text-[#7A829D]">
                  {currentEvent?.name ? `Event: ${currentEvent.name}` : 'Website & Operations Assistant'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 text-[#7A829D] hover:text-[#191E35] hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Toast Notification if action succeeded */}
          {toastMessage && (
            <div className="p-3 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-700 flex items-center space-x-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F4F5FB]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#8B5CF6] text-white rounded-br-none shadow-md'
                      : 'bg-white border border-[#EAEFF7] text-[#191E35] rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>

                  {/* Proposed Real Backend Action Buttons */}
                  {m.proposedActions && m.proposedActions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#EAEFF7] space-y-2">
                      <div className="text-[10px] font-bold text-violet-600 uppercase tracking-wider flex items-center space-x-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Recommended Operational Actions:</span>
                      </div>
                      <div className="space-y-1.5">
                        {m.proposedActions.map((act) => (
                          <button
                            key={act.id}
                            onClick={() => handleActionClick(act)}
                            className="w-full px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-left text-xs text-violet-700 font-medium transition-colors flex items-center justify-between group"
                          >
                            <span className="truncate">{act.buttonLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-violet-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#7A829D] mt-1 px-1">{m.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs text-[#7A829D] p-2">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                <span>Chatbot is analyzing and preparing answer...</span>
              </div>
            )}
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-2 border-t border-[#EAEFF7] bg-white flex items-center space-x-2 overflow-x-auto">
            {chips.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 rounded-lg bg-[#F4F5FB] border border-[#EAEFF7] text-[11px] text-[#7A829D] hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 whitespace-nowrap transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-[#EAEFF7] bg-white flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ask anything about the website, features, tasks, or event..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-[#F4F5FB] border border-[#EAEFF7] focus:border-violet-400 rounded-xl px-3.5 py-2.5 text-xs text-[#191E35] placeholder-[#7A829D] focus:outline-none transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !query.trim()}
              className="p-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white disabled:opacity-50 transition-colors shadow-md flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ActionConfirmationModal
        action={selectedAction}
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onSuccess={handleActionSuccess}
      />
    </>
  );
};
