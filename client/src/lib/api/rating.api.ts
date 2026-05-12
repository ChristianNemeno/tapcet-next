import type { QuizRating } from "../types/quiz";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function fetchQuizRating(id: string, token?: string | null): Promise<QuizRating> {
  return parseResponse(
    await fetch(`${BASE}/quiz/${id}/rating`, { headers: authHeader(token) })
  );
}

export async function rateQuiz(id: string, rating: number, token: string): Promise<QuizRating> {
  return parseResponse(
    await fetch(`${BASE}/quiz/${id}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ rating }),
    })
  );
}
