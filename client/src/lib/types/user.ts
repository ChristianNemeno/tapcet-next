import type { QuizSummary } from "./quiz";

export interface DashboardEntry {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface WeaknessEntry {
  subject: string;
  totalCorrect: number;
  totalQuestions: number;
  attempts: number;
  percentage: number;
}

export interface CreatorProfileCollection {
  id: string;
  title: string;
  description: string;
  examTag: string | null;
  isOfficial: boolean;
  quizCount: number;
}

export interface CreatorProfile {
  id: string;
  name: string;
  joinedAt: string;
  quizCount: number;
  collectionCount: number;
  totalAttempts: number;
  averageRating: number | null;
  quizzes: QuizSummary[];
  collections: CreatorProfileCollection[];
}
