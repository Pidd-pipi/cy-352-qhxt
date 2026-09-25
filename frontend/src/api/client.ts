import { API_BASE_URL } from "../constants/app";
import type {
  GameItem,
  GamePayload,
  RecommendationResult,
  RecommendInput,
  TableSessionItem,
} from "../types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  const data = (await response.json().catch(() => ({}))) as { message?: string };
  if (!response.ok) {
    throw new ApiError(response.status, data.message ?? `请求失败（${response.status}）`);
  }
  return data as T;
}

export async function checkHealth(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/health`, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`health check failed: ${response.status}`);
  }
}

export function fetchGames(): Promise<{ games: GameItem[] }> {
  return request("/games");
}

export function createGame(payload: GamePayload): Promise<{ game: GameItem }> {
  return request("/games", { method: "POST", body: JSON.stringify(payload) });
}

export function updateGame(id: string, payload: GamePayload): Promise<{ game: GameItem }> {
  return request(`/games/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function fetchRecommendation(input: RecommendInput): Promise<RecommendationResult> {
  return request("/recommendations", { method: "POST", body: JSON.stringify(input) });
}

export function fetchOpenTables(): Promise<{ sessions: TableSessionItem[] }> {
  return request("/tables?status=open");
}

export function openTable(gameId: string, partySize: number): Promise<{ session: TableSessionItem }> {
  return request("/tables", { method: "POST", body: JSON.stringify({ gameId, partySize }) });
}

export function closeTable(sessionId: string): Promise<{ session: TableSessionItem; alreadyClosed: boolean }> {
  return request(`/tables/${sessionId}/close`, { method: "POST" });
}
