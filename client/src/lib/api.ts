import type {
  QuizSummary,
  QuizDetail,
  AnswersMap,
  SubmitQuizResponse,
  LeaderboardEntry,
  DashboardEntry,
  WeaknessEntry,
  ReviewQueueItem,
  ReviewAnswerResponse,
  ReviewStats,
  CollectionSummary,
  CollectionDetail,
  MyCollectionSummary,
  CollectionFormPayload,
  AuthResponse,
  MyQuizSummary,
  QuizFormPayload,
  QuizRating,
  AdminReport,
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

export async function fetchDashboard(token: string): Promise<DashboardEntry[]> {
  return parseResponse(
    await fetch(`${BASE}/dashboard`, { headers: authHeader(token) })
  );
}

export async function fetchWeakness(token: string): Promise<WeaknessEntry[]> {
  return parseResponse(
    await fetch(`${BASE}/dashboard/weakness`, { headers: authHeader(token) })
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

export async function fetchCollections(params?: { exam?: string; official?: boolean }): Promise<CollectionSummary[]> {
  const url = new URL(`${BASE}/collections`, window.location.origin);
  if (params?.exam) url.searchParams.set("exam", params.exam);
  if (params?.official) url.searchParams.set("official", "true");
  return parseResponse(await fetch(url.toString()));
}

export async function fetchCollection(id: string, token?: string | null): Promise<CollectionDetail> {
  return parseResponse(
    await fetch(`${BASE}/collection/${id}`, { headers: authHeader(token) })
  );
}

export async function createCollection(payload: CollectionFormPayload, token: string): Promise<MyCollectionSummary> {
  return parseResponse(
    await fetch(`${BASE}/collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateCollection(id: string, payload: Partial<CollectionFormPayload>, token: string): Promise<MyCollectionSummary> {
  return parseResponse(
    await fetch(`${BASE}/collection/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteCollection(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/collection/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function fetchMyCollections(token: string): Promise<MyCollectionSummary[]> {
  return parseResponse(
    await fetch(`${BASE}/my-collections`, { headers: authHeader(token) })
  );
}

export async function toggleFollowCollection(id: string, token: string): Promise<{ following: boolean; followerCount: number }> {
  return parseResponse(
    await fetch(`${BASE}/collection/${id}/follow`, {
      method: "POST",
      headers: authHeader(token),
    })
  );
}

export async function addQuizToCollection(collectionId: string, quizId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/collection/${collectionId}/quizzes/${quizId}`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function removeQuizFromCollection(collectionId: string, quizId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/collection/${collectionId}/quizzes/${quizId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

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

export async function reportQuestion(
  questionId: string,
  payload: { quizId: string; reportType: "incorrect" | "ambiguous" | "duplicate"; comment?: string },
  token: string
): Promise<void> {
  const res = await fetch(`${BASE}/question/${questionId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function fetchAdminReports(
  params: { status?: string; reportType?: string; page?: number },
  token: string
): Promise<AdminReport[]> {
  const url = new URL(`${BASE}/admin/reports`, window.location.origin);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.reportType) url.searchParams.set("reportType", params.reportType);
  if (params.page) url.searchParams.set("page", String(params.page));
  return parseResponse(await fetch(url.toString(), { headers: authHeader(token) }));
}

export async function resolveReport(
  id: string,
  status: "open" | "reviewing" | "resolved",
  token: string
): Promise<AdminReport> {
  return parseResponse(
    await fetch(`${BASE}/admin/report/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ status }),
    })
  );
}
