"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface AuthState {
  token: string | null;
  name: string | null;
  role: "user" | "admin" | null;
  userId: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, name: string, role: "user" | "admin", userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    if (typeof window === "undefined") {
      return { token: null, name: null, role: null, userId: null };
    }

    const stored = localStorage.getItem("tapcet_auth");
    if (!stored) {
      return { token: null, name: null, role: null, userId: null };
    }

    try {
      return JSON.parse(stored) as AuthState;
    } catch {
      localStorage.removeItem("tapcet_auth");
      return { token: null, name: null, role: null, userId: null };
    }
  });

  function login(token: string, name: string, role: "user" | "admin", userId: string) {
    const next = { token, name, role, userId };
    setAuth(next);
    localStorage.setItem("tapcet_auth", JSON.stringify(next));
  }

  function logout() {
    setAuth({ token: null, name: null, role: null, userId: null });
    localStorage.removeItem("tapcet_auth");
  }

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
