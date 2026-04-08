import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { WINSTON_MODULE_NEST_PROVIDER } from "nest-winston";
import helmet from "helmet";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import { AppModule } from "./app.module";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useStaticAssets(join(process.cwd(), "uploads"), {
    prefix: "/uploads",
  });

  // 使用 Winston 作为日志记录器
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Helmet 安全头中间件
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Swagger UI 需要
        },
      },
      crossOriginEmbedderPolicy: false, // 允许 Swagger UI 加载
    }),
  );

  // 全局前缀和版本控制
  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局管道 - 参数校验
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局响应转换拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API 文档配置
  const swaggerConfig = new DocumentBuilder()
    .setTitle("NestJS 用户认证系统 API")
    .setDescription(
      `
## 接口说明

本系统提供用户注册、登录、认证等功能的 RESTful API。

### API 版本
- 当前版本: **v1**
- 基础路径: \`/api/v1\`

### 认证方式
- 使用 JWT (JSON Web Token) 进行身份认证
- 在请求头中添加 \`Authorization: Bearer <token>\`

### 角色权限
- **普通用户 (role: 0)**: 可访问个人信息相关接口
- **管理员 (role: 1)**: 可访问所有接口，包括用户管理和日志查询

### 测试账号
- 管理员: admin / admin123
- 普通用户: testuser / user123456

### 安全特性
- Helmet 安全头 (HSTS, X-Frame-Options, X-Content-Type-Options 等)
- API 限流保护
- JWT Token 双令牌机制
- 登录失败锁定机制
    `,
    )
    .setVersion("1.0.0")
    .setContact("API Support", "", "support@example.com")
    .addServer("/", "API Server")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "请输入 JWT Token",
      },
      "JWT",
    )
    .addTag("健康检查", "API 健康状态检查")
    .addTag("认证", "用户注册、登录、Token 刷新等")
    .addTag("用户管理", "用户 CRUD 操作（仅管理员）")
    .addTag("操作日志", "系统操作日志查询（仅管理员）")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: "NestJS Auth API 文档",
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 应用已启动: http://localhost:${port}/api/v1`, "Bootstrap");
  logger.log(`📚 API 文档地址: http://localhost:${port}/api/docs`, "Bootstrap");
  logger.log(`🔒 安全特性: Helmet, CORS, Rate Limiting`, "Bootstrap");
  logger.log(`📝 日志文件目录: ${process.env.LOG_DIR || "logs"}`, "Bootstrap");
}

bootstrap();
