import cors from "cors";
import express from "express";
import helmet from "helmet";
import { gameErrorHandler } from "./modules/games/games.controller";
import { gamesRouter } from "./modules/games/games.routes";
import { overviewRouter } from "./modules/overview/overview.routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => response.json({ status: "ok" }));
app.get("/api/health", (_request, response) => response.json({ status: "ok" }));

// 同时挂载在根路径与 /api 下，与既有 overview 路由保持一致
app.use("/", gamesRouter);
app.use("/api", gamesRouter);
app.use("/", overviewRouter);
app.use("/api", overviewRouter);

app.use(gameErrorHandler);
