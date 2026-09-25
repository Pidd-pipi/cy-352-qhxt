import { Router } from "express";
import { body, param } from "express-validator";
import { createGame, listGames, recommendGames, updateGame } from "./games.controller";
import { DIFFICULTY_MAX, DIFFICULTY_MIN, GAME_CATEGORIES } from "./game.model";

export const gamesRouter = Router();

const gameBodyRules = [
  body("name").isString().trim().notEmpty().withMessage("名称必填").isLength({ max: 60 }),
  body("category").isIn(GAME_CATEGORIES).withMessage(`类型必须是 ${GAME_CATEGORIES.join("/")}`),
  body("minPlayers").isInt({ min: 1, max: 30 }).withMessage("最少人数需为 1–30 的整数").toInt(),
  body("maxPlayers")
    .isInt({ min: 1, max: 30 })
    .withMessage("最多人数需为 1–30 的整数")
    .custom((value, { req }) => value >= req.body.minPlayers)
    .withMessage("最多人数不能小于最少人数")
    .toInt(),
  body("durationMinutes").isInt({ min: 5, max: 720 }).withMessage("单局时长需为 5–720 分钟").toInt(),
  body("difficulty")
    .isInt({ min: DIFFICULTY_MIN, max: DIFFICULTY_MAX })
    .withMessage(`难度需为 ${DIFFICULTY_MIN}–${DIFFICULTY_MAX} 的整数`)
    .toInt(),
  body("totalCopies").isInt({ min: 0, max: 99 }).withMessage("总份数需为 0–99 的整数").toInt(),
  body("stock")
    .isInt({ min: 0, max: 99 })
    .withMessage("在库份数需为 0–99 的整数")
    .custom((value, { req }) => value <= req.body.totalCopies)
    .withMessage("在库份数不能大于总份数")
    .toInt(),
  body("description").optional({ nullable: true }).isString().isLength({ max: 300 }),
];

gamesRouter.get("/games", listGames);
gamesRouter.post("/games", gameBodyRules, createGame);
gamesRouter.put(
  "/games/:id",
  [param("id").isMongoId().withMessage("桌游 ID 不合法"), ...gameBodyRules],
  updateGame,
);

gamesRouter.post(
  "/recommendations",
  [
    body("partySize").isInt({ min: 1, max: 30 }).withMessage("人数需为 1–30 的整数").toInt(),
    body("availableMinutes").isInt({ min: 5, max: 720 }).withMessage("可用分钟需为 5–720 的整数").toInt(),
    body("preferredDifficulty")
      .optional({ nullable: true })
      .isInt({ min: DIFFICULTY_MIN, max: DIFFICULTY_MAX })
      .withMessage(`偏好难度需为 ${DIFFICULTY_MIN}–${DIFFICULTY_MAX} 或 null`)
      .toInt(),
  ],
  recommendGames,
);
