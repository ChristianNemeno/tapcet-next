import type {
  QuizSummary,
  QuizDetail,
  AnswersMap,
  SubmitQuizResponse,
  LeaderboardEntry,
  DashboardEntry,
  AuthResponse,
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

export async function fetchQuizzes(): Promise<QuizSummary[]> {
  return parseResponse(await fetch(`${BASE}/quizzes`));
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
