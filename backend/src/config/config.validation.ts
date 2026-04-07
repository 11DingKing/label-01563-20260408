import * as Joi from "joi";

/**
 * 环境变量 Schema 校验
 * 确保应用在缺少关键配置时无法启动
 */
export const configValidationSchema = Joi.object({
  // 服务配置
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),

  // 数据库配置 - 必填项
  DB_HOST: Joi.string().required().messages({
    "any.required": "数据库主机地址 DB_HOST 必须配置",
  }),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required().messages({
    "any.required": "数据库用户名 DB_USERNAME 必须配置",
  }),
  DB_PASSWORD: Joi.string().required().messages({
    "any.required": "数据库密码 DB_PASSWORD 必须配置",
  }),
  DB_DATABASE: Joi.string().required().messages({
    "any.required": "数据库名称 DB_DATABASE 必须配置",
  }),
  DB_LOGGING: Joi.string().valid("true", "false").default("false"),

  // JWT 配置 - 必填项
  JWT_SECRET: Joi.string().min(32).required().messages({
    "any.required": "JWT 密钥 JWT_SECRET 必须配置",
    "string.min": "JWT 密钥长度至少为 32 个字符",
  }),
  JWT_EXPIRES_IN: Joi.string().default("7d"),

  // Token 配置
  ACCESS_TOKEN_EXPIRES: Joi.string()
    .pattern(/^\d+(s|m|h|d)$/)
    .default("15m")
    .messages({
      "string.pattern.base": "ACCESS_TOKEN_EXPIRES 格式无效，示例: 15m, 1h, 1d",
    }),
  REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().min(1).max(365).default(7),
  REMEMBER_ME_EXPIRES_DAYS: Joi.number().min(1).max(365).default(30),

  // 登录安全配置
  MAX_LOGIN_ATTEMPTS: Joi.number().min(1).max(100).default(5),
  LOCK_TIME_MINUTES: Joi.number().min(1).max(1440).default(15),

  // API 限流配置
  THROTTLE_TTL: Joi.number().min(1000).default(60000),
  THROTTLE_LIMIT: Joi.number().min(1).default(100),

  // 日志配置
  LOG_LEVEL: Joi.string()
    .valid("error", "warn", "info", "debug", "verbose")
    .default("info"),
  LOG_DIR: Joi.string().default("logs"),
});
