<<<<<<< HEAD
# MyPersonal AI – Personalized AI Assistant Chatbot

> A college engineering mini-project showcasing a personalized conversational AI chatbot built with **React.js**, **Node.js/Express**, and the **Google Gemini API** (`gemini-3.8-flash`) via the modern `@google/genai` TypeScript SDK.

---

## 1. Project Abstract
**MyPersonal AI** is an intelligent, user-centric conversational agent engineered to bridge the gap between static, one-size-fits-all chatbots and personalized learning companions. While mainstream conversational platforms frequently treat each session in isolation or require complex cloud accounts, MyPersonal AI implements a local persistent memory system and dynamic profile persona engine. The application adapts its language (supporting English, Hindi, and colloquial Hinglish), explanation depth (from beginner-friendly analogies to rigorous academic analysis), and context to the individual user’s educational background and career goals without transmitting sensitive API credentials to the browser client.

---

## 2. Project Objectives
1. **Personalization Engine**: Formulate and dynamically construct contextual system instructions that adapt responses to the user's name, role, background, interests, and target milestones.
2. **Persistent Local Memory**: Implement a structured client-side memory bank using browser `localStorage` where users can view, add, toggle, edit, and purge personal preferences across sessions.
3. **Enterprise-Grade API Security**: Maintain strict server-side API isolation using Express.js so that the `GEMINI_API_KEY` remains securely guarded on the server and is never exposed in client bundles.
4. **Multilingual & Hinglish Fluency**: Enable seamless code-switching for Indian technical students who naturally converse in a blend of Hindi and English (Hinglish) while keeping technical keywords accurate.
5. **Real-Time Streaming UX**: Deliver low-latency, progressive text rendering using Server-Sent Events (SSE) and full Markdown syntax highlighting with one-click code copying and browser Speech Synthesis (TTS).
6. **Academic Demonstration Readiness**: Include an in-app interactive architecture guide, sequence diagrams, and 12+ viva examination questions and answers.

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend Framework** | React 19 + TypeScript | Component-based interactive UI, hooks, and reactive state management |
| **Styling** | Tailwind CSS v4 | Responsive utility-first design, dark/light themes, and glassmorphic panels |
| **Icons** | Lucide React | High-contrast, lightweight vector icons |
| **Backend Server** | Node.js + Express.js | Full-stack REST & Server-Sent Events (SSE) proxy server (`server.ts`) |
| **AI SDK** | `@google/genai` (^2.4.0) | Official Google Gemini TypeScript SDK with telemetry headers |
| **AI Model** | `gemini-3.8-flash` | State-of-the-art fast multimodal/text model with high multilingual capability |
| **Storage** | HTML5 Web Storage (`localStorage`) | Zero-cost persistent storage for chat history, user profile, and memory bank |
| **Speech** | Web Speech API (`SpeechSynthesis`) | Native client-side text-to-speech voice narration |

---

## 4. System Architecture & Data Flow

```text
+--------------------------------------------------------------------------+
|                           CLIENT (Browser)                               |
|                                                                          |
|  +------------------+   +-------------------+   +---------------------+  |
|  | User Interface   |   | Web Storage API   |   | SpeechSynthesis API |  |
|  | - ChatArea.tsx   |   | - Profile         |   | - Text-to-Speech    |  |
|  | - Sidebar.tsx    |   | - Memory Bank     |   +---------------------+  |
|  | - MarkdownViewer |   | - Chat History    |                            |
|  +--------+---------+   +---------+---------+                            |
|           |                       |                                      |
+-----------|-----------------------|--------------------------------------+
            | HTTP POST /api/chat   | Injected Memory & Persona
            v                       v
+--------------------------------------------------------------------------+
|                     BACKEND SERVER (Node.js / Express)                   |
|                                                                          |
|  1. Ingests request { messages, profile, memories }                      |
|  2. Builds dynamic systemInstruction prompt with behavioral constraints  |
|  3. Reads GEMINI_API_KEY securely from environment (process.env)         |
|  4. Dispatches request via @google/genai SDK                             |
+-----------------------------------+--------------------------------------+
                                    |
                                    | HTTPS API Call
                                    v
+--------------------------------------------------------------------------+
|                       GOOGLE GEMINI API CLOUD                            |
|                                                                          |
|             Model: gemini-3.8-flash (generateContentStream)              |
|             Token-by-token generation with sub-second latency            |
+-----------------------------------+--------------------------------------+
                                    |
                                    | SSE Stream Chunks (data: {"text":"..."})
                                    v
+--------------------------------------------------------------------------+
|                     CLIENT REAL-TIME RENDERING                           |
|                                                                          |
|  - Incremental token accumulation into active chat bubble                |
|  - Real-time Markdown parsing (headers, tables, code blocks)             |
|  - Automatic conversation titling via /api/chat/suggest-title            |
+--------------------------------------------------------------------------+
```

