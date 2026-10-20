import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Initialise Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const DEFAULT_MODEL = 'gemini-3.8-flash';

// Health status check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    defaultModel: DEFAULT_MODEL,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== ''),
    appName: 'MyPersonal AI',
    features: {
      searchGrounding: true,
      liveVoice: true,
      imageStudio: true,
      multiModel: true,
    },
  });
});

// Helper to construct dynamic system instruction based on user profile, active memories, and role
function buildSystemInstruction(profile: any, memories: any[], chatRole?: string): string {
  const user = profile || {};
  const activeMemories = Array.isArray(memories)
    ? memories.filter((m) => m && m.enabled && m.content)
    : [];

  const styleGuidance: Record<string, string> = {
    beginner:
      'Explain concepts in simple, easy-to-understand terms with clear analogies, real-world examples, and step-by-step breakdowns. Avoid heavy academic jargon unless explained first.',
    detailed:
      'Provide comprehensive, well-structured, in-depth explanations with practical code or actionable steps, edge cases, and best practices.',
    concise:
      'Keep answers crisp, direct, and to the point. Use bullet points and summary tables where helpful. Minimize conversational filler.',
    academic:
      'Provide rigorous, technically precise explanations referencing algorithmic complexity, underlying theory, architecture, and formal terminology.',
  };

  const roleGuidance: Record<string, string> = {
    tutor:
      'ROLE: You are an expert Academic Tutor & DSA Mentor. When helping with concepts, provide intuitive mental models, Socratic questions to test understanding, time/space complexity analysis, and clean commented code examples.',
    interviewer:
      'ROLE: You are a Senior FAANG Technical Interviewer. Simulate a realistic technical interview. Ask challenging follow-up questions, evaluate edge cases, demand optimal Big-O complexity, and provide constructive evaluation feedback.',
    debugger:
      'ROLE: You are a Principal Systems Debugger. Analyze user code, identify root-cause bugs, explain the "why", highlight anti-patterns, and provide corrected, production-grade solutions.',
    hinglish_buddy:
      'ROLE: You are a friendly senior college senior/buddy who explains complex CS concepts in natural, lively Hinglish. Use relatable real-world college & Indian life analogies (railway booking, IRCTC, chai stalls, traffic jams). Keep technical terms in English.',
    assistant:
      'ROLE: You are a versatile, polite, and deeply helpful personal AI assistant.',
  };

  const chosenStyle = styleGuidance[user.responseStyle] || styleGuidance.beginner;
  const chosenRole = roleGuidance[chatRole || 'assistant'] || roleGuidance.assistant;

  return `You are "MyPersonal AI", a dedicated, friendly, and highly capable personal AI assistant chatbot.
You are running as a personalized assistant specifically tailored for this individual user.

### CURRENT OPERATIONAL ROLE:
${chosenRole}

### USER PROFILE:
- Name: ${user.name || 'Friend'}
- Role / Background: ${user.role || 'Student & Learner'}
- Education / Field: ${user.education || 'Computer Science / Engineering'}
- Key Interests: ${Array.isArray(user.interests) ? user.interests.join(', ') : 'Software Development, AI, Problem Solving'}
- Primary Learning Goals: ${user.goals || 'Master technical concepts, prepare for exams/placements, and build projects'}
- Preferred Language: ${user.language || 'English'}
- Preferred Response Style: ${user.responseStyle || 'beginner'} (${chosenStyle})

### ACTIVE MEMORY & SAVED PREFERENCES (Explicitly saved in user's persistent memory):
${
  activeMemories.length > 0
    ? activeMemories.map((m, idx) => `${idx + 1}. [${m.category?.toUpperCase() || 'PREF'}]: ${m.content}`).join('\n')
    : 'No explicit memories added yet.'
}

### CRITICAL BEHAVIORAL INSTRUCTIONS:
1. PERSONALIZATION: Address the user naturally by name (${user.name || 'Friend'}) when appropriate. Adapt your answers directly to their educational level (${user.education || 'student'}), target goals, and background.
2. LANGUAGE ADAPTATION: The user prefers **${user.language || 'English'}**.
   - If the preferred language is "Hinglish", respond in friendly, modern Hinglish (conversational Hindi written in Roman script mixed naturally with English tech terms, e.g. "Haan bilkul! Chaliye ise aasan tareeqe se samajhte hain..."). Keep code and technical keywords in standard English.
   - If "Hindi", write in clean Hindi (or Hinglish if appropriate for coding terms).
   - If "English", use natural, engaging English.
3. EXPLANATION STYLE: Strictly follow the **${user.responseStyle || 'beginner'}** explanation style. ${chosenStyle}
4. MEMORY INTEGRATION:
   - Use the active saved memories listed above whenever they are relevant.
   - NEVER invent or hallucinate false personal memories. Do not claim to remember things that are not in the profile or active memories list.
   - If information is missing or ambiguous, ask a concise clarifying question.
5. CODING & STUDY ASSISTANCE:
   - When providing code, format it with markdown code fences specifying the language. Include helpful inline comments and explain key logic.
   - Provide time/space complexity when discussing data structures and algorithms.
6. HONESTY & ACCURACY:
   - When answering current-event questions or real-time topics using Google Search grounding, cite relevant information accurately.
   - If you do not know the answer, state so politely rather than guessing.`;
}

