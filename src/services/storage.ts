import { AppSettings, Conversation, MemoryItem, UserProfile } from '../types';

const STORAGE_KEYS = {
  CONVERSATIONS: 'mypersonal_ai_conversations_v1',
  ACTIVE_CONVO_ID: 'mypersonal_ai_active_convo_v1',
  PROFILE: 'mypersonal_ai_profile_v1',
  MEMORIES: 'mypersonal_ai_memories_v1',
  SETTINGS: 'mypersonal_ai_settings_v1',
};

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Sharma',
  role: 'Engineering Student & Developer',
  education: 'B.Tech in Computer Science',
  interests: ['Full-stack Web Dev', 'Data Structures & Algorithms', 'AI Systems', 'System Design'],
  goals: 'Prepare for campus placement interviews and build real-world software applications.',
  language: 'Hinglish',
  responseStyle: 'beginner',
};

export const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preference',
    content: 'Prefers explanations with real-world analogies before deep dive technical jargon.',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
    enabled: true,
  },
  {
    id: 'mem-2',
    category: 'skill',
    content: 'Familiar with JavaScript/TypeScript and Python; learning React and Node.js.',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
    enabled: true,
  },
  {
    id: 'mem-3',
    category: 'goal',
    content: 'Targeting software engineering and technical roles in upcoming college placements.',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    enabled: true,
  },
  {
    id: 'mem-4',
    category: 'preference',
    content: 'When explaining in Hinglish or Hindi, keep technical terms (like "stack", "pointer", "async") in English.',
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now() - 43200000,
    enabled: true,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  streamResponse: true,
  soundEffects: false,
  defaultModel: 'gemini-3.8-flash',
  useSearchDefault: false,
};

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Storage] Failed to read ${key}:`, err);
    return fallback;
  }
}

function safeSet<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[Storage] Failed to write ${key}:`, err);
    return false;
  }
}

export const storageService = {
  // Conversations
  getConversations(): Conversation[] {
    return safeGet<Conversation[]>(STORAGE_KEYS.CONVERSATIONS, []);
  },

  saveConversations(conversations: Conversation[]): boolean {
    return safeSet(STORAGE_KEYS.CONVERSATIONS, conversations);
  },

  getActiveConversationId(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVO_ID);
    } catch {
      return null;
    }
  },

  setActiveConversationId(id: string | null): void {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVO_ID, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVO_ID);
      }
    } catch (e) {
      console.warn('[Storage] Failed to set active convo ID', e);
    }
  },

  // Profile
  getProfile(): UserProfile {
    return safeGet<UserProfile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  },

  saveProfile(profile: UserProfile): boolean {
    return safeSet(STORAGE_KEYS.PROFILE, profile);
  },

  // Memories
  getMemories(): MemoryItem[] {
    return safeGet<MemoryItem[]>(STORAGE_KEYS.MEMORIES, DEFAULT_MEMORIES);
  },

  saveMemories(memories: MemoryItem[]): boolean {
    return safeSet(STORAGE_KEYS.MEMORIES, memories);
  },

  // Settings
  getSettings(): AppSettings {
    return safeGet<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  },

  saveSettings(settings: AppSettings): boolean {
    return safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  // Reset all
  clearAllData(): boolean {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVO_ID);
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.MEMORIES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      return true;
    } catch (err) {
      console.error('[Storage] Failed to clear data:', err);
      return false;
    }
  },

  // Export & Import
  exportBackup(): string {
    const data = {
      conversations: this.getConversations(),
      profile: this.getProfile(),
      memories: this.getMemories(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
      app: 'MyPersonal AI',
    };
    return JSON.stringify(data, null, 2);
  },

  importBackup(jsonString: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.memories)) this.saveMemories(data.memories);
      if (Array.isArray(data.conversations)) this.saveConversations(data.conversations);
      if (data.settings) this.saveSettings(data.settings);
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Invalid backup format' };
    }
  },
};
