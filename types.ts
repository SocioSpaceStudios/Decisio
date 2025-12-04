export interface Criterion {
  id: string;
  name: string;
  weight: number; // 1-5
}

export interface DecisionInput {
  question: string;
  options: string[];
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
  criteriaAnalysis: { name: string; explanation: string; weight: number }[];
  optionsAnalysis: AnalysisOption[];
  recommendation: {
    suggestedOption: string;
    reasoning: string[];
  };
  reflectionQuestions: string[];
}

export interface DecisionRecord {
  id: string;
  title: string;
  input: DecisionInput;
  analysis: AnalysisResult;
  createdAt: number;
}

export interface UserSettings {
  displayName: string;
  theme: 'light' | 'dark' | 'system';
}

export type ViewState = 'HOME' | 'ANALYSIS' | 'HISTORY' | 'SETTINGS' | 'ONBOARDING';