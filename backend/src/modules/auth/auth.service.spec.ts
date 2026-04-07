import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid-v4',
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: jest.Mocked<UserService>;
  let jwtService: jest.Mocked<JwtService>;

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
      findByUsername: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      validatePassword: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-secret'),
    };

    const mockRefreshTokenRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get(UserService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should create a new user successfully', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
      };

      const newUser = createMockUser({
        username: registerDto.username,
        email: registerDto.email,
      });

      userService.create.mockResolvedValue(newUser);

      const result = await service.register(registerDto);

      expect(userService.create).toHaveBeenCalledWith({
        ...registerDto,
        status: 1,
        role: 0,
      });
      expect(result.username).toBe(registerDto.username);
    });
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      userService.update.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(loginDto);

      expect(result.user).toEqual(mockUser);
      expect(result.tokens).toBeDefined();
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto = { username: 'nonexistent', password: 'password' };

      userService.findByUsername.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user is disabled', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };
      const disabledUser = createMockUser({ status: 0 });

      userService.findByUsername.mockResolvedValue(disabledUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const loginDto = { username: 'testuser', password: 'wrongpassword' };

      userService.findByUsername.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(false);
      userService.update.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      userService.findOne.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(result).toEqual(mockUser);
      expect(userService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { nickname: 'Updated Name' };
      const updatedUser = createMockUser({ nickname: 'Updated Name' });

      userService.update.mockResolvedValue(updatedUser);

      const result = await service.updateProfile(1, updateDto);

      expect(result.nickname).toBe('Updated Name');
      expect(userService.update).toHaveBeenCalledWith(1, updateDto);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const updateDto = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      userService.findOne.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(true);
      userService.update.mockResolvedValue(mockUser);

      await expect(service.updatePassword(1, updateDto)).resolves.not.toThrow();
      expect(userService.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException when old password is incorrect', async () => {
      const updateDto = {
        oldPassword: 'wrongpassword',
        newPassword: 'newpassword',
      };

      userService.findOne.mockResolvedValue(mockUser);
      userService.validatePassword.mockResolvedValue(false);

      await expect(service.updatePassword(1, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
