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

import adminRouter from "./admin.js";
import { makeChain, makeQuiz } from "../test-utils/index.js";
import { signToken } from "../middleware/auth.js";

const app = express();
app.use(express.json());
app.use("/api/admin", adminRouter);
const request = supertest(app);

const userToken = () => signToken({ userId: "user-id-1", role: "user" });
const adminToken = () => signToken({ userId: "admin-id-1", role: "admin" });

const sampleQuestions = [
  { text: "Q1?", options: ["a", "b", "c", "d"], answer: 0 },
  { text: "Q2?", options: ["a", "b", "c", "d"], answer: 2 },
];

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-routes";
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── POST /api/admin/quizzes ───────────────────────────────────────────────────

describe("POST /api/admin/quizzes", () => {
  it("returns 401 with no token", async () => {
    const res = await request
      .post("/api/admin/quizzes")
      .send({ title: "Quiz", questions: sampleQuestions });
    expect(res.status).toBe(401);
  });

  it("returns 403 with a regular user token", async () => {
    const res = await request
      .post("/api/admin/quizzes")
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "Quiz", questions: sampleQuestions });
    expect(res.status).toBe(403);
  });

  it("returns 400 when title is missing", async () => {
    const res = await request
      .post("/api/admin/quizzes")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ questions: sampleQuestions });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title|questions/i);
  });

  it("returns 400 when questions array is empty", async () => {
    const res = await request
      .post("/api/admin/quizzes")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ title: "Quiz", questions: [] });
    expect(res.status).toBe(400);
  });

  it("returns 201 with the created quiz on success", async () => {
    const createdQuiz = makeQuiz({ id: "admin-quiz-id", createdBy: null });
    mockDb.insert
      .mockReturnValueOnce(makeChain([createdQuiz]))  // quizzes insert
      .mockReturnValueOnce(makeChain(undefined));      // questions insert

    const res = await request
      .post("/api/admin/quizzes")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ title: "Official Quiz", questions: sampleQuestions });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("admin-quiz-id");
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});

// ── PUT /api/admin/quizzes/:id ────────────────────────────────────────────────

describe("PUT /api/admin/quizzes/:id", () => {
  it("returns 401 with no token", async () => {
    const res = await request
      .put("/api/admin/quizzes/quiz-id-1")
      .send({ title: "New" });
    expect(res.status).toBe(401);
  });

  it("returns 403 with a regular user token", async () => {
    const res = await request
      .put("/api/admin/quizzes/quiz-id-1")
      .set("Authorization", `Bearer ${userToken()}`)
      .send({ title: "New" });
    expect(res.status).toBe(403);
  });

  it("returns 404 when quiz does not exist", async () => {
    mockDb.update.mockReturnValue(makeChain([]));
    const res = await request
      .put("/api/admin/quizzes/nonexistent")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ title: "New" });
    expect(res.status).toBe(404);
  });

  it("returns the updated quiz on success", async () => {
    const updated = makeQuiz({ title: "Updated" });
    mockDb.update.mockReturnValue(makeChain([updated]));

    const res = await request
      .put(`/api/admin/quizzes/${updated.id}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
  });
});

// ── DELETE /api/admin/quizzes/:id ─────────────────────────────────────────────

describe("DELETE /api/admin/quizzes/:id", () => {
  it("returns 401 with no token", async () => {
    const res = await request.delete("/api/admin/quizzes/quiz-id-1");
    expect(res.status).toBe(401);
  });

  it("returns 403 with a regular user token", async () => {
    const res = await request
      .delete("/api/admin/quizzes/quiz-id-1")
      .set("Authorization", `Bearer ${userToken()}`);
    expect(res.status).toBe(403);
  });

  it("returns 404 when quiz does not exist", async () => {
    mockDb.delete.mockReturnValue(makeChain([]));
    const res = await request
      .delete("/api/admin/quizzes/nonexistent")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(404);
  });

  it("returns 204 on successful deletion", async () => {
    mockDb.delete.mockReturnValue(makeChain([{ id: "quiz-id-1" }]));
    const res = await request
      .delete("/api/admin/quizzes/quiz-id-1")
      .set("Authorization", `Bearer ${adminToken()}`);
    expect(res.status).toBe(204);
  });
});
