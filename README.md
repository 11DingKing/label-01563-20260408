# NestJS 用户认证系统

基于 NestJS 的用户登录注册系统，采用最佳实践的业务框架设计。

---

## 1. How to Run

### 方式一：Docker Compose（推荐）

```bash
# 启动服务
docker-compose up --build -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

### 方式二：本地开发

```bash
# 1. 启动 MySQL（确保 MySQL 8.0 运行在 3306 端口）

# 2. 创建数据库并执行初始化脚本
mysql -u root -p < backend/sql/schema.sql

# 3. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件配置数据库连接

# 4. 安装依赖并启动
npm install
npm run start:dev
```

---

## 2. Services

| 服务 | 端口 | 说明 |
|------|------|------|
| Backend API | 3000 | NestJS 后端 API 服务 |
| MySQL | 3306 | 数据库服务 |

**数据持久化**:
- 数据库: `mysql_data` 卷
- 日志文件: `./logs/` 目录（挂载到宿主机）

**API 基础地址**: `http://localhost:3000/api/v1`

**Swagger 文档**: `http://localhost:3000/api/docs`

**API 版本**: v1

---

## 3. 测试账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin123 | 拥有所有权限 |
| 普通用户 | testuser | user123456 | 普通用户权限 |

---

## 4. 题目内容

> 我想用 NestJS 实现一个用户登录系统，主要包含用户注册以及用户登录，帮我搭建好一个最佳实践的业务框架。

---

## 5. 测试结果

### 单元测试

```
Test Suites: 6 passed, 6 total
Tests:       58 passed, 58 total
```

| 测试文件 | 测试内容 | 状态 |
|---------|---------|------|
| `auth.service.spec.ts` | 注册、登录、获取信息、修改密码 | ✅ |
| `auth.controller.spec.ts` | 认证接口路由 | ✅ |
| `user.service.spec.ts` | 用户 CRUD、状态更新、密码验证 | ✅ |
| `user.controller.spec.ts` | 用户管理接口路由 | ✅ |
| `log.service.spec.ts` | 日志查询 | ✅ |
| `log.controller.spec.ts` | 日志接口路由 | ✅ |

### 运行测试命令

```bash
cd backend

# 单元测试
npm run test

# E2E 测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

---

## 6. API 接口文档

### 6.0 健康检查

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api` | API 状态信息 | 无 |
| GET | `/api/health` | 健康检查（含运行时间） | 无 |

### 6.1 认证模块 (Auth)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/auth/register` | 用户注册 | 无 |
| POST | `/api/auth/login` | 用户登录 | 无 |
| GET | `/api/auth/profile` | 获取当前用户信息 | JWT |
| PUT | `/api/auth/profile` | 更新个人信息 | JWT |
| PUT | `/api/auth/password` | 修改密码 | JWT |
| POST | `/api/auth/logout` | 退出登录 | JWT |
| POST | `/api/auth/refresh` | 刷新 Token | JWT |

### 6.2 用户管理模块 (User) - 仅管理员

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/users` | 获取用户列表 | Admin |
| GET | `/api/users/:id` | 获取用户详情 | Admin |
| POST | `/api/users` | 创建用户 | Admin |
| PUT | `/api/users/:id` | 更新用户 | Admin |
| PUT | `/api/users/:id/status` | 更新用户状态 | Admin |
| DELETE | `/api/users/:id` | 删除用户 | Admin |

### 6.3 日志模块 (Log) - 仅管理员

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/api/logs` | 获取操作日志列表 | Admin |
| GET | `/api/logs/:id` | 获取日志详情 | Admin |

---

## 7. curl 测试命令（质检用）

以下命令用于质检人员测试 API 功能，请按顺序执行：

### 7.0 健康检查

```bash
# API 状态
curl -X GET http://localhost:3000/api/v1

# 健康检查（含运行时间）
curl -X GET http://localhost:3000/api/v1/health
```

**预期返回**:
```json
{
  "status": "ok",
  "service": "NestJS Auth API",
  "version": "1.0.0",
  "timestamp": "2026-02-04T02:04:06.142Z"
}
```

### 7.1 用户注册

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "password123",
    "email": "newuser@example.com",
    "nickname": "新用户"
  }'
```

**预期返回**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 3,
    "username": "newuser",
    "email": "newuser@example.com"
  }
}
```

### 7.2 用户登录

```bash
# 使用管理员账号登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**预期返回**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "uuid-refresh-token...",
    "expiresIn": 900,
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@example.com",
      "nickname": "系统管理员",
      "role": 1
    }
  }
}
```

```bash
# 使用普通用户账号登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "user123456"
  }'
```

### 7.3 获取当前用户信息

```bash
# 将 <TOKEN> 替换为登录返回的 accessToken
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer <TOKEN>"
```

**预期返回**:
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "nickname": "系统管理员",
    "avatar": "",
    "status": 1,
    "role": 1,
    "lastLoginAt": "2024-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 7.4 更新个人信息

```bash
curl -X PUT http://localhost:3000/api/v1/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar.png"
  }'
```

### 7.5 修改密码

```bash
curl -X PUT http://localhost:3000/api/v1/auth/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "oldPassword": "admin123",
    "newPassword": "newpassword123"
  }'
```

### 7.6 刷新 Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "<REFRESH_TOKEN>"
  }'
```

### 7.7 退出登录

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <TOKEN>"
```

