export type LearningStageId = 'vidya' | 'shravan' | 'manan' | 'pariksha';

export interface LearningStage {
  id: LearningStageId;
  name: string;
  sanskrit: string;
  transliteration: string;
  tagline: string;
  description: string;
  iconName: 'BookOpen' | 'Headphones' | 'Brain' | 'ClipboardCheck';
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
  chronologicalStep?: number;
  eraOrPhase?: string;
  eventDescription?: string;
}

export interface CrosswordGlossaryItem {
  term: string;
  definition: string;
}

export interface ChronologicalCrosswordEvent {
  stepOrder: number;
  eraOrPhase: string;
  eventDescription: string;
  answer: string;
  wordId?: string;
}

export interface CrosswordData {
  id: string;
  title: string;
  theme: string;
  summary: string;
  gridSize: number;
  words: CrosswordWord[];
  glossary: CrosswordGlossaryItem[];
  mode?: 'standard' | 'chronological';
  chronologicalEvents?: ChronologicalCrosswordEvent[];
}

export interface ParikshaQuestion {
  id: string;
  stage: number; // 1 to 5
  stageName: string; // 'Foundation' | 'Concepts' | 'Analytics' | 'Crucible' | 'Boss Stage'
  question: string;
  options: string[]; // 4 options
  correctIndex: number; // 0 to 3
  points: number; // 100, 150, 200, 250, 350
  topic: string;
  hint: string;
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert' | 'boss';
}

export interface ParikshaFlashcard {
  concept: string;
  takeaway: string;
}

export interface ParikshaData {
  id?: string;
  testTitle: string;
  sourceFileName: string;
  createdAt: string;
  topicsCovered: string[];
  questions: ParikshaQuestion[];
  summaryFlashcards: ParikshaFlashcard[];
}


