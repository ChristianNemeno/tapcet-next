import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockUseAuth = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth-context", () => ({ useAuth: mockUseAuth }));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href }, children),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => React.createElement("button", { onClick }, children),
}));

import { Navbar } from "./navbar";

// ── Test helpers ──────────────────────────────────────────────────────────────

function renderNavbar() {
  render(<Navbar />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Unauthenticated state ─────────────────────────────────────────────────────

describe("unauthenticated (name: null)", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ name: null, role: null, logout: vi.fn() });
  });

  it("shows a log in link pointing to /login", () => {
    renderNavbar();
    const link = screen.getByRole("link", { name: /log in/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows a sign up link pointing to /register", () => {
    renderNavbar();
    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/register");
  });

  it("does not show a log out button", () => {
    renderNavbar();
    expect(screen.queryByRole("button", { name: /log out/i })).toBeNull();
  });

  it("does not show a create link", () => {
    renderNavbar();
    expect(screen.queryByRole("link", { name: /create/i })).toBeNull();
  });
});

// ── Authenticated regular user ────────────────────────────────────────────────

describe("authenticated user (role: 'user')", () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    mockUseAuth.mockReturnValue({ name: "Alice", role: "user", logout: mockLogout });
  });

  it("shows the user's name as a link to /dashboard", () => {
    renderNavbar();
    const link = screen.getByRole("link", { name: /alice/i });
    expect(link).toHaveAttribute("href", "/dashboard");
  });

  it("does not show an [admin] badge", () => {
    renderNavbar();
    expect(screen.queryByText(/\[admin\]/i)).toBeNull();
  });

  it("shows a create link pointing to /quiz/create", () => {
    renderNavbar();
    const link = screen.getByRole("link", { name: /create/i });
    expect(link).toHaveAttribute("href", "/quiz/create");
  });

  it("does not show a manage link", () => {
    renderNavbar();
    expect(screen.queryByRole("link", { name: /manage/i })).toBeNull();
  });

  it("shows a log out button that calls logout on click", async () => {
    renderNavbar();
    const button = screen.getByRole("button", { name: /log out/i });
    await userEvent.click(button);
    expect(mockLogout).toHaveBeenCalledOnce();
  });

  it("does not show log in or sign up links", () => {
    renderNavbar();
    expect(screen.queryByRole("link", { name: /log in/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /sign up/i })).toBeNull();
  });
});

// ── Authenticated admin ───────────────────────────────────────────────────────

describe("authenticated admin (role: 'admin')", () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ name: "Bob", role: "admin", logout: vi.fn() });
  });

  it("shows the admin badge next to the user name", () => {
    renderNavbar();
    expect(screen.getByText(/\[admin\]/i)).toBeInTheDocument();
  });

  it("shows a manage link pointing to /admin", () => {
    renderNavbar();
    const link = screen.getByRole("link", { name: /manage/i });
    expect(link).toHaveAttribute("href", "/admin");
  });

  it("still shows the create link", () => {
    renderNavbar();
    expect(screen.getByRole("link", { name: /create/i })).toBeInTheDocument();
  });
});