---

## 5. Key Features

### A. Responsive Chat Interface
- Clean, clutter-free message bubbles for user and AI with distinct gradients and icons.
- Real-time Server-Sent Events (SSE) streaming with animated typing indicators.
- Keyboard shortcuts: `Enter` to send, `Shift + Enter` for multi-line inputs.
- Formatted Markdown rendering: Code blocks with syntax badge and copy button, tables, bulleted lists, and blockquotes.
- Browser Text-to-Speech (TTS): Read any AI response aloud at native speed.
- Quick follow-up prompt chips above the input field.

### B. Dynamic Personalization Engine
- Configurable user profile: Full Name, Role, Education, Goals, Key Interests, Preferred Language, and Response Style.
- Four distinct explanation styles:
  1. **Beginner-Friendly & Simple**: Real-world analogies, step-by-step breakdowns, no unexplained jargon.
  2. **Balanced & Practical**: Well-structured explanations with code and edge cases.
  3. **Crisp & Direct**: Bullet points and quick summaries.
  4. **Deep Dive & Rigorous**: Theoretical foundations, Big-O complexities, and system architecture.
- Full Hinglish support for Indian engineering contexts (e.g., explaining algorithms using everyday analogies like railway queues or restaurant waiters).

### C. Persistent Memory Bank
- Dedicated Memory management dashboard to view, add, edit, toggle, or delete stored preferences.
- Memory categorized into **Preference**, **Skill & Tech**, **Goal / Target**, **Constraint / Rule**, and **Personal Fact**.
- Automatic Memory Detector (`/api/memory/extract`): Analyzes recent messages to identify stated preferences and offers one-click addition to memory.
- Distinct separation between short-term chat context and long-term persistent memory.

### D. Conversation Management & Privacy
- Chat history automatically grouped by time: Today, Yesterday, Previous 7 Days, and Older.
- Search conversations by keyword.
- Reopen, rename, or delete past conversations.
- Export chat as Markdown (`.md`) or download complete JSON backup.
- Single-click "Clear All Local Data" with protective confirmation modal.

---

## 6. Directory Structure

```text
mypersonal-ai/
├── .env.example              # Environment variables template
├── index.html                # HTML entry point with metadata and fonts
├── metadata.json             # AI Studio applet configuration & capabilities
├── package.json              # Dependencies and run scripts
├── server.ts                 # Full-stack Express backend with Gemini API
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build and dev configuration
└── src/
    ├── App.tsx               # Primary application coordinator & state
    ├── main.tsx              # React DOM mounting
    ├── index.css             # Tailwind CSS imports & global styles
    ├── types/
    │   └── index.ts          # TypeScript interfaces (Message, Profile, Memory)
    ├── services/
    │   └── storage.ts        # LocalStorage persistence service & defaults
    └── components/
        ├── Sidebar.tsx       # Conversation history, navigation, and theme toggle
        ├── ChatArea.tsx      # Chat bubbles, input box, speech synthesis, suggestions
        ├── ProfileModal.tsx  # User profile & persona customization settings
        ├── MemoryModal.tsx   # Memory bank management & auto-detector
        ├── VivaGuideModal.tsx# Mini-project documentation & 12+ viva Q&As
        ├── ClearDataModal.tsx# Confirmation dialog for clearing local data
        └── MarkdownRenderer.tsx # Custom markdown parser with code block copying
```

---

## 7. Setup & Execution Instructions

