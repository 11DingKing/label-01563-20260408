import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { TransformInterceptor } from "../src/common/interceptors/transform.interceptor";

describe("App (e2e)", () => {
  let app: INestApplication;
  let accessToken: string;
  let adminToken: string;
  let testUserId: number;

  const testUser = {
    username: `e2etest_${Date.now()}`,
    password: "testpassword123",
    email: `e2etest_${Date.now()}@example.com`,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix("api");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalInterceptors(new TransformInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== 认证模块测试 ====================
  describe("AuthController (e2e)", () => {
    describe("POST /api/auth/register", () => {
      it("should register a new user", () => {
        return request(app.getHttpServer())
          .post("/api/auth/register")
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.username).toBe(testUser.username);
            expect(res.body.data.email).toBe(testUser.email);
            expect(res.body.data.password).toBeUndefined();
          });
      });

      it("should fail when username is too short", () => {
        return request(app.getHttpServer())
          .post("/api/auth/register")
          .send({
            username: "ab",
            password: "password123",
            email: "test@example.com",
          })
          .expect(400);
      });

      it("should fail when password is too short", () => {
        return request(app.getHttpServer())
          .post("/api/auth/register")
          .send({
            username: "validuser",
            password: "123",
            email: "test@example.com",
          })
          .expect(400);
      });

      it("should fail when email is invalid", () => {
        return request(app.getHttpServer())
          .post("/api/auth/register")
          .send({
            username: "validuser",
            password: "password123",
            email: "invalid-email",
          })
          .expect(400);
      });

      it("should fail when username already exists", () => {
        return request(app.getHttpServer())
          .post("/api/auth/register")
          .send(testUser)
          .expect(409);
      });
    });

    describe("POST /api/auth/login", () => {
      it("should login successfully", () => {
        return request(app.getHttpServer())
          .post("/api/auth/login")
          .send({
            username: testUser.username,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.user.username).toBe(testUser.username);
            expect(res.body.data.user.password).toBeUndefined();
            accessToken = res.body.data.accessToken;
          });
      });

      it("should fail with wrong password", () => {
        return request(app.getHttpServer())
          .post("/api/auth/login")
          .send({
            username: testUser.username,
            password: "wrongpassword",
          })
          .expect(401);
      });

      it("should fail with non-existent user", () => {
        return request(app.getHttpServer())
          .post("/api/auth/login")
          .send({
            username: "nonexistentuser",
            password: "password123",
          })
          .expect(401);
      });

      it("should fail with missing fields", () => {
        return request(app.getHttpServer())
          .post("/api/auth/login")
          .send({
            username: testUser.username,
          })
          .expect(400);
      });
    });

    describe("GET /api/auth/profile", () => {
      it("should get user profile", () => {
        return request(app.getHttpServer())
          .get("/api/auth/profile")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.username).toBe(testUser.username);
            expect(res.body.data.password).toBeUndefined();
          });
      });

      it("should fail without token", () => {
        return request(app.getHttpServer())
          .get("/api/auth/profile")
          .expect(401);
      });

      it("should fail with invalid token", () => {
        return request(app.getHttpServer())
          .get("/api/auth/profile")
          .set("Authorization", "Bearer invalid-token")
          .expect(401);
      });

      it("should fail with malformed authorization header", () => {
        return request(app.getHttpServer())
          .get("/api/auth/profile")
          .set("Authorization", "InvalidFormat")
          .expect(401);
      });
    });

    describe("PUT /api/auth/profile", () => {
      it("should update user nickname", () => {
        return request(app.getHttpServer())
          .put("/api/auth/profile")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ nickname: "Updated Nickname" })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.nickname).toBe("Updated Nickname");
          });
      });

      it("should update user avatar", () => {
        return request(app.getHttpServer())
          .put("/api/auth/profile")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({ avatar: "https://example.com/avatar.png" })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.avatar).toBe("https://example.com/avatar.png");
          });
      });
    });

    describe("PUT /api/auth/password", () => {
      it("should change password successfully", () => {
        return request(app.getHttpServer())
          .put("/api/auth/password")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            oldPassword: testUser.password,
            newPassword: "newpassword123",
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.message).toBe("密码修改成功");
          });
      });

      it("should fail with wrong old password", () => {
        return request(app.getHttpServer())
          .put("/api/auth/password")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            oldPassword: "wrongoldpassword",
            newPassword: "newpassword123",
          })
          .expect(400);
      });

      it("should fail with short new password", () => {
        return request(app.getHttpServer())
          .put("/api/auth/password")
          .set("Authorization", `Bearer ${accessToken}`)
          .send({
            oldPassword: "newpassword123",
            newPassword: "123",
          })
          .expect(400);
      });
    });

    describe("POST /api/auth/logout", () => {
      it("should logout successfully", () => {
        return request(app.getHttpServer())
          .post("/api/auth/logout")
          .set("Authorization", `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.message).toBe("退出登录成功");
          });
      });
    });
  });

  // ==================== 用户管理模块测试（管理员） ====================
  describe("UserController (e2e) - Admin operations", () => {
    beforeAll(async () => {
      // Login as admin
      const res = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          username: "admin",
          password: "admin123",
        });

      if (res.body.code === 0) {
        adminToken = res.body.data.accessToken;
      }
    });

    describe("GET /api/users", () => {
      it("should get user list (admin only)", async () => {
        if (!adminToken) {
          console.log("Skipping admin test - admin user not available");
          return;
        }

        return request(app.getHttpServer())
          .get("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10 })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.data).toBeInstanceOf(Array);
            expect(res.body.data.total).toBeGreaterThan(0);
            expect(res.body.data.page).toBe(1);
            expect(res.body.data.pageSize).toBe(10);
          });
      });

      it("should filter users by username", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10, username: "admin" })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.data.length).toBeGreaterThan(0);
          });
      });

      it("should filter users by status", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10, status: 1 })
          .expect(200);
      });
    });

    describe("POST /api/users", () => {
      it("should create a new user (admin only)", async () => {
        if (!adminToken) {
          console.log("Skipping admin test - admin user not available");
          return;
        }

        const newUser = {
          username: `admintest_${Date.now()}`,
          password: "password123",
          email: `admintest_${Date.now()}@example.com`,
        };

        return request(app.getHttpServer())
          .post("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(newUser)
          .expect(201)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.username).toBe(newUser.username);
            expect(res.body.data.password).toBeUndefined();
            testUserId = res.body.data.id;
          });
      });

      it("should fail when creating user with existing username", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .post("/api/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            username: "admin",
            password: "password123",
            email: "newemail@example.com",
          })
          .expect(409);
      });
    });

    describe("GET /api/users/:id", () => {
      it("should get user by id (admin only)", async () => {
        if (!adminToken || !testUserId) {
          console.log("Skipping admin test - prerequisites not met");
          return;
        }

        return request(app.getHttpServer())
          .get(`/api/users/${testUserId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.id).toBe(testUserId);
            expect(res.body.data.password).toBeUndefined();
          });
      });

      it("should return 404 for non-existent user", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/users/999999")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe("PUT /api/users/:id", () => {
      it("should update user (admin only)", async () => {
        if (!adminToken || !testUserId) {
          console.log("Skipping admin test - prerequisites not met");
          return;
        }

        return request(app.getHttpServer())
          .put(`/api/users/${testUserId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ nickname: "Admin Updated" })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.nickname).toBe("Admin Updated");
          });
      });
    });

    describe("PUT /api/users/:id/status", () => {
      it("should disable user (admin only)", async () => {
        if (!adminToken || !testUserId) {
          console.log("Skipping admin test - prerequisites not met");
          return;
        }

        return request(app.getHttpServer())
          .put(`/api/users/${testUserId}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: 0 })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.status).toBe(0);
          });
      });

      it("should enable user (admin only)", async () => {
        if (!adminToken || !testUserId) return;

        return request(app.getHttpServer())
          .put(`/api/users/${testUserId}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send({ status: 1 })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.status).toBe(1);
          });
      });
    });

    describe("DELETE /api/users/:id", () => {
      it("should delete user (admin only)", async () => {
        if (!adminToken || !testUserId) {
          console.log("Skipping admin test - prerequisites not met");
          return;
        }

        return request(app.getHttpServer())
          .delete(`/api/users/${testUserId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200);
      });
    });
  });

  // ==================== 日志模块测试（管理员） ====================
  describe("LogController (e2e) - Admin operations", () => {
    describe("GET /api/logs", () => {
      it("should get log list (admin only)", async () => {
        if (!adminToken) {
          console.log("Skipping admin test - admin user not available");
          return;
        }

        return request(app.getHttpServer())
          .get("/api/logs")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10 })
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.data).toBeInstanceOf(Array);
            expect(res.body.data.page).toBe(1);
            expect(res.body.data.pageSize).toBe(10);
          });
      });

      it("should filter logs by username", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/logs")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10, username: "admin" })
          .expect(200);
      });

      it("should filter logs by module", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/logs")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10, module: "auth" })
          .expect(200);
      });

      it("should filter logs by status", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/logs")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 10, status: 1 })
          .expect(200);
      });

      it("should filter logs by date range", async () => {
        if (!adminToken) return;

        const today = new Date().toISOString().split("T")[0];

        return request(app.getHttpServer())
          .get("/api/logs")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({
            page: 1,
            pageSize: 10,
            startDate: today,
            endDate: today,
          })
          .expect(200);
      });
    });

    describe("GET /api/logs/:id", () => {
      it("should get log by id (admin only)", async () => {
        if (!adminToken) {
          console.log("Skipping admin test - admin user not available");
          return;
        }

        // First get a log to get its ID
        const logsRes = await request(app.getHttpServer())
          .get("/api/logs")
          .set("Authorization", `Bearer ${adminToken}`)
          .query({ page: 1, pageSize: 1 });

        if (logsRes.body.data.data.length === 0) {
          console.log("No logs available for testing");
          return;
        }

        const logId = logsRes.body.data.data[0].id;

        return request(app.getHttpServer())
          .get(`/api/logs/${logId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.code).toBe(0);
            expect(res.body.data.id).toBe(logId);
          });
      });

      it("should return 404 for non-existent log", async () => {
        if (!adminToken) return;

        return request(app.getHttpServer())
          .get("/api/logs/999999")
          .set("Authorization", `Bearer ${adminToken}`)
          .expect(404);
      });
    });
  });

  // ==================== 权限测试 ====================
  describe("Permission Tests", () => {
    let normalUserToken: string;

    beforeAll(async () => {
      // 创建并登录普通用户
      const normalUser = {
        username: `normaluser_${Date.now()}`,
        password: "password123",
        email: `normaluser_${Date.now()}@example.com`,
      };

      await request(app.getHttpServer())
        .post("/api/auth/register")
        .send(normalUser);

      const res = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({
          username: normalUser.username,
          password: normalUser.password,
        });

      if (res.body.code === 0) {
        normalUserToken = res.body.data.accessToken;
      }
    });

    it("should deny normal user access to user list", async () => {
      if (!normalUserToken) {
        console.log("Skipping permission test - normal user not available");
        return;
      }

      return request(app.getHttpServer())
        .get("/api/users")
        .set("Authorization", `Bearer ${normalUserToken}`)
        .expect(403);
    });

    it("should deny normal user access to create user", async () => {
      if (!normalUserToken) return;

      return request(app.getHttpServer())
        .post("/api/users")
        .set("Authorization", `Bearer ${normalUserToken}`)
        .send({
          username: "newuser",
          password: "password123",
          email: "new@example.com",
        })
        .expect(403);
    });

    it("should deny normal user access to logs", async () => {
      if (!normalUserToken) return;

      return request(app.getHttpServer())
        .get("/api/logs")
        .set("Authorization", `Bearer ${normalUserToken}`)
        .expect(403);
    });
  });
});
