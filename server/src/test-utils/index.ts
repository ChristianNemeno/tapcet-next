import { vi } from "vitest";

/**
 * Creates a chainable, awaitable proxy that resolves to `resolveWith`.
 * Mimics Drizzle ORM's fluent query builder — any method call returns the
 * same chain, and awaiting the chain resolves to the provided value.
 */
export function makeChain<T>(resolveWith: T) {
  const handler: ProxyHandler<Record<string | symbol, unknown>> = {
    get(_target, prop) {
      if (typeof prop === "symbol") return undefined;
      if (prop === "then") {
        return (
          onfulfilled?: ((value: T) => unknown) | null,
          onrejected?: ((reason: unknown) => unknown) | null
        ) => Promise.resolve(resolveWith).then(onfulfilled, onrejected);
      }
      if (prop === "catch") {
        return (onrejected?: ((reason: unknown) => unknown) | null) =>
          Promise.resolve(resolveWith).catch(onrejected);
      }
      if (prop === "finally") {
        return (onfinally?: (() => void) | null) =>
          Promise.resolve(resolveWith).finally(onfinally);
      }
      return (..._args: unknown[]) =>
        new Proxy({} as Record<string | symbol, unknown>, handler);
    },
  };
  return new Proxy({} as Record<string | symbol, unknown>, handler);
}

/** Returns a fresh mock DB object with vi.fn() methods matching Drizzle's API. */
export function makeMockDb() {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

export function makeUser(
  overrides: Partial<{
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: "user" | "admin";
    createdAt: Date;
  }> = {}
) {
  return {
    id: "user-id-1",
    email: "user@example.com",
    passwordHash: "$2b$12$hashedpassword",
    name: "Test User",
    role: "user" as const,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

export function makeQuiz(
  overrides: Partial<{
    id: string;
    title: string;
    description: string;
    timeLimitSeconds: number | null;
    createdBy: string | null;
    visibility: "public" | "draft";
  }> = {}
) {
  return {
    id: "quiz-id-1",
    title: "Test Quiz",
    description: "A test quiz",
    timeLimitSeconds: null,
    createdBy: "user-id-1",
    visibility: "public" as const,
    ...overrides,
  };
}

export function makeQuestion(
  overrides: Partial<{
    id: string;
    quizId: string;
    text: string;
    options: string[];
    answer: number;
    orderIndex: number;
  }> = {}
) {
  return {
    id: "question-id-1",
    quizId: "quiz-id-1",
    text: "What is 2 + 2?",
    options: ["1", "2", "3", "4"],
    answer: 3,
    orderIndex: 0,
    ...overrides,
  };
}
