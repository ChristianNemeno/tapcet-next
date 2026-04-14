import type { Request, Response, NextFunction } from "express";
import type { JwtPayload } from "./auth.js";
import { errorResponse } from "../lib/errorResponse.js";

export interface OwnedResource {
  createdBy: string | null;
}

export function canMutateResource(resource: OwnedResource, user: JwtPayload): boolean {
  return user.role === "admin" || resource.createdBy === user.userId;
}

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      errorResponse(res, 401, "Authentication required");
      return;
    }
    if (role === "admin" && req.user.role !== "admin") {
      errorResponse(res, 403, "Admin access required");
      return;
    }
    next();
  };
}

export function requireOwnership<T extends OwnedResource>(
  loader: (req: Request) => Promise<T | null | undefined>,
  attachAs: string = "resource"
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resource = await loader(req);
      if (!resource) {
        errorResponse(res, 404, "Not found");
        return;
      }
      if (!canMutateResource(resource, req.user!)) {
        errorResponse(res, 403, "Not authorized");
        return;
      }
      (req as Request & Record<string, unknown>)[attachAs] = resource;
      next();
    } catch (err) {
      next(err);
    }
  };
}
