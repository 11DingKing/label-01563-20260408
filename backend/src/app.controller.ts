import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { Public } from "./common/decorators/public.decorator";

@ApiTags("健康检查")
@Controller()
export class AppController {
  @Get()
  @Public()
  @ApiOperation({ summary: "API 状态", description: "获取 API 基本状态信息" })
  @ApiResponse({ status: 200, description: "返回 API 状态信息" })
  healthCheck() {
    return {
      status: "ok",
      service: "NestJS Auth API",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };
  }

  @Get("health")
  @Public()
  @ApiOperation({
    summary: "健康检查",
    description: "获取服务健康状态和运行时间",
  })
  @ApiResponse({ status: 200, description: "返回健康状态信息" })
  health() {
    return {
      status: "healthy",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
