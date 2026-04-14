import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { errorResponse } from "../lib/errorResponse.js";

function formatIssues(issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>) {
  return issues.map((i) => {
    const path = i.path.map((seg) => String(seg)).join(".");
    return path ? `${path}: ${i.message}` : i.message;
  });
}

export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = formatIssues(result.error.issues);
      errorResponse(res, 400, messages.join("; "), messages);
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const messages = formatIssues(result.error.issues);
      errorResponse(res, 400, messages.join("; "), messages);
      return;
    }
    // Don't reassign req.query — Express 5 makes it read-only. Attach instead.
    (req as Request & { validatedQuery: unknown }).validatedQuery = result.data;
    next();
  };
}
