import { randomUUID } from "crypto";
import type {
  GameInput,
  GameRecord,
  GameView,
  TableRecord,
  TableStatus,
  TableView,
} from "./game.types";

/**
 * 进程内内存仓储。
 * Node 单线程事件循环下，下列同步方法不会被并发请求穿插执行，
 * 「查库存 -> 扣库存」因此天然原子：两人同时抢最后一份，只有先执行的请求能开桌。
 */
class GameStore {
  private games = new Map<string, GameRecord>();
  private tables = new Map<string, TableRecord>();

  constructor() {
    this.seed();
  }

  private seed() {
    const seeds: GameInput[] = [
      { name: "璀璨宝石", category: "策略", minPlayers: 2, maxPlayers: 4, durationMinutes: 30, difficulty: 2, totalStock: 2, intro: "宝石交易与引擎构筑的经典轻策。" },
      { name: "卡坦岛", category: "策略", minPlayers: 3, maxPlayers: 4, durationMinutes: 75, difficulty: 3, totalStock: 1, intro: "拓荒、交易与资源博弈。" },
      { name: "狼人杀", category: "聚会", minPlayers: 6, maxPlayers: 12, durationMinutes: 45, difficulty: 2, totalStock: 3, intro: "身份推理聚会必备。" },
      { name: "UNO", category: "卡牌", minPlayers: 2, maxPlayers: 10, durationMinutes: 15, difficulty: 1, totalStock: 4, intro: "随时开局的欢乐卡牌。" },
      { name: "电力公司", category: "策略", minPlayers: 2, maxPlayers: 6, durationMinutes: 120, difficulty: 4, totalStock: 1, intro: "电厂竞拍与电网建设的中重策。" },
      { name: "剧本杀·迷雾镇", category: "角色扮演", minPlayers: 5, maxPlayers: 8, durationMinutes: 180, difficulty: 3, totalStock: 2, intro: "沉浸式推理剧本。" },
      { name: "只言片语", category: "聚会", minPlayers: 3, maxPlayers: 6, durationMinutes: 30, difficulty: 1, totalStock: 2, intro: "看图说话的想象力派对游戏。" },
      { name: "农场主", category: "策略", minPlayers: 1, maxPlayers: 5, durationMinutes: 90, difficulty: 4, totalStock: 1, intro: "经营家庭农场的工人放置名作。" },
      { name: "风声", category: "卡牌", minPlayers: 3, maxPlayers: 7, durationMinutes: 40, difficulty: 3, totalStock: 0, intro: "谍战阵营卡牌，当前缺货。" },
    ];
    for (const input of seeds) {
      this.addGame(input);
    }
  }

  addGame(input: GameInput): GameRecord {
    const now = new Date().toISOString();
    const record: GameRecord = {
      id: randomUUID(),
      name: input.name,
      category: input.category,
      minPlayers: input.minPlayers,
      maxPlayers: input.maxPlayers,
      durationMinutes: input.durationMinutes,
      difficulty: input.difficulty,
      totalStock: input.totalStock,
      intro: input.intro ?? "",
      createdAt: now,
    };
    this.games.set(record.id, record);
    return record;
  }

  updateGame(id: string, patch: Partial<GameInput>): GameRecord | null {
    const current = this.games.get(id);
    if (!current) return null;

    // 在库份数不能被未归还的开桌占用而变负
    const openCount = this.countOpenByGame(id);
    if (
      patch.totalStock !== undefined &&
      patch.totalStock < openCount
    ) {
      throw new StockConflictError(
        `有 ${openCount} 桌正在使用该游戏，总份数不能低于 ${openCount}`,
      );
    }

    const next: GameRecord = { ...current, ...patch, id };
    this.games.set(id, next);
    return next;
  }

  getGame(id: string): GameRecord | null {
    return this.games.get(id) ?? null;
  }

  listGames(): GameView[] {
    return [...this.games.values()].map((game) => this.decorate(game));
  }

  /** 原子开桌：库存为 0 时拒绝，保证最后一份只够一桌 */
  openTable(gameId: string, players: number | null, note: string): TableView {
    const game = this.games.get(gameId);
    if (!game) throw new GameNotFoundError(gameId);

    const openCount = this.countOpenByGame(gameId);
    if (openCount >= game.totalStock) {
      throw new StockConflictError(`《${game.name}》在库份数不足（剩余 0 / 共 ${game.totalStock} 份）`);
    }

    const record: TableRecord = {
      id: randomUUID(),
      gameId,
      players,
      note,
      status: "open",
      openedAt: new Date().toISOString(),
      closedAt: null,
    };
    this.tables.set(record.id, record);
    return this.decorateTable(record);
  }

  /** 结桌归还：仅进行中的桌会恢复一份库存；重复结桌幂等、不再加库存 */
  closeTable(tableId: string): TableView {
    const table = this.tables.get(tableId);
    if (!table) throw new TableNotFoundError(tableId);
    if (table.status === "closed") {
      throw new TableAlreadyClosedError(tableId);
    }
    const closed: TableRecord = {
      ...table,
      status: "closed" as TableStatus,
      closedAt: new Date().toISOString(),
    };
    this.tables.set(tableId, closed);
    return this.decorateTable(closed);
  }

  listTables(status?: TableStatus): TableView[] {
    return [...this.tables.values()]
      .filter((table) => (status ? table.status === status : true))
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt))
      .map((table) => this.decorateTable(table));
  }

  private countOpenByGame(gameId: string): number {
    let count = 0;
    for (const table of this.tables.values()) {
      if (table.gameId === gameId && table.status === "open") count += 1;
    }
    return count;
  }

  private decorate(game: GameRecord): GameView {
    const openCount = this.countOpenByGame(game.id);
    return { ...game, openCount, availableStock: game.totalStock - openCount };
  }

  private decorateTable(table: TableRecord): TableView {
    const game = this.games.get(table.gameId);
    const totalStock = game?.totalStock ?? 0;
    return {
      ...table,
      gameName: game?.name ?? "（已删除的桌游）",
      totalStock,
      availableStock: totalStock - this.countOpenByGame(table.gameId),
    };
  }
}

export class GameNotFoundError extends Error {
  constructor(public readonly gameId: string) {
    super(`桌游不存在：${gameId}`);
  }
}

export class TableNotFoundError extends Error {
  constructor(public readonly tableId: string) {
    super(`桌台不存在：${tableId}`);
  }
}

export class StockConflictError extends Error {}

export class TableAlreadyClosedError extends Error {
  constructor(public readonly tableId: string) {
    super(`桌台 ${tableId} 已结桌，不能重复归还库存`);
  }
}

export const gameStore = new GameStore();
