import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import { User } from "../modules/user/entities/user.entity";

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 执行数据填充
   * 通过 CLI 命令调用: npm run seed
   */
  async run(): Promise<void> {
    this.logger.log("Running database seed...");
    await this.seedUsers();
    this.logger.log("Database seed completed");
  }

  private async seedUsers(): Promise<void> {
    // 检查是否已有管理员账号
    const adminExists = await this.userRepository.findOne({
      where: { username: "admin" },
    });

    if (!adminExists) {
      this.logger.log("Creating default admin user...");
      const admin = this.userRepository.create({
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        email: "admin@example.com",
        nickname: "系统管理员",
        status: 1,
        role: 1,
      });
      await this.userRepository.save(admin);
      this.logger.log("Default admin user created: admin / admin123");
    }

    // 检查是否已有测试用户
    const testUserExists = await this.userRepository.findOne({
      where: { username: "testuser" },
    });

    if (!testUserExists) {
      this.logger.log("Creating test user...");
      const testUser = this.userRepository.create({
        username: "testuser",
        password: await bcrypt.hash("user123456", 10),
        email: "testuser@example.com",
        nickname: "测试用户",
        status: 1,
        role: 0,
      });
      await this.userRepository.save(testUser);
      this.logger.log("Test user created: testuser / user123456");
    }
  }
}