### 7.8 用户管理（管理员）

```bash
# 获取用户列表
curl -X GET "http://localhost:3000/api/v1/users?page=1&pageSize=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 获取单个用户
curl -X GET http://localhost:3000/api/v1/users/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 创建用户
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "username": "user2",
    "password": "password123",
    "email": "user2@example.com",
    "nickname": "用户2",
    "role": 0
  }'

# 更新用户
curl -X PUT http://localhost:3000/api/v1/users/2 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "nickname": "更新后的昵称"
  }'

# 更新用户状态（禁用/启用）
curl -X PUT http://localhost:3000/api/v1/users/2/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{
    "status": 0
  }'

# 删除用户
curl -X DELETE http://localhost:3000/api/v1/users/3 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 7.9 查看操作日志（管理员）

```bash
# 获取日志列表
curl -X GET "http://localhost:3000/api/v1/logs?page=1&pageSize=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 按用户名筛选
curl -X GET "http://localhost:3000/api/v1/logs?username=admin" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"

# 按模块筛选
curl -X GET "http://localhost:3000/api/v1/logs?module=认证" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 7.10 错误场景测试

```bash
# 测试用户名已存在
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123",
    "email": "test@example.com"
  }'
# 预期: 409 用户名已存在

# 测试密码错误
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "wrongpassword"
  }'
# 预期: 401 用户名或密码错误

# 测试无效 Token
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer invalid_token"
# 预期: 401 Unauthorized

# 测试无权限访问（普通用户访问管理接口）
curl -X GET http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer <USER_TOKEN>"
# 预期: 403 Forbidden

# 测试登录失败锁定（连续5次错误密码后账户锁定15分钟）
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "wrong"}'
  echo ""
done
# 预期: 第6次返回 403 账户已被锁定
```

---

## 8. 项目架构

```
backend/
├── src/
│   ├── common/                 # 公共模块
│   │   ├── decorators/         # 自定义装饰器
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── operation-log.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── dto/                # 公共 DTO
│   │   ├── filters/            # 异常过滤器
│   │   ├── guards/             # 守卫
│   │   ├── interceptors/       # 拦截器
│   │   └── logger/             # 日志模块
│   ├── database/               # 数据库模块
│   │   ├── database.module.ts
│   │   └── seed.service.ts     # 数据库初始化
│   ├── modules/                # 业务模块
│   │   ├── auth/               # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   ├── entities/
│   │   │   ├── guards/
│   │   │   └── strategies/
│   │   ├── user/               # 用户模块
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.module.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   └── log/                # 日志模块
│   ├── app.module.ts           # 根模块
│   └── main.ts                 # 入口文件
├── test/                       # E2E 测试
├── sql/                        # SQL 脚本
│   └── schema.sql              # 数据库初始化脚本
└── Dockerfile                  # Docker 配置
```

---

## 9. 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | NestJS | 10.x |
| 语言 | TypeScript | 5.x |
| ORM | TypeORM | 0.3.x |
| 数据库 | MySQL | 8.0 |
| 认证 | Passport.js + JWT | - |
| 验证 | class-validator | 0.14.x |
| 加密 | bcryptjs | 2.4.x |
| 测试 | Jest | 29.x |
| 日志 | Winston | 3.x |
| API 文档 | Swagger/OpenAPI | 7.x |
| 配置校验 | Joi | 17.x |
| 安全头 | Helmet | 8.x |

---

## 10. 最佳实践

### 架构设计
- **分层架构**: Controller -> Service -> Repository
- **模块化设计**: 每个功能模块独立封装
- **依赖注入**: 使用 NestJS IoC 容器

### 安全特性
- **JWT 双 Token**: Access Token (15min) + Refresh Token (7天)
- **登录失败锁定**: 5次失败后锁定15分钟
- **密码加密**: bcrypt 哈希存储
- **角色权限控制**: RBAC 模型
- **Helmet 安全头**: HSTS, X-Frame-Options, X-Content-Type-Options 等
- **API 限流**: 防止暴力攻击

### 工程化
- **全局异常处理**: HttpExceptionFilter
- **统一响应格式**: TransformInterceptor
- **请求日志**: LoggingInterceptor
- **操作日志**: OperationLogInterceptor（记录到数据库）
- **参数验证**: ValidationPipe + class-validator
- **配置校验**: Joi Schema 校验，缺少关键配置时启动失败
- **API 文档**: Swagger/OpenAPI 自动生成
- **API 版本控制**: URI 版本化 (/api/v1)
- **配置化管理**: 所有关键参数通过环境变量配置
- **单元测试**: Jest (58 个测试用例)

### 可配置项（环境变量）

| 配置项 | 默认值 | 说明 |
|-------|--------|------|
| `ACCESS_TOKEN_EXPIRES` | 15m | Access Token 过期时间 |
| `REFRESH_TOKEN_EXPIRES_DAYS` | 7 | Refresh Token 过期天数 |
| `REMEMBER_ME_EXPIRES_DAYS` | 30 | 记住我模式过期天数 |
| `MAX_LOGIN_ATTEMPTS` | 5 | 最大登录失败次数 |
| `LOCK_TIME_MINUTES` | 15 | 账户锁定时间（分钟）|
| `THROTTLE_TTL` | 60000 | 限流时间窗口（毫秒）|
| `THROTTLE_LIMIT` | 100 | 每个窗口内最大请求数 |
