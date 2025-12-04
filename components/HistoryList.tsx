import React from 'react';
import { DecisionRecord } from '../types';
import { Calendar, ChevronRight, Trash2 } from 'lucide-react';

interface HistoryListProps {
  history: DecisionRecord[];
  onSelect: (record: DecisionRecord) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ history, onSelect, onDelete, onNew }) => {
  if (history.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No History Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">You haven't saved any decision analyses yet.</p>
        <button 
          onClick={onNew}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition-colors"
        >
          Start Your First Decision
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Decision History</h2>
        <button 
           onClick={onNew}
           className="text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          + New Decision
        </button>
      </div>

      <div className="space-y-4">
        {history.map((record) => (
          <div 
            key={record.id} 
            onClick={() => onSelect(record)}
            className="group bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer flex justify-between items-center p-5"
          >
             <div className="flex-1">
                <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 mb-1">{record.title}</h3>
                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                   <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(record.createdAt).toLocaleDateString()}
                   </span>
                   <span>{record.input.options.length} Options</span>
                </div>
             </div>
             
             <div className="flex items-center gap-3">
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                 className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors z-10"
                 title="Delete"
               >
                 <Trash2 size={18} />
               </button>
               <div className="text-slate-300 group-hover:text-indigo-400 dark:group-hover:text-indigo-500">
                  <ChevronRight />
               </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;