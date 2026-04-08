import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { LogService } from "./log.service";
import { QueryLogDto } from "./dto/query-log.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles, Role } from "../../common/decorators/roles.decorator";

@ApiTags("操作日志")
@ApiBearerAuth("JWT")
@Controller("logs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LogController {
  constructor(private readonly logService: LogService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "获取日志列表",
    description: "分页查询操作日志，支持筛选",
  })
  @ApiResponse({ status: 200, description: "返回日志列表" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  findAll(@Query() queryDto: QueryLogDto) {
    return this.logService.findAll(queryDto);
  }

  @Get(":id")
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: "获取日志详情",
    description: "根据 ID 获取操作日志详情",
  })
  @ApiParam({ name: "id", description: "日志 ID", example: 1 })
  @ApiResponse({ status: 200, description: "返回日志详情" })
  @ApiResponse({ status: 401, description: "未授权" })
  @ApiResponse({ status: 403, description: "无权限" })
  @ApiResponse({ status: 404, description: "日志不存在" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.logService.findOne(id);
  }
}
