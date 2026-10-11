export type LearningStageId = 'vidya' | 'shravan' | 'manan' | 'prashna' | 'pariksha';

export interface LearningStage {
  id: LearningStageId;
  name: string;
  sanskrit: string;
  transliteration: string;
  tagline: string;
  description: string;
  iconName: 'BookOpen' | 'Headphones' | 'Brain' | 'MessageCircleQuestion' | 'ClipboardCheck';
  xpReward: number;
  isOptional?: boolean;
  sampleContent: {
    title: string;
    details: string;
    actionLabel: string;
  };
}

export interface GamificationFeature {
  id: string;
  title: string;
  metric: string;
  description: string;
  iconName: 'Zap' | 'TrendingUp' | 'Map' | 'Trophy' | 'Flame';
  colorClass: string;
}

export interface CustomUploadedPdf {
  id: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  subject: string;
  targetClass: string;
  uploadedAt: string;
  status: 'ready' | 'processing';
}

export interface StudyMaterialOption {
  id: string;
  title: string;
  format: string;
  description: string;
  iconName: 'BookOpen' | 'FileText' | 'FileCheck' | 'PenTool';
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  isGuest: boolean;
  createdAt?: string;
}

export type CrosswordDifficulty = 'easy' | 'medium' | 'hard';

export interface CrosswordWord {
  id: string;
  number: number;
  direction: 'across' | 'down';
  answer: string;
  clue: string;
  row: number;
  col: number;
}

export interface CrosswordGlossaryItem {
  term: string;
  definition: string;
}

export interface CrosswordData {
  id: string;
  title: string;
  theme: string;
  summary: string;
  gridSize: number;
  words: CrosswordWord[];
  glossary: CrosswordGlossaryItem[];
}

