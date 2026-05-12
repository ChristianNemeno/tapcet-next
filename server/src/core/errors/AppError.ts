export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what: string) => new AppError(404, "not_found", `${what} not found`);
export const forbidden = (msg = "Forbidden") => new AppError(403, "forbidden", msg);
export const badRequest = (msg: string, details?: unknown) =>
  new AppError(400, "bad_request", msg, details);
