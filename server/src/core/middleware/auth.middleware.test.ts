import { describe, it, expect, vi, beforeAll } from "vitest";
import type { Request, Response, NextFunction } from "express";
import {
  signToken,
  authenticateToken,
  optionalAuth,
  requireAdmin,
  type JwtPayload,
} from "./auth.middleware.js";

beforeAll(() => {
  process.env.JWT_SECRET = "test-secret-for-vitest";
});

function mockReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

function mockRes() {
  const res = {
    _status: 0,
    _body: null as unknown,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._body = body;
      return res;
    },
  };
  return res as unknown as Response & { _status: number; _body: unknown };
}

const next: NextFunction = vi.fn();

describe("signToken", () => {
  it("returns a string", () => {
    const token = signToken({ userId: "abc", role: "user" });
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("encodes the payload", () => {
    const payload: JwtPayload = { userId: "user-123", role: "admin" };
    const token = signToken(payload);
    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString()
    );
    expect(decoded.userId).toBe("user-123");
    expect(decoded.role).toBe("admin");
  });
});

describe("authenticateToken", () => {
  it("returns 401 when no Authorization header is present", () => {
    const req = mockReq();
    const res = mockRes();
    authenticateToken(req, res, next);
    expect(res._status).toBe(401);
    expect((res._body as { error: string }).error).toMatch(/token required/i);
  });

  it("returns 403 when token is invalid", () => {
    const req = mockReq("Bearer not.a.valid.token");
    const res = mockRes();
    authenticateToken(req, res, next);
    expect(res._status).toBe(403);
    expect((res._body as { error: string }).error).toMatch(/invalid|expired/i);
  });

  it("calls next() and sets req.user when token is valid", () => {
    const token = signToken({ userId: "u1", role: "user" });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    const nextFn = vi.fn();
    authenticateToken(req, res, nextFn);
    expect(nextFn).toHaveBeenCalledOnce();
    expect(req.user?.userId).toBe("u1");
    expect(req.user?.role).toBe("user");
  });

  it("returns 401 when Authorization header has no Bearer prefix", () => {
    const token = signToken({ userId: "u1", role: "user" });
    const req = mockReq(token);
    const res = mockRes();
    authenticateToken(req, res, next);
    expect(res._status).toBe(401);
  });
});

describe("optionalAuth", () => {
  it("calls next() and leaves req.user undefined when no header", () => {
    const req = mockReq();
    const res = mockRes();
    const nextFn = vi.fn();
    optionalAuth(req, res, nextFn);
    expect(nextFn).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it("calls next() and leaves req.user undefined when token is invalid", () => {
    const req = mockReq("Bearer garbage");
    const res = mockRes();
    const nextFn = vi.fn();
    optionalAuth(req, res, nextFn);
    expect(nextFn).toHaveBeenCalledOnce();
    expect(req.user).toBeUndefined();
  });

  it("sets req.user when token is valid", () => {
    const token = signToken({ userId: "u2", role: "admin" });
    const req = mockReq(`Bearer ${token}`);
    const res = mockRes();
    const nextFn = vi.fn();
    optionalAuth(req, res, nextFn);
    expect(nextFn).toHaveBeenCalledOnce();
    expect(req.user?.userId).toBe("u2");
    expect(req.user?.role).toBe("admin");
  });
});

describe("requireAdmin", () => {
  it("returns 401 when req.user is not set", () => {
    const req = mockReq();
    const res = mockRes();
    requireAdmin(req, res, next);
    expect(res._status).toBe(401);
  });

  it("returns 403 when req.user has role 'user'", () => {
    const req = mockReq();
    req.user = { userId: "u1", role: "user" };
    const res = mockRes();
    requireAdmin(req, res, next);
    expect(res._status).toBe(403);
    expect((res._body as { error: string }).error).toMatch(/admin/i);
  });

  it("calls next() when req.user has role 'admin'", () => {
    const req = mockReq();
    req.user = { userId: "u1", role: "admin" };
    const res = mockRes();
    const nextFn = vi.fn();
    requireAdmin(req, res, nextFn);
    expect(nextFn).toHaveBeenCalledOnce();
    expect(res._status).toBe(0);
  });
});
