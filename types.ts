export interface Criterion {
  id: string;
  name: string;
  weight: number; // 1-5
}

export interface OptionItem {
  id: string;
  type: 'text' | 'image' | 'file' | 'audio';
  text: string; // The name or label of the option
  fileData?: string; // Base64 string
  mimeType?: string;
  fileName?: string;
}

export interface DecisionInput {
  question: string;
  options: OptionItem[]; 
  criteria: Criterion[];
}

export interface AnalysisOption {
  name: string;
  pros: string[];
  cons: string[];
  scores: { criterionName: string; score: number }[]; // Score 1-10
  totalScore: number;
}

export interface AnalysisResult {
  safetyWarning?: string | null;
  summary: string;
  changesFromPrevious?: string[]; // New field for highlighting changes
  criteriaAnalysis: { name: string; explanation: string; weight: number }[];
  optionsAnalysis: AnalysisOption[];
  recommendation: {
    suggestedOption: string;
    reasoning: string[];
  };
  reflectionQuestions: string[];
}

export interface HistoryItem {
    analysis: AnalysisResult;
    instruction?: string;
    timestamp: number;
}

export interface DecisionRecord {
  id: string;
  title: string;
  input: DecisionInput;
  analysis: AnalysisResult; // The *latest* analysis
  createdAt: number;
  refinementHistory?: HistoryItem[]; // Past versions
}

export interface UserSettings {
  displayName: string;
  theme: 'light' | 'dark' | 'system';
}

export type ViewState = 'HOME' | 'ANALYSIS' | 'HISTORY' | 'SETTINGS' | 'ONBOARDING';