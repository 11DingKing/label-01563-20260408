import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan, MoreThan } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcryptjs";

import { UserService } from "../user/user.service";
import { User } from "../user/entities/user.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  UpdatePasswordDto,
} from "./dto/auth.dto";

export interface TokenPayload {
  sub: number;
  username: string;
  type: "access" | "refresh";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // 从配置中读取的安全配置
  private readonly maxLoginAttempts: number;
  private readonly lockTimeMinutes: number;
  private readonly accessTokenExpires: string;
  private readonly accessTokenExpiresSeconds: number;
  private readonly refreshTokenExpiresDays: number;
  private readonly rememberMeExpiresDays: number;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {
    // 从环境变量读取配置，提供合理的默认值
    this.maxLoginAttempts = this.configService.get<number>(
      "MAX_LOGIN_ATTEMPTS",
      5,
    );
    this.lockTimeMinutes = this.configService.get<number>(
      "LOCK_TIME_MINUTES",
      15,
    );
    this.accessTokenExpires = this.configService.get<string>(
      "ACCESS_TOKEN_EXPIRES",
      "15m",
    );
    this.accessTokenExpiresSeconds = this.parseExpiresTime(
      this.accessTokenExpires,
    );
    this.refreshTokenExpiresDays = this.configService.get<number>(
      "REFRESH_TOKEN_EXPIRES_DAYS",
      7,
    );
    this.rememberMeExpiresDays = this.configService.get<number>(
      "REMEMBER_ME_EXPIRES_DAYS",
      30,
    );

    this.logger.log(
      `Token 配置 - Access: ${this.accessTokenExpires}, Refresh: ${this.refreshTokenExpiresDays}d, RememberMe: ${this.rememberMeExpiresDays}d`,
    );
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresTime(expires: string): number {
    const match = expires.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900; // 默认15分钟

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value;
      case "m":
        return value * 60;
      case "h":
        return value * 60 * 60;
      case "d":
        return value * 24 * 60 * 60;
      default:
        return 900;
    }
  }

  /**
   * 用户注册
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const user = await this.userService.create({
      ...registerDto,
      status: 1,
      role: 0,
    });

    this.logger.log(`新用户注册: ${user.username}`);
    return user;
  }

  /**
   * 用户登录
   */
  async login(
    loginDto: LoginDto,
    ip?: string,
    userAgent?: string,
  ): Promise<{ user: User; tokens: AuthTokens }> {
    const { username, password, rememberMe } = loginDto;

    const user = await this.userService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException("用户名或密码错误");
    }

