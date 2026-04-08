import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { UserService } from "./user.service";
import { User } from "./entities/user.entity";

jest.mock("bcryptjs");

describe("UserService", () => {
  let service: UserService;
  let repository: jest.Mocked<Repository<User>>;

  const createMockUser = (overrides = {}): User => {
    const user = new User();
    Object.assign(user, {
      id: 1,
      username: "testuser",
      password: "$2a$10$hashedpassword",
      email: "test@example.com",
      nickname: "Test User",
      avatar: "",
      status: 1,
      role: 0,
      loginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: null,
      lastLoginIp: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
    return user;
  };

  const mockUser = createMockUser();

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(User), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repository = module.get(getRepositoryToken(User));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const createDto = {
        username: "newuser",
        password: "password123",
        email: "new@example.com",
      };

      const newUser = createMockUser({
        username: createDto.username,
        email: createDto.email,
      });

      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(newUser);
      repository.save.mockResolvedValue(newUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");

      const result = await service.create(createDto);

      expect(result.username).toBe(createDto.username);
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it("should throw ConflictException if username exists", async () => {
      const createDto = {
        username: "testuser", // same as mockUser
        password: "password123",
        email: "new@example.com",
      };

      // findOne checks both username and email, returns existing user with matching username
      repository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it("should throw ConflictException if email exists", async () => {
      const createDto = {
        username: "newuser",
        password: "password123",
        email: "test@example.com", // same as mockUser
      };

      // findOne finds existing user with matching email
      const existingUserWithEmail = createMockUser({
        username: "otheruser",
        email: "test@example.com",
      });
      repository.findOne.mockResolvedValue(existingUserWithEmail);

      await expect(service.create(createDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("findOne", () => {
    it("should return a user by id", async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it("should throw NotFoundException if user not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("findByUsername", () => {
    it("should return a user by username", async () => {
      repository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername("testuser");

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
    });

    it("should return null if user not found", async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername("nonexistent");

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a user", async () => {
      const updateDto = { nickname: "Updated Name" };
      const updatedUser = createMockUser({ nickname: "Updated Name" });

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.update(1, updateDto);

      expect(result.nickname).toBe("Updated Name");
    });

    it("should throw NotFoundException if user not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { nickname: "Test" })).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ConflictException if username already taken", async () => {
      const existingUser = createMockUser({
        id: 2,
        username: "existinguser",
      });

      repository.findOne
        .mockResolvedValueOnce(mockUser) // findOne(id)
        .mockResolvedValueOnce(existingUser); // findByUsername

      await expect(
        service.update(1, { username: "existinguser" }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("updateStatus", () => {
    it("should update user status", async () => {
      const updatedUser = createMockUser({ status: 0 });

      repository.findOne.mockResolvedValue(mockUser);
      repository.save.mockResolvedValue(updatedUser);

      const result = await service.updateStatus(1, { status: 0 });

      expect(result.status).toBe(0);
    });

    it("should throw NotFoundException if user not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.updateStatus(999, { status: 0 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("remove", () => {
    it("should remove a user", async () => {
      repository.findOne.mockResolvedValue(mockUser);
      repository.remove.mockResolvedValue(mockUser);

      await expect(service.remove(1)).resolves.not.toThrow();
      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it("should throw NotFoundException if user not found", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe("validatePassword", () => {
    it("should return true for valid password", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validatePassword(
        "password123",
        "hashedPassword",
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedPassword",
      );
    });

    it("should return false for invalid password", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validatePassword(
        "wrongpassword",
        "hashedPassword",
      );

      expect(result).toBe(false);
    });
  });
});
