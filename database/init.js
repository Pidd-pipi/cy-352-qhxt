// 参考初始化脚本：后端启动时会在空库情况下自动写入同样的种子数据，
// 本文件用于需要手动初始化/重置桌游库的场景：
//   mongosh "mongodb://app:app_pwd@localhost:27017/app?authSource=admin" database/init.js

db.createCollection("games");
db.games.createIndex({ name: 1 }, { unique: true });

db.games.insertMany([
  { name: "卡坦岛", category: "策略", minPlayers: 3, maxPlayers: 4, durationMinutes: 90, difficulty: 3, totalCopies: 3, stock: 3, description: "经典资源交易与拓荒策略游戏。", createdAt: new Date(), updatedAt: new Date() },
  { name: "璀璨宝石", category: "策略", minPlayers: 2, maxPlayers: 4, durationMinutes: 30, difficulty: 2, totalCopies: 2, stock: 2, description: "轻量引擎构筑，上手快。", createdAt: new Date(), updatedAt: new Date() },
  { name: "农场主", category: "策略", minPlayers: 1, maxPlayers: 5, durationMinutes: 150, difficulty: 5, totalCopies: 1, stock: 1, description: "重度德式经营，单局时间较长。", createdAt: new Date(), updatedAt: new Date() },
  { name: "阿瓦隆", category: "聚会", minPlayers: 5, maxPlayers: 10, durationMinutes: 30, difficulty: 2, totalCopies: 4, stock: 4, description: "身份推理嘴炮局，无需主持。", createdAt: new Date(), updatedAt: new Date() },
  { name: "狼人杀", category: "聚会", minPlayers: 6, maxPlayers: 12, durationMinutes: 45, difficulty: 2, totalCopies: 3, stock: 3, description: "门店人气聚会推理游戏。", createdAt: new Date(), updatedAt: new Date() },
  { name: "花火", category: "聚会", minPlayers: 2, maxPlayers: 5, durationMinutes: 25, difficulty: 2, totalCopies: 2, stock: 2, description: "合作放烟花，信息受限沟通。", createdAt: new Date(), updatedAt: new Date() },
  { name: "UNO", category: "卡牌", minPlayers: 2, maxPlayers: 10, durationMinutes: 15, difficulty: 1, totalCopies: 5, stock: 5, description: "随时开一局的经典卡牌。", createdAt: new Date(), updatedAt: new Date() },
  { name: "三国杀", category: "卡牌", minPlayers: 4, maxPlayers: 10, durationMinutes: 60, difficulty: 3, totalCopies: 2, stock: 0, description: "身份阵营卡牌对抗（当前全部开桌中）。", createdAt: new Date(), updatedAt: new Date() },
  { name: "剧本杀·年轮", category: "角色扮演", minPlayers: 5, maxPlayers: 6, durationMinutes: 240, difficulty: 4, totalCopies: 1, stock: 1, description: "硬核还原本，需要完整下午。", createdAt: new Date(), updatedAt: new Date() },
]);

db.createCollection("tablesessions");
