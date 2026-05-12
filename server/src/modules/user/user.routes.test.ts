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

import userRouter from "./user.routes.js";
import { makeChain } from "../../test-utils/index.js";
import { signToken } from "../../core/middleware/auth.middleware.js";

const app = express();
app.use(express.json());
app.use("/api", userRouter);
const request = supertest(app);

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-routes";
});

beforeEach(() => {
  vi.clearAllMocks();
});

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
