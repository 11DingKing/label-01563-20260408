import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    // 获取用户信息（如果存在）
    const user = (request as any).user;
    const userId = user?.id;
    const username = user?.username;

    // 记录请求开始
    this.logger.info(`[${requestId}] --> ${method} ${url}`, {
      context: 'HTTP',
      requestId,
      method,
      url,
      ip,
      userAgent,
      userId,
      username,
      body: this.sanitizeBody(body),
      query,
      params,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse<Response>();
          const { statusCode } = response;
          const duration = Date.now() - startTime;

          // 记录请求完成
          this.logger.info(
            `[${requestId}] <-- ${method} ${url} ${statusCode} ${duration}ms`,
            {
              context: 'HTTP',
              requestId,
              method,
              url,
              statusCode,
              duration,
              ip,
              userId,
              username,
            },
          );

          // 记录慢请求警告
          if (duration > 3000) {
            this.logger.warn(
              `[${requestId}] 慢请求警告: ${method} ${url} 耗时 ${duration}ms`,
              {
                context: 'Performance',
                requestId,
                method,
                url,
                duration,
              },
            );
          }
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || error.statusCode || 500;

          this.logger.error(
            `[${requestId}] <-- ${method} ${url} ${statusCode} ${duration}ms - ${error.message}`,
            {
              context: 'HTTP',
              requestId,
              method,
              url,
              statusCode,
              duration,
              ip,
              userId,
              username,
              error: error.message,
              stack: error.stack,
            },
          );
        },
      }),
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = ['password', 'oldPassword', 'newPassword', 'confirmPassword', 'token', 'accessToken'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }
    
    return sanitized;
  }
}
