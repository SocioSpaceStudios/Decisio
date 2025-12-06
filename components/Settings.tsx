import React from 'react';
import { UserSettings } from '../types';
import { User, Moon, Sun, Monitor, Trash2, Save, Check } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearHistory: () => void;
  historyCount: number;
}

const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings, onClearHistory, historyCount }) => {
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, displayName: e.target.value });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="flex justify-between items-end mb-8 px-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        
        {/* Profile */}
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                <User size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile</h2>
                <p className="text-xs text-slate-500 font-medium">Personalize your experience</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">
               Display Name
            </label>
            <input
              type="text"
              value={settings.displayName}
              onChange={handleNameChange}
              placeholder="What should we call you?"
              className="w-full px-5 py-4 rounded-xl input-sleek text-lg font-medium"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
                <Sun size={24} />
            </div>
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Appearance</h2>
                <p className="text-xs text-slate-500 font-medium">Choose your interface theme</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {[
                { id: 'light', icon: Sun, label: 'Light' },
                { id: 'dark', icon: Moon, label: 'Dark' },
                { id: 'system', icon: Monitor, label: 'System' }
            ].map((theme) => {
                const isActive = settings.theme === theme.id;
                const Icon = theme.icon;
                return (
                    <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme.id as any)}
                        className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                            isActive 
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 shadow-sm' 
                            : 'border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-slate-700 text-slate-500'
                        }`}
                    >
                        <Icon size={24} className="mb-2" />
                        <span className="font-semibold">{theme.label}</span>
                        {isActive && <div className="absolute top-2 right-2 text-purple-500"><Check size={14} strokeWidth={4} /></div>}
                    </button>
                )
            })}
          </div>
        </div>

        {/* Data */}
        <div className="glass-card rounded-3xl p-8 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-xl text-red-600 dark:text-red-400">
                    <Trash2 size={24} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Clear History</h2>
                    <p className="text-sm text-slate-500">
                        {historyCount} saved decision{historyCount !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
            <button
              onClick={onClearHistory}
              disabled={historyCount === 0}
              className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Clear All
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;