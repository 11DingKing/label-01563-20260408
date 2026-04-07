import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    const contextStr = context ? `[${context}]` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.toUpperCase().padEnd(7)}] ${contextStr} ${message}${stackStr}`;
  }),
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.printf(({ timestamp, level, message, context, stack }) => {
    const contextStr = context ? `[${context}]` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `${timestamp} [${level.padEnd(7)}] ${contextStr} ${message}${stackStr}`;
  }),
);

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const logLevel = configService.get('LOG_LEVEL', 'info');
        const logDir = configService.get('LOG_DIR', 'logs');
        const isProduction = configService.get('NODE_ENV') === 'production';

        const transports: winston.transport[] = [
          // 控制台输出
          new winston.transports.Console({
            level: isProduction ? 'info' : 'debug',
            format: consoleFormat,
          }),

          // 所有日志文件（按天轮转）
          new DailyRotateFile({
            dirname: logDir,
            filename: 'app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            level: logLevel,
            format: customFormat,
          }),

          // 错误日志文件（按天轮转）
          new DailyRotateFile({
            dirname: logDir,
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: customFormat,
          }),

          // HTTP 请求日志文件
          new DailyRotateFile({
            dirname: logDir,
            filename: 'http-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '7d',
            level: 'info',
            format: customFormat,
          }),
        ];

        return {
          level: logLevel,
          transports,
          // 全局异常处理
          exceptionHandlers: [
            new DailyRotateFile({
              dirname: logDir,
              filename: 'exceptions-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
              format: customFormat,
            }),
          ],
          // Promise 拒绝处理
          rejectionHandlers: [
            new DailyRotateFile({
              dirname: logDir,
              filename: 'rejections-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              zippedArchive: true,
              maxSize: '20m',
              maxFiles: '30d',
              format: customFormat,
            }),
          ],
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
