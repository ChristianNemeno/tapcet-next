export interface QuizSummary {
  id: string;
  title: string;
  description: string;
  timeLimitSeconds: number | null;
  examTags: string[];
  subject: string | null;
  topic: string | null;
  isOfficial: boolean;
  scoringMode: "standard" | "penalized";
  penaltyFraction: number;
  quizType: "standard" | "mock_exam";
  questionCount: number;
  creatorName: string | null;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  orderIndex: number;
  sectionId: string | null;
}

export interface QuizSection {
  id: string;
  title: string;
  timeLimitSeconds: number | null;
  orderIndex: number;
  questions: QuizQuestion[];
}

export interface QuizDetail extends Omit<QuizSummary, "questionCount"> {
  questions: QuizQuestion[];
  sections: QuizSection[];
  visibility: "public" | "draft";
  createdBy: string | null;
}

export interface QuizRating {
  averageRating: number | null;
  totalRatings: number;
  userRating: number | null;
}

export interface AdminReport {
  id: string;
  reportType: "incorrect" | "ambiguous" | "duplicate";
  status: "open" | "reviewing" | "resolved";
  comment: string;
  createdAt: string;
  resolvedAt: string | null;
  questionId: string;
  questionText: string;
  quizId: string;
  quizTitle: string;
  reporterName: string;
  resolvedBy: string | null;
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
  quizType?: "standard" | "mock_exam";
  scoringMode?: "standard" | "penalized";
  penaltyFraction?: number;
  questions: Array<{ text: string; options: string[]; answer: number }>;
  sections?: Array<{
    title: string;
    timeLimitSeconds?: number | null;
    questions: Array<{ text: string; options: string[]; answer: number }>;
  }>;
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
  scoringMode: "standard" | "penalized";
  penaltyPoints: number;
  penaltyFraction: number;
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

export interface WeaknessEntry {
  subject: string;
  totalCorrect: number;
  totalQuestions: number;
  attempts: number;
  percentage: number;
}

export interface CollectionSummary {
  id: string;
  title: string;
  description: string;
  examTag: string | null;
  isOfficial: boolean;
  visibility: "public" | "draft";
  quizCount: number;
  followerCount: number;
  creatorName: string | null;
  createdAt: string;
}

export interface CollectionDetail extends CollectionSummary {
  createdBy: string;
  isFollowing: boolean;
  quizzes: Array<QuizSummary & { orderIndex: number }>;
}

export interface MyCollectionSummary {
  id: string;
  title: string;
  description: string;
  examTag: string | null;
  isOfficial: boolean;
  visibility: "public" | "draft";
  quizCount: number;
  createdAt: string;
}

export interface CollectionFormPayload {
  title: string;
  description: string;
  examTag?: string | null;
  visibility: "public" | "draft";
  isOfficial?: boolean;
}

export interface ReviewQueueItem {
  queueId: string;
  questionId: string;
  intervalDays: number;
  missCount: number;
  nextReviewAt: string;
  questionText: string;
  questionOptions: string[];
  quizId: string;
  quizTitle: string;
  subject: string | null;
}

export interface ReviewAnswerResponse {
  correct: boolean;
  correctAnswer: number;
  newIntervalDays: number;
  nextReviewAt: string;
}

export interface ReviewStats {
  dueToday: number;
  total: number;
}

export interface AuthResponse {
  token: string;
  name: string;
  role: "user" | "admin";
}
