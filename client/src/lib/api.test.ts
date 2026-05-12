import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchQuizzes,
  fetchQuiz,
  submitQuiz,
  fetchLeaderboard,
} from "./api/quiz.api";
import { fetchDashboard } from "./api/user.api";
import { login, register } from "./api/auth.api";
import {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  fetchMyQuizzes,
} from "./api/quiz-management.api";

function makeFetchMock(status: number, body?: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body ?? {}),
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── fetchQuizzes ──────────────────────────────────────────────────────────────

describe("fetchQuizzes", () => {
  it("calls GET /api/quizzes and returns the parsed body", async () => {
    const data = [{ id: "q1", title: "Quiz 1" }];
    const mockFetch = makeFetchMock(200, data);
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchQuizzes();
    expect(mockFetch).toHaveBeenCalledWith("/api/quizzes");
    expect(result).toEqual(data);
  });

  it("throws with the server error message on failure", async () => {
    vi.stubGlobal("fetch", makeFetchMock(500, { error: "Server exploded" }));
    await expect(fetchQuizzes()).rejects.toThrow("Server exploded");
  });

  it("falls back to 'HTTP <status>' when error body has no message", async () => {
    vi.stubGlobal("fetch", makeFetchMock(503, {}));
    await expect(fetchQuizzes()).rejects.toThrow("HTTP 503");
  });
});

// ── fetchQuiz ─────────────────────────────────────────────────────────────────

describe("fetchQuiz", () => {
  it("calls GET /api/quiz/:id with the correct id", async () => {
    const quiz = { id: "abc", title: "Test" };
    const mockFetch = makeFetchMock(200, quiz);
    vi.stubGlobal("fetch", mockFetch);

    const result = await fetchQuiz("abc");
    expect(mockFetch).toHaveBeenCalledWith("/api/quiz/abc");
    expect(result).toEqual(quiz);
  });

  it("throws on 404", async () => {
    vi.stubGlobal("fetch", makeFetchMock(404, { error: "Quiz not found" }));
    await expect(fetchQuiz("missing")).rejects.toThrow("Quiz not found");
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe("login", () => {
  it("sends POST to /api/auth/login with email and password", async () => {
    const authResponse = { token: "tok", name: "Alice", role: "user" };
    const mockFetch = makeFetchMock(200, authResponse);
    vi.stubGlobal("fetch", mockFetch);

    const result = await login("alice@example.com", "pass123");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email: "alice@example.com", password: "pass123" }),
      })
    );
    expect(result).toEqual(authResponse);
  });

  it("throws on 401 with the server error message", async () => {
    vi.stubGlobal("fetch", makeFetchMock(401, { error: "Invalid credentials" }));
    await expect(login("a@b.com", "wrong")).rejects.toThrow("Invalid credentials");
  });
});

// ── register ──────────────────────────────────────────────────────────────────

describe("register", () => {
  it("sends POST to /api/auth/register with email, password and name", async () => {
    const authResponse = { token: "tok", name: "Bob", role: "user" };
    const mockFetch = makeFetchMock(201, authResponse);
    vi.stubGlobal("fetch", mockFetch);

    await register("bob@example.com", "pass123", "Bob");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "bob@example.com", password: "pass123", name: "Bob" }),
      })
    );
  });

  it("throws on 409 when email is taken", async () => {
    vi.stubGlobal("fetch", makeFetchMock(409, { error: "Email already in use" }));
    await expect(register("taken@example.com", "pw", "User")).rejects.toThrow("Email already in use");
  });
});

// ── submitQuiz ────────────────────────────────────────────────────────────────

