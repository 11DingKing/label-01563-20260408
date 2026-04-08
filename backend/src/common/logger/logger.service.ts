import {
  Injectable,
  Inject,
  LoggerService as NestLoggerService,
} from "@nestjs/common";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

@Injectable()
export class AppLoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { context, stack: trace });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  // 自定义方法：记录 HTTP 请求
  http(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, { context: "HTTP", ...meta });
  }

  // 自定义方法：记录数据库操作
  database(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, { context: "Database", ...meta });
  }

  // 自定义方法：记录业务操作
  business(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, { context: "Business", ...meta });
  }

  // 自定义方法：记录安全事件
  security(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(message, { context: "Security", ...meta });
  }

  // 自定义方法：记录性能指标
  performance(message: string, meta?: Record<string, unknown>) {
    this.logger.info(message, { context: "Performance", ...meta });
  }
}
