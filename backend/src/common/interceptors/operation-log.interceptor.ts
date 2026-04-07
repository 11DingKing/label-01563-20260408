import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { tap, catchError } from "rxjs/operators";
import { Request } from "express";
import { LogService, CreateLogDto } from "../../modules/log/log.service";
import {
  OPERATION_LOG_KEY,
  OperationLogOptions,
} from "../decorators/operation-log.decorator";

// 敏感字段列表（不区分大小写）
const SENSITIVE_FIELDS = [
  "password",
  "oldPassword",
  "newPassword",
  "confirmPassword",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "authorization",
  "creditCard",
  "cardNumber",
  "cvv",
  "ssn",
];

@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OperationLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogService,
  ) {}

  /**
   * 脱敏处理：递归遍历对象，将敏感字段替换为 [REDACTED]
   */
  private sanitize(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitize(item));
    }

    if (typeof data === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          SENSITIVE_FIELDS.some((field) =>
            lowerKey.includes(field.toLowerCase()),
          )
        ) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.sanitize(value);
        }
      }
      return sanitized;
    }

    return data;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<OperationLogOptions>(
      OPERATION_LOG_KEY,
      context.getHandler(),
    );

    // 如果没有装饰器，直接执行
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, body, query, params, ip } = request;
    const userAgent = request.get("user-agent") || "";
    const startTime = Date.now();

    // 获取用户信息
    const user = request.user as { id: number; username: string } | undefined;

    // 对请求参数进行脱敏处理
    const sanitizedParams = this.sanitize({ body, query, params });

    return next.handle().pipe(
      tap(async (result) => {
        const duration = Date.now() - startTime;

        // 对响应结果进行脱敏处理
        const sanitizedResult = this.sanitize(result);

        const logData: CreateLogDto = {
          userId: user?.id,
          username: user?.username,
          module: options.module,
          action: options.action,
          method: method,
          path: url,
          params: JSON.stringify(sanitizedParams),
          result: this.truncateResult(sanitizedResult),
          ip: this.getClientIp(request),
          userAgent: userAgent.substring(0, 255),
          duration,
          status: 1, // 成功
        };

        try {
          await this.logService.create(logData);
        } catch (error) {
          this.logger.error("Failed to save operation log", error);
        }
      }),
      catchError(async (error) => {
        const duration = Date.now() - startTime;

        const logData: CreateLogDto = {
          userId: user?.id,
          username: user?.username,
          module: options.module,
          action: options.action,
          method: method,
          path: url,
          params: JSON.stringify(sanitizedParams),
          result: JSON.stringify({ error: error.message }),
          ip: this.getClientIp(request),
          userAgent: userAgent.substring(0, 255),
          duration,
          status: 0, // 失败
        };

        try {
          await this.logService.create(logData);
        } catch (logError) {
          this.logger.error("Failed to save operation log", logError);
        }

        throw error;
      }),
    );
  }

  private truncateResult(result: unknown): string {
    try {
      const str = JSON.stringify(result);
      // 限制结果长度，避免存储过大数据
      return str.length > 2000 ? str.substring(0, 2000) + "..." : str;
    } catch {
      return "[Unable to stringify]";
    }
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers["x-forwarded-for"];
    if (typeof forwarded === "string") {
      return forwarded.split(",")[0].trim();
    }
    return request.ip || request.socket.remoteAddress || "";
  }
}
