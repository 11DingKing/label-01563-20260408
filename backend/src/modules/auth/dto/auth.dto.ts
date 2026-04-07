import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// 密码强度正则：至少包含大写字母、小写字母、数字，长度8-50
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&_-]{8,}$/;
const PASSWORD_MESSAGE = '密码必须包含大写字母、小写字母和数字，且长度不少于8位';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'newuser', minLength: 3, maxLength: 50 })
  @IsString()
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(50, { message: '用户名长度不能超过50个字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '用户名只能包含字母、数字、下划线和连字符' })
  username: string;

  @ApiProperty({ description: '密码（需包含大小写字母和数字）', example: 'Password123', minLength: 8, maxLength: 50 })
  @IsString()
  @MinLength(8, { message: '密码长度不能少于8个字符' })
  @MaxLength(50, { message: '密码长度不能超过50个字符' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password: string;

  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '请输入有效的邮箱地址' })
  email: string;

  @ApiPropertyOptional({ description: '昵称', example: '新用户', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString()
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', example: 'admin123' })
  @IsString()
  @MinLength(6, { message: '密码长度不能少于6个字符' })
  @MaxLength(50)
  password: string;

  @ApiPropertyOptional({ description: '记住我（延长 Token 有效期）', example: false })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称', example: '新昵称' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiPropertyOptional({ description: '头像 URL', example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string;
}

export class UpdatePasswordDto {
  @ApiProperty({ description: '原密码', example: 'OldPassword123' })
  @IsString()
  @MinLength(6, { message: '原密码长度不能少于6个字符' })
  @MaxLength(50)
  oldPassword: string;

  @ApiProperty({ description: '新密码（需包含大小写字母和数字）', example: 'NewPassword123' })
  @IsString()
  @MinLength(8, { message: '新密码长度不能少于8个字符' })
  @MaxLength(50, { message: '新密码长度不能超过50个字符' })
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  newPassword: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌', example: 'uuid-refresh-token' })
  @IsString({ message: '刷新令牌不能为空' })
  refreshToken: string;
}
