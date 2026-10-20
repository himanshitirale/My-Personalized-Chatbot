export type Role = 'user' | 'model' | 'system';

export type ResponseStyle = 'beginner' | 'detailed' | 'concise' | 'academic';

export type PreferredLanguage = 'English' | 'Hindi' | 'Hinglish' | 'Spanish' | 'French' | 'German';

export type MemoryCategory = 'preference' | 'skill' | 'goal' | 'constraint' | 'personal';

export type ModelOption = 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon';

export type ChatRole = 'assistant' | 'tutor' | 'interviewer' | 'debugger' | 'hinglish_buddy';

export interface GroundingSource {
  title: string;
  url: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  error?: boolean;
  grounding?: GroundingSource[];
  modelUsed?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  model?: ModelOption;
  rolePreset?: ChatRole;
  useSearch?: boolean;
}

export interface UserProfile {
  name: string;
  role: string;
  education: string;
  interests: string[];
  goals: string;
  language: PreferredLanguage | string;
  responseStyle: ResponseStyle;
  activeChatRole?: ChatRole;
}

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  content: string;
  createdAt: number;
  updatedAt: number;
  enabled: boolean;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  streamResponse: boolean;
  soundEffects: boolean;
  defaultModel: ModelOption;
  useSearchDefault: boolean;
}

export type ActiveView = 'chat' | 'profile' | 'memory' | 'viva' | 'voice' | 'image';
