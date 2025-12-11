
import React, { useState, useEffect } from 'react';
import { ViewState, DecisionInput, DecisionRecord, UserSettings } from './types';
import { analyzeDecision, refineAnalysis } from './services/geminiService';
import { subscribeToAuthChanges, saveDecisionToFirestore, deleteDecisionFromFirestore, getHistoryFromFirestore, signOut, signInWithGoogle } from './services/firebase.ts';
import DecisionForm from './components/DecisionForm';
import DecisionResult from './components/DecisionResult';
import HistoryList from './components/HistoryList';
import Settings from './components/Settings';
import Onboarding from './components/Onboarding';
import { Bird, History as HistoryIcon, PlusCircle, Settings as SettingsIcon, LogOut, Compass, Sparkles } from 'lucide-react';

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
      email: '',
      theme: 'system',
      decisionMethod: 'balanced'
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
                
                // Update local settings if cloud profile has data
                const newSettings = { ...userSettings };
                let settingsChanged = false;

                if (!userSettings.displayName && currentUser.displayName) {
                    newSettings.displayName = currentUser.displayName;
                    settingsChanged = true;
                }
                if (!userSettings.email && currentUser.email) {
                    newSettings.email = currentUser.email;
                    settingsChanged = true;
                }

                if (settingsChanged) {
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
        setHistory([]);
        if (!user) {
            localStorage.removeItem(STORAGE_KEY);
        } else {
            alert("To permanently delete all cloud data, please manage this in your account settings.");
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
    <div className="min-h-screen pb-24 md:pb-10 relative overflow-x-hidden font-sans selection:bg-pink-100 dark:selection:bg-pink-900">
      
      {/* Onboarding Overlay */}
      {view === 'ONBOARDING' && (
        <Onboarding 
          settings={userSettings}
          onUpdateSettings={updateSettings}
          onComplete={completeOnboarding}
        />
      )}

      {/* Main Content */}
      {view !== 'ONBOARDING' && (
        <main className="max-w-xl mx-auto px-4 pt-12 md:pt-16 relative z-10">
          
          {/* Header Area */}
          <div className="flex justify-between items-center mb-6">
             <div 
                className="flex items-center gap-2 cursor-pointer"
                onClick={() => { setView('HOME'); setCurrentRecord(null); }}
             >
                 {/* Mascot Icon */}
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-pink-200 dark:shadow-none">
                  <Bird size={24} strokeWidth={2.5} />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">Decisio</span>
             </div>
             {user && (
                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-bold text-slate-600 dark:text-slate-300">
                     {userSettings.displayName.charAt(0)}
                 </div>
             )}
          </div>

          {view === 'HOME' && (
            <div className="animate-fade-in-up">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">
                    Welcome back{userSettings.displayName ? `, ${userSettings.displayName}` : ''}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  What decision are you facing today?
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
                  setHistory([]);
                  setView('HOME');
              }}
            />
          )}
        </main>
      )}

      {/* Mobile Bottom Navigation (Simulating App Feel) */}
      {view !== 'ONBOARDING' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 pb-safe">
          <div className="max-w-md mx-auto flex justify-around items-center p-2">
            <button 
                onClick={() => { setView('HOME'); setCurrentRecord(null); }}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${view === 'HOME' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <Compass size={24} strokeWidth={view === 'HOME' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Decide</span>
            </button>
            
            <button 
                onClick={() => setView('HISTORY')}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${view === 'HISTORY' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <HistoryIcon size={24} strokeWidth={view === 'HISTORY' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">History</span>
            </button>

            <button 
                onClick={() => setView('SETTINGS')}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${view === 'SETTINGS' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
                <SettingsIcon size={24} strokeWidth={view === 'SETTINGS' ? 2.5 : 2} />
                <span className="text-[10px] font-bold">Settings</span>
            </button>
          </div>
        </nav>
      )}

    </div>
  );
};

export default App;