### Prerequisites
- Node.js version 18 or higher installed on your machine.
- A free Google Gemini API key from [Google AI Studio](https://aistudio.google.com/).

### Step 1: Configure the Gemini API Key
In Google AI Studio Build, the `GEMINI_API_KEY` is injected automatically from your Secrets panel.

If running locally on your own computer:
1. Create a `.env` file in the project root:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and paste your API key:
   ```env
   GEMINI_API_KEY="AIzaSyYourActualKeyHere..."
   PORT=3000
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Application
```bash
npm run dev
```
The server will boot on `http://0.0.0.0:3000`. Open your browser and navigate to the application.

### Step 4: Build for Production
```bash
npm run build
npm start
```

---

## 8. College Mini-Project Viva Questions & Answers

### Q1. What is the motivation behind developing "MyPersonal AI"?
**Answer:** Traditional conversational assistants either treat users as blank slates in every session or rely on heavy, expensive cloud databases with privacy concerns. MyPersonal AI demonstrates how a modern, cost-effective hybrid architecture can leverage browser `localStorage` for privacy-first memory retention and combine it with Google's Gemini 3.8 Flash model to deliver deeply personalized educational and coding assistance.

### Q2. How is API key security maintained in this full-stack setup?
**Answer:** The architecture enforces strict client-server decoupling. The Gemini SDK (`@google/genai`) is strictly imported and instantiated in `server.ts`. The browser frontend only sends HTTP requests to our local `/api/chat` endpoint. The `GEMINI_API_KEY` is read from `process.env` on the server and is never bundled, logged, or exposed in client-side JavaScript.

### Q3. Why was Google Gemini 3.8 Flash selected?
**Answer:** `gemini-3.8-flash` is Google's recommended high-efficiency model. It features rapid token generation suitable for streaming, robust multi-turn reasoning, low computational overhead, and outstanding performance on multilingual tasks (including colloquial Indian English and Hinglish).

### Q4. How does the chatbot remember preferences across new conversations?
**Answer:** In traditional chatbots, starting a "New Chat" wipes all session context. In MyPersonal AI, user preferences are stored in a dedicated `MemoryItem[]` array in `localStorage`. Every time a user initiates or continues a conversation, the backend injects these active memories into the `systemInstruction` field of the Gemini API call. Thus, even a fresh conversation starts with full awareness of the user's preferences.

### Q5. What is the difference between Conversation Context and Persistent Memory?
**Answer:**
- **Conversation Context:** The short-term sequence of back-and-forth messages within a single active chat. It enables the model to resolve pronouns (e.g., "explain *that* with an example").
- **Persistent Memory:** Long-term, user-curated facts and constraints that survive across distinct conversations, tab closes, and page refreshes.

### Q6. How does real-time streaming work under the hood?
**Answer:** The backend calls `ai.models.generateContentStream()`. It opens an HTTP connection with headers `Content-Type: text/event-stream` and writes each incoming chunk in SSE format (`data: {"text":"..."}\n\n`). The frontend reads the stream using the `ReadableStreamDefaultReader` of the Fetch API, progressively appending tokens to state so the user experiences zero lag.

### Q7. How does the system prevent the AI from hallucinating false memories?
**Answer:** Through strict prompt engineering in `server.ts`. The system instruction explicitly commands: *"NEVER invent or hallucinate false personal memories. Do not claim to remember things that are not in the profile or active memories list. If information is missing or ambiguous, ask a concise clarifying question."*

### Q8. What are the limitations and future enhancements of this project?
**Answer:**
- **Current Limitations:** Memory is tied to a specific browser's `localStorage` on one machine; there is no cross-device sync.
- **Future Scope:**
  1. Multi-device synchronization using Firebase Authentication and Firestore.
  2. Semantic Retrieval-Augmented Generation (RAG) using `gemini-embedding-2-preview` to rank and retrieve only the most relevant memories when memory size grows large.
  3. Real-time voice-to-voice interaction using the Gemini Live API over WebSockets.

---

## 9. License
This project is open-source under the Apache-2.0 License.
=======
# My-Personalized-Chatbot
Developed a personalized AI chatbot using Node.js/Express.js with Google Gemini API integration.
>>>>>>> e92a09ec7d7b4afa239cc73cb86cc0b2dfef68b5
