export interface GameItem {
  id: string;
  name: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: number;
  totalCopies: number;
  stock: number;
  description: string;
}

export interface GamePayload {
  name: string;
  category: string;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: number;
  totalCopies: number;
  stock: number;
  description: string;
}

export interface RecommendInput {
  partySize: number;
  availableMinutes: number;
  /** null 表示不限难度 */
  preferredDifficulty: number | null;
}

export interface CandidateItem {
  game: GameItem;
  playerFit: boolean;
  difficultyGap: number | null;
  timeSlackMinutes: number;
  basis: string[];
}

export interface ExcludedItem {
  game: GameItem;
  reasons: string[];
}

export interface RecommendationResult {
  input: RecommendInput;
  candidates: CandidateItem[];
  excluded: ExcludedItem[];
}

export interface TableSessionItem {
  id: string;
  gameId: string;
  gameName: string;
  partySize: number;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
}