function extractCleanErrorMessage(err: any): string {
  if (!err) return 'An unexpected error occurred.';
  const rawMsg = err.message || String(err);
  try {
    const parsed = JSON.parse(rawMsg);
    if (parsed.error?.message) {
      return parsed.error.message;
    }
  } catch {}
  return rawMsg;
}

// POST /api/chat - Supports multi-model, search grounding, and SSE streaming
app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
      return res.status(500).json({
        error: 'Gemini API key is not configured. Please ensure GEMINI_API_KEY is set in your environment.',
      });
    }

    const {
      messages,
      profile,
      memories,
      stream = true,
      model = DEFAULT_MODEL,
      useSearch = false,
      chatRole = 'assistant',
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required and must not be empty.' });
    }

    // Determine target model
    let targetModel = model;
    if (targetModel === 'gemini-4-argon') {
      targetModel = 'gemini-3.8-flash';
    }

    const systemInstruction = buildSystemInstruction(profile, memories, chatRole);

    const contents = messages
      .filter((m: any) => m.role === 'user' || m.role === 'model')
      .map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }],
      }));

    const config: any = {
      systemInstruction: systemInstruction,
    };

    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let responseStream;
      try {
        responseStream = await ai.models.generateContentStream({
          model: targetModel,
          contents: contents,
          config: config,
        });
      } catch (firstErr: any) {
        console.warn(`[Gemini API] Primary model ${targetModel} issue:`, firstErr.message);
        // Fallback to gemini-3.1-flash-lite without search tools if primary model has temporary spike
        try {
          responseStream = await ai.models.generateContentStream({
            model: 'gemini-3.1-flash-lite',
            contents: contents,
            config: { systemInstruction: systemInstruction },
          });
        } catch (fallbackErr: any) {
          const cleanMsg = extractCleanErrorMessage(fallbackErr);
          res.write(`data: ${JSON.stringify({ error: cleanMsg })}\n\n`);
          res.write('data: [DONE]\n\n');
          return res.end();
        }
      }

      try {
        let accumulatedGrounding: any[] = [];

        for await (const chunk of responseStream) {
          const text = chunk.text || '';
          
          const groundingMetadata = (chunk as any).candidates?.[0]?.groundingMetadata;
          if (groundingMetadata?.groundingChunks) {
            for (const gChunk of groundingMetadata.groundingChunks) {
              if (gChunk.web?.uri) {
                accumulatedGrounding.push({
                  title: gChunk.web.title || gChunk.web.uri,
                  url: gChunk.web.uri,
                });
              }
            }
          }

          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`);
          }
        }

        if (accumulatedGrounding.length > 0) {
          const uniqueSources = Array.from(
            new Map(accumulatedGrounding.map((item) => [item.url, item])).values()
          );
          res.write(`data: ${JSON.stringify({ grounding: uniqueSources })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamErr: any) {
        console.error('[Gemini Stream Error]:', streamErr);
        const cleanMsg = extractCleanErrorMessage(streamErr);
        res.write(`data: ${JSON.stringify({ error: cleanMsg })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else {
      let response;
      try {
        response = await ai.models.generateContent({
          model: targetModel,
          contents: contents,
          config: config,
        });
      } catch (firstErr: any) {
        console.warn(`[Gemini API] Primary model ${targetModel} fallback to 3.1-flash-lite`);
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: contents,
          config: { systemInstruction: systemInstruction },
        });
      }

      const responseText = response.text || '';
      let grounding: any[] = [];
      const metadata = (response as any).candidates?.[0]?.groundingMetadata;
      if (metadata?.groundingChunks) {
        for (const gChunk of metadata.groundingChunks) {
          if (gChunk.web?.uri) {
            grounding.push({
              title: gChunk.web.title || gChunk.web.uri,
              url: gChunk.web.uri,
            });
          }
        }
      }

      return res.json({ text: responseText, grounding });
    }
  } catch (err: any) {
    console.error('[POST /api/chat error]:', err);
    return res.status(500).json({
      error: extractCleanErrorMessage(err),
    });
  }
});

// POST /api/generate-image - Image Studio (Text to image and image editing)
app.post('/api/generate-image', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const { prompt, imageBase64, mimeType = 'image/jpeg', aspectRatio = '1:1' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: mimeType,
        },
      });
    }
    parts.push({ text: prompt });

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-nano-banana-2.1',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
          },
        },
      });

      let imageUrl: string | null = null;
      let textOutput = '';

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          } else if (part.text) {
            textOutput += part.text;
          }
        }
      }

      if (imageUrl) {
        return res.json({ imageUrl, text: textOutput });
      } else {
        return res.json({ text: textOutput || 'No image data returned from model.' });
      }
    } catch (modelErr: any) {
      console.warn('[Image Generation Warning]:', modelErr.message);
      return res.status(402).json({
        error:
          modelErr.message ||
          'Image generation with gemini-nano-banana-2.1 requires an active paid tier API key in AI Studio Secrets.',
        paidModelRequired: true,
      });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Image processing failed' });
  }
});

// POST /api/chat/suggest-title
app.post('/api/chat/suggest-title', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ title: 'New Conversation' });
    }

    const { firstMessage } = req.body;
    if (!firstMessage) {
      return res.json({ title: 'New Conversation' });
    }

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Create a clean, concise 3 to 5 word title for a conversation that begins with this user message. Return ONLY the title, no quotes, no punctation marks at the end:\n\n"${firstMessage.slice(0, 300)}"`,
      config: {
        maxOutputTokens: 20,
        temperature: 0.3,
      },
    });

    const title = response.text?.trim().replace(/^["']|["']$/g, '') || 'New Conversation';
    res.json({ title });
  } catch {
    res.json({ title: 'New Conversation' });
  }
});

// POST /api/memory/extract
app.post('/api/memory/extract', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key missing' });
    }

    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.json({ suggestions: [] });
    }

    const recentUserMessages = messages
      .filter((m: any) => m.role === 'user')
      .slice(-6)
      .map((m: any) => m.content)
      .join('\n');

    const prompt = `Analyze these recent user messages and identify if the user stated any personal preferences, skills, tech stack, goals, or constraints that should be remembered for future conversations.
User messages:
"""
${recentUserMessages}
"""

Return a JSON array of up to 3 detected memory items. Each item must have:
- category: one of ["preference", "skill", "goal", "constraint", "personal"]
- content: a concise 1-sentence statement of the fact (e.g. "Prefers Python for coding examples" or "Preparing for GATE CSE exam in 2027")

If no clear personal preferences or facts were stated, return an empty array [].
Return ONLY valid JSON with no markdown wrapping.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    let suggestions = [];
    try {
      suggestions = JSON.parse(response.text?.trim() || '[]');
    } catch {
      suggestions = [];
    }

    res.json({ suggestions });
  } catch {
    res.json({ suggestions: [] });
  }
});

// WebSocket Server for Live Voice API (gemini-3.8-live)
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[Live API] Client connected to /live WebSocket');

  try {
    if (!process.env.GEMINI_API_KEY) {
      clientWs.send(JSON.stringify({ error: 'GEMINI_API_KEY is not configured on the server.' }));
      clientWs.close();
      return;
    }

    const session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are MyPersonal AI, a friendly, intelligent, and supportive conversational partner. Speak concisely, clearly, and warmly.',
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          const outputText = (message.serverContent as any)?.outputTranscription?.text;
          const inputText = (message.serverContent as any)?.inputTranscription?.text;
          const interrupted = message.serverContent?.interrupted;

          if (audio || outputText || inputText || interrupted) {
            clientWs.send(JSON.stringify({ audio, outputText, inputText, interrupted }));
          }
        },
        onclose: () => {
          console.log('[Live API] Session closed');
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
        onerror: (err) => {
          console.error('[Live API Session Error]:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: err?.message || 'Live session error' }));
          }
        },
      },
    });

    clientWs.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio) {
          session.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (e) {
        console.error('[Live Client WS Message Parse Error]:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live API] Client disconnected');
      try {
        session.close();
      } catch {}
    });
  } catch (err: any) {
    console.error('[Live API Connect Error]:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: err?.message || 'Failed to initialize Live API session' }));
      clientWs.close();
    }
  }
});

// Setup Vite middlewares for dev or serve dist in prod
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MyPersonal AI] Server running on http://0.0.0.0:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[MyPersonal AI] Server boot failure:', err);
});
