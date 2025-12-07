import React, { useState, useEffect } from 'react';
import { ViewState, DecisionInput, DecisionRecord, UserSettings } from './types';
import { analyzeDecision, refineAnalysis } from './services/geminiService';
import { subscribeToAuthChanges, saveDecisionToFirestore, deleteDecisionFromFirestore, getHistoryFromFirestore, signOut, signInWithGoogle } from './services/firebase.ts';
import DecisionForm from './components/DecisionForm';
import DecisionResult from './components/DecisionResult';
import HistoryList from './components/HistoryList';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { BrainCircuit, History as HistoryIcon, PlusCircle, Settings as SettingsIcon, LogOut } from 'lucide-react';

const STORAGE_KEY = 'clarity_choice_history';
const SETTINGS_KEY = 'clarity_choice_settings';
const ONBOARDED_KEY = 'clarity_choice_onboarded';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem(ONBOARDED_KEY)) {
      return 'ONBOARDING';
    }
    return 'HOME';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<DecisionRecord | null>(null);
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [user, setUser] = useState<any | null>(null); // Firebase user
  
  const [userSettings, setUserSettings] = useState<UserSettings>(() => {
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    return savedSettings ? JSON.parse(savedSettings) : {
      displayName: '',
      theme: 'system'
    };
  });

  // --- Theme Management ---
  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      const isDark = userSettings.theme === 'dark' || 
        (userSettings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (userSettings.theme === 'system') applyTheme();
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [userSettings.theme]);

  // --- Auth & Data Loading ---
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            // Logged In: Fetch from Firestore
            try {
                const cloudHistory = await getHistoryFromFirestore(currentUser.uid);
                setHistory(cloudHistory);
                // Optionally update display name from Google Profile if not set
                if (!userSettings.displayName && currentUser.displayName) {
                   const newSettings = { ...userSettings, displayName: currentUser.displayName };
                   setUserSettings(newSettings);
                   localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
                }
            } catch (e) {
                console.error("Failed to load cloud history", e);
            }
        } else {
            // Logged Out: Fetch from LocalStorage
            try {
                const savedHistory = localStorage.getItem(STORAGE_KEY);
                if (savedHistory) {
                    setHistory(JSON.parse(savedHistory));
                } else {
                    setHistory([]);
                }
            } catch (e) {
                console.error("Failed to load local data", e);
            }
        }
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = (newSettings: UserSettings) => {
    setUserSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setView('HOME');
  };

  const clearHistory = async () => {
    if (window.confirm("Are you sure you want to delete all your decision history?")) {
        // If logged in, we'd theoretically delete collection, but for now just clear local state 
        // because deleting collections client-side is complex/restricted in standard Firestore rules.
        // We will just clear the state for now to reflect 'cleared' view.
        setHistory([]);
        if (!user) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            alert("To permanently delete all cloud data, please manage this in your account settings (Feature coming soon). For now, items can be deleted individually.");
        }
    }
  };

  const handleSave = async (record: DecisionRecord) => {
    const exists = history.some(h => h.id === record.id);
    let newHistory;
    if (exists) {
        newHistory = history.map(h => h.id === record.id ? record : h);
    } else {
        newHistory = [record, ...history];
    }
    setHistory(newHistory);
    
    // PERSISTENCE LOGIC
    if (user) {
        await saveDecisionToFirestore(user.uid, record);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }
  };

  const handleAnalyze = async (input: DecisionInput) => {
    setIsLoading(true);
    try {
      const analysis = await analyzeDecision(input, userSettings.displayName);
      const newRecord: DecisionRecord = {
        id: Date.now().toString(),
        title: input.question,
        input,
        analysis,
        createdAt: Date.now(),
        refinementHistory: [] 
      };
      setCurrentRecord(newRecord);
      await handleSave(newRecord);
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
        // Save the current analysis state to history before replacing it
        refinementHistory: [
            ...(currentRecord.refinementHistory || []),
            {
                analysis: currentRecord.analysis,
                instruction: instruction,
                timestamp: Date.now()
            }
        ],
        analysis: refinedAnalysis 
      };

      setCurrentRecord(updatedRecord);
      await handleSave(updatedRecord);
    } catch (error) {
      console.error("Refinement failed", error);
      throw error; 
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this decision?")) return;
    const newHistory = history.filter(h => h.id !== id);
    setHistory(newHistory);
    
    // PERSISTENCE LOGIC
    if (user) {
        await deleteDecisionFromFirestore(user.uid, id);
    } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    }
    
    if (currentRecord && currentRecord.id === id) {
        setCurrentRecord(null);
        setView('HOME');
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 pb-20 relative overflow-x-hidden font-sans selection:bg-purple-200 dark:selection:bg-purple-900">
      
      {/* Animated Aurora Background */}
      <div className="bg-aurora"></div>
      
      {/* Noise Texture */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-0 mix-blend-overlay"></div>
      
      {/* Onboarding Overlay */}
      {view === 'ONBOARDING' && (
        <Onboarding 
          settings={userSettings}
          onUpdateSettings={updateSettings}
          onComplete={completeOnboarding}
        />
      )}

      {/* Floating Glass Navigation */}
      {view !== 'ONBOARDING' && (
        <nav className="fixed top-6 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <div className="glass-card rounded-full px-4 py-3 flex items-center justify-between shadow-lg">
              <div 
                className="flex items-center gap-3 cursor-pointer group pl-2"
                onClick={() => { setView('HOME'); setCurrentRecord(null); }}
              >
                <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md transform transition-transform group-hover:rotate-12">
                  <BrainCircuit size={20} />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300">Decisio</span>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-full">
                <button 
                  onClick={() => { setView('HOME'); setCurrentRecord(null); }}
                  className={`p-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${view === 'HOME' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <PlusCircle size={18} /> <span className="hidden sm:inline">New</span>
                </button>
                <button 
                  onClick={() => setView('HISTORY')}
                  className={`p-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${view === 'HISTORY' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <HistoryIcon size={18} /> <span className="hidden sm:inline">History</span>
                </button>
                <button 
                  onClick={() => setView('SETTINGS')}
                  className={`relative p-2.5 rounded-full flex items-center gap-2 text-sm font-bold transition-all ${view === 'SETTINGS' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                >
                  <SettingsIcon size={18} /> 
                  {user && <span className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-slate-800"></span>}
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      {view !== 'ONBOARDING' && (
        <main className="max-w-3xl mx-auto px-4 pt-32 relative z-10">
          {view === 'HOME' && (
            <div className="animate-fade-in-up">
              <div className="text-center mb-12">
                <div className="inline-block animate-float">
                    <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter text-gradient leading-tight filter drop-shadow-sm">
                    Decide Better.
                    </h1>
                </div>
                <p className="text-slate-600 dark:text-slate-300 max-w-lg mx-auto text-lg leading-relaxed font-medium opacity-90">
                  Navigate complexity with AI-powered clarity. Weigh your options, define your criteria, and choose with confidence.
                </p>
                {!user && (
                    <div className="mt-4 text-xs font-semibold text-slate-400">
                        <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">Offline Mode</span>
                    </div>
                )}
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
                onDelete={() => handleDelete(currentRecord.id)}
                onNew={() => { setView('HOME'); setCurrentRecord(null); }}
                onRefine={handleRefine}
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
              user={user}
              onSignIn={signInWithGoogle}
              onSignOut={() => {
                  signOut();
                  setHistory([]); // Clear view on logout, will reload from local storage
                  setView('HOME');
              }}
            />
          )}
        </main>
      )}

    </div>
  );
};

export default App;