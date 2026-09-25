import type { GameDto } from "./game.model";

export interface RecommendInput {
  partySize: number;
  availableMinutes: number;
  /** null 表示不限难度 */
  preferredDifficulty: number | null;
}

export interface CandidateItem {
  game: GameDto;
  /** 人数是否落在适合区间内 */
  playerFit: boolean;
  /** 与偏好难度的差距，未设偏好时为 null */
  difficultyGap: number | null;
  /** 可用时间减去单局时长的余量（分钟） */
  timeSlackMinutes: number;
  /** 排序依据，按排序键顺序给出，前端直接展示 */
  basis: string[];
}

export interface ExcludedItem {
  game: GameDto;
  reasons: string[];
}

export interface RecommendationResult {
  input: RecommendInput;
  candidates: CandidateItem[];
  excluded: ExcludedItem[];
}

function playerRangeLabel(game: GameDto): string {
  return `${game.minPlayers}–${game.maxPlayers} 人`;
}

/**
 * 现场选游推荐：
 * - 无库存、单局时长超过可用时间的桌游进入 excluded 并给出原因；
 * - 其余进入 candidates，依次按 人数适配 → 难度偏好差距 → 时长余量 排序。
 */
export function buildRecommendation(games: GameDto[], input: RecommendInput): RecommendationResult {
  const candidates: CandidateItem[] = [];
  const excluded: ExcludedItem[] = [];

  for (const game of games) {
    const reasons: string[] = [];
    if (game.stock <= 0) {
      reasons.push(`在库 0 份（共 ${game.totalCopies} 份全部开桌中）`);
    }
    if (game.durationMinutes > input.availableMinutes) {
      reasons.push(`单局 ${game.durationMinutes} 分钟，超出可用 ${input.availableMinutes} 分钟`);
    }
    if (reasons.length > 0) {
      excluded.push({ game, reasons });
      continue;
    }

    const playerFit = input.partySize >= game.minPlayers && input.partySize <= game.maxPlayers;
    const difficultyGap =
      input.preferredDifficulty === null ? null : Math.abs(game.difficulty - input.preferredDifficulty);
    const timeSlackMinutes = input.availableMinutes - game.durationMinutes;

    const basis: string[] = [
      playerFit
        ? `人数适配：${input.partySize} 人在 ${playerRangeLabel(game)} 区间内`
        : `人数不适配：适合 ${playerRangeLabel(game)}，当前 ${input.partySize} 人`,
      difficultyGap === null
        ? `难度 ${game.difficulty}（未设偏好）`
        : difficultyGap === 0
          ? `难度 ${game.difficulty}，正好匹配偏好`
          : `难度 ${game.difficulty}，与偏好差 ${difficultyGap}`,
      `时长余量 ${timeSlackMinutes} 分钟（单局 ${game.durationMinutes} 分钟）`,
    ];

    candidates.push({ game, playerFit, difficultyGap, timeSlackMinutes, basis });
  }

  candidates.sort((a, b) => {
    // 1. 人数适配优先
    const fitOrder = Number(b.playerFit) - Number(a.playerFit);
    if (fitOrder !== 0) return fitOrder;
    // 2. 难度偏好差距小者优先（未设偏好时差距视为 0）
    const gapOrder = (a.difficultyGap ?? 0) - (b.difficultyGap ?? 0);
    if (gapOrder !== 0) return gapOrder;
    // 3. 时长余量小者优先：可用时间利用得更充分
    const slackOrder = a.timeSlackMinutes - b.timeSlackMinutes;
    if (slackOrder !== 0) return slackOrder;
    return a.game.name.localeCompare(b.game.name, "zh-Hans-CN");
  });

  // 被排除的按名称排序，便于前台扫读
  excluded.sort((a, b) => a.game.name.localeCompare(b.game.name, "zh-Hans-CN"));

  return { input, candidates, excluded };
}
