import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserController', () => {
  let controller: UserController;
  let userService: jest.Mocked<UserService>;

  const createMockUser = (overrides = {}): User => {
    const user = new User();
    Object.assign(user, {
      id: 1,
      username: 'testuser',
      password: '$2a$10$hashedpassword',
      email: 'test@example.com',
      nickname: 'Test User',
      avatar: '',
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
    const mockUserService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createDto = {
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
      };

      const newUser = createMockUser({
        username: createDto.username,
        email: createDto.email,
      });

      userService.create.mockResolvedValue(newUser);

      const result = await controller.create(createDto);

      expect(result.username).toBe(createDto.username);
      expect(result.email).toBe(createDto.email);
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      const paginatedResult = {
        data: [mockUser],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      userService.findAll.mockResolvedValue(paginatedResult);

      const query = { page: 1, pageSize: 10 };
      const result = await controller.findAll(query);

      expect(result).toEqual(paginatedResult);
      expect(userService.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateDto = { nickname: 'Updated Name' };
      const updatedUser = createMockUser({ nickname: 'Updated Name' });

      userService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateDto);

      expect(result.nickname).toBe('Updated Name');
      expect(userService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('updateStatus', () => {
    it('should update user status', async () => {
      const statusDto = { status: 0 };
      const updatedUser = createMockUser({ status: 0 });

      userService.updateStatus.mockResolvedValue(updatedUser);

      const result = await controller.updateStatus(1, statusDto);

      expect(result.status).toBe(0);
      expect(userService.updateStatus).toHaveBeenCalledWith(1, statusDto);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      userService.remove.mockResolvedValue(undefined);

      await expect(controller.remove(1)).resolves.not.toThrow();
      expect(userService.remove).toHaveBeenCalledWith(1);
    });
  });
});
