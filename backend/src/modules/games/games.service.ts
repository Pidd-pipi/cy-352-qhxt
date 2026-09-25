import { AppError } from "../../common/errors";
import { GameModel, toGameDto, type GameAttrs, type GameDto } from "./game.model";
import { buildRecommendation, type RecommendInput, type RecommendationResult } from "./recommendation";

export class GamesService {
  async listGames(): Promise<GameDto[]> {
    const docs = await GameModel.find().sort({ category: 1, name: 1 }).exec();
    return docs.map(toGameDto);
  }

  async createGame(attrs: GameAttrs): Promise<GameDto> {
    const doc = await GameModel.create(attrs);
    return toGameDto(doc);
  }

  async updateGame(id: string, attrs: Partial<GameAttrs>): Promise<GameDto> {
    const doc = await GameModel.findByIdAndUpdate(id, attrs, { new: true, runValidators: true }).exec();
    if (!doc) {
      throw new AppError(404, "桌游不存在或已被删除");
    }
    return toGameDto(doc);
  }

  async recommend(input: RecommendInput): Promise<RecommendationResult> {
    const docs = await GameModel.find().exec();
    return buildRecommendation(docs.map(toGameDto), input);
  }
}
