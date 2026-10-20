import React, { useState } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ToggleLeft,
  ToggleRight,
  Info,
  Sparkles,
  ShieldCheck,
  Wand2,
  AlertCircle,
} from 'lucide-react';
import { MemoryCategory, MemoryItem } from '../types';

interface MemoryModalProps {
  memories: MemoryItem[];
  onSaveMemories: (updated: MemoryItem[]) => boolean;
  onClose: () => void;
  onDetectFromChat?: () => void;
  isDetecting?: boolean;
  detectedSuggestions?: Array<{ category: MemoryCategory; content: string }>;
  onApplyDetected?: (item: { category: MemoryCategory; content: string }) => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  memories,
  onSaveMemories,
  onClose,
  onDetectFromChat,
  isDetecting = false,
  detectedSuggestions = [],
  onApplyDetected,
}) => {
  const [items, setItems] = useState<MemoryItem[]>([...memories]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryCategory>('preference');

  // New item form
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('preference');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categoryBadges: Record<MemoryCategory, { label: string; color: string; bg: string }> = {
    preference: { label: 'Preference', color: 'text-sky-300 border-sky-500/30', bg: 'bg-sky-500/10' },
    skill: { label: 'Skill & Tech', color: 'text-emerald-300 border-emerald-500/30', bg: 'bg-emerald-500/10' },
    goal: { label: 'Goal / Target', color: 'text-amber-300 border-amber-500/30', bg: 'bg-amber-500/10' },
    constraint: { label: 'Constraint / Rule', color: 'text-rose-300 border-rose-500/30', bg: 'bg-rose-500/10' },
    personal: { label: 'Personal Fact', color: 'text-purple-300 border-purple-500/30', bg: 'bg-purple-500/10' },
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleToggle = (id: string) => {
    const updated = items.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    const ok = onSaveMemories(updated);
    if (ok) {
      setItems(updated);
      notify('success', 'Memory status updated successfully.');
    } else {
      notify('error', 'Failed to update memory in localStorage.');
    }
  };

  const handleDelete = (id: string) => {
    const updated = items.filter((m) => m.id !== id);
    const ok = onSaveMemories(updated);
    if (ok) {
      setItems(updated);
      notify('success', 'Memory item deleted.');
    } else {
      notify('error', 'Failed to delete memory item.');
    }
  };

  const handleStartEdit = (m: MemoryItem) => {
    setEditingId(m.id);
    setEditContent(m.content);
    setEditCategory(m.category);
  };

  const handleSaveEdit = (id: string) => {
    if (!editContent.trim()) return;
    const updated = items.map((m) =>
      m.id === id
        ? {
            ...m,
            content: editContent.trim(),
            category: editCategory,
            updatedAt: Date.now(),
          }
        : m
    );
    const ok = onSaveMemories(updated);
    if (ok) {
      setItems(updated);
      setEditingId(null);
      notify('success', 'Memory item successfully updated.');
    } else {
      notify('error', 'Failed to save changes.');
    }
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      category: newCategory,
      content: newContent.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      enabled: true,
    };

    const updated = [newItem, ...items];
    const ok = onSaveMemories(updated);
    if (ok) {
      setItems(updated);
      setNewContent('');
      notify('success', 'New preference saved into persistent memory!');
    } else {
      notify('error', 'Could not save memory item to storage.');
    }
  };

  const activeCount = items.filter((m) => m.enabled).length;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Brain className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Memory Bank & Saved Preferences
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Persistent memory stored locally in your browser. These facts guide Gemini's responses across all future chats.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-semibold">
              {activeCount} of {items.length} Active
            </span>
            <button
              onClick={onClose}
              type="button"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              Back to Chat
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMessage && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/40 border border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-800 text-rose-300'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Explanatory Distinction Box */}
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-xs text-slate-300 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-indigo-400 text-sm">
            <Info className="w-4 h-4" />
            <span>How the Memory Architecture Works</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-emerald-300 block mb-1">
                💾 Persistent Memory (Saved in localStorage)
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Explicit preferences listed below are retained forever on this machine. They are automatically injected into Gemini's system instructions for every new conversation.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="font-semibold text-sky-300 block mb-1">
                ⏳ Temporary Conversation Context
              </span>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                The immediate back-and-forth turns of your current chat. When you start a New Chat, the temporary context resets, but your persistent memories remain safe.
              </p>
            </div>
          </div>
        </div>

        {/* Auto-detect suggestions banner if any */}
        {detectedSuggestions.length > 0 && (
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Detected Preferences from Your Recent Chat:</span>
              </div>
            </div>
            <div className="space-y-2">
              {detectedSuggestions.map((sug, sIdx) => (
                <div
                  key={sIdx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 uppercase">
                      {sug.category}
                    </span>
                    <span className="text-slate-200">"{sug.content}"</span>
                  </div>
                  {onApplyDetected && (
                    <button
                      onClick={() => onApplyDetected(sug)}
                      className="px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add to Memory</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add New Memory Card */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Add a New Preference or Memory
            </h3>
            {onDetectFromChat && (
              <button
                type="button"
                onClick={onDetectFromChat}
                disabled={isDetecting}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isDetecting ? 'animate-spin' : ''}`} />
                <span>{isDetecting ? 'Scanning Chat...' : 'Auto-detect from Chat'}</span>
              </button>
            )}
          </div>

          <form onSubmit={handleAddNew} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as MemoryCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="preference">Preference</option>
                  <option value="skill">Skill & Tech</option>
                  <option value="goal">Goal / Target</option>
                  <option value="constraint">Constraint / Rule</option>
                  <option value="personal">Personal Fact</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Memory Description
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="e.g. Always provide time complexity (Big-O) when explaining sorting algorithms"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Memory</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Saved Memories List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Stored Preferences ({items.length})</span>
            <span>Toggle Active / Inactive</span>
          </div>

          {items.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl text-slate-500 text-xs">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-slate-300">No saved memories</p>
              <p className="mt-1">Add your preferences above so Gemini remembers them.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const badge = categoryBadges[item.category] || categoryBadges.preference;
                const isEditing = editingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.enabled
                        ? 'bg-slate-900 border-slate-800 text-slate-200'
                        : 'bg-slate-900/40 border-slate-800/40 text-slate-500 opacity-60'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <select
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value as MemoryCategory)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          >
                            <option value="preference">Preference</option>
                            <option value="skill">Skill & Tech</option>
                            <option value="goal">Goal / Target</option>
                            <option value="constraint">Constraint / Rule</option>
                            <option value="personal">Personal Fact</option>
                          </select>
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="sm:col-span-3 bg-slate-950 border border-indigo-500 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(item.id)}
                            className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-medium flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Edit</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${badge.bg} ${badge.color}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Added {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-medium leading-relaxed">
                            {item.content}
                          </p>
                        </div>

                        {/* Controls: Toggle, Edit, Delete */}
                        <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                          <button
                            onClick={() => handleToggle(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title={item.enabled ? 'Disable memory' : 'Enable memory'}
                          >
                            {item.enabled ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-600" />
                            )}
                          </button>

                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit memory"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 rounded hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete memory"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
