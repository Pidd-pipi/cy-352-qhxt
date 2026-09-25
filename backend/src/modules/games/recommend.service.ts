import { DIFFICULTY_LABELS } from "./game.types";
import type {
  CandidateView,
  ExcludedGameView,
  GameView,
  RecommendCriteria,
  RecommendResult,
} from "./game.types";
import { gameStore } from "./game.store";

export class RecommendService {
  recommend(criteria: RecommendCriteria): RecommendResult {
    const all = gameStore.listGames();
    const candidates: CandidateView[] = [];
    const excluded: ExcludedGameView[] = [];

    for (const game of all) {
      const reasons = this.exclusionReasons(game, criteria);
      if (reasons.length > 0) {
        excluded.push({ ...game, reasons });
        continue;
      }

      const playerFit =
        criteria.players >= game.minPlayers && criteria.players <= game.maxPlayers;
      const difficultyDistance =
        criteria.preferredDifficulty === null
          ? null
          : Math.abs(game.difficulty - criteria.preferredDifficulty);
      const timeMargin = criteria.availableMinutes - game.durationMinutes;

      candidates.push({
        ...game,
        fit: { playerFit, difficultyDistance, timeMargin },
        sortBasis: this.buildSortBasis(game, criteria, {
          playerFit,
          difficultyDistance,
          timeMargin,
        }),
      });
    }

    candidates.sort((a, b) => this.compare(a, b, criteria));

    return {
      criteria,
      sortRule: this.describeSortRule(criteria),
      candidates,
      excluded,
    };
  }

  /** 不可开原因：没库存优先于时长（两者可并存，全部列出） */
  private exclusionReasons(game: GameView, criteria: RecommendCriteria): string[] {
    const reasons: string[] = [];
    if (game.totalStock <= 0) {
      reasons.push("门店无库存（总份数为 0）");
    } else if (game.availableStock <= 0) {
      reasons.push(`在库 0 份（共 ${game.totalStock} 份，已全部开桌）`);
    }
    if (game.durationMinutes > criteria.availableMinutes) {
      reasons.push(
        `时长不够：单局约 ${game.durationMinutes} 分钟，超出可用 ${criteria.availableMinutes} 分钟 ${game.durationMinutes - criteria.availableMinutes} 分钟`,
      );
    }
    return reasons;
  }

  /**
   * 排序依据（按优先级）：
   * 1. 人数适配：人数落在标称区间的优先；区间外（已放宽推荐）越接近区间越靠前
   * 2. 难度偏好：与偏好难度差距越小越靠前
   * 3. 时长余量：单局时长与可用时间越贴合（余量越小且为正）越靠前
   * 4. 名称兜底，保证排序稳定
   */
  private compare(a: CandidateView, b: CandidateView, criteria: RecommendCriteria): number {
    // 1. 人数适配
    const playerA = this.playerGap(a, criteria.players);
    const playerB = this.playerGap(b, criteria.players);
    if (playerA !== playerB) return playerA - playerB;

    // 2. 难度偏好
    const diffA = a.fit.difficultyDistance ?? Number.MAX_SAFE_INTEGER;
    const diffB = b.fit.difficultyDistance ?? Number.MAX_SAFE_INTEGER;
    if (diffA !== diffB) return diffA - diffB;

    // 3. 时长余量（可开候选余量均 >= 0，越小越贴合）
    if (a.fit.timeMargin !== b.fit.timeMargin) {
      return a.fit.timeMargin - b.fit.timeMargin;
    }

    return a.name.localeCompare(b.name, "zh-Hans-CN");
  }

  /** 人数与适合区间的差距：区间内为 0，否则取到最近边界的距离 */
  private playerGap(game: GameView, players: number): number {
    if (players < game.minPlayers) return game.minPlayers - players;
    if (players > game.maxPlayers) return players - game.maxPlayers;
    return 0;
  }

  private buildSortBasis(
    game: GameView,
    criteria: RecommendCriteria,
    fit: CandidateView["fit"],
  ): string[] {
    const basis: string[] = [];

    if (fit.playerFit) {
      basis.push(`人数适配：${criteria.players} 人在 ${game.minPlayers}-${game.maxPlayers} 人区间内`);
    } else {
      const gap = this.playerGap(game, criteria.players);
      const direction = criteria.players < game.minPlayers ? "少于下限" : "超出上限";
      basis.push(`人数放宽：${criteria.players} 人${direction} ${gap} 人（适合 ${game.minPlayers}-${game.maxPlayers} 人）`);
    }

    if (fit.difficultyDistance === null) {
      basis.push(`难度 ${game.difficulty} 级（${DIFFICULTY_LABELS[game.difficulty]}），未指定偏好`);
    } else if (fit.difficultyDistance === 0) {
      basis.push(`难度匹配：${game.difficulty} 级（${DIFFICULTY_LABELS[game.difficulty]}）正中偏好`);
    } else {
      basis.push(`难度偏差 ${fit.difficultyDistance} 级：实际 ${game.difficulty} 级 vs 偏好 ${criteria.preferredDifficulty} 级`);
    }

    basis.push(`时长余量 ${fit.timeMargin} 分钟：单局 ${game.durationMinutes} 分钟 / 可用 ${criteria.availableMinutes} 分钟`);
    basis.push(`在库 ${game.availableStock} 份（共 ${game.totalStock} 份，已开 ${game.openCount} 桌）`);
    return basis;
  }

  private describeSortRule(criteria: RecommendCriteria): string {
    const difficulty =
      criteria.preferredDifficulty === null
        ? "不限"
        : `${criteria.preferredDifficulty} 级（${DIFFICULTY_LABELS[criteria.preferredDifficulty]}）`;
    return `按 ①人数适配（${criteria.players} 人）→ ②难度偏好（${difficulty}）→ ③时长余量（可用 ${criteria.availableMinutes} 分钟，越贴合越靠前）排序`;
  }
}

export const recommendService = new RecommendService();
