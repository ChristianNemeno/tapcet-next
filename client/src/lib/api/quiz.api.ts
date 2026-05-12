import type { QuizSummary, QuizDetail, AnswersMap, SubmitQuizResponse, LeaderboardEntry } from "../types/quiz";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function fetchQuizzes(params?: { exam?: string; subject?: string; official?: boolean; quizType?: string }): Promise<QuizSummary[]> {
  const url = new URL(`${BASE}/quizzes`, window.location.origin);
  if (params?.exam) url.searchParams.set("exam", params.exam);
  if (params?.subject) url.searchParams.set("subject", params.subject);
  if (params?.official) url.searchParams.set("official", "true");
  if (params?.quizType) url.searchParams.set("quizType", params.quizType);
  return parseResponse(await fetch(url.toString()));
}

export async function fetchMockExams(exam?: string): Promise<QuizSummary[]> {
  return fetchQuizzes({ quizType: "mock_exam", official: true, ...(exam ? { exam } : {}) });
}

export async function fetchQuiz(id: string): Promise<QuizDetail> {
  return parseResponse(await fetch(`${BASE}/quiz/${id}`));
}

export async function submitQuiz(
  id: string,
  answers: AnswersMap,
  nickname?: string,
  token?: string | null
): Promise<SubmitQuizResponse> {
  return parseResponse(
    await fetch(`${BASE}/quiz/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ answers, nickname }),
    })
  );
}

export async function fetchLeaderboard(id: string): Promise<LeaderboardEntry[]> {
  return parseResponse(await fetch(`${BASE}/quiz/${id}/leaderboard`));
}

export interface CsvRow {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  answer: string;
}

export interface CsvImportResult {
  parsed: { text: string; options: [string, string, string, string]; answer: number }[];
  errors: { row: number; message: string }[];
}

export async function validateCsvImport(rows: CsvRow[], token: string): Promise<CsvImportResult> {
  return parseResponse(
    await fetch(`${BASE}/quiz/import/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ rows }),
    })
  );
}
