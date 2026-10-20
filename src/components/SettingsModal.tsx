import React, { useState } from 'react';
import {
  X,
  User,
  Brain,
  GraduationCap,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { MemoryCategory, MemoryItem, UserProfile } from '../types';
import { DEFAULT_PROFILE } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => boolean;
  memories: MemoryItem[];
  onSaveMemories: (memories: MemoryItem[]) => boolean;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  memories,
  onSaveMemories,
  onClearAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'memory' | 'viva'>('profile');
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [newMemory, setNewMemory] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemory.trim()) return;

    const item: MemoryItem = {
      id: `mem-${Date.now()}`,
      category: 'preference',
      content: newMemory.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    };
    onSaveMemories([item, ...memories]);
    setNewMemory('');
  };

  const handleDeleteMemory = (id: string) => {
    onSaveMemories(memories.filter((m) => m.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'memory'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Memories ({memories.length})
            </button>
            <button
              onClick={() => setActiveTab('viva')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'viva'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Project Docs
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Your Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Preferred Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                  >
                    <option value="English">English</option>
                    <option value="Hinglish">Hinglish</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Role / Background</label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-medium">Explanation Style</label>
                  <select
                    value={formData.responseStyle}
                    onChange={(e) => setFormData({ ...formData, responseStyle: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                  >
                    <option value="beginner">Beginner-Friendly & Simple</option>
                    <option value="detailed">Balanced & Detailed</option>
                    <option value="concise">Crisp & Direct</option>
                    <option value="academic">Deep Technical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Primary Goals</label>
                <input
                  type="text"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-slate-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-emerald-400 font-medium">
                  {savedNotice ? 'Saved!' : ''}
                </span>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MEMORIES */}
          {activeTab === 'memory' && (
            <div className="space-y-3">
              <form onSubmit={handleAddMemory} className="flex gap-2">
                <input
                  type="text"
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  placeholder="Add a preference to remember (e.g. 'Use Python for DSA')"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>

              <div className="space-y-1.5 pt-1">
                {memories.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No saved memories yet.</p>
                ) : (
                  memories.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="text-slate-300 flex-1">{m.content}</span>
                      <button
                        onClick={() => handleDeleteMemory(m.id)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIVA & DOCS */}
          {activeTab === 'viva' && (
            <div className="space-y-3 leading-relaxed">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-white">Project Overview</span>
                <p className="text-slate-400">
                  "MyPersonal AI" is a college engineering mini-project showcasing a personalized conversational chatbot built with React, Express, and Google Gemini 3.8 Flash.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-white">Architecture & Security</span>
                <p className="text-slate-400">
                  API keys are strictly kept server-side in Node.js/Express. Preferences and chat histories are stored locally in the browser's localStorage. Real-time streaming is achieved using Server-Sent Events (SSE).
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    if (confirm('Clear all local chat history and preferences?')) {
                      onClearAllData();
                      onClose();
                    }
                  }}
                  className="w-full py-2 rounded-lg border border-rose-900/40 text-rose-400 hover:bg-rose-950/20 text-xs font-medium transition-colors"
                >
                  Clear All Local Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
