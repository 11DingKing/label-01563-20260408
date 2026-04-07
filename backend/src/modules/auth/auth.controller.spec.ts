import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

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

  const mockTokens = {
    accessToken: 'jwt-access-token',
    refreshToken: 'jwt-refresh-token',
    expiresIn: 900,
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      updatePassword: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'password123',
        email: 'new@example.com',
      };

      const newUser = createMockUser({
        username: registerDto.username,
        email: registerDto.email,
      });

      authService.register.mockResolvedValue(newUser);

      const result = await controller.register(registerDto);

      expect(result).toEqual({
        id: newUser.id,
        username: registerDto.username,
        email: registerDto.email,
      });
    });
  });

  describe('login', () => {
    it('should return access token and user info', async () => {
      const loginDto = { username: 'testuser', password: 'password123' };

      authService.login.mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const mockRequest = {
        headers: { 'user-agent': 'test-agent' },
      };

      const result = await controller.login(
        loginDto,
        '127.0.0.1',
        mockRequest as any,
      );

      expect(result.accessToken).toBe(mockTokens.accessToken);
      expect(result.refreshToken).toBe(mockTokens.refreshToken);
      expect(result.user.username).toBe(mockUser.username);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      authService.getProfile.mockResolvedValue(mockUser);

      const result = await controller.getProfile(mockUser);

      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const updateDto = { nickname: 'Updated Name' };
      const updatedUser = createMockUser({ nickname: 'Updated Name' });

      authService.updateProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateProfile(mockUser, updateDto);

      expect(result.nickname).toBe('Updated Name');
    });
  });

  describe('updatePassword', () => {
    it('should update password', async () => {
      const updateDto = {
        oldPassword: 'oldpassword',
        newPassword: 'newpassword',
      };

      authService.updatePassword.mockResolvedValue();

      const result = await controller.updatePassword(mockUser, updateDto);

      expect(result.message).toBe('密码修改成功，请重新登录');
    });
  });

  describe('logout', () => {
    it('should return logout success message', async () => {
      authService.logout.mockResolvedValue();

      const result = await controller.logout(mockUser, undefined);

      expect(result.message).toBe('退出登录成功');
    });
  });
});
