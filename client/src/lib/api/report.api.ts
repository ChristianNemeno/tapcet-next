import type { AdminReport } from "../types/report";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function reportQuestion(
  questionId: string,
  payload: { quizId: string; reportType: "incorrect" | "ambiguous" | "duplicate"; comment?: string },
  token: string
): Promise<void> {
  const res = await fetch(`${BASE}/question/${questionId}/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function fetchAdminReports(
  params: { status?: string; reportType?: string; page?: number },
  token: string
): Promise<AdminReport[]> {
  const url = new URL(`${BASE}/admin/reports`, window.location.origin);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.reportType) url.searchParams.set("reportType", params.reportType);
  if (params.page) url.searchParams.set("page", String(params.page));
  return parseResponse(await fetch(url.toString(), { headers: authHeader(token) }));
}

export async function resolveReport(
  id: string,
  status: "open" | "reviewing" | "resolved",
  token: string
): Promise<AdminReport> {
  return parseResponse(
    await fetch(`${BASE}/admin/report/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify({ status }),
    })
  );
}
