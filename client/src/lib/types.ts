export interface QuizSummary {
  id: string;
  title: string;
  description: string;
  timeLimitSeconds: number | null;
  examTags: string[];
  subject: string | null;
  topic: string | null;
  isOfficial: boolean;
  questionCount: number;
  creatorName: string | null;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  orderIndex: number;
}

export interface QuizDetail extends Omit<QuizSummary, "questionCount"> {
  questions: QuizQuestion[];
  visibility: "public" | "draft";
  createdBy: string | null;
}

export interface MyQuizSummary {
  id: string;
  title: string;
  description: string;
  timeLimitSeconds: number | null;
  examTags: string[];
  subject: string | null;
  topic: string | null;
  isOfficial: boolean;
  questionCount: number;
  visibility: "public" | "draft";
}

export interface QuizFormPayload {
  title: string;
  description: string;
  timeLimitSeconds?: number | null;
  visibility: "public" | "draft";
  examTags?: string[];
  subject?: string | null;
  topic?: string | null;
  isOfficial?: boolean;
  questions: Array<{ text: string; options: string[]; answer: number }>;
}

export type AnswersMap = Record<string, number>;

export interface QuizResultItem {
  questionId: string;
  correct: boolean;
  selectedAnswer: number;
  correctAnswer: number;
}

export interface SubmitQuizResponse {
  score: number;
  total: number;
  percentage: number;
  results: QuizResultItem[];
  quizId: string;
  nickname: string;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface DashboardEntry {
  id: string;
  quizId: string;
  quizTitle: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export interface AuthResponse {
  token: string;
  name: string;
  role: "user" | "admin";
}
