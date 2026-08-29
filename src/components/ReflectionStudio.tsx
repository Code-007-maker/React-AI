import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Save,
  CheckCircle,
  AlertCircle,
  FileText,
  Lightbulb,
  ListTodo,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  ChevronDown,
  Smile,
  Heart,
  Zap,
  Coffee,
  Target,
  Share2,
} from 'lucide-react';
import type {
  ChatMessage,
  JournalEntry,
  ReflectionCategory,
  ReflectionTone,
  MoodType,
} from '../types';

interface ReflectionStudioProps {
  currentEntry: JournalEntry;
  onUpdateEntry: (updated: Partial<JournalEntry>) => void;
  onSaveToCloud: () => Promise<void>;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveErrorMessage: string | null;
}

const STARTER_PROMPTS = [
  'What was the most meaningful part of my day today, and what made it stand out?',
  'I am feeling stuck on a challenging decision regarding my goals. Help me unpack the trade-offs.',
  'What are 3 specific moments or people I am grateful for today and why?',
  'I noticed I felt overwhelmed earlier. Let us explore the root trigger and reframe it.',
  'Help me brainstorm creative solutions and a 3-step action plan for my project.',
];

const CATEGORIES: { id: ReflectionCategory; label: string }[] = [
  { id: 'daily_journal', label: 'Daily Journal' },
  { id: 'deep_reflection', label: 'Deep Reflection' },
  { id: 'goal_setting', label: 'Goal Setting' },
  { id: 'problem_solving', label: 'Problem Solving' },
  { id: 'gratitude', label: 'Gratitude' },
  { id: 'brainstorming', label: 'Brainstorming' },
];

const TONES: { id: ReflectionTone; label: string; desc: string }[] = [
  { id: 'empathetic', label: 'Empathetic Guide', desc: 'Validating, warm, compassionate reflection' },
  { id: 'analytical', label: 'Analytical Coach', desc: 'Pattern identification and structured clarity' },
  { id: 'socratic', label: 'Socratic Questioner', desc: 'Probing questions to deepen self-discovery' },
  { id: 'summarizer', label: 'Concise Synthesizer', desc: 'Direct, distilled takeaways & bullet points' },
];

const MOODS: { id: MoodType; label: string; icon: any }[] = [
  { id: 'reflective', label: 'Reflective', icon: Smile },
  { id: 'calm', label: 'Calm', icon: Coffee },
  { id: 'focused', label: 'Focused', icon: Target },
  { id: 'energized', label: 'Energized', icon: Zap },
  { id: 'grateful', label: 'Grateful', icon: Heart },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: AlertCircle },
];

