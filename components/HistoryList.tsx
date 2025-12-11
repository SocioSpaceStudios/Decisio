
import React from 'react';
import { DecisionRecord } from '../types';
import { Calendar, ChevronRight, Trash2, Clock, GitBranch } from 'lucide-react';

interface HistoryListProps {
  history: DecisionRecord[];
  onSelect: (record: DecisionRecord) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, onNew }) => {
  if (history.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center animate-fade-in-up">
        <div className="inline-flex p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-6 text-slate-400">
            <Clock size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">No History Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">
            Your past decisions will appear here once you've completed an analysis.
        </p>
        <button 
          onClick={onNew}
          className="btn-glow px-8 py-3 rounded-xl font-bold shadow-lg"
        >
          Start First Decision
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-20">
      <div className="flex justify-between items-center mb-8 px-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">History</h2>
        <span className="text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {history.length} Records
        </span>
      </div>

      <div className="grid gap-4">
        {history.map((record) => {
            const refinementCount = record.refinementHistory ? record.refinementHistory.length : 0;
            const optionsCount = Array.isArray(record.input.options) ? record.input.options.length : 0;

            return (
                <div 
                    key={record.id} 
                    onClick={() => onSelect(record)}
                    className="group glass-card glass-card-hover rounded-2xl p-6 cursor-pointer relative overflow-hidden transition-all"
                >
                    {/* Hover Accent */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                    <div className="flex justify-between items-center gap-4">
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {record.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                    <Calendar size={12} />
                                    {new Date(record.createdAt).toLocaleDateString()}
                                </span>
                                <span>
                                    {optionsCount} Options
                                </span>
                                {refinementCount > 0 && (
                                    <span className="flex items-center gap-1 text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md">
                                        <GitBranch size={12} />
                                        {refinementCount} Refinement{refinementCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                            <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-slate-800 border-2 border-transparent group-hover:border-purple-200 dark:group-hover:border-purple-900/50 flex items-center justify-center text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-sm group-hover:shadow-md">
                                <ChevronRight size={24} strokeWidth={3} />
                            </div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default HistoryList;
