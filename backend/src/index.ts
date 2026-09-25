import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./common/logger";
import { connectDatabase } from "./db/connection";
import { seedGamesIfEmpty } from "./db/seed";

async function bootstrap() {
  await connectDatabase();
  await seedGamesIfEmpty();

  app.listen(env.port, "0.0.0.0", () => {
    logger.info(`API listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
