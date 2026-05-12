import type { ReviewQueueItem, ReviewAnswerResponse, ReviewStats } from "../types/review";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function fetchReviewQueue(token: string): Promise<ReviewQueueItem[]> {
  return parseResponse(
    await fetch(`${BASE}/review-queue`, { headers: authHeader(token) })
  );
}

export async function fetchReviewStats(token: string): Promise<ReviewStats> {
  return parseResponse(
    await fetch(`${BASE}/review-queue/stats`, { headers: authHeader(token) })
  );
}

export async function answerReviewItem(
  questionId: string,
  selectedAnswer: number,
  token: string
): Promise<ReviewAnswerResponse> {
  return parseResponse(
    await fetch(`${BASE}/review-queue/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ questionId, selectedAnswer }),
    })
  );
}
