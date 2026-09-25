import { GameModel, type GameAttrs } from "../modules/games/game.model";
import { logger } from "../common/logger";

const seedGames: GameAttrs[] = [
  { name: "卡坦岛", category: "策略", minPlayers: 3, maxPlayers: 4, durationMinutes: 90, difficulty: 3, totalCopies: 3, stock: 3, description: "经典资源交易与拓荒策略游戏。" },
  { name: "璀璨宝石", category: "策略", minPlayers: 2, maxPlayers: 4, durationMinutes: 30, difficulty: 2, totalCopies: 2, stock: 2, description: "轻量引擎构筑，上手快。" },
  { name: "农场主", category: "策略", minPlayers: 1, maxPlayers: 5, durationMinutes: 150, difficulty: 5, totalCopies: 1, stock: 1, description: "重度德式经营，单局时间较长。" },
  { name: "阿瓦隆", category: "聚会", minPlayers: 5, maxPlayers: 10, durationMinutes: 30, difficulty: 2, totalCopies: 4, stock: 4, description: "身份推理嘴炮局，无需主持。" },
  { name: "狼人杀", category: "聚会", minPlayers: 6, maxPlayers: 12, durationMinutes: 45, difficulty: 2, totalCopies: 3, stock: 3, description: "门店人气聚会推理游戏。" },
  { name: "花火", category: "聚会", minPlayers: 2, maxPlayers: 5, durationMinutes: 25, difficulty: 2, totalCopies: 2, stock: 2, description: "合作放烟花，信息受限沟通。" },
  { name: "UNO", category: "卡牌", minPlayers: 2, maxPlayers: 10, durationMinutes: 15, difficulty: 1, totalCopies: 5, stock: 5, description: "随时开一局的经典卡牌。" },
  { name: "三国杀", category: "卡牌", minPlayers: 4, maxPlayers: 10, durationMinutes: 60, difficulty: 3, totalCopies: 2, stock: 0, description: "身份阵营卡牌对抗（当前全部开桌中）。" },
  { name: "剧本杀·年轮", category: "角色扮演", minPlayers: 5, maxPlayers: 6, durationMinutes: 240, difficulty: 4, totalCopies: 1, stock: 1, description: "硬核还原本，需要完整下午。" },
];

/** 空库时写入示例桌游，保证现场选游开箱可用；已有数据则跳过。 */
export async function seedGamesIfEmpty(): Promise<void> {
  const count = await GameModel.estimatedDocumentCount();
  if (count > 0) {
    logger.info(`games collection already has ${count} docs, skip seeding`);
    return;
  }
  await GameModel.insertMany(seedGames);
  logger.info(`seeded ${seedGames.length} games`);
}
