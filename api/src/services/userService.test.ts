import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, checkUserExists, createUser } from './userService.ts';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { UserErrorType } from '../utils/errors.ts';

// モックの作成
vi.mock('bcrypt');
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findFirst: vi.fn(),
        create: vi.fn()
      }
    }))
  };
});

describe('hashPassword', () => {
  it('should hash password correctly', async () => {
    // モックの設定
    vi.mocked(bcrypt.genSalt).mockResolvedValue('salt' as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);

    const result = await hashPassword('password123');

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    expect(result).toBe('hashedPassword');
  });

  it('should throw error if password is empty', async () => {
    await expect(hashPassword('')).rejects.toThrow('Password is required');
  });
});

describe('checkUserExists', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn()
      }
    };
  });

  it('should not throw error if user does not exist', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(checkUserExists('newuser', 'new@example.com', mockPrisma as PrismaClient))
      .resolves.not.toThrow();

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { username: 'newuser' },
          { email: 'new@example.com' }
        ]
      }
    });
  });

  it('should throw error if username already exists', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      username: 'newuser',
      email: 'existing@example.com'
    });

    await expect(checkUserExists('newuser', 'new@example.com', mockPrisma as PrismaClient))
      .rejects.toThrow('Username already exists');
  });

  it('should throw error if email already exists', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      username: 'existinguser',
      email: 'new@example.com'
    });

    await expect(checkUserExists('newuser', 'new@example.com', mockPrisma as PrismaClient))
      .rejects.toThrow('Email already exists');
  });
});

describe('createUser', () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        create: vi.fn()
      }
    };

    vi.mocked(bcrypt.genSalt).mockResolvedValue('salt' as never);
    vi.mocked(bcrypt.hash).mockResolvedValue('hashedPassword' as never);
  });

  it('should create user successfully', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      username: 'newuser',
      displayName: 'New User',
      email: 'new@example.com',
      passwordHash: 'hashedPassword',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await createUser({
      username: 'newuser',
      displayName: 'New User',
      email: 'new@example.com',
      password: 'password123'
    }, mockPrisma as PrismaClient);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty('id', 1);
      expect(result.value).toHaveProperty('username', 'newuser');
    }
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        username: 'newuser',
        displayName: 'New User',
        email: 'new@example.com',
        passwordHash: 'hashedPassword'
      }
    });
  });

  it('should return error if user already exists', async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      username: 'newuser',
      email: 'existing@example.com'
    });

    const result = await createUser({
      username: 'newuser',
      displayName: 'New User',
      email: 'new@example.com',
      password: 'password123'
    }, mockPrisma as PrismaClient);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.USER_ALREADY_EXISTS);
    }
  });
});
