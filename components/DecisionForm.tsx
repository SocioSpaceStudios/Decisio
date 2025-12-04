import React, { useState } from 'react';
import { DecisionInput, Criterion } from '../types';
import { Plus, Trash2, Loader2, Sparkles } from 'lucide-react';
import { getDecisionSuggestion, getOptionsSuggestion, getCriteriaSuggestion } from '../services/geminiService';

interface DecisionFormProps {
  onSubmit: (data: DecisionInput) => void;
  isLoading: boolean;
  displayName?: string;
}

const DecisionForm: React.FC<DecisionFormProps> = ({ onSubmit, isLoading, displayName }) => {
  const [question, setQuestion] = useState('');
  const [optionsText, setOptionsText] = useState('');
  
  // Loading states for individual AI assists
  const [isSuggestingDecision, setIsSuggestingDecision] = useState(false);
  const [isSuggestingOptions, setIsSuggestingOptions] = useState(false);
  const [isSuggestingCriteria, setIsSuggestingCriteria] = useState(false);

  // Criteria state management
  const [criteria, setCriteria] = useState<Criterion[]>([
    { id: '1', name: '', weight: 3 }
  ]);

  const handleAddCriterion = () => {
    setCriteria([...criteria, { id: Date.now().toString(), name: '', weight: 3 }]);
  };

  const handleRemoveCriterion = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const handleCriterionChange = (id: string, field: keyof Criterion, value: string | number) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // AI Suggestion Handlers
  const suggestDecision = async () => {
    setIsSuggestingDecision(true);
    try {
      const suggestion = await getDecisionSuggestion(question);
      if (suggestion) setQuestion(suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggestingDecision(false);
    }
  };

  const suggestOptions = async () => {
    if (!question.trim()) return;
    setIsSuggestingOptions(true);
    try {
      const suggestions = await getOptionsSuggestion(question);
      if (suggestions && suggestions.length > 0) {
        setOptionsText(suggestions.join('\n'));
      }
    } catch (e) {
      console.error(e);
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
        const newCriteria = suggestions.map((s, idx) => ({
          id: Date.now().toString() + idx,
          name: s.name,
          weight: s.weight
        }));
        setCriteria(newCriteria);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggestingCriteria(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const options = optionsText.split('\n').map(o => o.trim()).filter(o => o.length > 0);
    const validCriteria = criteria.filter(c => c.name.trim().length > 0);

    if (!question.trim()) return alert("Please enter a decision question.");
    if (options.length < 2) return alert("Please enter at least two options to compare.");
    
    onSubmit({
      question,
      options,
      criteria: validCriteria.length > 0 ? validCriteria : [{ id: 'default', name: 'General Benefit', weight: 3 }]
    });
  };

  // Shared style for active AI buttons to give them a glow
  const activeAiBtnStyle = "text-purple-700 dark:text-purple-300 hover:text-purple-900 dark:hover:text-purple-100 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-purple-200 dark:border-purple-700 shadow-[0_0_10px_rgba(168,85,247,0.25)] hover:shadow-[0_0_15px_rgba(168,85,247,0.4)]";
  const disabledAiBtnStyle = "text-slate-400 dark:text-slate-600 bg-slate-100 dark:bg-slate-800 border-transparent cursor-not-allowed";

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100 dark:border-slate-700 transition-colors">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
          {displayName ? `Welcome, ${displayName}` : 'New Decision'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                What decision are you trying to make?
              </label>
              <button
                type="button"
                onClick={suggestDecision}
                disabled={isSuggestingDecision}
                className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center self-start sm:self-auto transition-all border ${activeAiBtnStyle}`}
              >
                {isSuggestingDecision ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-1"/>
                    {question.trim() ? "Refining..." : "Thinking..."}
                  </>
                ) : (
                  <>
                    <Sparkles size={12} className="mr-1 text-purple-600 dark:text-purple-400"/>
                    {question.trim() ? "Enhance" : "Decide for me"}
                  </>
                )}
              </button>
            </div>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Should I accept the job offer in New York?"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none placeholder-slate-400 dark:placeholder-slate-500"
              required
            />
          </div>

          {/* Options */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                 List the options (one per line)
               </label>
               <button
                  type="button"
                  onClick={suggestOptions}
                  disabled={!question.trim() || isSuggestingOptions}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center self-start sm:self-auto transition-all border ${!question.trim() ? disabledAiBtnStyle : activeAiBtnStyle}`}
                  title={!question.trim() ? "Fill in the decision first" : "Generate options"}
                >
                  {isSuggestingOptions ? (
                    <>
                      <Loader2 size={12} className="animate-spin mr-1"/>
                      Brainstorming...
                    </>
                  ) : (
                    <>
                      <Sparkles size={12} className="mr-1 text-purple-600 dark:text-purple-400"/>
                      Suggest Options
                    </>
                  )}
                </button>
            </div>
            <textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              placeholder={"Stay at current job\nAccept New York offer\nNegotiate for remote work"}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none min-h-[120px] placeholder-slate-400 dark:placeholder-slate-500"
              required
            />
          </div>

          {/* Criteria */}
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                What matters most? (Criteria)
              </label>
              <div className="flex gap-2 self-start sm:self-auto">
                <button
                    type="button"
                    onClick={suggestCriteria}
                    disabled={!question.trim() || isSuggestingCriteria}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full flex items-center transition-all border ${!question.trim() ? disabledAiBtnStyle : activeAiBtnStyle}`}
                    title={!question.trim() ? "Fill in the decision first" : "Generate criteria"}
                  >
                    {isSuggestingCriteria ? (
                      <>
                        <Loader2 size={12} className="animate-spin mr-1"/>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} className="mr-1 text-purple-600 dark:text-purple-400"/>
                        Suggest Criteria
                      </>
                    )}
                  </button>
              </div>
            </div>
            
            <div className="space-y-3">
              {criteria.map((criterion) => (
                <div key={criterion.id} className="flex gap-2 sm:gap-3 items-center">
                  <input
                    type="text"
                    value={criterion.name}
                    onChange={(e) => handleCriterionChange(criterion.id, 'name', e.target.value)}
                    placeholder="e.g., Salary, Work-life balance"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder-slate-400 dark:placeholder-slate-500"
                  />
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0">
                    <span className="hidden sm:inline text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Importance</span>
                    <select
                      value={criterion.weight}
                      onChange={(e) => handleCriterionChange(criterion.id, 'weight', parseInt(e.target.value))}
                      className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5].map(w => (
                        <option key={w} value={w} className="text-slate-900">{w}</option>
                      ))}
                    </select>
                  </div>
                  {criteria.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(criterion.id)}
                      className="p-1 sm:p-0 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={handleAddCriterion}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center mt-2"
              >
                <Plus size={16} className="mr-1" /> Add Manually
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2 mt-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> Analyzing...
              </>
            ) : (
              <span className="text-xl">Analyze</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DecisionForm;