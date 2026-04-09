import { describe, it, expect, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import React, { useRef } from "react";
import { AuthProvider, useAuth } from "./auth-context";

// Helper: renders a consumer that exposes the auth context value via a ref
function renderWithAuth() {
  const ref = { current: null as ReturnType<typeof useAuth> | null };

  function Consumer() {
    ref.current = useAuth();
    return null;
  }

  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>
  );

  return ref;
}

beforeEach(() => {
  localStorage.clear();
});

// ── Initial state ─────────────────────────────────────────────────────────────

describe("initial state", () => {
  it("returns null values when localStorage is empty", () => {
    const ref = renderWithAuth();
    expect(ref.current?.token).toBeNull();
    expect(ref.current?.name).toBeNull();
    expect(ref.current?.role).toBeNull();
  });

  it("restores state from valid localStorage data", () => {
    localStorage.setItem(
      "tapcet_auth",
      JSON.stringify({ token: "tok", name: "Alice", role: "user" })
    );

    const ref = renderWithAuth();
    expect(ref.current?.token).toBe("tok");
    expect(ref.current?.name).toBe("Alice");
    expect(ref.current?.role).toBe("user");
  });

  it("returns null values and removes corrupt localStorage data", () => {
    localStorage.setItem("tapcet_auth", "not-valid-json{{");

    const ref = renderWithAuth();
    expect(ref.current?.token).toBeNull();
    expect(localStorage.getItem("tapcet_auth")).toBeNull();
  });
});

// ── login ─────────────────────────────────────────────────────────────────────

describe("login()", () => {
  it("updates the context state", () => {
    const ref = renderWithAuth();
    act(() => {
      ref.current?.login("new-token", "Bob", "admin");
    });
    expect(ref.current?.token).toBe("new-token");
    expect(ref.current?.name).toBe("Bob");
    expect(ref.current?.role).toBe("admin");
  });

  it("persists the new auth state to localStorage", () => {
    const ref = renderWithAuth();
    act(() => {
      ref.current?.login("t", "Bob", "user");
    });
    const stored = JSON.parse(localStorage.getItem("tapcet_auth") ?? "null");
    expect(stored).toEqual({ token: "t", name: "Bob", role: "user" });
  });
});

// ── logout ────────────────────────────────────────────────────────────────────

describe("logout()", () => {
  it("resets context state to nulls", () => {
    localStorage.setItem(
      "tapcet_auth",
      JSON.stringify({ token: "tok", name: "Alice", role: "user" })
    );
    const ref = renderWithAuth();

    act(() => {
      ref.current?.logout();
    });

    expect(ref.current?.token).toBeNull();
    expect(ref.current?.name).toBeNull();
    expect(ref.current?.role).toBeNull();
  });

  it("removes the localStorage entry", () => {
    localStorage.setItem(
      "tapcet_auth",
      JSON.stringify({ token: "tok", name: "Alice", role: "user" })
    );
    const ref = renderWithAuth();

    act(() => {
      ref.current?.logout();
    });

    expect(localStorage.getItem("tapcet_auth")).toBeNull();
  });
});

// ── useAuth outside provider ──────────────────────────────────────────────────

describe("useAuth() outside provider", () => {
  it("throws an error when called outside AuthProvider", () => {
    function BadConsumer() {
      useAuth();
      return null;
    }
    // Suppress the expected console.error from React about the uncaught error
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      "useAuth must be used within AuthProvider"
    );
    spy.mockRestore();
  });
});
