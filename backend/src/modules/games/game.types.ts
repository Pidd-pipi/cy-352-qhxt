export const GAME_CATEGORIES = ["策略", "聚会", "卡牌", "角色扮演"] as const;
export type GameCategory = (typeof GAME_CATEGORIES)[number];

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "入门",
  2: "轻度",
  3: "中等",
  4: "进阶",
  5: "硬核",
};

export interface GameRecord {
  id: string;
  name: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: number;
  totalStock: number;
  intro: string;
  createdAt: string;
}

export interface GameInput {
  name: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: number;
  totalStock: number;
  intro?: string;
}

/** 面向前端的桌游视图：附带在开桌数与可开（在库）份数 */
export interface GameView extends GameRecord {
  openCount: number;
  availableStock: number;
}

export type TableStatus = "open" | "closed";

export interface TableRecord {
  id: string;
  gameId: string;
  players: number | null;
  note: string;
  status: TableStatus;
  openedAt: string;
  closedAt: string | null;
}

export interface TableView extends TableRecord {
  gameName: string;
  totalStock: number;
  availableStock: number;
}

export interface RecommendCriteria {
  players: number;
  availableMinutes: number;
  preferredDifficulty: number | null;
}

export interface CandidateFit {
  playerFit: boolean;
  difficultyDistance: number | null;
  timeMargin: number;
}

export interface CandidateView extends GameView {
  fit: CandidateFit;
  sortBasis: string[];
}

export interface ExcludedGameView extends GameView {
  reasons: string[];
}

export interface RecommendResult {
  criteria: RecommendCriteria;
  sortRule: string;
  candidates: CandidateView[];
  excluded: ExcludedGameView[];
}
