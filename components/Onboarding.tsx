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
    }, 500);
  };

  const updateName = (name: string) => {
    onUpdateSettings({ ...settings, displayName: name });
  };

  const updateTheme = (theme: 'light' | 'dark' | 'system') => {
    onUpdateSettings({ ...settings, theme });
  };

  return (
    <div className={`fixed inset-0 z-50 bg-white/50 dark:bg-black/50 backdrop-blur-xl flex flex-col items-center justify-center p-6 transition-opacity duration-500 ${animateExit ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Immersive Card */}
      <div className="glass-card rounded-[3rem] p-8 sm:p-12 max-w-lg w-full relative z-10 animate-fade-in-up shadow-2xl">
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-3 mb-10">
          {[0, 1, 2].map(i => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === step ? 'w-10 bg-purple-500 shadow-glow' : 
                i < step ? 'w-2 bg-purple-300' : 'w-2 bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl transform rotate-3">
              <BrainCircuit size={48} />
            </div>
            
            <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
              Decisio
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-300 mb-10 leading-relaxed">
                The modern way to weigh options. <br/> Clarity is just a click away.
            </p>
            
            <button 
              onClick={handleNext}
              className="w-full btn-glow py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 group text-lg"
            >
              Start Journey <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div>
             <div className="text-center mb-8">
               <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                 Who's deciding?
               </h2>
               <p className="text-slate-500 dark:text-slate-400">
                 We'll personalize your experience.
               </p>
             </div>

             <div className="space-y-6">
               <div className="relative">
                 <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                 <input 
                    type="text" 
                    value={settings.displayName}
                    onChange={(e) => updateName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-12 pr-6 py-4 rounded-2xl input-sleek text-lg font-bold text-center"
                    autoFocus
                 />
               </div>

               <button 
                onClick={handleNext}
                disabled={!settings.displayName.trim()}
                className="w-full btn-glow py-4 rounded-2xl font-bold shadow-xl mt-4"
              >
                Continue
              </button>
             </div>
          </div>
        )}

        {/* Step 2: Theme */}
        {step === 2 && (
          <div>
             <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                  Set the Mood
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  How do you like to work?
                </p>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-8">
               {[
                 { id: 'light', icon: Sun, label: 'Light' },
                 { id: 'dark', icon: Moon, label: 'Dark' },
                 { id: 'system', icon: Monitor, label: 'Auto' },
               ].map((item) => {
                 const isSelected = settings.theme === item.id;
                 const Icon = item.icon;
                 return (
                   <button
                     key={item.id}
                     onClick={() => updateTheme(item.id as any)}
                     className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                       isSelected 
                         ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-md transform scale-105' 
                         : 'border-slate-100 dark:border-slate-800 text-slate-400'
                     }`}
                   >
                     <Icon size={28} className="mb-2" />
                     <span className="font-semibold">{item.label}</span>
                   </button>
                 );
               })}
             </div>

             <button 
                onClick={handleFinish}
                className="w-full btn-glow py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2"
              >
                Let's Go <CheckCircle2 size={20} />
              </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;