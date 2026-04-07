import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR, APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { AuthModule } from "./modules/auth/auth.module";
import { UserModule } from "./modules/user/user.module";
import { LogModule } from "./modules/log/log.module";
import { DatabaseModule } from "./database/database.module";
import { LoggerModule } from "./common/logger";
import { OperationLogInterceptor } from "./common/interceptors/operation-log.interceptor";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { configValidationSchema } from "./config/config.validation";
import { EnvironmentVariables } from "./config/env.interface";

@Module({
  imports: [
    // 配置模块 - 带 Schema 校验
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      validationSchema: configValidationSchema,
      validationOptions: {
        abortEarly: false, // 显示所有校验错误
        allowUnknown: true, // 允许未知的环境变量
      },
    }),

    // 日志模块（必须在其他模块之前加载）
    LoggerModule,

    // API 限流模块
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        throttlers: [
          {
            name: "default",
            ttl: configService.get("THROTTLE_TTL", 60000), // 默认 60 秒
            limit: configService.get("THROTTLE_LIMIT", 100), // 默认每分钟 100 次
          },
          {
            name: "strict",
            ttl: 60000, // 60 秒
            limit: 10, // 每分钟 10 次（用于敏感操作）
          },
        ],
      }),
      inject: [ConfigService],
    }),

    // 数据库模块 - 使用迁移管理，禁用 synchronize
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        type: "mysql",
        host: configService.getOrThrow("DB_HOST"),
        port: configService.get("DB_PORT"),
        username: configService.getOrThrow("DB_USERNAME"),
        password: configService.getOrThrow("DB_PASSWORD"),
        database: configService.getOrThrow("DB_DATABASE"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        migrations: [__dirname + "/database/migrations/*{.ts,.js}"],
        migrationsRun: false, // 生产环境通过 CLI 手动执行迁移
        synchronize: false, // 禁用自动同步，使用迁移管理
        logging: configService.get("DB_LOGGING") === "true",
        timezone: "+08:00",
      }),
      inject: [ConfigService],
    }),

    // 业务模块
    AuthModule,
    UserModule,
    LogModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [
    // 全局限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // 全局日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // 全局操作日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
  ],
})
export class AppModule {}
