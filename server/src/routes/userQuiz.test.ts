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

import userQuizRouter from "./userQuiz.js";
import { makeChain, makeQuiz } from "../test-utils/index.js";
import { signToken } from "../middleware/auth.js";

const app = express();
app.use(express.json());
app.use("/api", userQuizRouter);
const request = supertest(app);

const userToken = () => signToken({ userId: "user-id-1", role: "user" });
const adminToken = () => signToken({ userId: "admin-id-1", role: "admin" });

const sampleQuestions = [
  { text: "Q1?", options: ["a", "b", "c", "d"], answer: 0 },
  { text: "Q2?", options: ["a", "b", "c", "d"], answer: 1 },
];

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-routes";
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/quiz ────────────────────────────────────────────────────────────

describe("POST /api/quiz", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request
      .post("/api/quiz")
      .send({ title: "My Quiz", questions: sampleQuestions });
    expect(res.status).toBe(401);
  });

  it("returns 400 when title is missing", async () => {
    const res = await request
      .post("/api/quiz")
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ questions: sampleQuestions });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title|questions/i);
  });

  it("returns 400 when questions array is empty", async () => {
    const res = await request
      .post("/api/quiz")
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "My Quiz", questions: [] });
    expect(res.status).toBe(400);
  });

  it("returns 201 with the created quiz on success", async () => {
    const createdQuiz = makeQuiz({ id: "new-quiz-id", createdBy: "user-id-1" });
    mockDb.insert
      .mockReturnValueOnce(makeChain([createdQuiz]))   // quizzes insert
      .mockReturnValueOnce(makeChain(undefined));       // questions insert

    const res = await request
      .post("/api/quiz")
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "My Quiz", questions: sampleQuestions });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("new-quiz-id");
    expect(res.body.questionCount).toBe(sampleQuestions.length);
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});

// ── PUT /api/quiz/:id ─────────────────────────────────────────────────────────

describe("PUT /api/quiz/:id", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request.put("/api/quiz/quiz-id-1").send({ title: "New" });
    expect(res.status).toBe(401);
  });

  it("returns 404 when quiz does not exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request
      .put("/api/quiz/nonexistent")
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "New" });
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the creator and not admin", async () => {
    const quiz = makeQuiz({ createdBy: "other-user-id" });
    mockDb.select.mockReturnValue(makeChain([quiz]));

    const res = await request
      .put(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${userToken()}`)  // user-id-1, not other-user-id
      .send({ title: "New Title" });

    expect(res.status).toBe(403);
  });

  it("returns 200 when user is the creator", async () => {
    const quiz = makeQuiz({ createdBy: "user-id-1" });
    const updated = { ...quiz, title: "Updated Title" };
    mockDb.select.mockReturnValue(makeChain([quiz]));
    mockDb.update.mockReturnValue(makeChain([updated]));

    const res = await request
      .put(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
  });

  it("returns 200 when admin edits another user's quiz", async () => {
    const quiz = makeQuiz({ createdBy: "some-other-user" });
    const updated = { ...quiz, title: "Admin Updated" };
    mockDb.select.mockReturnValue(makeChain([quiz]));
    mockDb.update.mockReturnValue(makeChain([updated]));

    const res = await request
      .put(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ title: "Admin Updated" });

    expect(res.status).toBe(200);
  });

  it("replaces questions when questions array is provided", async () => {
    const quiz = makeQuiz({ createdBy: "user-id-1" });
    mockDb.select.mockReturnValue(makeChain([quiz]));
    mockDb.update.mockReturnValue(makeChain([quiz]));
    mockDb.delete.mockReturnValue(makeChain(undefined));
    mockDb.insert.mockReturnValue(makeChain(undefined));

    await request
      .put(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "T", questions: sampleQuestions });

    expect(mockDb.delete).toHaveBeenCalledOnce();
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  it("does not touch questions when questions field is absent", async () => {
    const quiz = makeQuiz({ createdBy: "user-id-1" });
    mockDb.select.mockReturnValue(makeChain([quiz]));
    mockDb.update.mockReturnValue(makeChain([quiz]));

    await request
      .put(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "Just title update" });

    expect(mockDb.delete).not.toHaveBeenCalled();
    expect(mockDb.insert).not.toHaveBeenCalled();
  });
});

// ── DELETE /api/quiz/:id ──────────────────────────────────────────────────────

describe("DELETE /api/quiz/:id", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request.delete("/api/quiz/quiz-id-1");
    expect(res.status).toBe(401);
  });

  it("returns 404 when quiz does not exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request
      .delete("/api/quiz/nonexistent")
      .set("Authorization", `Bearer ${userToken()}`);
    expect(res.status).toBe(404);
  });

  it("returns 403 when user is not the creator and not admin", async () => {
    const quiz = makeQuiz({ createdBy: "other-user-id" });
    mockDb.select.mockReturnValue(makeChain([quiz]));

    const res = await request
      .delete(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${userToken()}`);

    expect(res.status).toBe(403);
  });

  it("returns 204 on successful deletion by creator", async () => {
    const quiz = makeQuiz({ createdBy: "user-id-1" });
    mockDb.select.mockReturnValue(makeChain([quiz]));
    mockDb.delete.mockReturnValue(makeChain(undefined));

    const res = await request
      .delete(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${userToken()}`);

    expect(res.status).toBe(204);
  });

  it("returns 204 when admin deletes any quiz", async () => {
    const quiz = makeQuiz({ createdBy: "some-other-user" });
    mockDb.select.mockReturnValue(makeChain([quiz]));
    mockDb.delete.mockReturnValue(makeChain(undefined));

    const res = await request
      .delete(`/api/quiz/${quiz.id}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(204);
  });
});

// ── GET /api/my-quizzes ───────────────────────────────────────────────────────

describe("GET /api/my-quizzes", () => {
  it("returns 401 without an auth token", async () => {
    const res = await request.get("/api/my-quizzes");
    expect(res.status).toBe(401);
  });

  it("returns the authenticated user's quizzes", async () => {
    const rows = [
      { id: "q1", title: "My Quiz 1", description: "", timeLimitSeconds: null, visibility: "public", questionCount: 5 },
      { id: "q2", title: "My Quiz 2", description: "desc", timeLimitSeconds: 60, visibility: "draft", questionCount: 3 },
    ];
    mockDb.select.mockReturnValue(makeChain(rows));

    const res = await request
      .get("/api/my-quizzes")
      .set("Authorization", `Bearer ${userToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe("My Quiz 1");
  });

  it("returns an empty array when user has no quizzes", async () => {
    mockDb.select.mockReturnValue(makeChain([]));

    const res = await request
      .get("/api/my-quizzes")
      .set("Authorization", `Bearer ${userToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
