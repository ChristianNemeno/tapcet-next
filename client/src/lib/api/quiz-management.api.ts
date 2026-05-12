import type { MyQuizSummary, QuizFormPayload } from "../types/quiz";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function fetchQuizForEdit(id: string, token: string): Promise<import("../types/quiz").EditableQuizDetail> {
  return parseResponse(
    await fetch(`${BASE}/quiz/${id}/edit`, { headers: authHeader(token) })
  );
}

export async function createQuiz(
  payload: QuizFormPayload,
  token: string
): Promise<MyQuizSummary> {
  return parseResponse(
    await fetch(`${BASE}/quiz`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateQuiz(
  id: string,
  payload: Partial<QuizFormPayload>,
  token: string
): Promise<MyQuizSummary> {
  return parseResponse(
    await fetch(`${BASE}/quiz/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteQuiz(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/quiz/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function createAdminQuiz(
  payload: Omit<QuizFormPayload, "visibility"> & { visibility?: "public" | "draft" },
  token: string
): Promise<MyQuizSummary> {
  return parseResponse(
    await fetch(`${BASE}/admin/quizzes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteAdminQuiz(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/quizzes/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function fetchMyQuizzes(token: string): Promise<MyQuizSummary[]> {
  return parseResponse(
    await fetch(`${BASE}/my-quizzes`, { headers: authHeader(token) })
  );
}
