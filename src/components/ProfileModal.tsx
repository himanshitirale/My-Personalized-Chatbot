import React, { useState } from 'react';
import {
  User,
  GraduationCap,
  Sparkles,
  BookOpen,
  Languages,
  Check,
  RotateCcw,
  Plus,
  X,
  Target,
  BrainCircuit,
  Smile,
} from 'lucide-react';
import { PreferredLanguage, ResponseStyle, UserProfile } from '../types';
import { DEFAULT_PROFILE } from '../services/storage';

interface ProfileModalProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSaveProfile,
  onClose,
}) => {
  const [formData, setFormData] = useState<UserProfile>({ ...profile });
  const [newInterest, setNewInterest] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const languages: { id: PreferredLanguage; label: string; desc: string }[] = [
    { id: 'Hinglish', label: 'Hinglish (Recommended)', desc: 'Conversational Hindi in English script with tech terms' },
    { id: 'English', label: 'English', desc: 'Clear, fluent global English' },
    { id: 'Hindi', label: 'Hindi (हिंदी)', desc: 'Pure Hindi explanations with tech terminology' },
    { id: 'Spanish', label: 'Spanish (Español)', desc: 'Natural Spanish conversational style' },
    { id: 'French', label: 'French (Français)', desc: 'Natural French conversational style' },
  ];

  const styles: { id: ResponseStyle; label: string; desc: string; icon: string }[] = [
    {
      id: 'beginner',
      label: 'Beginner-Friendly & Simple',
      desc: 'Step-by-step breakdowns, real-world analogies, zero confusing jargon without explanation.',
      icon: '🌱',
    },
    {
      id: 'detailed',
      label: 'Balanced & Practical',
      desc: 'Complete, structured answers with production-ready code, edge cases, and best practices.',
      icon: '⚖️',
    },
    {
      id: 'concise',
      label: 'Crisp & Direct',
      desc: 'Bullet-point summaries, fast answers, minimum preamble or filler words.',
      icon: '⚡',
    },
    {
      id: 'academic',
      label: 'Deep Dive & Rigorous',
      desc: 'Algorithmic time/space complexities, mathematical foundations, and system architecture.',
      icon: '🔬',
    },
  ];

  const handleAddInterest = () => {
    if (newInterest.trim() && !formData.interests.includes(newInterest.trim())) {
      setFormData({
        ...formData,
        interests: [...formData.interests, newInterest.trim()],
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (tag: string) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter((i) => i !== tag),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onSaveProfile(formData);
    if (success) {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } else {
      setSaveStatus('error');
    }
  };

  const handleReset = () => {
    if (confirm('Reset profile to default engineering student settings?')) {
      setFormData({ ...DEFAULT_PROFILE });
      onSaveProfile({ ...DEFAULT_PROFILE });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-8 text-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <User className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                My Profile & Persona Settings
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Personalize how Gemini responds to your educational background, learning goals, and language preference.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              <span>Back to Chat</span>
            </button>
          </div>
        </div>

        {/* Live Personalization Preview Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <BrainCircuit className="w-4 h-4" />
            <span>AI Personalization Prompt Vector (Live Preview)</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">
            "You are addressing <strong className="text-indigo-300">{formData.name || 'Friend'}</strong>, a{' '}
            <strong className="text-emerald-300">{formData.role || 'Student'}</strong> studying{' '}
            <strong className="text-sky-300">{formData.education || 'CS'}</strong>. Their goal is "{formData.goals}".
            You will explain concepts in <strong className="text-amber-300">{formData.language}</strong> using a{' '}
            <strong className="text-purple-300">{formData.responseStyle}</strong> style."
          </p>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-indigo-400" />
                Full Name or Preferred Nickname
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Alex Sharma"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Current Role */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                Role / Occupation
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="e.g. 3rd Year Computer Science Undergrad"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Education */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                Education / Degree / University
              </label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                placeholder="e.g. B.Tech Computer Engineering"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Preferred Language */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Languages className="w-3.5 h-3.5 text-indigo-400" />
                Primary Preferred Language
              </label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value as PreferredLanguage })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                {languages.find((l) => l.id === formData.language)?.desc || ''}
              </p>
            </div>
          </div>

          {/* Primary Goals */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Primary Learning & Career Goals
            </label>
            <textarea
              rows={2}
              value={formData.goals}
              onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
              placeholder="e.g. Clear technical placement interviews at top tech companies, master DSA in Python, and build impressive full-stack projects."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Key Interests & Skills */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Key Interests, Tech Stack & Hobbies
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                >
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddInterest();
                  }
                }}
                placeholder="Add skill or interest (e.g. Next.js, Machine Learning, Cyber Security)"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Response Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />
              AI Explanation & Response Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {styles.map((st) => {
                const isSelected = formData.responseStyle === st.id;
                return (
                  <div
                    key={st.id}
                    onClick={() => setFormData({ ...formData, responseStyle: st.id })}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{st.icon}</span>
                        <span className="text-sm font-semibold text-white">{st.label}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-500'
                            : 'border-slate-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save Status & Button */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs">
              {saveStatus === 'success' && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Preferences successfully saved to browser localStorage!
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="text-rose-400 font-semibold">
                  Failed to write to localStorage. Please check browser permissions.
                </span>
              )}
              {saveStatus === 'idle' && (
                <span className="text-slate-500">
                  Settings are automatically persisted locally across browser refreshes.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-md shadow-emerald-600/25 transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Profile & Personalize</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
