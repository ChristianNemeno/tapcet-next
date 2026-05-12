import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import supertest from "supertest";

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../core/db/index.js", () => ({ db: mockDb }));

import quizRouter from "./quiz.routes.js";
import { makeChain, makeQuiz, makeQuestion } from "../../test-utils/index.js";
import { signToken } from "../../core/middleware/auth.middleware.js";

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
      .mockReturnValueOnce(makeChain([]))
      .mockReturnValueOnce(makeChain(questions));

    const res = await request.get(`/api/quiz/${quiz.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(quiz.id);
    expect(res.body.title).toBe(quiz.title);
    expect(res.body.questions).toHaveLength(2);
    expect(res.body.questions[0]).not.toHaveProperty("answer");
  });
});

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
    expect(res.body.results[0].correct).toBe(true);
    expect(res.body.results[1].correct).toBe(false);
    expect(res.body.results[2].correct).toBe(true);
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

describe("POST /api/quiz/import/validate", () => {
  const validRow = {
    question: "What is 2 + 2?",
    option_a: "3",
    option_b: "4",
    option_c: "5",
    option_d: "6",
    answer: "B",
  };

  it("returns 401 without auth token", async () => {
    const res = await request.post("/api/quiz/import/validate").send({ rows: [validRow] });
    expect(res.status).toBe(401);
  });

  it("returns 400 when rows array is empty", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [] });
    expect(res.status).toBe(400);
  });

  it("parses a valid row correctly", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [validRow] });
    expect(res.status).toBe(200);
    expect(res.body.parsed).toHaveLength(1);
    expect(res.body.errors).toHaveLength(0);
    expect(res.body.parsed[0]).toEqual({
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: 1,
    });
  });

  it("accepts lowercase answer letters", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [{ ...validRow, answer: "a" }] });
    expect(res.status).toBe(200);
    expect(res.body.parsed[0].answer).toBe(0);
  });

  it("returns a row error when question is empty", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [{ ...validRow, question: "" }] });
    expect(res.status).toBe(200);
    expect(res.body.parsed).toHaveLength(0);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].row).toBe(1);
    expect(res.body.errors[0].message).toContain("question is empty");
  });

  it("returns a row error for invalid answer letter", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [{ ...validRow, answer: "E" }] });
    expect(res.status).toBe(200);
    expect(res.body.parsed).toHaveLength(0);
    expect(res.body.errors[0].message).toContain("answer must be A, B, C, or D");
  });

  it("keeps valid rows even when some rows fail", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const badRow = { ...validRow, question: "", answer: "Z" };
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [validRow, badRow, validRow] });
    expect(res.status).toBe(200);
    expect(res.body.parsed).toHaveLength(2);
    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].row).toBe(2);
  });

  it("trims whitespace from all fields", async () => {
    const token = signToken({ userId: "user-1", role: "user" });
    const paddedRow = {
      question: "  What? ",
      option_a: " Yes ",
      option_b: " No ",
      option_c: " Maybe ",
      option_d: " Never ",
      answer: " C ",
    };
    const res = await request
      .post("/api/quiz/import/validate")
      .set("Authorization", `Bearer ${token}`)
      .send({ rows: [paddedRow] });
    expect(res.status).toBe(200);
    expect(res.body.parsed[0].text).toBe("What?");
    expect(res.body.parsed[0].options[0]).toBe("Yes");
    expect(res.body.parsed[0].answer).toBe(2);
  });
});
