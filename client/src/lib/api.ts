import type {
  QuizSummary,
  QuizDetail,
  AnswersMap,
  SubmitQuizResponse,
  LeaderboardEntry,
  DashboardEntry,
  AuthResponse,
  MyQuizSummary,
  QuizFormPayload,
} from "./types";

const BASE = "/api";

async function parseResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

function authHeader(token?: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchQuizzes(params?: { exam?: string; subject?: string; official?: boolean }): Promise<QuizSummary[]> {
  const url = new URL(`${BASE}/quizzes`, window.location.origin);
  if (params?.exam) url.searchParams.set("exam", params.exam);
  if (params?.subject) url.searchParams.set("subject", params.subject);
  if (params?.official) url.searchParams.set("official", "true");
  return parseResponse(await fetch(url.toString()));
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

export async function fetchDashboard(token: string): Promise<DashboardEntry[]> {
  return parseResponse(
    await fetch(`${BASE}/dashboard`, { headers: authHeader(token) })
  );
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return parseResponse(
    await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  return parseResponse(
    await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
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

export async function fetchMyQuizzes(token: string): Promise<MyQuizSummary[]> {
  return parseResponse(
    await fetch(`${BASE}/my-quizzes`, { headers: authHeader(token) })
  );
}
