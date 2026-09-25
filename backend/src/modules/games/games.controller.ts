import type { NextFunction, Request, Response } from "express";
import {
  GameNotFoundError,
  TableAlreadyClosedError,
  TableNotFoundError,
  gameStore,
  StockConflictError,
} from "./game.store";
import { recommendService } from "./recommend.service";
import {
  DIFFICULTY_LABELS,
  GAME_CATEGORIES,
  type GameCategory,
  type RecommendCriteria,
  type TableStatus,
} from "./game.types";

export class BadRequestError extends Error {
  constructor(public readonly details: string[]) {
    super(details.join("；"));
  }
}

function toInt(value: unknown, field: string, min: number, max: number): number {
  const num = typeof value === "string" ? Number(value.trim()) : Number(value);
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new BadRequestError([`${field}必须是 ${min}-${max} 之间的整数`]);
  }
  return num;
}

function toOptionalInt(value: unknown, field: string, min: number, max: number): number | null {
  if (value === undefined || value === null || value === "") return null;
  return toInt(value, field, min, max);
}

function parseGameBody(body: Record<string, unknown>, partial = false) {
  const out: Record<string, unknown> = {};
  const requirePresent = (key: string) => {
    if (!partial && (body[key] === undefined || body[key] === null)) {
      throw new BadRequestError([`缺少必填字段：${key}`]);
    }
  };

  requirePresent("name");
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) throw new BadRequestError(["名称不能为空"]);
    out.name = name;
  }

  requirePresent("category");
  if (body.category !== undefined) {
    const category = String(body.category) as GameCategory;
    if (!GAME_CATEGORIES.includes(category)) {
      throw new BadRequestError([`类型必须是：${GAME_CATEGORIES.join("/")}`]);
    }
    out.category = category;
  }

  requirePresent("minPlayers");
  if (body.minPlayers !== undefined) out.minPlayers = toInt(body.minPlayers, "最少人数", 1, 20);
  requirePresent("maxPlayers");
  if (body.maxPlayers !== undefined) out.maxPlayers = toInt(body.maxPlayers, "最多人数", 1, 20);
  requirePresent("durationMinutes");
  if (body.durationMinutes !== undefined) {
    out.durationMinutes = toInt(body.durationMinutes, "单局时长(分钟)", 1, 600);
  }
  requirePresent("difficulty");
  if (body.difficulty !== undefined) out.difficulty = toInt(body.difficulty, "难度", 1, 5);
  requirePresent("totalStock");
  if (body.totalStock !== undefined) out.totalStock = toInt(body.totalStock, "在库总份数", 0, 999);

  if (body.intro !== undefined) out.intro = String(body.intro);

  const minP = out.minPlayers as number | undefined;
  const maxP = out.maxPlayers as number | undefined;
  if (minP !== undefined && maxP !== undefined && minP > maxP) {
    throw new BadRequestError(["最少人数不能大于最多人数"]);
  }
  return out;
}

export const gamesController = {
  list(_request: Request, response: Response) {
    response.json({
      difficulties: DIFFICULTY_LABELS,
      categories: GAME_CATEGORIES,
      games: gameStore.listGames(),
    });
  },

  create(request: Request, response: Response, next: NextFunction) {
    try {
      const input = parseGameBody(request.body ?? {});
      const game = gameStore.addGame(input as never);
      response.status(201).json(game);
    } catch (error) {
      next(error);
    }
  },

  update(request: Request, response: Response, next: NextFunction) {
    try {
      const patch = parseGameBody(request.body ?? {}, true);
      const gameId = String(request.params.id);
      const game = gameStore.updateGame(gameId, patch as never);
      if (!game) throw new GameNotFoundError(gameId);
      response.json(game);
    } catch (error) {
      next(error);
    }
  },

  recommend(request: Request, response: Response, next: NextFunction) {
    try {
      const source = request.method === "GET" ? (request.query as Record<string, unknown>) : (request.body ?? {});

      const criteria: RecommendCriteria = {
        players: toInt(source.players, "人数", 1, 20),
        availableMinutes: toInt(source.availableMinutes ?? source.available_minutes, "可用分钟", 5, 600),
        preferredDifficulty: toOptionalInt(source.preferredDifficulty ?? source.preferred_difficulty, "偏好难度", 1, 5),
      };

      response.json(recommendService.recommend(criteria));
    } catch (error) {
      next(error);
    }
  },

  openTable(request: Request, response: Response, next: NextFunction) {
    try {
      const body = request.body ?? {};
      const gameId = String(body.gameId ?? request.params.gameId ?? "").trim();
      if (!gameId) throw new BadRequestError(["缺少 gameId"]);
      const players = toOptionalInt(body.players, "人数", 1, 20);
      const note = body.note ? String(body.note) : "";
      const table = gameStore.openTable(gameId, players, note);
      response.status(201).json(table);
    } catch (error) {
      next(error);
    }
  },

  closeTable(request: Request, response: Response, next: NextFunction) {
    try {
      const table = gameStore.closeTable(String(request.params.id));
      response.json(table);
    } catch (error) {
      next(error);
    }
  },

  listTables(request: Request, response: Response, next: NextFunction) {
    try {
      const status = (request.query.status as string | undefined) as TableStatus | undefined;
      if (status !== undefined && status !== "open" && status !== "closed") {
        throw new BadRequestError(['status 只能是 "open" 或 "closed"']);
      }
      response.json({ tables: gameStore.listTables(status) });
    } catch (error) {
      next(error);
    }
  },
};

export function gameErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (response.headersSent || error === undefined || error === null) {
    next(error);
    return;
  }

  if (error instanceof BadRequestError) {
    response.status(400).json({ error: "BadRequest", message: error.message, details: error.details });
    return;
  }
  if (error instanceof StockConflictError) {
    response.status(409).json({ error: "StockConflict", message: error.message });
    return;
  }
  if (error instanceof GameNotFoundError || error instanceof TableNotFoundError) {
    response.status(404).json({ error: "NotFound", message: error.message });
    return;
  }
  if (error instanceof TableAlreadyClosedError) {
    response.status(409).json({ error: "AlreadyClosed", message: error.message });
    return;
  }

  response.status(500).json({ error: "InternalError", message: "服务内部错误" });
}
