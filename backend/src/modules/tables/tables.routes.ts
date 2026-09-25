import { Router } from "express";
import { body, param } from "express-validator";
import { closeTable, listTables, openTable } from "./tables.controller";

export const tablesRouter = Router();

tablesRouter.get("/tables", listTables);

tablesRouter.post(
  "/tables",
  [
    body("gameId").isMongoId().withMessage("桌游 ID 不合法"),
    body("partySize").isInt({ min: 1, max: 30 }).withMessage("人数需为 1–30 的整数").toInt(),
  ],
  openTable,
);

tablesRouter.post("/tables/:id/close", [param("id").isMongoId().withMessage("开桌记录 ID 不合法")], closeTable);
