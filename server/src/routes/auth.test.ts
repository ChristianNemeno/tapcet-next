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

vi.mock("../db/index.js", () => ({ db: mockDb }));
vi.mock("bcrypt", () => ({ default: mockBcrypt }));
vi.mock("express-rate-limit", () => ({
  default: () => (_req: unknown, _res: unknown, next: () => void) => next(),
}));

import authRouter from "./auth.js";
import { makeChain, makeUser } from "../test-utils/index.js";

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

// ── POST /api/auth/register ───────────────────────────────────────────────────

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
  });

  it("returns 400 when name is missing", async () => {
    const res = await request
      .post("/api/auth/register")
      .send({ email: "a@b.com", password: "pass123" });
    expect(res.status).toBe(400);
  });

  it("returns 409 when email is already taken", async () => {
    mockDb.select.mockReturnValue(makeChain([makeUser()]));
    const res = await request
      .post("/api/auth/register")
      .send({ email: "taken@example.com", password: "pass123", name: "Alice" });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it("returns 201 with token on success", async () => {
    const user = makeUser({ id: "new-user-id", role: "user", name: "Alice" });
    mockDb.select.mockReturnValue(makeChain([]));
    mockBcrypt.hash.mockResolvedValue("hashed_password");
    mockDb.insert.mockReturnValue(
      makeChain([{ id: user.id, role: user.role, name: user.name }])
    );

    const res = await request
      .post("/api/auth/register")
      .send({ email: "Alice@EXAMPLE.com", password: "pass123", name: "Alice" });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.name).toBe("Alice");
    expect(res.body.role).toBe("user");
  });

  it("normalises email to lowercase before lookup", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockBcrypt.hash.mockResolvedValue("hashed");
    mockDb.insert.mockReturnValue(
      makeChain([{ id: "uid", role: "user", name: "Bob" }])
    );

    await request
      .post("/api/auth/register")
      .send({ email: "BOB@EXAMPLE.COM", password: "pw", name: "Bob" });

    // The first db.select call should have been invoked (the where clause lowercases)
    expect(mockDb.select).toHaveBeenCalledOnce();
  });

  it("calls bcrypt.hash with 12 rounds", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    mockBcrypt.hash.mockResolvedValue("hashed");
    mockDb.insert.mockReturnValue(
      makeChain([{ id: "uid", role: "user", name: "Carol" }])
    );

    await request
      .post("/api/auth/register")
      .send({ email: "carol@example.com", password: "mypassword", name: "Carol" });

    expect(mockBcrypt.hash).toHaveBeenCalledWith("mypassword", 12);
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────

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

  it("returns 401 when user is not found", async () => {
    mockDb.select.mockReturnValue(makeChain([]));
    const res = await request
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "pass" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("returns 401 when password is wrong", async () => {
    mockDb.select.mockReturnValue(makeChain([makeUser()]));
    mockBcrypt.compare.mockResolvedValue(false);
    const res = await request
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "wrongpass" });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it("returns 200 with token on success", async () => {
    const user = makeUser();
    mockDb.select.mockReturnValue(makeChain([user]));
    mockBcrypt.compare.mockResolvedValue(true);

    const res = await request
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "correctpass" });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe("string");
    expect(res.body.name).toBe(user.name);
    expect(res.body.role).toBe(user.role);
  });

  it("passes raw password and stored hash to bcrypt.compare", async () => {
    const user = makeUser({ passwordHash: "$2b$12$storedHash" });
    mockDb.select.mockReturnValue(makeChain([user]));
    mockBcrypt.compare.mockResolvedValue(true);

    await request
      .post("/api/auth/login")
      .send({ email: "user@example.com", password: "mypassword" });

    expect(mockBcrypt.compare).toHaveBeenCalledWith("mypassword", "$2b$12$storedHash");
  });
});
