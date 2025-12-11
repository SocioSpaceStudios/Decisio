
import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, DecisionRecord, AnalysisOption } from '../types';
import { AlertTriangle, Trash2, ArrowLeft, Sparkles, Send, Loader2, Lightbulb, CheckCircle2, Star, RefreshCw, ArrowDown, GitCommit, ArrowUp, ArrowDown as ArrowDownIcon, ListFilter } from 'lucide-react';

interface DecisionResultProps {
  record: DecisionRecord;
  onDelete: () => void;
  onNew: () => void;
  onRefine: (instruction: string) => Promise<void>;
}

const DecisionResult: React.FC<DecisionResultProps> = ({ record, onDelete, onNew, onRefine }) => {
  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const latestAnalysisRef = useRef<HTMLDivElement>(null);
  const history = record.refinementHistory || [];
  
  useEffect(() => {
    if (history.length > 0 && latestAnalysisRef.current) {
        latestAnalysisRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [record.analysis, history.length]);

  const handleRefineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinementText.trim()) return;
    setIsRefining(true);
    try {
      await onRefine(refinementText);
      setRefinementText('');
    } catch (error) {
      alert("Failed to refine. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  const latestPreviousAnalysis = history.length > 0 ? history[history.length - 1].analysis : undefined;

  return (
    <div className="space-y-12 pb-24">
      {/* Timeline Rendering */}
      {history.map((item, idx) => {
          const prevAnalysis = idx > 0 ? history[idx - 1].analysis : undefined;
          return (
            <div key={`history-${idx}`} className="opacity-80 hover:opacity-100 transition-opacity">
                <SingleAnalysisView 
                    analysis={item.analysis} 
                    previousAnalysis={prevAnalysis}
                    title={idx === 0 ? "Original Answer" : `Refined Version ${idx + 1}`} 
                    isLatest={false} 
                />
                <div className="flex flex-col items-center my-6">
                    <div className="h-8 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full text-sm font-bold text-slate-600 dark:text-slate-300 shadow-sm max-w-md text-center">
                        "{item.instruction || "Refined"}"
                    </div>
                    <div className="h-8 w-0.5 bg-slate-300 dark:bg-slate-700"></div>
                    <ArrowDown size={20} className="text-slate-300 dark:text-slate-700 -mt-2" />
                </div>
            </div>
          );
      })}

      {/* Latest Analysis */}
      <div ref={latestAnalysisRef} className="scroll-mt-32">
        <SingleAnalysisView 
            analysis={record.analysis} 
            previousAnalysis={latestPreviousAnalysis}
            title={history.length > 0 ? "Refined Analysis" : "Analysis"} 
            isLatest={true} 
        />
      </div>

      {/* Refinement Box */}
      <div className="card-modern rounded-3xl p-1 bg-gradient-to-br from-pink-500/5 to-violet-500/5 animate-fade-in-up">
        <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600 dark:text-pink-400">
                    <Sparkles size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Refine with AI</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Ask a follow-up...</p>
                </div>
            </div>
            
            <form onSubmit={handleRefineSubmit} className="relative group">
                <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    disabled={isRefining}
                    placeholder="e.g. 'What if I prioritize speed?'"
                    className="w-full p-4 pr-16 rounded-2xl input-soft min-h-[80px] resize-none text-base"
                />
                <button 
                    type="submit"
                    disabled={isRefining || !refinementText.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-xl shadow-lg hover:shadow-pink-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="hidden md:flex justify-center gap-3">
            <button 
              onClick={onNew}
              className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-white"
            >
              <ArrowLeft size={18} /> New Decision
            </button>
            
            <button 
                onClick={onDelete}
                className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
                <Trash2 size={18} /> Delete
            </button>
      </div>
    </div>
  );
};

const SingleAnalysisView: React.FC<{ analysis: AnalysisResult, previousAnalysis?: AnalysisResult, title: string, isLatest: boolean }> = ({ analysis, previousAnalysis, title, isLatest }) => {
    
    // Sort options by score descending
    const sortedOptions = [...analysis.optionsAnalysis].sort((a, b) => {
        const scoreA = a.totalScore === -1 ? -Infinity : a.totalScore;
        const scoreB = b.totalScore === -1 ? -Infinity : b.totalScore;
        return scoreB - scoreA;
    });

    if (analysis.safetyWarning) {
        return (
          <div className="card-modern rounded-2xl p-8 border-l-4 border-red-500 animate-fade-in">
             <div className="flex gap-4">
               <AlertTriangle className="text-red-500 w-8 h-8" />
               <p className="text-slate-700 font-bold">{analysis.safetyWarning}</p>
             </div>
          </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Top Recommendation Card - Matching the design vibe */}
            <div className="card-modern rounded-[2rem] p-8 bg-white dark:bg-slate-900 overflow-hidden relative border-t-4 border-t-green-400">
                <div className="flex items-center gap-2 mb-4">
                    <Lightbulb size={20} className="text-green-500 fill-current" />
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Top Recommendation</h2>
                </div>

                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
                    {analysis.recommendation.suggestedOption}
                </h1>

                <div className="flex items-baseline gap-2 mb-6">
                    <span className="text-4xl font-black text-green-500">
                        {sortedOptions[0]?.totalScore !== -1 ? (sortedOptions[0]?.totalScore * 10).toFixed(0) : '--'}
                    </span>
                    <span className="text-lg font-bold text-slate-300">/100</span>
                    <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
                        Excellent
                    </span>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg mb-6">
                    {analysis.summary}
                </p>

                <div className="space-y-2">
                    {analysis.recommendation.reasoning.map((r, i) => (
                        <div key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-400">
                             <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                             <p>{r}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Other Options List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">All Options</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                        <ListFilter size={12}/> Sorted by Score
                    </div>
                </div>
                
                {sortedOptions.map((option, idx) => {
                    if (idx === 0) return null; // Skip top option as it's already shown
                    const isUnrated = option.totalScore === -1;
                    return (
                        <div key={idx} className="card-modern rounded-3xl p-6 flex flex-col md:flex-row gap-6 items-start">
                            <div className="flex-1">
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{option.name}</h4>
                                <div className="space-y-1 mb-4">
                                    {option.pros.slice(0,2).map((p, i) => (
                                        <p key={i} className="text-sm text-slate-500 flex gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5"></span> {p}
                                        </p>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 self-start md:self-center">
                                <span className="text-2xl font-bold text-green-500">
                                    {isUnrated ? '--' : (option.totalScore * 10).toFixed(0)}
                                </span>
                                <span className="text-xs font-bold text-slate-300">/100</span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default DecisionResult;
