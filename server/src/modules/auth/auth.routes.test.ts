import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import express from "express";
import supertest from "supertest";

const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

const mockBcrypt = vi.hoisted(() => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock("../../core/db/index.js", () => ({ db: mockDb }));
vi.mock("bcrypt", () => ({ default: mockBcrypt }));
vi.mock("express-rate-limit", () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import authRouter from "./auth.routes.js";
import { makeChain, makeUser } from "../../test-utils/index.js";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter);
const request = supertest(app);

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-routes";
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request
      .post("/api/auth/register")
      .send({ password: "pass123", name: "Alice" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request
      .post("/api/auth/register")
      .send({ email: "a@b.com", name: "Alice" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 400 when name is missing", async () => {
    const res = await request
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "pass123" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("returns 409 when email already exists", async () => {
    mockDb.select.mockReturnValue(makeChain([{ id: "existing" }]));

    const res = await request
      .post("/api/auth/register")
      .send({ email: "existing@test.com", password: "pass123", name: "Alice" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/in use/i);
  });

  it("returns 201 and a token on successful registration", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([{ id: "new-id", role: "user", name: "Alice" }]));
    mockBcrypt.hash.mockResolvedValue("$2b$12$hashedpassword");

    const res = await request
      .post("/api/auth/register")
      .send({ email: "alice@test.com", password: "securePass1", name: "Alice" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.name).toBe("Alice");
    expect(res.body.role).toBe("user");
    expect(res.body.userId).toBe("new-id");
  });

  it("stores email in lowercase", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([{ id: "u1", role: "user", name: "Alice" }]));
    mockBcrypt.hash.mockResolvedValue("hashed");

    await request
      .post("/api/auth/register")
      .send({ email: "ALICE@TEST.COM", password: "pass123", name: "Alice" });

    const insertCall = mockDb.insert.mock.calls[0][0];
    expect(insertCall.values.email).toBe("alice@test.com");
  });

  it("hashes password with 12 rounds", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockDb.insert.mockReturnValue(makeChain([{ id: "u1", role: "user", name: "Alice" }]));
    mockBcrypt.hash.mockResolvedValue("hashed");

    await request
      .post("/api/auth/register")
      .send({ email: "alice@test.com", password: "securePass1", name: "Alice" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("securePass1", 12);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 400 when email is missing", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ password: "pass123" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is missing", async () => {
    const res = await request
      .post("/api/auth/login")
      .send({ email: "a@b.com" });
    expect(res.status).toBe(400);
  });

  it("returns 401 when user does not exist", async () => {
    mockDb.select.mockReturnValue(makeChain([]));

    const res = await request
      .post("/api/auth/login")
      .send({ email: "nonexistent@test.com", password: "pass123" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("returns 401 when password does not match", async () => {
    mockDb.select.mockReturnValue(makeChain([makeUser()]));
    mockBcrypt.compare.mockResolvedValue(false);

    const res = await request
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  it("returns 200 and a token on successful login", async () => {
    mockDb.select.mockReturnValue(makeChain([makeUser()]));
    mockBcrypt.compare.mockResolvedValue(true);

    const res = await request
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "correctpass" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.name).toBe("Test User");
  });

  it("looks up email in lowercase", async () => {
    mockDb.select.mockReturnValue(makeChain([]));

    await request
      .post("/api/auth/login")
      .send({ email: "USER@EXAMPLE.COM", password: "pass" });

    expect(mockDb.select.mock.calls[0][0].where.eq.value).toBe("user@example.com");
  });
});
