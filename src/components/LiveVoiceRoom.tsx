import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  Radio,
  Volume2,
  AlertCircle,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';

interface LiveVoiceRoomProps {
  onClose: () => void;
  userName: string;
}

export const LiveVoiceRoom: React.FC<LiveVoiceRoomProps> = ({ onClose, userName }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [modelTranscript, setModelTranscript] = useState('');
  const [conversationLogs, setConversationLogs] = useState<
    Array<{ speaker: 'user' | 'gemini'; text: string; time: string }>
  >([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  // Helper to convert Float32 16kHz audio to 16-bit PCM base64
  const pcmToBase64 = (float32Array: Float32Array): string => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(int16Array.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Playback 24kHz PCM from Gemini
  const playAudioChunk = (audioCtx: AudioContext, base64Pcm: string) => {
    try {
      const binaryString = atob(base64Pcm);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for (let i = 0; i < int16.length; i++) {
        float32[i] = int16[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32.length, 24000);
      audioBuffer.getChannelData(0).set(float32);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      const startTime = Math.max(now, nextStartTimeRef.current);
      source.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;
    } catch (e) {
      console.warn('Failed to decode/play audio chunk:', e);
    }
  };

  const startVoiceSession = async () => {
    setErrorMessage(null);
    setIsConnecting(true);

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 2. Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 3. Connect WebSocket to /live
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // 4. Capture mic stream
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (isMuted) return;
          if (ws.readyState === WebSocket.OPEN) {
            const inputData = e.inputBuffer.getChannelData(0);
            const base64Audio = pcmToBase64(inputData);
            ws.send(JSON.stringify({ audio: base64Audio }));
          }
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            setErrorMessage(data.error);
            return;
          }

          if (data.interrupted) {
            // Stop scheduled audio on interruption
            if (outputCtx) {
              nextStartTimeRef.current = outputCtx.currentTime;
            }
          }

          if (data.audio && outputCtx) {
            playAudioChunk(outputCtx, data.audio);
          }

          if (data.inputText) {
            setUserTranscript(data.inputText);
            setConversationLogs((prev) => [
              ...prev,
              {
                speaker: 'user',
                text: data.inputText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }

          if (data.outputText) {
            setModelTranscript(data.outputText);
            setConversationLogs((prev) => [
              ...prev,
              {
                speaker: 'gemini',
                text: data.outputText,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          }
        } catch (mErr) {
          console.warn('WS message parsing error:', mErr);
        }
      };

      ws.onerror = () => {
        setErrorMessage('WebSocket connection to Gemini Live API failed.');
        setIsConnecting(false);
        setIsConnected(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err: any) {
      console.error('Failed to start voice call:', err);
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
          : err.message || 'Could not connect to microphone or Live API.'
      );
      setIsConnecting(false);
      setIsConnected(false);
    }
  };

  const endVoiceSession = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      endVoiceSession();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-4 sm:p-8 text-slate-100 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                endVoiceSession();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Return to Chat"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-rose-500 animate-pulse" />
                Live Voice Conversation
              </h2>
              <p className="text-xs text-slate-400">
                Bidirectional, low-latency voice interaction powered by <strong>gemini-3.8-live</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              {isConnected ? 'Live Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Stage & Visualizer */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 border border-slate-800/80 shadow-2xl relative overflow-hidden">
          {/* Animated Background Rings */}
          <div className="relative flex items-center justify-center mb-8">
            <div
              className={`absolute w-44 h-44 rounded-full transition-all duration-700 ${
                isConnected
                  ? 'bg-indigo-600/20 scale-125 animate-pulse'
                  : 'bg-slate-800/20 scale-100'
              }`}
            />
            <div
              className={`absolute w-36 h-36 rounded-full transition-all duration-500 ${
                isConnected
                  ? 'bg-indigo-500/30 scale-110 animate-ping [animation-duration:3s]'
                  : 'bg-slate-800/40'
              }`}
            />
            <div
              className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${
                isConnected
                  ? 'bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 shadow-indigo-500/30 ring-4 ring-indigo-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isConnected ? (
                <Volume2 className="w-12 h-12 text-white animate-bounce [animation-duration:2s]" />
              ) : (
                <Mic className="w-10 h-10 text-slate-400" />
              )}
            </div>
          </div>

          {/* Subtitle / Instructions */}
          <div className="text-center max-w-md space-y-2 mb-6">
            <h3 className="text-base font-semibold text-white">
              {isConnected ? `Listening to ${userName || 'You'}...` : 'Start Voice Conversation'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isConnected
                ? 'Speak naturally into your microphone. Gemini answers in real-time with ultra-low latency voice.'
                : 'Click "Connect & Start Call" to initialize the Live API audio bridge with Google Gemini 3.8 Live.'}
            </p>
          </div>

          {/* Live Action Controls */}
          <div className="flex items-center gap-4">
            {!isConnected ? (
              <button
                onClick={startVoiceSession}
                disabled={isConnecting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/30 transition-all transform active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>{isConnecting ? 'Connecting...' : 'Connect & Start Call'}</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-3.5 rounded-2xl transition-all transform active:scale-95 cursor-pointer flex items-center justify-center ${
                    isMuted
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                  onClick={endVoiceSession}
                  className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm shadow-lg shadow-rose-600/30 transition-all transform active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End Voice Call</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Real-time Transcription Stream */}
        {conversationLogs.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Live Conversation Transcript
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {conversationLogs.length} turns
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {conversationLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-xs ${
                    log.speaker === 'user'
                      ? 'bg-indigo-950/40 border border-indigo-900/50 text-indigo-200 ml-6'
                      : 'bg-slate-950 border border-slate-800/80 text-slate-200 mr-6'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1 opacity-70 text-[10px]">
                    <span>{log.speaker === 'user' ? userName || 'You' : 'MyPersonal AI (Live)'}</span>
                    <span>{log.time}</span>
                  </div>
                  <p className="leading-relaxed">{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