export const ReflectionStudio: React.FC<ReflectionStudioProps> = ({
  currentEntry,
  onUpdateEntry,
  onSaveToCloud,
  isSaving,
  saveStatus,
  saveErrorMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.6-flash');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentEntry.messages, isAiLoading]);

  // Handle sending a user reflection turn to Gemini
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isAiLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...currentEntry.messages, userMessage];
    onUpdateEntry({ messages: newMessages });
    setInputText('');
    setErrorMessage(null);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          tone: currentEntry.tone,
          category: currentEntry.category,
          contextTitle: currentEntry.title,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      const data = await response.json();
      if (data.modelUsed) {
        setActiveModel(data.modelUsed);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        role: 'assistant',
        content: data.reply || 'Reflected on your thought.',
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      onUpdateEntry({ messages: finalMessages });

      // Automatically trigger cloud save after successful turn
      await onSaveToCloud();
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMessage(err?.message || 'Failed to receive AI reflection. You can retry sending.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Generate AI Summary and Key Action Takeaways
  const handleGenerateSummary = async () => {
    if (currentEntry.messages.length === 0 || isSummarizing) return;

    setIsSummarizing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: currentEntry.messages.map((m) => ({ role: m.role, content: m.content })),
          title: currentEntry.title,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to synthesize summary');
      }

      const data = await response.json();
      onUpdateEntry({
        summary: data.summary,
        keyInsights: data.keyInsights,
        actionItems: data.actionItems,
      });

      await onSaveToCloud();
    } catch (err: any) {
      console.error('Summary error:', err);
      setErrorMessage(err?.message || 'Failed to generate summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden">
      {/* Studio Top Settings Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Editable Title */}
          <div className="flex-1 min-w-0">
            <input
              id="input-entry-title"
              type="text"
              value={currentEntry.title}
              onChange={(e) => onUpdateEntry({ title: e.target.value })}
              placeholder="Give your reflection a title (e.g., Clarity on Priorities)..."
              className="w-full bg-transparent text-base sm:text-lg font-semibold text-white placeholder-slate-400 focus:outline-none border-b border-transparent focus:border-emerald-500/60 transition-colors px-1 py-0.5"
            />
          </div>

          {/* Cloud Save & Summarize Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Save Status Badge */}
            <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700/80">
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span className="text-slate-400">Saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Vault Synced</span>
                </>
              ) : saveStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400 font-medium">Sync Error</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400">Cloud Ready</span>
                </>
              )}
            </div>

            {/* Manual Save Button if error or uncommitted */}
            {saveStatus === 'error' && (
              <button
                id="btn-retry-save"
                onClick={onSaveToCloud}
                disabled={isSaving}
                className="px-2.5 py-1 text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-md transition-colors cursor-pointer"
              >
                Retry Save
              </button>
            )}

            {/* Summarize CTA */}
            <button
              id="btn-synthesize-insights"
              onClick={handleGenerateSummary}
              disabled={isSummarizing || currentEntry.messages.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
              title="Synthesize AI Key Insights & Action Items"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Synthesize Insights</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Selectors: Category, Mood, AI Tone */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          {/* Category Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-[11px]">Topic:</span>
            <select
              id="select-category"
              value={currentEntry.category}
              onChange={(e) => onUpdateEntry({ category: e.target.value as ReflectionCategory })}
              className="bg-transparent text-emerald-300 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mood Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400 text-[11px]">Mood:</span>
            <select
              id="select-mood"
              value={currentEntry.mood || 'reflective'}
              onChange={(e) => onUpdateEntry({ mood: e.target.value as MoodType })}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer text-xs capitalize"
            >
              {MOODS.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* AI Reflection Tone Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400 text-[11px]">AI Tone:</span>
            <select
              id="select-ai-tone"
              value={currentEntry.tone}
              onChange={(e) => onUpdateEntry({ tone: e.target.value as ReflectionTone })}
              className="bg-transparent text-amber-300 font-medium focus:outline-none cursor-pointer text-xs"
            >
              {TONES.map((t) => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-200">
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {/* Error notification banner */}
        {(errorMessage || saveErrorMessage) && (
          <div className="p-3 bg-rose-950/70 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Notice: </span>
              <span>{errorMessage || saveErrorMessage}</span>
            </div>
          </div>
        )}

        {/* AI Synthesized Insights Panel (if available) */}
        {(currentEntry.summary ||
          (currentEntry.keyInsights && currentEntry.keyInsights.length > 0)) && (
          <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-lg shadow-indigo-950/30">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-indigo-200">
                Synthesized Reflection Insights
              </h3>
            </div>

            {currentEntry.summary && (
              <p className="text-xs text-slate-300 leading-relaxed mb-4 bg-indigo-900/20 p-3 rounded-xl border border-indigo-800/40">
                {currentEntry.summary}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {currentEntry.keyInsights && currentEntry.keyInsights.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>Key Takeaways & Cognitive Shifts</span>
                  </span>
                  <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                    {currentEntry.keyInsights.map((insight, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentEntry.actionItems && currentEntry.actionItems.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5" />
                    <span>Actionable Next Steps</span>
                  </span>
                  <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                    {currentEntry.actionItems.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty state with starter sparks */}
        {currentEntry.messages.length === 0 ? (
          <div className="text-center py-8 max-w-xl mx-auto space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                What is on your mind right now?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Write freely about your day, challenges, goals, or creative thoughts. Gemini will
                provide deep reflection, ask clarifying questions, and help organize your insights.
              </p>
            </div>

            {/* Spark Starters */}
            <div className="space-y-2 text-left">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">
                Prompt Starters:
              </span>
              <div className="grid grid-cols-1 gap-2">
                {STARTER_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="p-3 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs text-slate-300 hover:text-white transition-all text-left flex items-start gap-2.5 cursor-pointer group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                    <span className="leading-relaxed">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Turn Messages Feed */
          <div className="space-y-6 max-w-3xl mx-auto">
            {currentEntry.messages.map((msg, idx) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id || idx}
                  className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Assistant Icon */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4 text-slate-950" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed relative group ${
                      isUser
                        ? 'bg-emerald-600 text-white rounded-tr-sm shadow-md shadow-emerald-950/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between gap-3 mb-1.5 text-[11px] opacity-75">
                      <span className="font-semibold">
                        {isUser ? 'You' : `Gemini 3.6 Flash (${currentEntry.tone})`}
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <button
                          onClick={() => handleCopyMessage(msg.content, idx)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white cursor-pointer"
                          title="Copy text"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-emerald-300" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="prose prose-invert prose-sm max-w-none break-words">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>

                  {/* User Icon */}
                  {isUser && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* AI Generation Loading Indicator */}
            {isAiLoading && (
              <div className="flex gap-3.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-slate-950" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm p-4 text-xs text-slate-400 flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Gemini 3.6 Flash is reflecting on your thoughts...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-slate-950 border border-slate-800 focus-within:border-emerald-500/70 rounded-2xl p-2 transition-colors shadow-inner">
            <textarea
              id="input-reflection-message"
              ref={textareaRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write your journal entry or ask Gemini for reflection... (Enter to send, Shift+Enter for new line)"
              disabled={isAiLoading}
              className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none px-2 py-1 max-h-36"
            />

            <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs px-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                Press <kbd className="px-1 py-0.5 bg-slate-900 rounded border border-slate-800">Enter</kbd> to converse
              </span>

              <button
                id="btn-send-message"
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isAiLoading}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-xs shadow-sm"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reflecting...</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
