import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  ClassSerializerInterceptor,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { v4 as uuidv4 } from "uuid";
import { extname, join } from "path";
import { UserService } from "./user.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto, UpdateStatusDto } from "./dto/update-user.dto";
import { QueryUserDto } from "./dto/query-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, Role } from "../../common/decorators/roles.decorator";
import { OperationLog } from "../../common/decorators/operation-log.decorator";
import { FileService } from "../file/file.service";

const avatarStorage = diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = join(process.cwd(), "uploads", "avatars");
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const avatarFileFilter = (
  req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestException("只允许上传图片文件 (jpeg, png, gif, webp)"),
      false,
    );
  }
};

@ApiTags("用户管理")
@ApiBearerAuth("JWT")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @OperationLog({ module: "用户管理", action: "创建用户" })
  @ApiOperation({ summary: "创建用户", description: "管理员创建新用户" })
  @ApiResponse({ status: 201, description: "创建成功" })
  @ApiResponse({ status: 400, description: "参数验证失败" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 409, description: "用户名或邮箱已存在" })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "获取用户列表",
    description: "分页查询用户列表，支持筛选",
  })
  @ApiResponse({ status: 200, description: "返回用户列表" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  findAll(@Query() queryDto: QueryUserDto) {
    return this.userService.findAll(queryDto);
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "获取用户详情",
    description: "根据 ID 获取用户详细信息",
  })
  @ApiParam({ name: "id", description: "用户 ID", example: 1 })
  @ApiResponse({ status: 200, description: "返回用户信息" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Put(":id")
  @Roles(Role.ADMIN)
  @OperationLog({ module: "用户管理", action: "更新用户" })
  @ApiOperation({ summary: "更新用户", description: "更新用户信息" })
  @ApiParam({ name: "id", description: "用户 ID", example: 1 })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Put(":id/status")
  @Roles(Role.ADMIN)
  @OperationLog({ module: "用户管理", action: "更新用户状态" })
  @ApiOperation({ summary: "更新用户状态", description: "启用或禁用用户" })
  @ApiParam({ name: "id", description: "用户 ID", example: 1 })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  updateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return this.userService.updateStatus(id, updateStatusDto);
  }

  @Post(":id/avatar")
  @Roles(Role.ADMIN)
  @OperationLog({ module: "用户管理", action: "上传用户头像" })
  @ApiOperation({
    summary: "上传用户头像",
    description: "为指定用户上传头像图片",
  })
  @ApiParam({ name: "id", description: "用户 ID", example: 1 })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        avatar: {
          type: "string",
          format: "binary",
          description: "头像图片文件 (jpeg, png, gif, webp)",
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: "上传成功" })
  @ApiResponse({ status: 400, description: "文件格式错误或文件为空" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  @UseInterceptors(
    FileInterceptor("avatar", {
      storage: avatarStorage,
      fileFilter: avatarFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async uploadAvatar(
    @Param("id", ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException("请选择要上传的图片文件");
    }
    return this.userService.updateAvatar(id, file.filename);
  }

  @Delete(":id/avatar")
  @Roles(Role.ADMIN)
  @OperationLog({ module: "用户管理", action: "删除用户头像" })
  @ApiOperation({ summary: "删除用户头像", description: "删除指定用户的头像" })
  @ApiParam({ name: "id", description: "用户 ID", example: 1 })
  @ApiResponse({ status: 200, description: "删除成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  removeAvatar(@Param("id", ParseIntPipe) id: number) {
    return this.userService.deleteAvatar(id);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @OperationLog({ module: "用户管理", action: "删除用户" })
  @ApiOperation({ summary: "删除用户", description: "删除指定用户" })
  @ApiParam({ name: "id", description: "用户 ID", example: 1 })
  @ApiResponse({ status: 200, description: "删除成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
