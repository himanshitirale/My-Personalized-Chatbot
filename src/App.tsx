import React, { useState, useEffect, useRef } from 'react';
import { Conversation, GroundingSource, MemoryItem, Message, ModelOption, UserProfile } from './types';
import { DEFAULT_MEMORIES, DEFAULT_PROFILE, DEFAULT_SETTINGS, storageService } from './services/storage';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { LiveVoiceRoom } from './components/LiveVoiceRoom';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    return storageService.getConversations();
  });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const loadedConvos = storageService.getConversations();
    const activeId = storageService.getActiveConversationId();
    if (activeId && loadedConvos.some((c) => c.id === activeId)) {
      return activeId;
    }
    return loadedConvos.length > 0 ? loadedConvos[0].id : null;
  });
  const [profile, setProfile] = useState<UserProfile>(() => storageService.getProfile());
  const [memories, setMemories] = useState<MemoryItem[]>(() => storageService.getMemories());
  const [settings, setSettings] = useState(() => storageService.getSettings());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceRoomOpen, setIsVoiceRoomOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync theme
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storageService.saveSettings(settings);
  }, [settings]);

  // Current active conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) || null;

  // New Chat handler
  const handleNewChat = () => {
    const newConvo: Conversation = {
      id: `chat-${Date.now()}`,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => {
      const updated = [newConvo, ...prev];
      storageService.saveConversations(updated);
      return updated;
    });
    setActiveConversationId(newConvo.id);
    storageService.setActiveConversationId(newConvo.id);
  };

  // Select Conversation
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    storageService.setActiveConversationId(id);
  };

  // Delete Conversation
  const handleDeleteConversation = (id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      storageService.saveConversations(updated);

      if (activeConversationId === id) {
        const nextId = updated.length > 0 ? updated[0].id : null;
        setActiveConversationId(nextId);
        storageService.setActiveConversationId(nextId);
      }
      return updated;
    });
  };

  // Rename Conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c
      );
      storageService.saveConversations(updated);
      return updated;
    });
  };

  // Clear current chat
  const handleClearCurrentChat = () => {
    if (!activeConversationId) return;
    setConversations((prev) => {
      const updated = prev.map((c) =>
        c.id === activeConversationId ? { ...c, messages: [], updatedAt: Date.now() } : c
      );
      storageService.saveConversations(updated);
      return updated;
    });
  };

  // Send Message with robust streaming and persistent storage
  const handleSendMessage = async (
    text: string,
    useSearch = false,
    model: ModelOption = 'gemini-3.8-flash'
  ) => {
    if (!text.trim() || isGenerating) return;

    let convoId = activeConversationId;
    let isFirstMessage = false;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };

    const botMsgId = `bot-${Date.now() + 1}`;
    const botPlaceholderMsg: Message = {
      id: botMsgId,
      role: 'model',
      content: '',
      timestamp: Date.now(),
    };

    let chatHistoryToSend: { role: string; content: string }[] = [];

    // Atomically create or update conversation in state and localStorage
    setConversations((prev) => {
      let updated: Conversation[];
      const existing = prev.find((c) => c.id === convoId);

      if (!existing) {
        convoId = `chat-${Date.now()}`;
        setActiveConversationId(convoId);
        storageService.setActiveConversationId(convoId);
        isFirstMessage = true;

        const newConvo: Conversation = {
          id: convoId,
          title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [userMsg, botPlaceholderMsg],
        };
        updated = [newConvo, ...prev];
        chatHistoryToSend = [{ role: userMsg.role, content: userMsg.content }];
      } else {
        isFirstMessage = existing.messages.length === 0;
        chatHistoryToSend = [
          ...existing.messages.map((m) => ({ role: m.role, content: m.content })),
          { role: userMsg.role, content: userMsg.content },
        ];

        updated = prev.map((c) => {
          if (c.id !== convoId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            title: isFirstMessage
              ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
              : c.title,
            messages: [...c.messages, userMsg, botPlaceholderMsg],
          };
        });
      }

      storageService.saveConversations(updated);
      return updated;
    });

    const targetConvoId = convoId!;

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          messages: chatHistoryToSend,
          profile,
          memories,
          stream: true,
          useSearch,
          model,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }

      let accumulatedText = '';
      let accumulatedGrounding: GroundingSource[] = [];
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.grounding) {
                accumulatedGrounding = parsed.grounding;
              }
              if (parsed.text) {
                accumulatedText += parsed.text;
                // Live streaming UI update
                setConversations((prev) =>
                  prev.map((c) => {
                    if (c.id !== targetConvoId) return c;
                    return {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === botMsgId
                          ? { ...m, content: accumulatedText, grounding: accumulatedGrounding }
                          : m
                      ),
                    };
                  })
                );
              }
            } catch {}
          }
        }
      }

      // Final save to state and localStorage using functional updater (never stale)
      setConversations((prev) => {
        const finalContent = accumulatedText.trim() || 'I could not generate a response. Please try again.';
        const updated = prev.map((c) => {
          if (c.id !== targetConvoId) return c;
          return {
            ...c,
            updatedAt: Date.now(),
            messages: c.messages.map((m) =>
              m.id === botMsgId
                ? {
                    ...m,
                    content: finalContent,
                    grounding: accumulatedGrounding,
                  }
                : m
            ),
          };
        });
        storageService.saveConversations(updated);
        return updated;
      });

      // Suggest conversation title if first message
      if (isFirstMessage) {
        fetch('/api/chat/suggest-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstMessage: text }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.title && data.title !== 'New Conversation') {
              handleRenameConversation(targetConvoId, data.title);
            }
          })
          .catch(() => {});
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat generation error:', err);
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id !== targetConvoId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === botMsgId
                  ? {
                      ...m,
                      content: `⚠️ ${err.message || 'Error communicating with Gemini.'}`,
                      error: true,
                    }
                  : m
              ),
            };
          });
          storageService.saveConversations(updated);
          return updated;
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const handleSaveProfile = (updated: UserProfile): boolean => {
    const success = storageService.saveProfile(updated);
    if (success) setProfile(updated);
    return success;
  };

  const handleSaveMemories = (updated: MemoryItem[]): boolean => {
    const success = storageService.saveMemories(updated);
    if (success) setMemories(updated);
    return success;
  };

  const handleToggleTheme = () => {
    setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const handleClearAllData = () => {
    storageService.clearAllData();
    setConversations([]);
    setActiveConversationId(null);
    setProfile({ ...DEFAULT_PROFILE });
    setMemories([]);
    setSettings({ ...DEFAULT_SETTINGS });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenVoiceRoom={() => setIsVoiceRoomOpen(true)}
        isDark={settings.theme === 'dark'}
        onToggleTheme={handleToggleTheme}
        isOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-950">
        {isVoiceRoomOpen ? (
          <LiveVoiceRoom
            onClose={() => setIsVoiceRoomOpen(false)}
            userName={profile.name}
          />
        ) : (
          <ChatArea
            conversation={activeConversation}
            profile={profile}
            onSendMessage={handleSendMessage}
            onStopGeneration={handleStopGeneration}
            isGenerating={isGenerating}
            onClearCurrentChat={handleClearCurrentChat}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenVoiceRoom={() => setIsVoiceRoomOpen(true)}
          />
        )}
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        memories={memories}
        onSaveMemories={handleSaveMemories}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
