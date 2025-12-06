import React, { useState, useEffect, useRef } from 'react';
import { AnalysisResult, DecisionRecord, AnalysisOption } from '../types';
import { AlertTriangle, Trash2, ArrowLeft, BrainCircuit, Sparkles, Send, Loader2, Lightbulb, CheckCircle2, Star, RefreshCw, ArrowDown, GitCommit, ArrowUp, ArrowDown as ArrowDownIcon, MoveRight } from 'lucide-react';

interface DecisionResultProps {
  record: DecisionRecord;
  onDelete: () => void;
  onNew: () => void;
  onRefine: (instruction: string) => Promise<void>;
}

const DecisionResult: React.FC<DecisionResultProps> = ({ record, onDelete, onNew, onRefine }) => {
  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  
  // Ref for the latest analysis block to scroll to start of refined content
  const latestAnalysisRef = useRef<HTMLDivElement>(null);

  // Construct the timeline: [History Item 1, History Item 2, ..., Latest Analysis]
  const history = record.refinementHistory || [];
  
  // Auto-scroll to the latest analysis when refinement history changes
  useEffect(() => {
    if (history.length > 0 && latestAnalysisRef.current) {
        // scrollIntoView with block: 'start' aligns the top of the element with the viewport
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

  const suggestRefinement = () => {
    const suggestions = [
      "What if I ignore the cost?",
      "Re-evaluate assuming I have more time.",
      "What is the riskiest option?",
      "Add a criterion for 'Long-term happiness'.",
      "What if I prioritize speed above everything else?",
      "Explain the trade-offs more simply.",
    ];
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    setRefinementText(random);
  };

  // Determine previous analysis for the latest record
  const latestPreviousAnalysis = history.length > 0 ? history[history.length - 1].analysis : undefined;

  return (
    <div className="space-y-12 pb-24">
      
      {/* Timeline Rendering */}
      {history.map((item, idx) => {
          // For history items, the previous analysis is the one before it in the history array
          const prevAnalysis = idx > 0 ? history[idx - 1].analysis : undefined;
          
          return (
            <div key={`history-${idx}`} className="opacity-80 hover:opacity-100 transition-opacity">
                <SingleAnalysisView 
                    analysis={item.analysis} 
                    previousAnalysis={prevAnalysis}
                    title={idx === 0 ? "Original Answer" : `Refined Version ${idx + 1}`} 
                    isLatest={false} 
                />
                
                {/* Connector showing the instruction that led to the NEXT item (or the current one) */}
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
      {/* Scroll margin added to account for fixed header */}
      <div ref={latestAnalysisRef} className="scroll-mt-32">
        <SingleAnalysisView 
            analysis={record.analysis} 
            previousAnalysis={latestPreviousAnalysis}
            title={history.length > 0 ? "Refined Version" : record.title} 
            isLatest={true} 
        />
      </div>

      {/* Refinement Box - Always at the bottom */}
      <div className="glass-card rounded-3xl p-1 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-fade-in-up">
        <div className="p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Refine with AI</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                           Continue the conversation...
                        </p>
                    </div>
                </div>
                
                <button 
                  type="button"
                  onClick={suggestRefinement}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={12} /> Suggest Idea
                </button>
            </div>
            
            <form onSubmit={handleRefineSubmit} className="relative group">
                <textarea
                    value={refinementText}
                    onChange={(e) => setRefinementText(e.target.value)}
                    disabled={isRefining}
                    placeholder="e.g. 'Prioritize speed over cost' or 'What if I wait a month?'"
                    className="w-full p-4 pr-16 rounded-2xl input-sleek min-h-[80px] resize-none text-base"
                />
                <button 
                    type="submit"
                    disabled={isRefining || !refinementText.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                >
                    {isRefining ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
            </form>
        </div>
      </div>
      
      {/* Footer Actions */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-3 glass-card p-2 rounded-2xl shadow-2xl">
            <button 
              onClick={onNew}
              className="flex items-center gap-2 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-white"
            >
              <ArrowLeft size={18} /> New
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

// Sub-component for rendering a single analysis block
const SingleAnalysisView: React.FC<{ analysis: AnalysisResult, previousAnalysis?: AnalysisResult, title: string, isLatest: boolean }> = ({ analysis, previousAnalysis, title, isLatest }) => {
    
    const getScoreColor = (score: number) => {
        if (score === -1) return 'text-slate-400 bg-slate-100 dark:bg-slate-800';
        if (score >= 8) return 'text-green-600 bg-green-50 dark:text-green-300 dark:bg-green-900/30';
        if (score >= 6) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/30';
        return 'text-red-600 bg-red-50 dark:text-red-300 dark:bg-red-900/30';
    };

    const hasRecommendationChanged = previousAnalysis && previousAnalysis.recommendation.suggestedOption !== analysis.recommendation.suggestedOption;

    if (analysis.safetyWarning) {
        return (
          <div className="glass-card rounded-2xl p-8 border-l-4 border-red-500 animate-fade-in">
            <div className="flex gap-4">
              <AlertTriangle className="text-red-500 w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Safety Notice</h3>
                <p className="text-slate-700 dark:text-slate-300 mb-4">{analysis.safetyWarning}</p>
              </div>
            </div>
          </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
             {/* Header Card */}
            <div className={`glass-card rounded-[2rem] p-8 relative overflow-hidden ${isLatest ? 'ring-2 ring-purple-500/20' : 'grayscale-[0.5]'}`}>
                <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold uppercase text-xs tracking-widest">
                        <BrainCircuit size={16} /> {isLatest ? 'Analysis Complete' : 'Historical Version'}
                    </div>
                    {isLatest && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full flex items-center gap-1">
                            <CheckCircle2 size={12}/> Active
                        </span>
                    )}
                </div>
                
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 relative z-10">{title}</h1>
                <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl relative z-10">{analysis.summary}</p>
                
                {/* Refinement Changes Section */}
                {analysis.changesFromPrevious && analysis.changesFromPrevious.length > 0 && (
                  <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/50 rounded-xl relative z-10">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <GitCommit size={14} /> What's New
                    </h4>
                    <ul className="space-y-1">
                      {analysis.changesFromPrevious.map((change, idx) => (
                        <li key={idx} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                           <span className="block mt-1.5 w-1 h-1 rounded-full bg-purple-500"></span>
                           {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Decorative background blur */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            </div>

            {/* The Recommendation */}
            <div className={`relative rounded-[2.5rem] p-[3px] shadow-xl ${hasRecommendationChanged ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 shadow-orange-500/20' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-purple-500/10'}`}>
                {/* Change indicator badge */}
                {hasRecommendationChanged && (
                    <div className="absolute -top-3 left-8 z-20 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                        <RefreshCw size={12} /> New Recommendation
                    </div>
                )}
                
                <div className="bg-white dark:bg-slate-900 rounded-[2.3rem] p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 dark:opacity-10">
                    <Star size={120} />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2">
                             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top Recommendation</h2>
                             {hasRecommendationChanged && previousAnalysis && (
                                 <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                     was: <span className="line-through opacity-70">{previousAnalysis.recommendation.suggestedOption}</span>
                                 </div>
                             )}
                        </div>
                        
                        <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600 dark:from-blue-400 dark:to-pink-400 mb-6 leading-tight">
                            {analysis.recommendation.suggestedOption}
                        </div>
                        
                        <div className="grid gap-2">
                            {analysis.recommendation.reasoning.map((r, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl items-start">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{r}</p>
                            </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.optionsAnalysis.map((option, idx) => {
                const isUnrated = option.totalScore === -1;
                const displayName = option.name.replace(/^\[Suggestion\]\s*/i, '');
                const isSuggestion = option.name.toLowerCase().includes('[suggestion]');
                
                // Diff Logic
                const prevOption = previousAnalysis?.optionsAnalysis.find(o => o.name === option.name);
                const scoreDiff = prevOption && !isUnrated && prevOption.totalScore !== -1 
                    ? option.totalScore - prevOption.totalScore 
                    : 0;
                const isNewOption = previousAnalysis && !prevOption;

                return (
                    <div key={idx} className={`glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col ${isSuggestion ? 'border-purple-200 dark:border-purple-800 ring-4 ring-purple-500/5' : ''} ${isNewOption ? 'ring-2 ring-green-400/50' : ''}`}>
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 leading-tight">
                            {displayName}
                        </h3>
                        <div className="flex gap-1">
                            {isNewOption && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-[10px] uppercase font-bold px-2 py-1 rounded-lg">
                                    New
                                </span>
                            )}
                            {isSuggestion && (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] uppercase font-bold px-2 py-1 rounded-lg">
                                <Lightbulb size={12} /> AI Idea
                                </span>
                            )}
                        </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                        <div className={`text-base font-black px-2 py-0.5 rounded-md ${getScoreColor(option.totalScore)}`}>
                            {isUnrated ? 'N/A' : option.totalScore.toFixed(1)}
                        </div>
                        
                        {/* Score Diff Indicator */}
                        {Math.abs(scoreDiff) > 0.1 && (
                            <div className={`text-xs font-bold flex items-center ${scoreDiff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {scoreDiff > 0 ? <ArrowUp size={12} /> : <ArrowDownIcon size={12} />}
                                {Math.abs(scoreDiff).toFixed(1)}
                            </div>
                        )}

                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Score</span>
                        </div>
                    </div>
                    
                    <div className="p-5 flex-1 space-y-4">
                        <div>
                        <h4 className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <CheckCircle2 size={12}/> Pros
                        </h4>
                        <ul className="space-y-1.5">
                            {option.pros.map((pro, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-green-200 dark:border-green-900 leading-relaxed">
                                {pro}
                            </li>
                            ))}
                        </ul>
                        </div>
                        
                        <div>
                        <h4 className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <AlertTriangle size={12}/> Cons
                        </h4>
                        <ul className="space-y-1.5">
                            {option.cons.map((con, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-red-200 dark:border-red-900 leading-relaxed">
                                {con}
                            </li>
                            ))}
                        </ul>
                        </div>
                    </div>
                    
                    {!isUnrated && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {option.scores.map((s, i) => {
                                    // Diff Logic for individual criteria
                                    const prevScoreObj = prevOption?.scores.find(ps => ps.criterionName === s.criterionName);
                                    const diff = prevScoreObj && prevScoreObj.score !== -1 ? s.score - prevScoreObj.score : 0;
                                    
                                    return (
                                        <div key={i} className="flex justify-between items-center text-[10px]">
                                            <span className="text-slate-500 truncate mr-2">{s.criterionName}</span>
                                            <div className="flex items-center gap-1.5">
                                                {diff !== 0 && (
                                                    <span className={`text-[9px] font-bold ${diff > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                        {diff > 0 ? '+' : ''}{diff}
                                                    </span>
                                                )}
                                                <span className="font-bold text-slate-700 dark:text-slate-300">{s.score}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    </div>
                );
                })}
            </div>
        </div>
    );
};

export default DecisionResult;