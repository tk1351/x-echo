import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as userService from '../services/userService.ts';
import { UserErrorType } from '../utils/errors.ts';
import { registerUser, userCreateSchema } from './userController.ts';

// モックの作成
vi.mock('../services/userService.ts');
vi.mock('../lib/prisma.ts', () => ({
  default: {}
}));

describe('userCreateSchema', () => {
  it('should validate correct user data', () => {
    const validData = {
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const result = userCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject invalid username', () => {
    const invalidData = {
      username: 'te',  // too short
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const result = userCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const invalidData = {
      username: 'testuser',
      displayName: 'Test User',
      email: 'invalid-email',
      password: 'password123'
    };

    const result = userCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject short password', () => {
    const invalidData = {
      username: 'testuser',
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'short'
    };

    const result = userCreateSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('registerUser', () => {
  let mockContext: any;
  const userData = {
    username: 'testuser',
    displayName: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    mockContext = {
      req: {
        json: vi.fn().mockResolvedValue(userData)
      },
      json: vi.fn().mockReturnValue('json-response')
    };
  });

  it('should return 201 with user data on successful registration', async () => {
    vi.mocked(userService.createUser).mockResolvedValue({
      ok: true,
      value: {
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
        bio: null,
        profileImageUrl: null,
        headerImageUrl: null,
        followersCount: 0,
        followingCount: 0,
        isVerified: false,
        isActive: true,
        role: 'USER'
      }
    } as any);

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com'
      }),
      201
    );
    expect(result).toBe('json-response');
  });

  it('should return 400 when validation fails', async () => {
    // バリデーション失敗のモック
    mockContext.req.json.mockResolvedValue({
      username: 'te', // 短すぎる
      displayName: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Validation error',
        details: expect.any(Object)
      }),
      400
    );
    expect(result).toBe('json-response');
  });

  it('should return 409 when user already exists', async () => {
    vi.mocked(userService.createUser).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.USER_ALREADY_EXISTS,
        message: 'Username already exists'
      }
    });

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Username already exists' },
      409
    );
    expect(result).toBe('json-response');
  });

  it('should return 500 on internal error', async () => {
    vi.mocked(userService.createUser).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.INTERNAL_ERROR,
        message: 'Failed to create user'
      }
    });

    const result = await registerUser(mockContext);

    expect(mockContext.json).toHaveBeenCalledWith(
      { error: 'Internal server error' },
      500
    );
    expect(result).toBe('json-response');
  });
});