describe("submitQuiz", () => {
  it("sends POST to /api/quiz/:id/submit with answers and nickname", async () => {
    const mockFetch = makeFetchMock(200, { score: 2, total: 3 });
    vi.stubGlobal("fetch", mockFetch);

    const answers = { "q-1": 0, "q-2": 2 };
    await submitQuiz("quiz-123", answers, "Alice", null);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/quiz/quiz-123/submit",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ answers, nickname: "Alice" }),
      })
    );
  });

  it("includes Authorization header when token is provided", async () => {
    const mockFetch = makeFetchMock(200, {});
    vi.stubGlobal("fetch", mockFetch);

    await submitQuiz("q1", {}, undefined, "my-token");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer my-token");
  });

  it("omits Authorization header when token is null", async () => {
    const mockFetch = makeFetchMock(200, {});
    vi.stubGlobal("fetch", mockFetch);

    await submitQuiz("q1", {}, undefined, null);

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["Authorization"]).toBeUndefined();
  });
});

// ── fetchLeaderboard ──────────────────────────────────────────────────────────

describe("fetchLeaderboard", () => {
  it("calls GET /api/quiz/:id/leaderboard", async () => {
    const mockFetch = makeFetchMock(200, []);
    vi.stubGlobal("fetch", mockFetch);

    await fetchLeaderboard("quiz-abc");
    expect(mockFetch).toHaveBeenCalledWith("/api/quiz/quiz-abc/leaderboard");
  });
});

// ── fetchDashboard ────────────────────────────────────────────────────────────

describe("fetchDashboard", () => {
  it("calls GET /api/dashboard with Authorization header", async () => {
    const mockFetch = makeFetchMock(200, []);
    vi.stubGlobal("fetch", mockFetch);

    await fetchDashboard("my-token");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/dashboard",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    );
  });
});

// ── createQuiz ────────────────────────────────────────────────────────────────

describe("createQuiz", () => {
  it("sends POST to /api/quiz with auth header and payload", async () => {
    const mockFetch = makeFetchMock(201, { id: "new-quiz" });
    vi.stubGlobal("fetch", mockFetch);

    const payload = {
      title: "My Quiz",
      description: "",
      visibility: "public" as const,
      questions: [],
    };
    await createQuiz(payload, "tok");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/quiz",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
        body: JSON.stringify(payload),
      })
    );
  });
});

// ── updateQuiz ────────────────────────────────────────────────────────────────

describe("updateQuiz", () => {
  it("sends PUT to /api/quiz/:id with auth header", async () => {
    const mockFetch = makeFetchMock(200, { id: "quiz-1" });
    vi.stubGlobal("fetch", mockFetch);

    await updateQuiz("quiz-1", { title: "Updated" }, "tok");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/quiz/quiz-1",
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      })
    );
  });
});

// ── deleteQuiz ────────────────────────────────────────────────────────────────

describe("deleteQuiz", () => {
  it("sends DELETE to /api/quiz/:id with auth header", async () => {
    const mockFetch = makeFetchMock(204);
    vi.stubGlobal("fetch", mockFetch);

    await deleteQuiz("quiz-1", "tok");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/quiz/quiz-1",
      expect.objectContaining({
        method: "DELETE",
        headers: expect.objectContaining({ Authorization: "Bearer tok" }),
      })
    );
  });

  it("resolves without error on 204 response", async () => {
    vi.stubGlobal("fetch", makeFetchMock(204));
    await expect(deleteQuiz("quiz-1", "tok")).resolves.toBeUndefined();
  });

  it("throws with the error message on 403", async () => {
    vi.stubGlobal("fetch", makeFetchMock(403, { error: "Not authorized" }));
    await expect(deleteQuiz("quiz-1", "tok")).rejects.toThrow("Not authorized");
  });
});

// ── fetchMyQuizzes ────────────────────────────────────────────────────────────

describe("fetchMyQuizzes", () => {
  it("calls GET /api/my-quizzes with Authorization header", async () => {
    const mockFetch = makeFetchMock(200, []);
    vi.stubGlobal("fetch", mockFetch);

    await fetchMyQuizzes("my-token");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/my-quizzes",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer my-token" }),
      })
    );
  });
});
