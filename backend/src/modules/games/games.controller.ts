import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppError, ERROR_MESSAGES } from "../../common/errors";
import { GamesService } from "./games.service";
import type { RecommendInput } from "./recommendation";

const service = new GamesService();

function ensureValid(request: Request) {
  const result = validationResult(request);
  if (!result.isEmpty()) {
    const details = result
      .array()
      .map((item) => item.msg)
      .join("；");
    throw new AppError(400, `${ERROR_MESSAGES.validationFailed}：${details}`);
  }
}

function wrap(handler: (request: Request, response: Response) => Promise<void>) {
  return (request: Request, response: Response, next: NextFunction) => {
    handler(request, response).catch(next);
  };
}

export const listGames = wrap(async (_request, response) => {
  const games = await service.listGames();
  response.json({ games });
});

export const createGame = wrap(async (request, response) => {
  ensureValid(request);
  const game = await service.createGame(request.body);
  response.status(201).json({ game });
});

export const updateGame = wrap(async (request, response) => {
  ensureValid(request);
  const game = await service.updateGame(String(request.params.id), request.body);
  response.json({ game });
});

export const recommendGames = wrap(async (request, response) => {
  ensureValid(request);
  const input: RecommendInput = {
    partySize: Number(request.body.partySize),
    availableMinutes: Number(request.body.availableMinutes),
    preferredDifficulty:
      request.body.preferredDifficulty === null || request.body.preferredDifficulty === undefined
        ? null
        : Number(request.body.preferredDifficulty),
  };
  const result = await service.recommend(input);
  response.json(result);
});
