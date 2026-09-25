export interface FeatureItem {
  id: number;
  title: string;
  description: string;
  status: string;
  metric: string;
}

export interface KpiItem {
  label: string;
  value: string;
  trend: string;
  tone: string;
}

export interface OperationRecord {
  key: string;
  name: string;
  owner: string;
  status: string;
  metric: string;
  priority: string;
}

export interface OverviewResponse {
  appName: string;
  appCode: string;
  description: string;
  features: FeatureItem[];
  kpis: KpiItem[];
  records: OperationRecord[];
}

// ===== 现场选游 =====

export type GameCategory = "策略" | "聚会" | "卡牌" | "角色扮演";

export interface Game {
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
  openCount: number;
  availableStock: number;
}

export interface GameListResponse {
  difficulties: Record<string, string>;
  categories: GameCategory[];
  games: Game[];
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

export interface CandidateFit {
  playerFit: boolean;
  difficultyDistance: number | null;
  timeMargin: number;
}

export interface Candidate extends Game {
  fit: CandidateFit;
  sortBasis: string[];
}

export interface ExcludedGame extends Game {
  reasons: string[];
}

export interface RecommendCriteria {
  players: number;
  availableMinutes: number;
  preferredDifficulty: number | null;
}

export interface RecommendResult {
  criteria: RecommendCriteria;
  sortRule: string;
  candidates: Candidate[];
  excluded: ExcludedGame[];
}

export type TableStatus = "open" | "closed";

export interface TableRecord {
  id: string;
  gameId: string;
  gameName: string;
  players: number | null;
  note: string;
  status: TableStatus;
  openedAt: string;
  closedAt: string | null;
  totalStock: number;
  availableStock: number;
}

export interface TableListResponse {
  tables: TableRecord[];
}

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}
