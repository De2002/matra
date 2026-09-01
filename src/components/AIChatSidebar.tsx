import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Bot, 
  Send, 
  Trash2, 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Square, 
  Cpu, 
  FileSearch,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { ChatMessage, LoadedDocument } from '../types';

interface AIChatSidebarProps {
  document: LoadedDocument | null;
  currentPage: number;
  messages: ChatMessage[];
  onSendMessage: (message: string, model: string) => Promise<void>;
  onClearMessages: () => void;
  onClose: () => void;
  isLoading: boolean;
  onStop: () => void;
}

export const AIChatSidebar: React.FC<AIChatSidebarProps> = ({
  document,
  currentPage,
  messages,
  onSendMessage,
  onClearMessages,
  onClose,
  isLoading,
  onStop
}) => {
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await onSendMessage(msg, model);
  };

  const handleQuickPrompt = async (prompt: string) => {
    if (isLoading) return;
    await onSendMessage(prompt, model);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const quickPrompts = [
    '✨ Summarize the entire document',
    '📌 What are the key points of this page?',
    '🔍 Extract actionable checklist / tables',
    '💡 Explain the core concepts simply'
  ];

  return (
    <div className="fixed inset-0 z-40 md:static md:z-20 md:flex flex-row">
      {/* Mobile Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* AIChat Sidebar Container */}
      <aside className="fixed inset-y-0 right-0 z-50 w-[90vw] max-w-sm sm:w-96 md:static md:inset-auto md:w-80 lg:w-96 h-full border-l border-[var(--border-toolbar)] bg-[var(--bg-sidebar)] flex flex-col select-text shadow-2xl md:shadow-none transition-colors duration-150 animate-in slide-in-from-right md:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-toolbar)] bg-black/5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                <span>Scruttin AI Assistant</span>
                <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold px-1.5 py-0.2 rounded-full">
                  Gemini
                </span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)] truncate max-w-[170px] sm:max-w-[200px]">
                {document ? `${document.name} (p.${currentPage})` : 'No document active'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                id="btn-clear-chat"
                onClick={onClearMessages}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-600 hover:bg-black/10 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-close-aichat"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/10 transition-colors"
              title="Close AI Chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Model Selector Bar */}
        <div className="px-3 py-1.5 bg-black/3 border-b border-[var(--border-toolbar)] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Model:</span>
          </div>
          <select
            id="select-ai-model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-white/90 dark:bg-stone-800 text-[var(--text-main)] rounded-md px-2 py-1 border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fastest)</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Analysis)</option>
          </select>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs overscroll-contain">
          {messages.length === 0 ? (
            <div className="py-6 px-2 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text-main)] text-sm mb-1">
                  Chat with this document
                </h4>
                <p className="text-[11px] text-[var(--text-muted)] max-w-xs mx-auto">
                  Ask questions, generate chapter summaries, or extract key data points directly from {document?.name || 'your document'}.
                </p>
              </div>

              <div className="space-y-1.5 text-left pt-2">
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] px-1">
                  Suggested Prompts
                </div>
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickPrompt(prompt.replace(/^[^\s]+\s/, ''))}
                    className="w-full text-left p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 border border-black/5 text-[11px] font-medium transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : msg.isNotice
                      ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 text-amber-900 dark:text-amber-200 rounded-bl-xs'
                      : 'bg-white dark:bg-stone-800 text-[var(--text-main)] border border-black/10 rounded-bl-xs'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-xs dark:prose-invert max-w-none break-words leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  )}

                  {/* Footer / Copy */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2.5 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Gemini AI</span>
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-[var(--text-main)] transition-colors p-1 rounded-md"
                        title="Copy response"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-500 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 p-3 bg-white dark:bg-stone-800 rounded-xl border border-black/10 w-fit shadow-xs">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-[var(--text-muted)] animate-pulse">
                Analyzing document...
              </span>
              <button
                onClick={onStop}
                className="ml-2 text-[10px] text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/40 font-medium"
              >
                <Square className="w-2.5 h-2.5 fill-red-500" />
                Stop
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--border-toolbar)] bg-black/5">
          <div className="relative flex items-center">
            <input
              id="input-ai-chat"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this document..."
              disabled={isLoading}
              className="w-full text-xs py-2.5 pl-3 pr-11 bg-white dark:bg-stone-800 rounded-xl border border-black/15 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-[var(--text-main)] shadow-xs disabled:opacity-50 min-h-[44px]"
            />
            <button
              id="btn-send-ai-chat"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-1.5 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
};
