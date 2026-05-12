import type { DashboardEntry, WeaknessEntry } from "../types/user";
import type { CreatorProfile } from "../types/user";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function fetchDashboard(token: string): Promise<DashboardEntry[]> {
  return parseResponse(
    await fetch(`${BASE}/dashboard`, { headers: authHeader(token) })
  );
}

export async function fetchWeakness(token: string): Promise<WeaknessEntry[]> {
  return parseResponse(
    await fetch(`${BASE}/dashboard/weakness`, { headers: authHeader(token) })
  );
}

export async function fetchCreatorProfile(id: string): Promise<CreatorProfile> {
  return parseResponse(await fetch(`${BASE}/user/${id}/profile`));
}
