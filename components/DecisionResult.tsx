import React, { useState } from 'react';
import { AnalysisResult, DecisionRecord } from '../types';
import { AlertTriangle, Save, CheckCircle2, ArrowLeft, BrainCircuit, Sparkles, Send, Loader2, Lightbulb } from 'lucide-react';

interface DecisionResultProps {
  record: DecisionRecord;
  onSave?: (record: DecisionRecord) => void;
  onNew: () => void;
  onRefine: (instruction: string) => Promise<void>;
  isSaved?: boolean;
}

const DecisionResult: React.FC<DecisionResultProps> = ({ record, onSave, onNew, onRefine, isSaved }) => {
  const { analysis } = record;
  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementText.trim()) return;

    setIsRefining(true);
    try {
      await onRefine(refinementText);
      setRefinementText('');
    } catch (error) {
      console.error(error);
      alert("Failed to refine. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score === -1) return 'text-slate-400';
    if (score >= 8) return 'text-green-600 dark:text-green-400';
    if (score >= 6) return 'text-yellow-600 dark:text-yellow-400';
    if (score > 4) return 'text-blue-600 dark:text-blue-400';
    return 'text-red-600 dark:text-red-400';
  };

  if (analysis.safetyWarning) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <div className="flex items-start gap-4">
          <AlertTriangle className="text-red-600 dark:text-red-400 w-8 h-8 flex-shrink-0" />
          <div>
            <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Safety Notice</h3>
            <p className="text-red-800 dark:text-red-300">{analysis.safetyWarning}</p>
            <div className="mt-4 text-sm text-red-700 dark:text-red-400">
              If you are in immediate danger, please contact emergency services or a crisis helpline immediately.
            </div>
            <button 
              onClick={onNew}
              className="mt-6 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-900/60 text-red-800 dark:text-red-200 rounded-lg font-medium transition-colors"
            >
              Start New Decision
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header / Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-colors">
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold uppercase text-xs tracking-wider mb-2">
          <BrainCircuit size={16} /> Clarified Decision
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">{record.title}</h1>
        <p className="text-slate-600 dark:text-slate-300 text-lg leading-relaxed">{analysis.summary}</p>
      </div>

      {/* Criteria Breakdown */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-colors">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Criteria Analysis</h2>
        <div className="space-y-4">
          {analysis.criteriaAnalysis.map((c, idx) => (
            <div key={idx} className="flex flex-col md:flex-row gap-3 md:items-start p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
               <div className="flex items-center gap-2 md:w-48 flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                    {c.weight}
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{c.name}</span>
               </div>
               <p className="text-slate-600 dark:text-slate-300 text-sm flex-1">{c.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Options Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.optionsAnalysis.map((option, idx) => {
          const isUnrated = option.totalScore === -1;
          const displayName = option.name.replace(/^\[Suggestion\]\s*/i, '');
          const isSuggestion = option.name.toLowerCase().includes('[suggestion]');

          return (
            <div key={idx} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-md border ${isSuggestion ? 'border-purple-200 dark:border-purple-900/50' : 'border-slate-200 dark:border-slate-700'} overflow-hidden flex flex-col transition-colors`}>
              <div className={`p-4 border-b ${isSuggestion ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-900/50' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                    {displayName}
                  </h3>
                  {isSuggestion && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 text-[10px] uppercase font-bold px-2 py-1 rounded-full">
                      <Lightbulb size={10} /> Suggestion
                    </span>
                  )}
                </div>
                
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {isUnrated ? 'Feedback:' : 'Overall Score:'}
                  </span>
                  {isUnrated ? (
                     <span className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/50 px-2 py-0.5 rounded">
                        Not Rated
                     </span>
                  ) : (
                    <span className={`text-lg font-bold ${getScoreColorClass(option.totalScore)}`}>
                      {option.totalScore.toFixed(1)}/10
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-1 space-y-4">
                {/* Pros */}
                <div>
                  <h4 className="text-xs font-bold text-green-700 dark:text-green-400 uppercase tracking-wide mb-2">Pros</h4>
                  <ul className="space-y-1">
                    {option.pros.map((pro, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={14} className="text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Cons */}
                <div>
                  <h4 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wide mb-2">Cons</h4>
                  <ul className="space-y-1">
                    {option.cons.map((con, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <span className="block w-1.5 h-1.5 rounded-full bg-red-400 dark:bg-red-500 mt-1.5 flex-shrink-0"></span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Scores Table */}
                {!isUnrated ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                    <table className="w-full text-sm">
                      <tbody>
                        {option.scores.map((s, i) => (
                          <tr key={i}>
                            <td className="py-1 text-slate-500 dark:text-slate-400">{s.criterionName}</td>
                            <td className="py-1 text-right font-medium text-slate-700 dark:text-slate-300">{s.score}/10</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-purple-100 dark:border-slate-700 mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                    This option was generated by AI for your consideration and does not have a calculated score.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 md:p-8 relative overflow-hidden transition-colors">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <BrainCircuit size={100} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4 relative z-10">Recommendation</h2>
        <div className="relative z-10">
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200 mb-4">
             Consider: {analysis.recommendation.suggestedOption}
          </p>
          <ul className="space-y-2">
            {analysis.recommendation.reasoning.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-indigo-900/80 dark:text-indigo-200/80">
                <span className="mt-1.5 w-1.5 h-1.5 bg-indigo-500 dark:bg-indigo-400 rounded-full flex-shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Reflection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8 transition-colors">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Questions for Reflection</h2>
        <ul className="space-y-3">
          {analysis.reflectionQuestions.map((q, i) => (
            <li key={i} className="text-slate-600 dark:text-slate-300 italic border-l-4 border-indigo-200 dark:border-indigo-700 pl-4 py-1">
              "{q}"
            </li>
          ))}
        </ul>
      </div>

      {/* Refinement Section */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-6 transition-colors">
        <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold mb-3">
           <Sparkles size={20} />
           <span>Refine this Analysis</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
          Want to change something? Ask the AI to adjust criteria, add an option you missed, or re-evaluate with a different priority.
        </p>
        <form onSubmit={handleRefineSubmit} className="relative">
          <textarea
            value={refinementText}
            onChange={(e) => setRefinementText(e.target.value)}
            disabled={isRefining}
            placeholder="e.g. 'What if I prioritized work-life balance more?' or 'Add an option to work freelance'"
            className="w-full p-4 pr-12 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none resize-none h-24 text-slate-700 dark:text-slate-200 disabled:opacity-50 placeholder-slate-400 dark:placeholder-slate-500"
          />
          <button 
            type="submit"
            disabled={isRefining || !refinementText.trim()}
            className="absolute bottom-3 right-3 p-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors"
          >
            {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-600 max-w-lg mx-auto">
        This tool provides guidance only and is not professional, medical, legal, or financial advice. 
        You are responsible for your own decisions.
      </div>

      {/* Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-none z-50 transition-colors">
        <div className="max-w-4xl mx-auto flex gap-4 justify-between items-center">
            <button 
              onClick={onNew}
              className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft size={18} /> New Decision
            </button>
            
            {onSave && !isSaved && (
              <button 
                onClick={() => onSave(record)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold px-6 py-2.5 rounded-lg shadow-md transition-colors"
              >
                <Save size={18} /> Save Analysis
              </button>
            )}
            
            {isSaved && (
              <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle2 size={18} /> Saved
              </span>
            )}
        </div>
      </div>
    </div>
  );
};

export default DecisionResult;