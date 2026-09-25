import { Schema, model, type HydratedDocument } from "mongoose";

export const GAME_CATEGORIES = ["策略", "聚会", "角色扮演", "卡牌"] as const;
export type GameCategory = (typeof GAME_CATEGORIES)[number];

export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 5;

export interface GameAttrs {
  name: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: number;
  totalCopies: number;
  stock: number;
  description: string;
}

export type GameDocument = HydratedDocument<GameAttrs>;

const gameSchema = new Schema<GameAttrs>(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    category: { type: String, required: true, enum: GAME_CATEGORIES },
    minPlayers: { type: Number, required: true, min: 1, max: 30 },
    maxPlayers: { type: Number, required: true, min: 1, max: 30 },
    durationMinutes: { type: Number, required: true, min: 5, max: 720 },
    difficulty: { type: Number, required: true, min: DIFFICULTY_MIN, max: DIFFICULTY_MAX },
    totalCopies: { type: Number, required: true, min: 0, max: 99 },
    stock: { type: Number, required: true, min: 0, max: 99 },
    description: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true },
);

gameSchema.index({ name: 1 }, { unique: true });

export const GameModel = model<GameAttrs>("Game", gameSchema);

export interface GameDto {
  id: string;
  name: string;
  category: GameCategory;
  minPlayers: number;
  maxPlayers: number;
  durationMinutes: number;
  difficulty: number;
  totalCopies: number;
  stock: number;
  description: string;
}

export function toGameDto(doc: GameDocument): GameDto {
  return {
    id: doc._id.toString(),
    name: doc.name,
    category: doc.category,
    minPlayers: doc.minPlayers,
    maxPlayers: doc.maxPlayers,
    durationMinutes: doc.durationMinutes,
    difficulty: doc.difficulty,
    totalCopies: doc.totalCopies,
    stock: doc.stock,
    description: doc.description,
  };
}
