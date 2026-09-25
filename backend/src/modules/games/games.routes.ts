import { Router } from "express";
import { gamesController } from "./games.controller";

export const gamesRouter = Router();

// 桌游库（管理员维护）
gamesRouter.get("/games", gamesController.list);
gamesRouter.post("/games", gamesController.create);
gamesRouter.put("/games/:id", gamesController.update);

// 现场选游：录入人数 / 可用分钟 / 偏好难度，返回候选与不可开原因
gamesRouter.get("/recommend", gamesController.recommend);
gamesRouter.post("/recommend", gamesController.recommend);

// 桌台：开桌扣库存、结桌归还
gamesRouter.get("/tables", gamesController.listTables);
gamesRouter.post("/games/:gameId/tables", gamesController.openTable);
gamesRouter.post("/tables", gamesController.openTable);
gamesRouter.post("/tables/:id/close", gamesController.closeTable);
