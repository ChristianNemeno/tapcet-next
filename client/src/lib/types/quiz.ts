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
  createdBy: string | null;
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

export interface EditableQuizQuestion extends QuizQuestion {
  answer: number;
}

export interface EditableQuizSection extends Omit<QuizSection, "questions"> {
  questions: EditableQuizQuestion[];
}

export interface EditableQuizDetail extends Omit<QuizDetail, "questions" | "sections"> {
  questions: EditableQuizQuestion[];
  sections: EditableQuizSection[];
}

export interface QuizRating {
  averageRating: number | null;
  totalRatings: number;
  userRating: number | null;
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
  questions?: Array<{ text: string; options: string[]; answer: number }>;
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
