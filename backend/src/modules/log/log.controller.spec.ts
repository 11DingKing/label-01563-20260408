import { Test, TestingModule } from "@nestjs/testing";
import { LogController } from "./log.controller";
import { LogService } from "./log.service";
import { OperationLog } from "./entities/operation-log.entity";

describe("LogController", () => {
  let controller: LogController;
  let logService: jest.Mocked<LogService>;

  const mockLog: OperationLog = {
    id: 1,
    userId: 1,
    username: "testuser",
    action: "登录",
    module: "auth",
    method: "POST",
    path: "/api/auth/login",
    params: '{"username":"testuser"}',
    result: '{"code":0}',
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    duration: 100,
    status: 1,
    createdAt: new Date(),
  };

  const mockPaginatedResult = {
    data: [mockLog],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  };

  beforeEach(async () => {
    const mockLogService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogController],
      providers: [{ provide: LogService, useValue: mockLogService }],
    }).compile();

    controller = module.get<LogController>(LogController);
    logService = module.get(LogService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated logs", async () => {
      const queryDto = { page: 1, pageSize: 10 };

      logService.findAll.mockResolvedValue(mockPaginatedResult);

      const result = await controller.findAll(queryDto);

      expect(logService.findAll).toHaveBeenCalledWith(queryDto);
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it("should filter logs by username", async () => {
      const queryDto = { page: 1, pageSize: 10, username: "test" };

      logService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(queryDto);

      expect(logService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it("should filter logs by module", async () => {
      const queryDto = { page: 1, pageSize: 10, module: "auth" };

      logService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(queryDto);

      expect(logService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it("should filter logs by status", async () => {
      const queryDto = { page: 1, pageSize: 10, status: 1 };

      logService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(queryDto);

      expect(logService.findAll).toHaveBeenCalledWith(queryDto);
    });

    it("should filter logs by date range", async () => {
      const queryDto = {
        page: 1,
        pageSize: 10,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      logService.findAll.mockResolvedValue(mockPaginatedResult);

      await controller.findAll(queryDto);

      expect(logService.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe("findOne", () => {
    it("should return a log by id", async () => {
      logService.findOne.mockResolvedValue(mockLog);

      const result = await controller.findOne(1);

      expect(logService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockLog);
    });
  });
});
