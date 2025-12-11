
import React, { useState } from 'react';
import { UserSettings } from '../types';
import { Bird, ArrowRight, User, Sun, Moon, Monitor, CheckCircle2, Mail, Zap, BarChart3, Heart } from 'lucide-react';

interface OnboardingProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ settings, onUpdateSettings, onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => setStep(prev => prev + 1);
  const handleFinish = () => onComplete();

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6">
      
      {/* Step 0: Welcome Splash */}
      {step === 0 && (
        <div className="max-w-sm w-full text-center animate-fade-in-up">
          <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-pink-500 to-violet-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-2xl shadow-pink-500/20 transform rotate-6">
            <Bird size={48} strokeWidth={2} />
          </div>
          
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Decisio
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 font-medium">
            Make better decisions, effortlessly.
          </p>

          <div className="space-y-6 mb-12 text-left">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl"><Zap size={20} fill="currentColor" /></div>
                  <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">AI-Powered Analysis</h3>
                      <p className="text-xs text-slate-500">Get intelligent insights in seconds</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-2xl"><BarChart3 size={20} /></div>
                  <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Objective Ratings</h3>
                      <p className="text-xs text-slate-500">See clear scores for each option</p>
                  </div>
              </div>
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-2xl"><Heart size={20} /></div>
                  <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">Clear Reasoning</h3>
                      <p className="text-xs text-slate-500">Understand the 'Why' behind choices</p>
                  </div>
              </div>
          </div>
          
          <button 
            onClick={handleNext}
            className="w-full btn-vibe py-4 rounded-2xl font-bold text-lg shadow-xl"
          >
            Get Started
          </button>
        </div>
      )}

      {/* Step 1: Quick Setup (Combined Name/Theme for simplicity) */}
      {step === 1 && (
         <div className="max-w-sm w-full animate-fade-in-up">
             <div className="text-center mb-10">
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Let's set you up</h2>
                 <p className="text-slate-500">Personalize your experience</p>
             </div>

             <div className="space-y-6">
                 <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Your Name</label>
                     <input 
                        type="text" 
                        value={settings.displayName}
                        onChange={(e) => onUpdateSettings({...settings, displayName: e.target.value})}
                        placeholder="e.g. Chanel"
                        className="w-full p-4 rounded-2xl input-soft text-lg font-bold"
                     />
                 </div>

                 <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Preferred Theme</label>
                     <div className="grid grid-cols-3 gap-2">
                        {[
                             { id: 'light', icon: Sun, label: 'Light' },
                             { id: 'dark', icon: Moon, label: 'Dark' },
                             { id: 'system', icon: Monitor, label: 'Auto' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => onUpdateSettings({...settings, theme: t.id as any})}
                                className={`flex flex-col items-center py-3 rounded-xl border-2 transition-all ${settings.theme === t.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 text-pink-600' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                            >
                                <t.icon size={20} className="mb-1"/>
                                <span className="text-xs font-bold">{t.label}</span>
                            </button>
                        ))}
                     </div>
                 </div>

                 <button 
                    onClick={handleFinish}
                    disabled={!settings.displayName}
                    className="w-full btn-vibe py-4 rounded-2xl font-bold text-lg shadow-xl mt-4"
                >
                    Start Deciding
                </button>
             </div>
         </div>
      )}

    </div>
  );
};

export default Onboarding;
