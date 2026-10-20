import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  ShieldCheck,
  Cpu,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Database,
  Lock,
  Globe,
  Code2,
} from 'lucide-react';

interface VivaGuideModalProps {
  onClose: () => void;
}

export const VivaGuideModal: React.FC<VivaGuideModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'architecture' | 'viva'>('viva');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: '1. What is the core objective of the "MyPersonal AI" project?',
      a: 'The objective is to develop a personalized conversational AI chatbot using Google Gemini 3.8 Flash that retains user profile parameters (education, goals, language, explanation style) and explicit long-term memory facts across sessions without requiring complex third-party databases, demonstrating practical client-server AI architecture.',
    },
    {
      q: '2. Why did you choose Google Gemini 3.8 Flash instead of other models?',
      a: 'Gemini 3.8 Flash offers the ideal trade-off between sub-second inference latency, high reasoning fidelity, exceptional multilingual fluency (especially colloquial Indian Hinglish and Hindi), and native support in the @google/genai TypeScript SDK. It is lightweight, cost-effective, and supports fast streaming outputs.',
    },
    {
      q: '3. How is the Gemini API key secured in this application?',
      a: 'The application enforces strict server-side API isolation. The API key is stored as an environment variable (process.env.GEMINI_API_KEY) in Node.js/Express. The client browser NEVER imports @google/genai and never possesses the key. All requests route through our backend (/api/chat), protecting against client inspection or credential leakage.',
    },
    {
      q: '4. How does the persistent memory system work without a remote database?',
      a: 'The system uses an explicit client-side persistent storage model via the Web Storage API (localStorage). When the user creates or edits memories, they are serialized to JSON with unique IDs and categories. On every chat request, the active memories and user profile are injected into the dynamic systemInstruction payload sent to Gemini.',
    },
    {
      q: '5. What is the fundamental difference between "Temporary Conversation Context" and "Persistent Memory"?',
      a: 'Temporary conversation context consists of the recent message exchanges (chat history) within the active conversation session, which helps the model resolve pronouns and immediate dialogue. Persistent memory consists of curated, cross-session user facts (e.g. preferred coding language, target exam date, learning style) that persist even when a user starts a completely new chat.',
    },
    {
      q: '6. How does the application handle Hinglish and multilingual personalization?',
      a: 'Through prompt engineering in the dynamic systemInstruction builder. When the user selects "Hinglish", Gemini is explicitly instructed to communicate in conversational Hindi written in the Roman/Latin script, maintaining technical terminology (functions, pointers, algorithms) in standard English, which mirrors real-world Indian technical discourse.',
    },
    {
      q: '7. How is real-time response streaming implemented?',
      a: 'Streaming is implemented using Server-Sent Events (SSE). The Express backend calls ai.models.generateContentStream(), and as chunks arrive from Gemini, they are written to the HTTP response stream with Content-Type: text/event-stream using "data: {...}\\n\\n" format. The React frontend consumes the stream via a ReadableStream reader for smooth progressive typing.',
    },
    {
      q: '8. How are API errors, rate limits, or network timeouts handled?',
      a: 'The backend wraps SDK calls in try-catch blocks and returns clear HTTP status codes and error JSON. The frontend validates responses, displays user-friendly error banners, preserves the message input, and provides a one-click "Regenerate" and "Retry" option without losing the conversation state.',
    },
    {
      q: '9. What prompt engineering techniques prevent the model from hallucinating false memories?',
      a: 'The system instruction has explicit negative constraints: "NEVER invent or hallucinate false personal memories. Do not claim to remember things that are not in the profile or active memories list. If information is missing or ambiguous, ask a concise clarifying question."',
    },
    {
      q: '10. What are the limitations of the current architecture and its future scope?',
      a: 'Current limitation: LocalStorage is device-specific and browser-scoped. Future scope includes cloud synchronization with Firebase Auth and Firestore for multi-device access, vector embeddings (RAG) using gemini-embedding-2-preview for semantic memory retrieval, and voice-to-voice bidirectional conversation via the Gemini Live API.',
    },
    {
      q: '11. Why did you use React 19 and Tailwind CSS for the frontend?',
      a: 'React 19 provides reactive state management with hooks, seamless component modularity, and rapid DOM updates. Tailwind CSS enables responsive utility-first styling with modern glassmorphism, dark/light theme switching, and smooth transitions without bulky CSS overhead.',
    },
    {
      q: '12. Can the user export or delete their personal data for privacy (GDPR compliance)?',
      a: 'Yes! The project includes a "Clear All Local Data" button that wipes all stored chats, memories, and profile data from localStorage with a confirmation prompt. It also features a "Backup Export" feature that downloads all user data in clean JSON format.',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Mini-Project Documentation & Viva Guide
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Comprehensive reference for college mini-project demonstration, architecture defense, and viva examinations.
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
          >
            Back to Chat
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('viva')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'viva'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Viva Q&A ({vivaQuestions.length} Questions)</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>System Architecture</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Project Abstract & Scope</span>
          </button>
        </div>

        {/* TAB 1: VIVA QUESTIONS */}
        {activeTab === 'viva' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/30 text-xs text-purple-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <span>
                These questions are curated based on typical engineering viva patterns (External Examiner questions on LLMs, API security, and state management).
              </span>
            </div>

            <div className="space-y-2">
              {vivaQuestions.map((item, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-100 hover:text-purple-300 transition-colors cursor-pointer"
                    >
                      <span className="flex-1 pr-4">{item.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-[13px] text-slate-300 leading-relaxed border-t border-slate-800/80 bg-slate-950/40">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6">
            {/* Visual Architecture Flow */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Data Flow & Component Architecture
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Layer 1: Client */}
                <div className="p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                    <Globe className="w-4 h-4" />
                    <span>1. Client Presentation</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>React 19 SPA + Tailwind CSS</li>
                    <li>Message streaming reader (SSE)</li>
                    <li>Web Speech API (Text-to-Speech)</li>
                    <li>Markdown parser with Code copy</li>
                  </ul>
                  <div className="p-2.5 rounded bg-indigo-950/30 border border-indigo-900/50 text-[11px] text-indigo-300 font-medium">
                    💾 Browser LocalStorage (Persists User Profile & Memory Bank)
                  </div>
                </div>

                {/* Layer 2: Express Server */}
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <Cpu className="w-4 h-4" />
                    <span>2. Express Backend (Node.js)</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Entry point: <code className="text-emerald-400 font-mono">server.ts</code></li>
                    <li>Dynamic System Prompt Generator</li>
                    <li>Server-Sent Events (SSE) router</li>
                    <li>Title and memory extraction APIs</li>
                  </ul>
                  <div className="p-2.5 rounded bg-emerald-950/30 border border-emerald-900/50 text-[11px] text-emerald-300 font-medium flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>GEMINI_API_KEY safely isolated in env</span>
                  </div>
                </div>

                {/* Layer 3: Gemini Model */}
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>3. Google Gemini 3.8 Flash</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4 leading-relaxed">
                    <li>Official SDK: <code className="text-amber-400 font-mono">@google/genai</code></li>
                    <li>Telemetry header: <code className="text-slate-400 font-mono">User-Agent: aistudio-build</code></li>
                    <li>High-speed token generation</li>
                    <li>Hinglish / Multilingual fluency</li>
                  </ul>
                  <div className="p-2.5 rounded bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 font-medium">
                    ⚡ Sub-second latency, zero hallucinations on user facts
                  </div>
                </div>
              </div>

              {/* Data Flow Diagram Card */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2 font-mono">
                <div className="text-purple-400 font-semibold mb-2 font-sans flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  Sequence Flow:
                </div>
                <p className="text-slate-400">[User Types Message] ➔ [Client reads active Profile + Memories from LocalStorage]</p>
                <p className="text-slate-400">➔ [POST /api/chat with messages, profile, memories]</p>
                <p className="text-slate-400">➔ [Backend builds systemInstruction containing user persona & constraints]</p>
                <p className="text-slate-400">➔ [Gemini SDK generateContentStream(model: 'gemini-3.8-flash')]</p>
                <p className="text-slate-400">➔ [SSE stream piped chunk-by-chunk to browser] ➔ [Markdown rendered in real-time]</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-white">Project Abstract</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                "MyPersonal AI" is a web-based conversational assistant designed to bridge the gap between generic, memory-less chatbots and personalized learning companions. Built for college engineering students and developers, the system adapts to individual user backgrounds (e.g. computer engineering), preferred response styles (beginner-friendly to academic), and target career goals. By integrating Google's Gemini 3.8 Flash model with a localized persistent memory management architecture, the chatbot personalizes responses while enforcing strict security by never exposing API keys to the browser.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  Technology Stack
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                  <li><strong>Frontend:</strong> React 19, TypeScript, Tailwind CSS, Lucide Icons</li>
                  <li><strong>Backend:</strong> Node.js, Express.js (mounted via tsx)</li>
                  <li><strong>AI Engine:</strong> Google Gemini API via <code className="text-indigo-300">@google/genai</code></li>
                  <li><strong>Model:</strong> <code className="text-emerald-300">gemini-3.8-flash</code></li>
                  <li><strong>Storage:</strong> HTML5 Web Storage API (localStorage)</li>
                  <li><strong>Streaming:</strong> Server-Sent Events (SSE)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  Key Deliverables
                </h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                  <li>Natural conversation with real Google Gemini 3.8 Flash integration</li>
                  <li>Cross-session memory bank with add, edit, toggle, and delete</li>
                  <li>Custom persona editor (Name, Role, Goals, Hinglish/English)</li>
                  <li>Chat history with search, rename, export, and delete</li>
                  <li>Browser Text-to-Speech (TTS) audio narration</li>
                  <li>Interactive Viva exam preparation module</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
