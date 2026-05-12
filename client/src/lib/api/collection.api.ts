import type { CollectionSummary, CollectionDetail, MyCollectionSummary, CollectionFormPayload } from "../types/collection";
import { parseResponse, authHeader } from "./client";

const BASE = "/api";

export async function fetchCollections(params?: { exam?: string; official?: boolean }): Promise<CollectionSummary[]> {
  const url = new URL(`${BASE}/collections`, window.location.origin);
  if (params?.exam) url.searchParams.set("exam", params.exam);
  if (params?.official) url.searchParams.set("official", "true");
  return parseResponse(await fetch(url.toString()));
}

export async function fetchCollection(id: string, token?: string | null): Promise<CollectionDetail> {
  return parseResponse(
    await fetch(`${BASE}/collection/${id}`, { headers: authHeader(token) })
  );
}

export async function createCollection(payload: CollectionFormPayload, token: string): Promise<MyCollectionSummary> {
  return parseResponse(
    await fetch(`${BASE}/collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function updateCollection(id: string, payload: Partial<CollectionFormPayload>, token: string): Promise<MyCollectionSummary> {
  return parseResponse(
    await fetch(`${BASE}/collection/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeader(token) },
      body: JSON.stringify(payload),
    })
  );
}

export async function deleteCollection(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/collection/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function fetchMyCollections(token: string): Promise<MyCollectionSummary[]> {
  return parseResponse(
    await fetch(`${BASE}/my-collections`, { headers: authHeader(token) })
  );
}

export async function toggleFollowCollection(id: string, token: string): Promise<{ following: boolean; followerCount: number }> {
  return parseResponse(
    await fetch(`${BASE}/collection/${id}/follow`, {
      method: "POST",
      headers: authHeader(token),
    })
  );
}

export async function addQuizToCollection(collectionId: string, quizId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/collection/${collectionId}/quizzes/${quizId}`, {
    method: "POST",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

export async function removeQuizFromCollection(collectionId: string, quizId: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/collection/${collectionId}/quizzes/${quizId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}
