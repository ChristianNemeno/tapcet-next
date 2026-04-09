import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import supertest from "supertest";

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../db/index.js", () => ({ db: mockDb }));

import quizRouter from "./quiz.js";
import { makeChain, makeQuiz, makeQuestion } from "../test-utils/index.js";
import { signToken } from "../middleware/auth.js";

const app = express();
app.use(express.json());
app.use("/api", quizRouter);
const request = supertest(app);

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-routes";
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── GET /api/quizzes ──────────────────────────────────────────────────────────

describe("GET /api/quizzes", () => {
  it("returns a list of quiz summaries", async () => {
    const summaries = [
      { id: "q1", title: "Quiz 1", description: "", timeLimitSeconds: null, questionCount: 5, creatorName: "Alice" },
      { id: "q2", title: "Quiz 2", description: "desc", timeLimitSeconds: 60, questionCount: 3, creatorName: null },
    ];
    mockDb.select.mockReturnValue(makeChain(summaries));

    const res = await request.get("/api/quizzes");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe("q1");
  });

  it("returns an empty array when no public quizzes exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request.get("/api/quizzes");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── GET /api/quiz/:id ─────────────────────────────────────────────────────────

describe("GET /api/quiz/:id", () => {
  it("returns 404 when the quiz does not exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request.get("/api/quiz/nonexistent-id");
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it("returns the quiz with questions (no answer field)", async () => {
    const quiz = makeQuiz();
    const questions = [
      { id: "qn-1", text: "Q1?", options: ["a", "b", "c", "d"], orderIndex: 0 },
      { id: "qn-2", text: "Q2?", options: ["a", "b", "c", "d"], orderIndex: 1 },
    ];

    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain(questions));

    const res = await request.get(`/api/quiz/${quiz.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(quiz.id);
    expect(res.body.title).toBe(quiz.title);
    expect(res.body.questions).toHaveLength(2);
    expect(res.body.questions[0]).not.toHaveProperty("answer");
  });
});

// ── POST /api/quiz/:id/submit ─────────────────────────────────────────────────

describe("POST /api/quiz/:id/submit", () => {
  it("returns 400 when answers is missing", async () => {
    const res = await request.post("/api/quiz/quiz-id-1/submit").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/answers/i);
  });

  it("returns 400 when answers is not an object", async () => {
    const res = await request.post("/api/quiz/quiz-id-1/submit").send({ answers: "bad" });
    expect(res.status).toBe(400);
  });

  it("returns 404 when the quiz does not exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request
      .post("/api/quiz/quiz-id-1/submit")
      .send({ answers: { "q-1": 0 } });
    expect(res.status).toBe(404);
  });

  it("grades answers correctly: 2 correct out of 3", async () => {
    const quiz = makeQuiz();
    const q1 = makeQuestion({ id: "q-1", answer: 3, orderIndex: 0 });
    const q2 = makeQuestion({ id: "q-2", answer: 1, orderIndex: 1 });
    const q3 = makeQuestion({ id: "q-3", answer: 2, orderIndex: 2 });

    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain([q1, q2, q3]));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    const res = await request
      .post(`/api/quiz/${quiz.id}/submit`)
      .send({ answers: { "q-1": 3, "q-2": 0, "q-3": 2 }, nickname: "Alice" });

    expect(res.status).toBe(200);
    expect(res.body.score).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.results).toHaveLength(3);
    expect(res.body.results[0].correct).toBe(true);   // answered 3, answer 3 ✓
    expect(res.body.results[1].correct).toBe(false);  // answered 0, answer 1 ✗
    expect(res.body.results[2].correct).toBe(true);   // answered 2, answer 2 ✓
  });

  it("includes selectedAnswer and correctAnswer in each result", async () => {
    const quiz = makeQuiz();
    const q1 = makeQuestion({ id: "q-1", answer: 2, orderIndex: 0 });

    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain([q1]));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    const res = await request
      .post(`/api/quiz/${quiz.id}/submit`)
      .send({ answers: { "q-1": 0 } });

    expect(res.body.results[0].selectedAnswer).toBe(0);
    expect(res.body.results[0].correctAnswer).toBe(2);
  });

  it("defaults nickname to 'Anonymous' when not provided", async () => {
    const quiz = makeQuiz();
    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    const res = await request
      .post(`/api/quiz/${quiz.id}/submit`)
      .send({ answers: {} });

    expect(res.body.nickname).toBe("Anonymous");
  });

  it("trims and caps nickname at 20 characters", async () => {
    const quiz = makeQuiz();
    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    const res = await request
      .post(`/api/quiz/${quiz.id}/submit`)
      .send({ answers: {}, nickname: "  A very long nickname that exceeds 20 characters  " });

    expect(res.body.nickname).toHaveLength(20);
    expect(res.body.nickname).toBe("A very long nickname");
  });

  it("sets userId from authenticated user on leaderboard insert", async () => {
    const quiz = makeQuiz();
    const q1 = makeQuestion({ id: "q-1", answer: 0, orderIndex: 0 });
    const token = signToken({ userId: "auth-user-id", role: "user" });

    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain([q1]));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    const res = await request
      .post(`/api/quiz/${quiz.id}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: { "q-1": 0 } });

    expect(res.status).toBe(200);
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  it("includes quizId in response", async () => {
    const quiz = makeQuiz({ id: "my-quiz" });
    mockDb.select
      .mockReturnValueOnce(makeChain([quiz]))
      .mockReturnValueOnce(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    const res = await request
      .post("/api/quiz/my-quiz/submit")
      .send({ answers: {} });

    expect(res.body.quizId).toBe("my-quiz");
  });
});

// ── GET /api/quiz/:id/leaderboard ─────────────────────────────────────────────

describe("GET /api/quiz/:id/leaderboard", () => {
  it("returns top entries", async () => {
    const entries = [
      { id: "e1", nickname: "Alice", score: 3, total: 3, percentage: 100, completedAt: new Date() },
      { id: "e2", nickname: "Bob", score: 2, total: 3, percentage: 66.67, completedAt: new Date() },
    ];
    mockDb.select.mockReturnValue(makeChain(entries));

    const res = await request.get("/api/quiz/quiz-id-1/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].nickname).toBe("Alice");
  });

  it("returns an empty array when no entries exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request.get("/api/quiz/quiz-id-1/leaderboard");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

// ── GET /api/dashboard ────────────────────────────────────────────────────────

describe("GET /api/dashboard", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request.get("/api/dashboard");
    expect(res.status).toBe(401);
  });

  it("returns 403 with an invalid token", async () => {
    const res = await request
      .get("/api/dashboard")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(403);
  });

  it("returns attempt history for the authenticated user", async () => {
    const token = signToken({ userId: "user-id-1", role: "user" });
    const entries = [
      { id: "e1", quizId: "q1", quizTitle: "Quiz 1", score: 3, total: 3, percentage: 100, completedAt: new Date() },
    ];
    mockDb.select.mockReturnValue(makeChain(entries));

    const res = await request
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].quizTitle).toBe("Quiz 1");
  });
});
