/**
 * 环境变量类型定义
 * 提供类型安全的配置访问
 */
export interface EnvironmentVariables {
  // 服务配置
  NODE_ENV: "development" | "production" | "test";
  PORT: number;

  // 数据库配置
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_DATABASE: string;
  DB_LOGGING: string;

  // JWT 配置
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;

  // Token 配置
  ACCESS_TOKEN_EXPIRES: string;
  REFRESH_TOKEN_EXPIRES_DAYS: number;
  REMEMBER_ME_EXPIRES_DAYS: number;

  // 登录安全配置
  MAX_LOGIN_ATTEMPTS: number;
  LOCK_TIME_MINUTES: number;

  // API 限流配置
  THROTTLE_TTL: number;
  THROTTLE_LIMIT: number;

  // 日志配置
  LOG_LEVEL: "error" | "warn" | "info" | "debug" | "verbose";
  LOG_DIR: string;
}
