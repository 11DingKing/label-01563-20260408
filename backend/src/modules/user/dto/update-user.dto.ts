import {
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsDate,
} from "class-validator";
import { Type } from "class-transformer";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatar?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  status?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  role?: number;

  // 登录安全相关字段
  @IsOptional()
  @IsInt()
  @Min(0)
  loginAttempts?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lockedUntil?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  lastLoginAt?: Date | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastLoginIp?: string | null;
}

export class UpdateStatusDto {
  @IsInt()
  @Min(0)
  @Max(1)
  status: number;
}
