import React from 'react';
import { UserSettings } from '../types';
import { User, Moon, Sun, Monitor, Trash2, Save } from 'lucide-react';

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
      <div className="flex justify-between items-end mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Settings</h1>
        <span className="text-xs text-green-600 dark:text-green-400 font-medium px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded">
           Changes saved automatically
        </span>
      </div>

      <div className="space-y-6">
        
        {/* Profile Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
            <User size={24} />
            <h2 className="text-xl font-bold">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={settings.displayName}
                onChange={handleNameChange}
                placeholder="What should the AI call you?"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Your name helps the AI personalize the analysis and recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4 text-indigo-600 dark:text-indigo-400">
            <Sun size={24} />
            <h2 className="text-xl font-bold">Appearance</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                settings.theme === 'light' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sun size={24} className="mb-2" />
              <span className="font-medium">Light</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                settings.theme === 'dark' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Moon size={24} className="mb-2" />
              <span className="font-medium">Dark</span>
            </button>
            
            <button
              onClick={() => handleThemeChange('system')}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                settings.theme === 'system' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                  : 'border-slate-200 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Monitor size={24} className="mb-2" />
              <span className="font-medium">System</span>
            </button>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
            <Save size={24} />
            <h2 className="text-xl font-bold">Data Management</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">Clear History</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                You have {historyCount} saved decision{historyCount !== 1 ? 's' : ''}.
              </div>
            </div>
            <button
              onClick={onClearHistory}
              disabled={historyCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-300 hover:border-red-200 dark:hover:border-red-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;