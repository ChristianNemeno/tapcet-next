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
