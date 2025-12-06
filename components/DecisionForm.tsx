import React, { useState, useRef } from 'react';
import { DecisionInput, Criterion, OptionItem } from '../types';
import { Plus, Trash2, Loader2, Sparkles, Image as ImageIcon, FileText, Music, Type, ArrowRight, ArrowLeft } from 'lucide-react';
import { getDecisionSuggestion, getOptionsSuggestion, getCriteriaSuggestion } from '../services/geminiService';

interface DecisionFormProps {
  onSubmit: (data: DecisionInput) => void;
  isLoading: boolean;
  displayName?: string;
}

type ComparisonMode = 'text' | 'image' | 'file' | 'audio';
type Step = 1 | 2 | 3;

const DecisionForm: React.FC<DecisionFormProps> = ({ onSubmit, isLoading, displayName }) => {
  const [step, setStep] = useState<Step>(1);
  const [question, setQuestion] = useState('');
  
  const [options, setOptions] = useState<OptionItem[]>([
    { id: '1', type: 'text', text: '' },
    { id: '2', type: 'text', text: '' },
    { id: '3', type: 'text', text: '' },
  ]);

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', name: '', weight: 3 }
  ]);

  const [isSuggestingDecision, setIsSuggestingDecision] = useState(false);
  const [isSuggestingOptions, setIsSuggestingOptions] = useState(false);
  const [isSuggestingCriteria, setIsSuggestingCriteria] = useState(false);

  const isQuestionValid = question.trim().length > 3;
  const validOptionsCount = options.filter(o => (o.text.trim().length > 0 || o.fileData)).length;
  const isOptionsValid = validOptionsCount >= 2;

  const nextStep = () => {
    if (step === 1 && isQuestionValid) setStep(2);
    else if (step === 2 && isOptionsValid) {
        if (criteria.length === 1 && !criteria[0].name) suggestCriteria();
        setStep(3);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
  };

  const handleModeChange = (mode: ComparisonMode) => {
    const hasLockedData = options.some(o => (o.type === 'text' && o.text.trim()) || o.fileData);
    if (hasLockedData && mode !== comparisonMode) {
        if (!confirm("Changing input type will clear your current options. Continue?")) return;
    }
    setComparisonMode(mode);
    if (mode === 'text') {
        setOptions([
            { id: Date.now().toString() + '1', type: 'text', text: '' },
            { id: Date.now().toString() + '2', type: 'text', text: '' },
            { id: Date.now().toString() + '3', type: 'text', text: '' },
        ]);
    } else {
        setOptions([]);
    }
  };

  const handleOptionChange = (id: string, text: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text } : o));
  };

  const handleAddTextOption = () => {
    setOptions([...options, { id: Date.now().toString(), type: 'text', text: '' }]);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleRemoveOption = (id: string) => {
    if (comparisonMode === 'text' && options.length <= 2) {
       setOptions(prev => prev.map(o => o.id === id ? { ...o, text: '' } : o));
    } else {
       setOptions(prev => prev.filter(o => o.id !== id));
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        setOptions(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                type: comparisonMode,
                text: file.name,
                fileName: file.name,
                mimeType: file.type,
                fileData: base64Data
            }
        ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddCriterion = () => {
    setCriteria([...criteria, { id: Date.now().toString(), name: '', weight: 3 }]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleCriterionChange = (id: string, field: keyof Criterion, value: string | number) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const suggestDecision = async () => {
    setIsSuggestingDecision(true);
    try {
      const suggestion = await getDecisionSuggestion(question);
      if (suggestion) setQuestion(suggestion);
    } finally {
      setIsSuggestingDecision(false);
    }
  };

  const suggestOptions = async () => {
    if (!question.trim() || comparisonMode !== 'text') return;
    setIsSuggestingOptions(true);
    try {
      const suggestions = await getOptionsSuggestion(question);
      if (suggestions && suggestions.length > 0) {
        const newOptions = [...options];
        suggestions.forEach(suggestion => {
            const emptyIndex = newOptions.findIndex(o => o.type === 'text' && !o.text.trim());
            if (emptyIndex !== -1) newOptions[emptyIndex].text = suggestion;
            else newOptions.push({ id: Date.now().toString() + Math.random(), type: 'text', text: suggestion });
        });
        setOptions(newOptions);
      }
    } finally {
      setIsSuggestingOptions(false);
    }
  };

  const suggestCriteria = async () => {
    if (!question.trim()) return;
    setIsSuggestingCriteria(true);
    try {
      const suggestions = await getCriteriaSuggestion(question);
      if (suggestions && suggestions.length > 0) {
        setCriteria(suggestions.map((s, idx) => ({
          id: Date.now().toString() + idx,
          name: s.name,
          weight: s.weight
        })));
      }
    } finally {
      setIsSuggestingCriteria(false);
    }
  };

  const handleSubmit = () => {
    const validOptions = options.filter(o => o.text.trim().length > 0 || o.fileData);
    const validCriteria = criteria.filter(c => c.name.trim().length > 0);
    
    onSubmit({
      question,
      options: validOptions,
      criteria: validCriteria.length > 0 ? validCriteria : [{ id: 'default', name: 'General Benefit', weight: 3 }]
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
        {/* Progress Pills */}
        <div className="flex justify-center mb-8 gap-2">
            {[1, 2, 3].map(s => (
                <div 
                    key={s} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'w-4 bg-slate-300 dark:bg-slate-700'}`}
                />
            ))}
        </div>

      <div className="glass-card rounded-[2rem] p-8 sm:p-12 min-h-[500px] flex flex-col relative overflow-hidden">
        
        {/* Step 1: Question */}
        {step === 1 && (
            <div className="flex-1 flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-8">
                    <span className="text-sm font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase">Step 01</span>
                    <button
                        type="button"
                        onClick={suggestDecision}
                        disabled={isSuggestingDecision}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        {isSuggestingDecision ? (
                           <>
                             <Loader2 size={12} className="animate-spin mr-1"/> Drafting...
                           </>
                        ) : (
                           <>
                             <Sparkles size={12} className="mr-1"/> AI Assist
                           </>
                        )}
                    </button>
                </div>
                
                <h2 className="text-4xl font-black mb-6 text-slate-900 dark:text-white leading-tight">
                    What's on your mind?
                </h2>

                <div className="flex-1 flex flex-col">
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="e.g. Should I accept the job offer in New York or stay in London?"
                        className="w-full flex-1 p-6 text-2xl font-medium rounded-2xl input-sleek resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600"
                        autoFocus
                        spellCheck={true}
                        lang="en"
                    />
                </div>
            </div>
        )}

        {/* Step 2: Options */}
        {step === 2 && (
            <div className="flex-1 flex flex-col animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                     <div>
                        <span className="text-sm font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase">Step 02</span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Your Options</h2>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Input Type</span>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                            {(['text', 'image', 'file', 'audio'] as ComparisonMode[]).map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => handleModeChange(mode)}
                                    className={`p-2 rounded-lg transition-all ${comparisonMode === mode ? 'bg-white dark:bg-slate-600 shadow-sm text-purple-600 dark:text-white' : 'text-slate-400 hover:text-purple-500'}`}
                                    title={mode}
                                >
                                    {mode === 'text' && <Type size={18}/>}
                                    {mode === 'image' && <ImageIcon size={18}/>}
                                    {mode === 'file' && <FileText size={18}/>}
                                    {mode === 'audio' && <Music size={18}/>}
                                </button>
                            ))}
                        </div>
                     </div>
                 </div>
                 
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={comparisonMode === 'image' ? "image/*" : comparisonMode === 'audio' ? "audio/*" : ".pdf,.txt,.doc,.docx"}
                    onChange={handleFileSelect}
                />

                 <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {options.map((option, index) => (
                        <div key={option.id} className="flex gap-3 items-center group animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>
                            <div className="flex-1">
                                {comparisonMode === 'text' ? (
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="w-full px-5 py-4 rounded-xl input-sleek text-lg font-medium"
                                        autoFocus={index === options.length - 1 && options.length > 2}
                                        spellCheck={true}
                                        lang="en"
                                    />
                                ) : (
                                    <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-purple-500 shadow-sm overflow-hidden flex-shrink-0">
                                            {option.type === 'image' && option.fileData ? (
                                                <img src={`data:${option.mimeType};base64,${option.fileData}`} alt="Preview" className="w-full h-full object-cover" />
                                            ) : option.type === 'audio' ? <Music size={24} /> : <FileText size={24} />}
                                        </div>
                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                            placeholder="Label this..."
                                            className="flex-1 bg-transparent border-none outline-none font-medium text-lg"
                                            spellCheck={true}
                                        />
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleRemoveOption(option.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                    
                    {comparisonMode !== 'text' && options.length === 0 && (
                         <div onClick={triggerFileUpload} className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 flex flex-col items-center justify-center text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all">
                             <Plus size={32} className="mb-2"/>
                             <span className="font-semibold">Upload {comparisonMode}s</span>
                         </div>
                    )}
                 </div>

                 <div className="flex justify-between items-center mt-6">
                     <button
                        onClick={comparisonMode === 'text' ? handleAddTextOption : triggerFileUpload}
                        className="text-purple-600 dark:text-purple-400 font-bold flex items-center gap-2 px-4 py-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    >
                        <Plus size={20} /> Add Option
                    </button>
                    
                    {comparisonMode === 'text' && (
                        <button
                            onClick={suggestOptions}
                            disabled={isSuggestingOptions}
                            className="text-sm font-bold text-slate-500 hover:text-purple-600 flex items-center gap-2 transition-colors"
                        >
                            {isSuggestingOptions ? (
                                <>
                                    <Loader2 size={16} className="animate-spin"/> Brainstorming...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16}/> Brainstorm
                                </>
                            )}
                        </button>
                    )}
                 </div>
            </div>
        )}

        {/* Step 3: Criteria */}
        {step === 3 && (
            <div className="flex-1 flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                     <div>
                        <span className="text-sm font-bold tracking-widest text-purple-600 dark:text-purple-400 uppercase">Step 03</span>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Success Criteria</h2>
                     </div>
                    <button
                        onClick={suggestCriteria}
                        disabled={isSuggestingCriteria}
                        className="text-xs font-semibold px-3 py-1.5 rounded-full flex items-center bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        {isSuggestingCriteria ? (
                            <>
                                <Loader2 size={12} className="animate-spin mr-1"/> Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles size={12} className="mr-1"/> Auto-Generate
                            </>
                        )}
                    </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {criteria.map((criterion, index) => (
                        <div key={criterion.id} className="flex gap-3 items-center group animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>
                             <div className="flex-1 flex items-center input-sleek rounded-xl p-2 pl-4 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-purple-500">
                                 <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => handleCriterionChange(criterion.id, 'name', e.target.value)}
                                    placeholder="e.g. Cost, Time, Effort"
                                    className="flex-1 bg-transparent outline-none font-bold text-lg"
                                    spellCheck={true}
                                    lang="en"
                                />
                                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                <select
                                    value={criterion.weight}
                                    onChange={(e) => handleCriterionChange(criterion.id, 'weight', parseInt(e.target.value))}
                                    className="bg-transparent text-sm font-bold text-purple-600 dark:text-purple-400 outline-none cursor-pointer pr-2"
                                >
                                    {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>Imp: {w}</option>)}
                                </select>
                             </div>
                             {criteria.length > 1 && (
                                <button onClick={() => handleRemoveCriterion(criterion.id)} className="p-3 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={20} />
                                </button>
                             )}
                        </div>
                    ))}
                    
                    <button
                        onClick={handleAddCriterion}
                        className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10 font-bold flex justify-center items-center gap-2 transition-all mt-4"
                    >
                        <Plus size={20} /> Add Criterion
                    </button>
                </div>
            </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            {step > 1 ? (
                <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 text-slate-500 hover:text-purple-600 dark:text-slate-400 dark:hover:text-purple-300 font-bold px-4 py-2 rounded-lg transition-colors"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            ) : (
                <div></div> 
            )}

            {step < 3 ? (
                <button
                    onClick={nextStep}
                    disabled={(step === 1 && !isQuestionValid) || (step === 2 && !isOptionsValid)}
                    className="btn-glow px-10 py-4 rounded-2xl font-bold shadow-lg flex items-center gap-2"
                >
                    Next Step <ArrowRight size={20} />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="btn-glow px-10 py-4 rounded-2xl font-bold shadow-lg flex items-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {isLoading ? "Thinking..." : "Analyze"}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default DecisionForm;