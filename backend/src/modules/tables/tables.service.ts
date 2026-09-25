import { AppError, ERROR_MESSAGES } from "../../common/errors";
import { GameModel } from "../games/game.model";
import {
  TableSessionModel,
  toTableSessionDto,
  type TableSessionDto,
  type TableSessionStatus,
} from "./table-session.model";

export interface CloseTableResult {
  session: TableSessionDto;
  /** true 表示这桌之前已经结过，本次是重复结桌，库存不再增加 */
  alreadyClosed: boolean;
}

export class TablesService {
  async listSessions(status?: TableSessionStatus): Promise<TableSessionDto[]> {
    const filter = status ? { status } : {};
    const docs = await TableSessionModel.find(filter).sort({ openedAt: -1 }).limit(100).exec();
    return docs.map(toTableSessionDto);
  }

  /**
   * 开桌：用「stock > 0」条件原子扣减库存。
   * 两人同时抢最后一份时，只有一个请求能匹配到条件并扣减成功，
   * 另一个匹配不到文档，直接返回 409，保证只能开一桌。
   */
  async openTable(gameId: string, partySize: number): Promise<TableSessionDto> {
    const game = await GameModel.findOneAndUpdate(
      { _id: gameId, stock: { $gt: 0 } },
      { $inc: { stock: -1 } },
      { new: true },
    ).exec();

    if (!game) {
      const exists = await GameModel.exists({ _id: gameId });
      throw new AppError(exists ? 409 : 404, exists ? ERROR_MESSAGES.outOfStock : ERROR_MESSAGES.gameNotFound);
    }

    try {
      const session = await TableSessionModel.create({
        game: game._id,
        gameName: game.name,
        partySize,
        status: "open",
        openedAt: new Date(),
        closedAt: null,
      });
      return toTableSessionDto(session);
    } catch (error) {
      // 建档失败时把扣掉的库存还回去，避免库存漏损
      await GameModel.updateOne({ _id: game._id }, { $inc: { stock: 1 } }).exec();
      throw error;
    }
  }

  /**
   * 结桌：用「status = open」条件原子置为 closed。
   * 只有第一次结桌能更新成功并归还一份库存；
   * 重复结桌匹配不到 open 记录，不再加库存，幂等返回。
   */
  async closeTable(sessionId: string): Promise<CloseTableResult> {
    const session = await TableSessionModel.findOneAndUpdate(
      { _id: sessionId, status: "open" },
      { $set: { status: "closed", closedAt: new Date() } },
      { new: true },
    ).exec();

    if (!session) {
      const existing = await TableSessionModel.findById(sessionId).exec();
      if (!existing) {
        throw new AppError(404, ERROR_MESSAGES.sessionNotFound);
      }
      return { session: toTableSessionDto(existing), alreadyClosed: true };
    }

    await GameModel.updateOne({ _id: session.game }, { $inc: { stock: 1 } }).exec();
    return { session: toTableSessionDto(session), alreadyClosed: false };
  }
}
