import React, { useState } from 'react';
import { UserSettings } from '../types';
import { BrainCircuit, ArrowRight, User, Sun, Moon, Monitor, CheckCircle2 } from 'lucide-react';

interface OnboardingProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ settings, onUpdateSettings, onComplete }) => {
  const [step, setStep] = useState(0);
  const [animateExit, setAnimateExit] = useState(false);

  const handleNext = () => {
    setStep(prev => prev + 1);
  };

  const handleFinish = () => {
    setAnimateExit(true);
    setTimeout(() => {
      onComplete();
    }, 500); // Wait for exit animation
  };

  const updateName = (name: string) => {
    onUpdateSettings({ ...settings, displayName: name });
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <div className={`fixed inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${animateExit ? 'opacity-0' : 'opacity-100'}`}>
      
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full relative z-10 animate-fade-in-up">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-12">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? 'w-8 bg-indigo-600 dark:bg-indigo-400' : 
                i < step ? 'w-2 bg-indigo-200 dark:bg-indigo-900' : 'w-2 bg-slate-200 dark:bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center space-y-8">
            <div className="inline-flex p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-4 shadow-sm">
              <BrainCircuit size={64} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Welcome to Decisio
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                Your personal AI assistant for making clear, confident, and grounded decisions.
              </p>
            </div>
            <button 
              onClick={handleNext}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
            >
              Get Started <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-8">
             <div className="text-center">
               <div className="inline-flex p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mb-6 text-indigo-600 dark:text-indigo-400">
                 <User size={32} />
               </div>
               <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                 What should we call you?
               </h2>
               <p className="text-slate-500 dark:text-slate-400">
                 We'll use this to personalize your analysis.
               </p>
             </div>

             <div className="space-y-4">
               <input 
                 type="text" 
                 value={settings.displayName}
                 onChange={(e) => updateName(e.target.value)}
                 placeholder="Enter your name"
                 className="w-full px-6 py-4 text-lg text-center rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none transition-colors placeholder-slate-300 dark:placeholder-slate-600"
                 autoFocus
               />
               <button 
                onClick={handleNext}
                disabled={!settings.displayName.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                Next Step
              </button>
              <button 
                onClick={handleNext} 
                className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Skip for now
              </button>
             </div>
          </div>
        )}

        {/* Step 2: Theme */}
        {step === 2 && (
          <div className="space-y-8">
             <div className="text-center">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                  Choose your vibe
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Select the appearance that helps you focus best.
                </p>
             </div>

             <div className="grid grid-cols-3 gap-4">
               {[
                 { id: 'light', icon: Sun, label: 'Light' },
                 { id: 'dark', icon: Moon, label: 'Dark' },
                 { id: 'system', icon: Monitor, label: 'System' },
               ].map((item) => {
                 const isSelected = settings.theme === item.id;
                 const Icon = item.icon;
                 return (
                   <button
                     key={item.id}
                     onClick={() => updateTheme(item.id as any)}
                     className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                       isSelected 
                         ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 transform scale-105 shadow-md' 
                         : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 text-slate-500 dark:text-slate-400'
                     }`}
                   >
                     <Icon size={28} className="mb-2" />
                     <span className="font-semibold">{item.label}</span>
                     {isSelected && <div className="absolute top-2 right-2 text-indigo-600 dark:text-indigo-400"><CheckCircle2 size={16} /></div>}
                   </button>
                 );
               })}
             </div>

             <button 
                onClick={handleFinish}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 mt-8"
              >
                Ready to Decide <CheckCircle2 size={20} />
              </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;