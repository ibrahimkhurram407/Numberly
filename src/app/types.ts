export interface LevelProgress {
  levelId: string;
  bestScore: number;
  starsEarned: number;
  timesCompleted: number;
  lastAccuracy: number;
}

export interface UserSettings {
  soundEnabled: boolean;
  highContrast: boolean;
  routineMode: boolean;
  preferredVoice: string;
}

export interface UserProfile {
  id: number;
  displayName: string;
  email: string;
  avatarColor: string;
  ageGroup: string;
  totalXp: number;
  streakDays: number;
  hearts: number;
  dailyGoal: number;
  progress: LevelProgress[];
  settings: UserSettings;
}

export interface Level {
  id: string;
  unit: string;
  title: string;
  description: string;
  lessonType: string;
  maxNumber: number;
  accent: string;
  difficultyBand?: 'easy' | 'medium' | 'hard';
  skills?: string[];
}

export interface Question {
  id: string;
  prompt: string;
  narration: string;
  choices: Array<number | string>;
  answer: number | string;
  visualType: string;
  visualItems?: string[];
  visualGroups?: string[][];
  sequence?: number[];
  removedCount?: number;
  assetTitle?: string;
  assetObjectName?: string;
  assetKind?: 'image';
}

export interface MediaAsset {
  id: number;
  title: string;
  objectName: string;
  imagePath: string;
  sourceType: string;
  manualTags: string[];
  visionLabels: string[];
}

export interface QuestionTemplate {
  id: number;
  assetId?: number | null;
  levelId: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sourceType: 'manual' | 'ai';
  reviewStatus: 'approved' | 'pending' | 'rejected';
  prompt: string;
  narration: string;
  choices: Array<string | number>;
  answer: string | number;
  visualType: string;
  templatePayload: Record<string, unknown>;
  tags: string[];
  assetTitle?: string;
  assetObjectName?: string;
}

export interface LeaderboardEntry {
  id: number;
  displayName: string;
  totalXp: number;
  streakDays: number;
  avatarColor: string;
  rank: number;
}
