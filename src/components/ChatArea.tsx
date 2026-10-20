import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Menu,
  Trash2,
  Globe,
  ExternalLink,
  Mic,
} from 'lucide-react';
import { Conversation, GroundingSource, ModelOption, UserProfile } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatAreaProps {
  conversation: Conversation | null;
  profile: UserProfile;
  onSendMessage: (text: string, useSearch?: boolean, model?: ModelOption) => void;
  onStopGeneration: () => void;
  isGenerating: boolean;
  onClearCurrentChat: () => void;
  onOpenMobileSidebar: () => void;
  onOpenVoiceRoom: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  profile,
  onSendMessage,
  onStopGeneration,
  isGenerating,
  onClearCurrentChat,
  onOpenMobileSidebar,
  onOpenVoiceRoom,
}) => {
  const [inputText, setInputText] = useState('');
  const [useSearch, setUseSearch] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>('gemini-3.8-flash');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = conversation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = (overrideText?: string) => {
    const textToSend = overrideText || inputText.trim();
    if (!textToSend || isGenerating) return;

    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    onSendMessage(textToSend, useSearch, selectedModel);
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const clean = text
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[*#_`>-]/g, '')
      .slice(0, 800);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const samplePrompts = [
    'Explain how Binary Search works with a clear example and time complexity.',
    'Help me prepare for an interview: top 5 questions on database indexing.',
    'Explain how APIs work in simple Hinglish with a real-life analogy.',
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Simple Header */}
      <header className="h-13 border-b border-slate-800/80 px-4 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-xs">
            {conversation?.title || 'New Chat'}
          </span>
        </div>

        {/* Minimal Model & Search Controls */}
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="gemini-3.8-flash">Gemini 3.8 Flash</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
          </select>

          {/* Web Search Toggle */}
          <button
            type="button"
            onClick={() => setUseSearch(!useSearch)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
              useSearch
                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Toggle Google Search data grounding"
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {messages.length > 0 && (
            <button
              onClick={onClearCurrentChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Message Thread Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          /* Simple, clean welcome state */
          <div className="max-w-2xl mx-auto h-full flex flex-col items-center justify-center text-center space-y-6 py-12">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                How can I help you today{profile.name ? `, ${profile.name}` : ''}?
              </h2>
              <p className="text-xs text-slate-400">
                Personalized for {profile.language} • {profile.responseStyle} explanations
              </p>
            </div>

            {/* Clean Prompt Suggestions */}
            <div className="w-full space-y-2 pt-2">
              {samplePrompts.map((promptText, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(promptText)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>{promptText}</span>
                  <span className="text-slate-500 text-[11px]">↵</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat Message List */
          <div className="max-w-2xl mx-auto space-y-5">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCopied = copiedId === msg.id;
              const isSpeaking = speakingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-indigo-300" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs'
                        : msg.error
                        ? 'bg-rose-950/40 border border-rose-800/80 text-rose-200'
                        : 'bg-slate-900 border border-slate-800/80 text-slate-100 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <>
                        <MarkdownRenderer content={msg.content} />

                        {/* Grounding Source Citations (if Google Search was used) */}
                        {msg.grounding && msg.grounding.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                              Sources from Google Search:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.grounding.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-slate-950 border border-slate-800 text-sky-400 hover:text-sky-300 hover:border-slate-700 transition-colors"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span className="truncate max-w-[140px]">{src.title}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Minimal Actions */}
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 pt-1">
                          <button
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 text-slate-400 hover:text-white"
                            title="Copy text"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleSpeak(msg.id, msg.content)}
                            className="p-1 text-slate-400 hover:text-white"
                            title={isSpeaking ? 'Stop speech' : 'Listen aloud'}
                          >
                            {isSpeaking ? (
                              <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <Volume2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}

            {isGenerating && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-300" />
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-400 flex items-center gap-2">
                  <span>Thinking...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Clean, Simple Input Bar */}
      <div className="p-3 sm:p-4 bg-slate-950">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end gap-2 bg-slate-900 border border-slate-800 focus-within:border-slate-700 rounded-2xl px-3 py-2 transition-colors">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message MyPersonal AI..."
              className="flex-1 bg-transparent border-0 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-1 max-h-40 leading-relaxed"
            />

            <div className="flex items-center gap-1 pb-0.5">
              {/* Quick mic to launch Live voice call */}
              <button
                type="button"
                onClick={onOpenVoiceRoom}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                title="Start Live Voice call"
              >
                <Mic className="w-4 h-4" />
              </button>

              {isGenerating ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:bg-slate-700 transition-colors"
                  title="Stop generating"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 text-white transition-colors cursor-pointer disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
