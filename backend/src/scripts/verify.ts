/**
 * 现场选游核心规则自检脚本：
 *   npx tsx src/scripts/verify.ts
 * 覆盖：排除原因、排序优先级、抢最后一份、结桌归还、重复结桌幂等。
 */
import { gameStore } from "../modules/games/game.store";
import { recommendService } from "../modules/games/recommend.service";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${message}`);
  } else {
    failed += 1;
    console.error(`  ❌ ${message}`);
  }
}

const game = gameStore.addGame({
  name: "自检专用游戏",
  category: "策略",
  minPlayers: 2,
  maxPlayers: 4,
  durationMinutes: 30,
  difficulty: 2,
  totalStock: 1,
  intro: "",
});

console.log("1) 无库存 / 时长不够 应给出明确原因");
{
  const out = recommendService.recommend({ players: 3, availableMinutes: 10, preferredDifficulty: 2 });
  const self = out.excluded.find((item) => item.id === game.id);
  assert(!!self, "时长不够时进入排除列表");
  assert(self?.reasons.some((r) => r.includes("时长不够")) === true, "原因包含「时长不够」");

  const zeroStockGame = gameStore.addGame({
    name: "自检缺货游戏",
    category: "卡牌",
    minPlayers: 2,
    maxPlayers: 5,
    durationMinutes: 20,
    difficulty: 1,
    totalStock: 0,
  });
  const out2 = recommendService.recommend({ players: 3, availableMinutes: 60, preferredDifficulty: null });
  const z = out2.excluded.find((item) => item.id === zeroStockGame.id);
  assert(z?.reasons.some((r) => r.includes("无库存")) === true, "零库存原因包含「无库存」");
}

console.log("2) 排序：人数适配 > 难度偏好 > 时长余量");
{
  const out = recommendService.recommend({ players: 4, availableMinutes: 60, preferredDifficulty: 2 });
  const names = out.candidates.map((c) => c.name);
  const selfIndex = names.indexOf("自检专用游戏");
  // 同为区间内 + 难度 2 + 时长 30 时，应排在区间外或难度更远的候选之前
  assert(selfIndex >= 0, "自检游戏出现在候选中");
  assert(out.candidates[0].fit.playerFit === true, "榜首候选人数落在适合区间内");
}

console.log("3) 两人抢最后一份：只能开一桌");
{
  const a = gameStore.openTable(game.id, 3, "");
  let conflict: unknown = null;
  try {
    gameStore.openTable(game.id, 4, "");
  } catch (error) {
    conflict = error;
  }
  assert(a.availableStock === 0, "先开桌成功后在库为 0");
  assert(conflict !== null, "第二个开桌请求被拒绝");

  console.log("4) 结桌归还 1 份，重复结桌不再加库存");
  const closed = gameStore.closeTable(a.id);
  assert(closed.status === "closed" && closed.availableStock === 1, "结桌后库存恢复为 1");

  let repeated: unknown = null;
  try {
    gameStore.closeTable(a.id);
  } catch (error) {
    repeated = error;
  }
  assert(repeated !== null, "重复结桌被拒绝");
  const view = gameStore.listGames().find((item) => item.id === game.id);
  assert(view?.availableStock === 1, "重复结桌后库存仍为 1（未多加）");
}

console.log(`\n结果：${passed} 通过 / ${failed} 失败`);
if (failed > 0) process.exit(1);
