import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
  Optional,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(
    @Optional() @Inject(WINSTON_MODULE_PROVIDER) private readonly logger?: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = responseObj.message[0] as string;
          errorDetails.validationErrors = responseObj.message;
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }
        if (responseObj.error) {
          errorDetails.error = responseObj.error;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails.name = exception.name;
    }

    // 获取用户信息
    const user = (request as any).user;
    const userId = user?.id;
    const username = user?.username;

    // 构建日志元数据
    const logMeta = {
      context: 'ExceptionFilter',
      method: request.method,
      url: request.url,
      ip: request.ip,
      userId,
      username,
      statusCode: status,
      errorMessage: message,
      ...errorDetails,
    };

    // 记录错误日志
    if (this.logger) {
      if (status >= 500) {
        this.logger.error(
          `${request.method} ${request.url} - ${status} - ${message}`,
          {
            ...logMeta,
            stack: exception instanceof Error ? exception.stack : undefined,
          },
        );
      } else if (status >= 400) {
        this.logger.warn(`${request.method} ${request.url} - ${status} - ${message}`, logMeta);
      }
    } else {
      // 如果没有 winston logger，使用 console
      console.error(`[ExceptionFilter] ${request.method} ${request.url} - ${status} - ${message}`);
    }

    response.status(status).json({
      code: status,
      message,
      data: null,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
