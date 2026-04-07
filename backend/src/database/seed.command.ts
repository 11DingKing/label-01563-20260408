import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "../app.module";
import { SeedService } from "./seed.service";

/**
 * 独立的数据填充 CLI 命令
 * 使用方式: npm run seed
 */
async function bootstrap() {
  const logger = new Logger("SeedCommand");

  try {
    logger.log("Starting seed process...");

    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ["error", "warn", "log"],
    });

    const seedService = app.get(SeedService);
    await seedService.run();

    await app.close();

    logger.log("Seed process completed successfully");
    process.exit(0);
  } catch (error) {
    logger.error("Seed process failed", error);
    process.exit(1);
  }
}

bootstrap();
