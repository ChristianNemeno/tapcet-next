import type { AuthResponse } from "../types/auth";
import { parseResponse } from "./client";

const BASE = "/api";

export async function login(email: string, password: string): Promise<AuthResponse> {
  return parseResponse(
    await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
  );
}

export async function register(
  email: string,
  password: string,
  name: string
): Promise<AuthResponse> {
  return parseResponse(
    await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    })
  );
}
