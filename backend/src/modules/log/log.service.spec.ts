import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotFoundException } from "@nestjs/common";
import { LogService } from "./log.service";
import { OperationLog } from "./entities/operation-log.entity";

describe("LogService", () => {
  let service: LogService;
  let repository: jest.Mocked<Repository<OperationLog>>;

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

  const mockQueryBuilder = {
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogService,
        {
          provide: getRepositoryToken(OperationLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LogService>(LogService);
    repository = module.get(getRepositoryToken(OperationLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new log entry", async () => {
      const createDto = {
        userId: 1,
        username: "testuser",
        action: "登录",
        module: "auth",
        method: "POST",
        path: "/api/auth/login",
        status: 1,
      };

      repository.create.mockReturnValue(mockLog);
      repository.save.mockResolvedValue(mockLog);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockLog);
    });
  });

  describe("findAll", () => {
    it("should return paginated logs", async () => {
      const queryDto = { page: 1, pageSize: 10 };
      const logs = [mockLog];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([logs, 1]);

      const result = await service.findAll(queryDto);

      expect(result.data).toEqual(logs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
    });

    it("should filter by username", async () => {
      const queryDto = { page: 1, pageSize: 10, username: "test" };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "log.username LIKE :username",
        { username: "%test%" },
      );
    });

    it("should filter by module", async () => {
      const queryDto = { page: 1, pageSize: 10, module: "auth" };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "log.module = :module",
        { module: "auth" },
      );
    });

    it("should filter by status", async () => {
      const queryDto = { page: 1, pageSize: 10, status: 1 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "log.status = :status",
        { status: 1 },
      );
    });

    it("should filter by date range", async () => {
      const queryDto = {
        page: 1,
        pageSize: 10,
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockLog], 1]);

      await service.findAll(queryDto);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "log.createdAt >= :startDate",
        expect.any(Object),
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "log.createdAt <= :endDate",
        expect.any(Object),
      );
    });

    it("should use default pagination values", async () => {
      const queryDto = {};

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

      const result = await service.findAll(queryDto);

      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe("findOne", () => {
    it("should return a log by id", async () => {
      repository.findOne.mockResolvedValue(mockLog);

      const result = await service.findOne(1);

      expect(result).toEqual(mockLog);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("should throw NotFoundException when log not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
