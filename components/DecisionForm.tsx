
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

  const exampleDecisions = [
      "Should I change careers?",
      "Which city should I move to?",
      "Should I start a business?"
  ];

  return (
    <div className="max-w-3xl mx-auto">
        {/* Progress Bars for Steps */}
        <div className="flex gap-2 mb-6">
            {[1, 2, 3].map(s => (
                <div 
                    key={s} 
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                        s <= step ? 'bg-gradient-to-r from-pink-500 to-violet-500' : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                />
            ))}
        </div>

      <div className="card-modern rounded-[2rem] p-6 sm:p-8 min-h-[500px] flex flex-col relative overflow-hidden">
        
        {/* Step 1: Question */}
        {step === 1 && (
            <div className="flex-1 flex flex-col animate-fade-in">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. Should I accept the job offer in New York?"
                    className="w-full h-40 p-6 text-xl font-medium rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-none resize-none placeholder:text-slate-400 focus:ring-2 focus:ring-pink-500/20"
                    autoFocus
                    spellCheck={true}
                    lang="en"
                />

                <div className="mt-6">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-1">
                        <Sparkles size={12}/> Try an example
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {exampleDecisions.map((ex, i) => (
                            <button
                                key={i}
                                onClick={() => setQuestion(ex)}
                                className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:border-pink-300 hover:text-pink-600 transition-colors shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                            >
                                {ex}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* Step 2: Options */}
        {step === 2 && (
            <div className="flex-1 flex flex-col animate-fade-in">
                 <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Options</h2>
                     <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        {(['text', 'image', 'file', 'audio'] as ComparisonMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => handleModeChange(mode)}
                                className={`p-2 rounded-lg transition-all ${comparisonMode === mode ? 'bg-white dark:bg-slate-600 shadow-sm text-pink-500 dark:text-white' : 'text-slate-400 hover:text-pink-400'}`}
                            >
                                {mode === 'text' && <Type size={18}/>}
                                {mode === 'image' && <ImageIcon size={18}/>}
                                {mode === 'file' && <FileText size={18}/>}
                                {mode === 'audio' && <Music size={18}/>}
                            </button>
                        ))}
                     </div>
                 </div>
                 
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept={comparisonMode === 'image' ? "image/*" : comparisonMode === 'audio' ? "audio/*" : ".pdf,.txt,.doc,.docx"}
                    onChange={handleFileSelect}
                />

                 <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {options.map((option, index) => (
                        <div key={option.id} className="flex gap-2 items-center group animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>
                             <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 flex items-center justify-center font-bold text-sm">
                                 {index + 1}
                             </div>
                            <div className="flex-1">
                                {comparisonMode === 'text' ? (
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                                        placeholder={`Option ${index + 1}`}
                                        className="w-full px-4 py-3 rounded-xl input-soft text-base font-medium"
                                        autoFocus={index === options.length - 1 && options.length > 2}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-2 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center text-pink-500 shadow-sm overflow-hidden flex-shrink-0">
                                            {option.type === 'image' && option.fileData ? (
                                                <img src={`data:${option.mimeType};base64,${option.fileData}`} alt="Preview" className="w-full h-full object-cover" />
                                            ) : <FileText size={20} />}
                                        </div>
                                        <span className="text-sm font-medium">{option.text}</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => handleRemoveOption(option.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                 </div>
                 
                 <div className="mt-4 flex gap-2">
                    <button
                        onClick={comparisonMode === 'text' ? handleAddTextOption : triggerFileUpload}
                        className="flex-1 py-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 font-bold hover:border-pink-300 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-all flex justify-center items-center gap-2"
                    >
                        <Plus size={18} /> Add Option
                    </button>
                    {comparisonMode === 'text' && (
                        <button
                            onClick={suggestOptions}
                            disabled={isSuggestingOptions}
                            className="px-4 py-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 font-bold hover:bg-purple-100 transition-colors"
                        >
                            {isSuggestingOptions ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                        </button>
                    )}
                 </div>
            </div>
        )}

        {/* Step 3: Criteria */}
        {step === 3 && (
            <div className="flex-1 flex flex-col animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What Matters?</h2>
                     <button
                        onClick={suggestCriteria}
                        disabled={isSuggestingCriteria}
                        className="text-xs font-bold px-3 py-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 transition-colors flex items-center gap-1"
                    >
                        {isSuggestingCriteria ? <Loader2 size={12} className="animate-spin"/> : <Sparkles size={12}/>} Auto
                    </button>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                    {criteria.map((criterion, index) => (
                        <div key={criterion.id} className="flex gap-2 items-center group animate-fade-in-up" style={{animationDelay: `${index * 50}ms`}}>
                             <div className="flex-1 flex items-center input-soft rounded-xl p-2 pl-4">
                                 <input
                                    type="text"
                                    value={criterion.name}
                                    onChange={(e) => handleCriterionChange(criterion.id, 'name', e.target.value)}
                                    placeholder="e.g. Cost, Time"
                                    className="flex-1 bg-transparent outline-none font-bold text-base"
                                />
                                <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                                <select
                                    value={criterion.weight}
                                    onChange={(e) => handleCriterionChange(criterion.id, 'weight', parseInt(e.target.value))}
                                    className="bg-transparent text-sm font-bold text-pink-600 dark:text-pink-400 outline-none cursor-pointer pr-2"
                                >
                                    {[1, 2, 3, 4, 5].map(w => <option key={w} value={w}>Imp: {w}</option>)}
                                </select>
                             </div>
                             {criteria.length > 1 && (
                                <button onClick={() => handleRemoveCriterion(criterion.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={18} />
                                </button>
                             )}
                        </div>
                    ))}
                    
                    <button
                        onClick={handleAddCriterion}
                        className="w-full py-3 mt-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 hover:text-pink-600 hover:border-pink-300 hover:bg-pink-50 transition-all font-bold flex justify-center items-center gap-2"
                    >
                        <Plus size={18} /> Add Criterion
                    </button>
                </div>
            </div>
        )}

        {/* Navigation Footer */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
            {step > 1 ? (
                <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold px-4 py-2 transition-colors"
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
                    className="btn-vibe px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                    Continue <ArrowRight size={18} />
                </button>
            ) : (
                <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="btn-vibe px-10 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2"
                >
                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                    {isLoading ? "Thinking..." : "Analyze Options"}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default DecisionForm;
