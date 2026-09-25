import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../common/logger";

const CONNECT_RETRY_DELAY_MS = 3000;
const MAX_ATTEMPTS = 10;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function connectDatabase(): Promise<void> {
  mongoose.set("strictQuery", true);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
      logger.info(`MongoDB connected (db=${env.dbName})`);
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`MongoDB connect attempt ${attempt}/${MAX_ATTEMPTS} failed: ${message}`);
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
