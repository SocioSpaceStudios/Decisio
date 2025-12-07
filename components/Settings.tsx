import React from 'react';
import { UserSettings } from '../types';
import { User, Moon, Sun, Monitor, Trash2, Save, Check, Cloud, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  onClearHistory: () => void;
  historyCount: number;
  user?: any; // Firebase User
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
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, displayName: e.target.value });
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up pb-20">
      <div className="flex justify-between items-end mb-8 px-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">Settings</h1>
      </div>

      <div className="space-y-6">
        
        {/* Cloud Sync / Auth */}
        <div className="glass-card rounded-3xl p-8 border-l-4 border-blue-500">
             <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                        <Cloud size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cloud Sync</h2>
                        {user ? (
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold flex items-center gap-1 mt-1">
                                <CheckCircle2 size={12}/> Synced as {user.email}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                Sign in to save decisions across devices
                            </p>
                        )}
                    </div>
                </div>
             </div>

             <div className="mt-6">
                {user ? (
                    <button 
                        onClick={onSignOut}
                        className="w-full sm:w-auto px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> Sign Out
                    </button>
                ) : (
                    <button 
                        onClick={onSignIn}
                        className="w-full sm:w-auto px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                    >
                        <LogIn size={18} /> Sign In with Google
                    </button>
                )}
             </div>
        </div>

        {/* Profile */}
        <div className="glass-card rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 dark:text-purple-400">
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