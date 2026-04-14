import type { Response, NextFunction, Request } from "express";
import { AppError } from "./AppError.js";

export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown
): void {
  res.status(statusCode).json({ error: message, ...(details !== undefined && { details }) });
}

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    next(err);
    return;
  }
  if (err instanceof AppError) {
    errorResponse(res, err.statusCode, err.message, err.details);
    return;
  }
  console.error(err);
  errorResponse(res, 500, "Internal server error");
}
