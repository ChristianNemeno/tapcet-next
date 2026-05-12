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
