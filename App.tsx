import React, { useState, useEffect } from 'react';
import { ViewState, DecisionInput, AnalysisResult, DecisionRecord, UserSettings } from './types';
import { analyzeDecision, refineAnalysis } from './services/geminiService';
import DecisionForm from './components/DecisionForm';
import DecisionResult from './components/DecisionResult';
import HistoryList from './components/HistoryList';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { BrainCircuit, History as HistoryIcon, PlusCircle, Settings as SettingsIcon } from 'lucide-react';

const STORAGE_KEY = 'clarity_choice_history';
const SETTINGS_KEY = 'clarity_choice_settings';
const ONBOARDED_KEY = 'clarity_choice_onboarded';

const App: React.FC = () => {
  // Initialize view state. If not onboarded, default to ONBOARDING.
  const [view, setView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(ONBOARDED_KEY)) {
      return 'ONBOARDING';
    }
    return 'HOME';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DecisionRecord | null>(null);
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  
  // Settings State - lazy init to avoid flash of default settings
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    return savedSettings ? JSON.parse(savedSettings) : {
      displayName: '',
      theme: 'system'
    };
  });

  // Load history on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load local data", e);
    }
  }, []);

  // Theme Application Effect
  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      const isDark = userSettings.theme === 'dark' || 
        (userSettings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for system changes if theme is 'system'
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (userSettings.theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [userSettings.theme]);

  const updateSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setView('HOME');
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to delete all your decision history? This cannot be undone.")) {
      setHistory([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const handleAnalyze = async (input: DecisionInput) => {
    setIsLoading(true);
    try {
      // Pass the display name to the service
      const analysis = await analyzeDecision(input, userSettings.displayName);
      
      const newRecord: DecisionRecord = {
        id: Date.now().toString(),
        title: input.question,
        input,
        analysis,
        createdAt: Date.now(),
      };

      setCurrentRecord(newRecord);
      setView('ANALYSIS');
    } catch (error) {
      alert("Something went wrong with the analysis. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (instruction: string) => {
    if (!currentRecord) return;
    
    try {
      const refinedAnalysis = await refineAnalysis(currentRecord.input, currentRecord.analysis, instruction);
      
      const updatedRecord: DecisionRecord = {
        ...currentRecord,
        analysis: refinedAnalysis,
      };
      
      setCurrentRecord(updatedRecord);
      
      if (history.some(h => h.id === updatedRecord.id)) {
        handleSave(updatedRecord);
      }
    } catch (error) {
      console.error("Refinement failed", error);
      throw error; 
    }
  };

  const handleSave = (record: DecisionRecord) => {
    const exists = history.some(h => h.id === record.id);
    let newHistory;
    
    if (exists) {
        newHistory = history.map(h => h.id === record.id ? record : h);
    } else {
        newHistory = [record, ...history];
    }
    
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this decision?")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const isCurrentSaved = currentRecord ? history.some(h => h.id === currentRecord.id) : false;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pb-10">
      
      {/* Onboarding View */}
      {view === 'ONBOARDING' && (
        <Onboarding 
          settings={userSettings}
          onUpdateSettings={updateSettings}
          onComplete={completeOnboarding}
        />
      )}

      {/* Navigation Bar - Hidden during onboarding */}
      {view !== 'ONBOARDING' && (
        <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => { setView('HOME'); setCurrentRecord(null); }}
            >
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm">
                <BrainCircuit size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white">Decisio</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setView('HOME'); setCurrentRecord(null); }}
                className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'HOME' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <PlusCircle size={18} /> <span className="hidden sm:inline">New</span>
              </button>
              <button 
                onClick={() => setView('HISTORY')}
                className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'HISTORY' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <HistoryIcon size={18} /> <span className="hidden sm:inline">History</span>
              </button>
              <button 
                onClick={() => setView('SETTINGS')}
                className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors ${view === 'SETTINGS' ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <SettingsIcon size={18} /> <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      {view !== 'ONBOARDING' && (
        <main className="max-w-5xl mx-auto px-4 pt-8">
          {view === 'HOME' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-slate-800 dark:text-white mb-4">
                  Make Better Decisions
                </h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                  Define your dilemma, list your options, and let AI analyze the pros, cons, and trade-offs to help you decide with confidence.
                </p>
              </div>
              <DecisionForm 
                onSubmit={handleAnalyze} 
                isLoading={isLoading} 
                displayName={userSettings.displayName}
              />
            </div>
          )}

          {view === 'ANALYSIS' && currentRecord && (
            <div className="animate-fade-in">
              <DecisionResult 
                record={currentRecord} 
                onSave={handleSave}
                onRefine={handleRefine}
                isSaved={isCurrentSaved}
                onNew={() => { setView('HOME'); setCurrentRecord(null); }}
              />
            </div>
          )}

          {view === 'HISTORY' && (
            <div className="animate-fade-in">
              <HistoryList 
                history={history} 
                onSelect={(r) => { setCurrentRecord(r); setView('ANALYSIS'); }}
                onDelete={handleDelete}
                onNew={() => { setView('HOME'); setCurrentRecord(null); }}
              />
            </div>
          )}

          {view === 'SETTINGS' && (
            <Settings 
              settings={userSettings} 
              onUpdateSettings={updateSettings} 
              onClearHistory={clearHistory}
              historyCount={history.length}
            />
          )}
        </main>
      )}

    </div>
  );
};

export default App;