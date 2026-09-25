import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { AppError, ERROR_MESSAGES } from "../../common/errors";
import { TablesService } from "./tables.service";
import type { TableSessionStatus } from "./table-session.model";

const service = new TablesService();

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

export const listTables = wrap(async (request, response) => {
  const status = request.query.status as TableSessionStatus | undefined;
  const sessions = await service.listSessions(status === "open" || status === "closed" ? status : undefined);
  response.json({ sessions });
});

export const openTable = wrap(async (request, response) => {
  ensureValid(request);
  const session = await service.openTable(String(request.body.gameId), Number(request.body.partySize));
  response.status(201).json({ session });
});

export const closeTable = wrap(async (request, response) => {
  ensureValid(request);
  const result = await service.closeTable(String(request.params.id));
  response.json(result);
});
