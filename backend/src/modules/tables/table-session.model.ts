import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export type TableSessionStatus = "open" | "closed";

export interface TableSessionAttrs {
  game: Types.ObjectId;
  gameName: string;
  partySize: number;
  status: TableSessionStatus;
  openedAt: Date;
  closedAt: Date | null;
}

export type TableSessionDocument = HydratedDocument<TableSessionAttrs>;

const tableSessionSchema = new Schema<TableSessionAttrs>(
  {
    game: { type: Schema.Types.ObjectId, ref: "Game", required: true },
    gameName: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1, max: 30 },
    status: { type: String, required: true, enum: ["open", "closed"], default: "open" },
    openedAt: { type: Date, required: true, default: () => new Date() },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

tableSessionSchema.index({ status: 1, openedAt: -1 });

export const TableSessionModel = model<TableSessionAttrs>("TableSession", tableSessionSchema);

export interface TableSessionDto {
  id: string;
  gameId: string;
  gameName: string;
  partySize: number;
  status: TableSessionStatus;
  openedAt: string;
  closedAt: string | null;
}

export function toTableSessionDto(doc: TableSessionDocument): TableSessionDto {
  return {
    id: doc._id.toString(),
    gameId: doc.game.toString(),
    gameName: doc.gameName,
    partySize: doc.partySize,
    status: doc.status,
    openedAt: doc.openedAt.toISOString(),
    closedAt: doc.closedAt ? doc.closedAt.toISOString() : null,
  };
}
