import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import helmet from "helmet";
import { AppError, ERROR_MESSAGES } from "./common/errors";
import { logger } from "./common/logger";
import { gamesRouter } from "./modules/games/games.routes";
import { overviewRouter } from "./modules/overview/overview.routes";
import { tablesRouter } from "./modules/tables/tables.routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

// 业务路由同时挂在 /api 与 /：nginx 与 vite 代理会剥掉 /api 前缀，直连后端时则带前缀访问
app.use("/", overviewRouter, gamesRouter, tablesRouter);
app.use("/api", overviewRouter, gamesRouter, tablesRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "接口不存在" });
});

// 统一错误处理：AppError 按 statusCode 返回，其余按 500
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }
  if (error instanceof Error && error.name === "CastError") {
    response.status(400).json({ message: `${ERROR_MESSAGES.validationFailed}：ID 格式不正确` });
    return;
  }
  logger.error(error instanceof Error ? error.stack ?? error.message : String(error));
  response.status(500).json({ message: ERROR_MESSAGES.internal });
});
