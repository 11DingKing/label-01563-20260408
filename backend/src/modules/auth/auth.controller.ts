import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  ClassSerializerInterceptor,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  Req,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  UpdateProfileDto,
  UpdatePasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OperationLog } from '../../common/decorators/operation-log.decorator';
import { User } from '../user/entities/user.entity';

@ApiTags('认证')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @OperationLog({ module: '认证', action: '用户注册' })
  @ApiOperation({ summary: '用户注册', description: '创建新用户账号' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 400, description: '参数验证失败' })
  @ApiResponse({ status: 409, description: '用户名或邮箱已存在' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return { id: user.id, username: user.username, email: user.email };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @OperationLog({ module: '认证', action: '用户登录' })
  @ApiOperation({ summary: '用户登录', description: '使用用户名和密码登录，获取访问令牌' })
  @ApiResponse({ status: 200, description: '登录成功，返回 Token 和用户信息' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  @ApiResponse({ status: 403, description: '账户已被锁定' })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const { user, tokens } = await this.authService.login(
      loginDto,
      ip,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: '刷新令牌', description: '使用 Refresh Token 获取新的 Access Token' })
  @ApiResponse({ status: 200, description: '刷新成功，返回新的 Token' })
  @ApiResponse({ status: 401, description: '无效或过期的刷新令牌' })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const tokens = await this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      ip,
      userAgent,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '获取个人信息', description: '获取当前登录用户的详细信息' })
  @ApiResponse({ status: 200, description: '返回用户信息' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@CurrentUser() user: User) {
    return this.authService.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @OperationLog({ module: '认证', action: '更新个人信息' })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '更新个人信息', description: '更新当前用户的昵称、头像等信息' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.id, updateProfileDto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  @OperationLog({ module: '认证', action: '修改密码' })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '修改密码', description: '修改当前用户的登录密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  @ApiResponse({ status: 400, description: '原密码错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updatePassword(
    @CurrentUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    await this.authService.updatePassword(user.id, updatePasswordDto);
    return { message: '密码修改成功，请重新登录' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @OperationLog({ module: '认证', action: '退出登录' })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '退出登录', description: '退出当前设备的登录状态' })
  @ApiBody({ schema: { properties: { refreshToken: { type: 'string', description: '可选，指定要撤销的 Refresh Token' } } } })
  @ApiResponse({ status: 200, description: '退出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async logout(
    @CurrentUser() user: User,
    @Body('refreshToken') refreshToken?: string,
  ) {
    await this.authService.logout(user.id, refreshToken);
    return { message: '退出登录成功' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @OperationLog({ module: '认证', action: '全设备退出' })
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: '全设备退出', description: '退出所有设备的登录状态' })
  @ApiResponse({ status: 200, description: '退出成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async logoutAll(@CurrentUser() user: User) {
    await this.authService.revokeAllUserTokens(user.id);
    return { message: '已从所有设备退出登录' };
  }
}