    // 检查账户是否被锁定
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil!.getTime() - Date.now()) / 1000 / 60,
      );
      throw new ForbiddenException(
        `账户已被锁定，请在 ${remainingMinutes} 分钟后重试`,
      );
    }

    // 检查账户状态
    if (user.status === 0) {
      throw new UnauthorizedException("用户已被禁用");
    }

    // 验证密码
    const isPasswordValid = await this.userService.validatePassword(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      await this.handleFailedLogin(user);
      throw new UnauthorizedException("用户名或密码错误");
    }

    // 登录成功，重置失败次数
    await this.handleSuccessfulLogin(user, ip);

    // 生成双 Token
    const tokens = await this.generateTokens(user, rememberMe, ip, userAgent);

    this.logger.log(`用户登录成功: ${user.username}, IP: ${ip}`);

    return { user, tokens };
  }

  /**
   * 处理登录失败
   */
  private async handleFailedLogin(user: User): Promise<void> {
    user.loginAttempts += 1;

    if (user.loginAttempts >= this.maxLoginAttempts) {
      user.lockedUntil = new Date(
        Date.now() + this.lockTimeMinutes * 60 * 1000,
      );
      this.logger.warn(
        `用户 ${user.username} 登录失败次数过多，账户已锁定 ${this.lockTimeMinutes} 分钟`,
      );
    }

    await this.userService.update(user.id, {
      loginAttempts: user.loginAttempts,
      lockedUntil: user.lockedUntil,
    });
  }

  /**
   * 处理登录成功
   */
  private async handleSuccessfulLogin(user: User, ip?: string): Promise<void> {
    await this.userService.update(user.id, {
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: ip || null,
    });
  }

  /**
   * 生成双 Token
   */
  async generateTokens(
    user: User,
    rememberMe = false,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const payload: Omit<TokenPayload, "type"> = {
      sub: user.id,
      username: user.username,
    };

    // 生成 Access Token
    const accessToken = this.jwtService.sign(
      { ...payload, type: "access" },
      { expiresIn: this.accessTokenExpires },
    );

    // 生成 Refresh Token
    const refreshTokenStr = uuidv4();
    const refreshExpiresInDays = rememberMe
      ? this.rememberMeExpiresDays
      : this.refreshTokenExpiresDays;
    const expiresAt = new Date(
      Date.now() + refreshExpiresInDays * 24 * 60 * 60 * 1000,
    );

    // 保存 Refresh Token 到数据库
    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenStr,
      userId: user.id,
      expiresAt,
      userAgent,
      ip,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenStr,
      expiresIn: this.accessTokenExpiresSeconds,
    };
  }

  /**
   * 刷新 Token
   */
  async refreshTokens(
    refreshTokenStr: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokens> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenStr },
      relations: ["user"],
    });

    if (!refreshToken) {
      throw new UnauthorizedException("无效的刷新令牌");
    }

    if (refreshToken.isRevoked) {
      // 可能是令牌被盗用，撤销该用户所有令牌
      await this.revokeAllUserTokens(refreshToken.userId);
      this.logger.warn(
        `检测到已撤销的刷新令牌被使用，用户ID: ${refreshToken.userId}`,
      );
      throw new UnauthorizedException("刷新令牌已被撤销，请重新登录");
    }

    if (refreshToken.expiresAt < new Date()) {
      throw new UnauthorizedException("刷新令牌已过期，请重新登录");
    }

    const user = refreshToken.user;

    if (!user || user.status === 0) {
      throw new UnauthorizedException("用户不存在或已被禁用");
    }

    // 撤销旧的 Refresh Token（轮换策略）
    await this.refreshTokenRepository.update(refreshToken.id, {
      isRevoked: true,
    });

    // 生成新的 Token 对
    const tokens = await this.generateTokens(user, false, ip, userAgent);

    this.logger.log(`用户刷新令牌: ${user.username}`);

    return tokens;
  }

  /**
   * 撤销用户所有 Refresh Token
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  /**
   * 退出登录
   */
  async logout(userId: number, refreshTokenStr?: string): Promise<void> {
    if (refreshTokenStr) {
      // 只撤销当前设备的令牌
      await this.refreshTokenRepository.update(
        { token: refreshTokenStr, userId },
        { isRevoked: true },
      );
    } else {
      // 撤销所有令牌（全设备退出）
      await this.revokeAllUserTokens(userId);
    }
  }

  /**
   * 获取用户个人信息
   */
  async getProfile(userId: number): Promise<User> {
    return this.userService.findOne(userId);
  }

  /**
   * 更新用户个人信息
   */
  async updateProfile(
    userId: number,
    updateProfileDto: UpdateProfileDto,
  ): Promise<User> {
    const user = await this.userService.update(userId, updateProfileDto);
    this.logger.log(`用户更新个人信息: ${user.username}`);
    return user;
  }

  /**
   * 修改密码
   */
  async updatePassword(
    userId: number,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<void> {
    const { oldPassword, newPassword } = updatePasswordDto;

    const user = await this.userService.findOne(userId);

    const isPasswordValid = await this.userService.validatePassword(
      oldPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException("原密码错误");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userService.update(userId, { password: hashedPassword });

    // 修改密码后撤销所有 Refresh Token
    await this.revokeAllUserTokens(userId);

    this.logger.log(`用户修改密码: ${user.username}`);
  }

  /**
   * 清理过期的 Refresh Token（定时任务调用）
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected || 0;
  }

  /**
   * 获取用户活跃会话列表
   */
  async getActiveSessions(userId: number): Promise<RefreshToken[]> {
    return this.refreshTokenRepository.find({
      where: {
        userId,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: "DESC" },
    });
  }
}
