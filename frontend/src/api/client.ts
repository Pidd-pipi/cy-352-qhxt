import { API_BASE_URL } from "../constants/app";
import type { OverviewResponse } from "../types";

async function parseError(response: Response): Promise<Error> {
  let message = `请求失败（${response.status}）`;
  try {
    const data = await response.json();
    if (data?.message) message = data.message;
  } catch {
    // 忽略非 JSON 错误体
  }
  return new Error(message);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    ...init,
  });
  if (!response.ok) throw await parseError(response);
  return response.json() as Promise<T>;
}

export async function fetchOverview(): Promise<OverviewResponse> {
  return request<OverviewResponse>("/overview");
}

// ===== 桌游库 =====

export async function fetchGames() {
  return request<import("../types").GameListResponse>("/games");
}

export async function createGame(input: import("../types").GameInput) {
  return request<import("../types").Game>("/games", { method: "POST", body: JSON.stringify(input) });
}

export async function updateGame(id: string, patch: Partial<import("../types").GameInput>) {
  return request<import("../types").Game>(`/games/${id}`, { method: "PUT", body: JSON.stringify(patch) });
}

// ===== 现场选游 =====

export async function fetchRecommend(criteria: import("../types").RecommendCriteria) {
  return request<import("../types").RecommendResult>("/recommend", {
    method: "POST",
    body: JSON.stringify(criteria),
  });
}

// ===== 桌台 =====

export async function fetchTables(status?: import("../types").TableStatus) {
  const query = status ? `?status=${status}` : "";
  return request<import("../types").TableListResponse>(`/tables${query}`);
}

export async function openTable(gameId: string, players?: number | null) {
  return request<import("../types").TableRecord>("/tables", {
    method: "POST",
    body: JSON.stringify({ gameId, players: players ?? null }),
  });
}

export async function closeTable(tableId: string) {
  return request<import("../types").TableRecord>(`/tables/${tableId}/close`, { method: "POST" });
}
