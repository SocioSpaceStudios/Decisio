
import React, { useState } from 'react';
import { UserSettings, FeedbackSubmission } from '../types';
import { User, Moon, Sun, Monitor, Trash2, Check, Cloud, LogIn, LogOut, CheckCircle2, MessageSquare, Send, Loader2, Zap, LayoutTemplate } from 'lucide-react';
import { submitFeedback } from '../services/firebase.ts';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearHistory: () => void;
  historyCount: number;
  user?: any;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
    settings, 
    onUpdateSettings, 
    onClearHistory, 
    historyCount,
    user,
    onSignIn,
    onSignOut
}) => {
  const [feedbackType, setFeedbackType] = useState<'bug' | 'suggestion' | 'other'>('suggestion');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // ... (Keep handler functions same as before) ...
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, displayName: e.target.value });
  };
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };
  const handleMethodChange = (method: UserSettings['decisionMethod']) => {
    onUpdateSettings({ ...settings, decisionMethod: method });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;
    setIsSubmittingFeedback(true);
    try {
        const feedback: FeedbackSubmission = {
            type: feedbackType,
            message: feedbackMessage,
            email: settings.email || user?.email,
            timestamp: Date.now(),
            userId: user?.uid
        };
        await submitFeedback(feedback);
        setFeedbackMessage('');
        alert("Feedback sent!");
    } catch (error) {
        alert("Failed.");
    } finally {
        setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-fade-in-up pb-20">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Settings</h1>

      {/* PRO BANNER */}
      <div className="mb-8 rounded-3xl p-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/30 relative overflow-hidden group cursor-pointer">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <Zap size={120} />
          </div>
          <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-white/20 rounded-lg"><Zap size={16} fill="currentColor"/></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Pro Plan</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">Upgrade to Pro</h2>
              <p className="text-violet-100 text-sm mb-4 max-w-[80%]">Unlock unlimited history, deep analysis mode, and custom export options.</p>
              <button className="bg-white text-violet-600 px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-violet-50 transition-colors">
                  Unlock all features
              </button>
          </div>
      </div>

      <div className="space-y-6">
        
        {/* Appearance */}
        <div className="card-modern rounded-3xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sun size={20} className="text-slate-400"/> Appearance
            </h2>
             <div className="grid grid-cols-3 gap-3">
            {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'Auto' }
            ].map((theme) => {
                const isActive = settings.theme === theme.id;
                const Icon = theme.icon;
                return (
                    <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${
                            isActive 
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' 
                            : 'border-slate-100 dark:border-slate-800 text-slate-400'
                        }`}
                    >
                        <Icon size={20} className="mb-1" />
                        <span className="text-xs font-bold">{theme.label}</span>
                    </button>
                )
            })}
          </div>
        </div>

        {/* Decision Method */}
        <div className="card-modern rounded-3xl p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <LayoutTemplate size={20} className="text-slate-400"/> Decision Method
            </h2>
            <div className="space-y-2">
                {[
                    { id: 'analytical', label: 'Analytical', desc: 'Data-driven with detailed breakdown' },
                    { id: 'intuitive', label: 'Intuitive', desc: 'Focus on feelings and gut instinct' },
                    { id: 'balanced', label: 'Balanced', desc: 'Mix of logic and intuition' },
                    { id: 'quick', label: 'Quick', desc: 'Fast, actionable recommendations' }
                ].map((method) => {
                    const isSelected = settings.decisionMethod === method.id;
                    return (
                        <button 
                            key={method.id}
                            onClick={() => handleMethodChange(method.id as any)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between ${
                                isSelected ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10' : 'border-slate-100 dark:border-slate-800'
                            }`}
                        >
                            <div>
                                <h3 className={`text-sm font-bold ${isSelected ? 'text-pink-600' : 'text-slate-700 dark:text-slate-300'}`}>{method.label}</h3>
                                <p className="text-xs text-slate-500">{method.desc}</p>
                            </div>
                            {isSelected && <CheckCircle2 size={18} className="text-pink-500" />}
                        </button>
                    );
                })}
            </div>
        </div>

        {/* Cloud Sync */}
        <div className="card-modern rounded-3xl p-6">
             <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Cloud size={20} className="text-slate-400"/> Sync & Data
            </h2>
            
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl mb-4">
                <div>
                     {user ? (
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{user.email}</p>
                    ) : (
                        <p className="text-sm font-bold text-slate-500">Not signed in</p>
                    )}
                </div>
                {user ? (
                    <button onClick={onSignOut} className="text-xs font-bold text-red-500">Sign Out</button>
                ) : (
                    <button onClick={onSignIn} className="text-xs font-bold text-violet-600">Sign In</button>
                )}
            </div>

            <button
              onClick={onClearHistory}
              disabled={historyCount === 0}
              className="w-full py-3 border border-red-200 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
            >
              Clear History ({historyCount})
            </button>
        </div>

      </div>
    </div>
  );
};

export default Settings;
