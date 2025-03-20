import type { PrismaClient, User } from "@prisma/client";
import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserUpdateData } from "../types/index.js";
import { UserErrorType } from "../utils/errors.ts";
import * as userRepository from "../domain/user/userRepository.js";
import { checkUserExists, createUser, getUserProfile, hashPassword, updateUserProfile, validateProfileData } from "./userService.ts";

// モックの作成
vi.mock("bcrypt");
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    })),
  };
});

// モックの設定
vi.mock("../domain/user/userRepository.js", () => ({
  findUserByUsername: vi.fn(),
  updateUser: vi.fn(),
}));

describe("validateProfileData", () => {
  it("should return true for valid profile data", () => {
    const validData: UserUpdateData = {
      displayName: "Valid Name",
      bio: "Valid bio text",
    };

    const result = validateProfileData(validData);
    expect(result.ok).toBe(true);
  });

  it("should return error for empty displayName", () => {
    const invalidData: UserUpdateData = {
      displayName: "",
      bio: "Valid bio",
    };

    const result = validateProfileData(invalidData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.INVALID_PROFILE_DATA);
      expect(result.error.message).toContain("表示名");
    }
  });

  it("should return error for too long displayName", () => {
    const invalidData: UserUpdateData = {
      displayName: "a".repeat(51), // 51文字（上限は50文字）
      bio: "Valid bio",
    };

    const result = validateProfileData(invalidData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.INVALID_PROFILE_DATA);
      expect(result.error.message).toContain("表示名");
    }
  });

  it("should return error for too long bio", () => {
    const invalidData: UserUpdateData = {
      displayName: "Valid Name",
      bio: "a".repeat(161), // 161文字（上限は160文字）
    };

    const result = validateProfileData(invalidData);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.INVALID_PROFILE_DATA);
      expect(result.error.message).toContain("自己紹介");
    }
  });
});

describe("getUserProfile", () => {
  let mockPrisma: any;
  const mockUser: User = {
    id: 1,
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedpassword",
    bio: "Test bio",
    profileImageUrl: "http://example.com/image.jpg",
    headerImageUrl: null,
    followersCount: 5,
    followingCount: 10,
    isVerified: false,
    isActive: true,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {};
    vi.mocked(userRepository.findUserByUsername).mockReset();
  });

  it("should return user profile when found", async () => {
    // Arrange
    vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
      ok: true,
      value: mockUser,
    });

    // Act
    const result = await getUserProfile("testuser", mockPrisma as PrismaClient);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty("username", "testuser");
      expect(result.value).toHaveProperty("displayName", "Test User");
      expect(result.value).toHaveProperty("bio", "Test bio");
      expect(result.value).toHaveProperty("followersCount", 5);
      expect(result.value).not.toHaveProperty("email"); // メールアドレスは含まれない
      expect(result.value).not.toHaveProperty("passwordHash"); // パスワードハッシュは含まれない
    }
    expect(userRepository.findUserByUsername).toHaveBeenCalledWith(
      "testuser",
      mockPrisma,
    );
  });

  it("should return error when user not found", async () => {
    // Arrange
    vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.USER_NOT_FOUND,
        message: "ユーザーが見つかりません",
      },
    });

    // Act
    const result = await getUserProfile("nonexistent", mockPrisma as PrismaClient);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
    }
  });
});

describe("updateUserProfile", () => {
  let mockPrisma: any;
  const mockUser: User = {
    id: 1,
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedpassword",
    bio: null,
    profileImageUrl: null,
    headerImageUrl: null,
    followersCount: 0,
    followingCount: 0,
    isVerified: false,
    isActive: true,
    role: "USER",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {};
    vi.mocked(userRepository.updateUser).mockReset();
  });

  it("should update user profile successfully", async () => {
    // Arrange
    const userId = 1;
    const updateData: UserUpdateData = {
      displayName: "Updated Name",
      bio: "Updated bio",
    };
    const updatedUser = {
      ...mockUser,
      displayName: "Updated Name",
      bio: "Updated bio",
    };

    vi.mocked(userRepository.updateUser).mockResolvedValue({
      ok: true,
      value: updatedUser,
    });

    // Act
    const result = await updateUserProfile(userId, updateData, mockPrisma as PrismaClient);

    // Assert
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty("displayName", "Updated Name");
      expect(result.value).toHaveProperty("bio", "Updated bio");
      expect(result.value).not.toHaveProperty("passwordHash"); // パスワードハッシュは含まれない
    }
    expect(userRepository.updateUser).toHaveBeenCalledWith(
      userId,
      updateData,
      mockPrisma,
    );
  });

  it("should return error for invalid profile data", async () => {
    // Arrange
    const userId = 1;
    const invalidData: UserUpdateData = {
      displayName: "", // 空の表示名（無効）
    };

    // Act
    const result = await updateUserProfile(userId, invalidData, mockPrisma as PrismaClient);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.INVALID_PROFILE_DATA);
    }
    expect(userRepository.updateUser).not.toHaveBeenCalled();
  });

  it("should return error when user not found", async () => {
    // Arrange
    const userId = 999;
    const updateData: UserUpdateData = {
      displayName: "Updated Name",
    };

    vi.mocked(userRepository.updateUser).mockResolvedValue({
      ok: false,
      error: {
        type: UserErrorType.USER_NOT_FOUND,
        message: "更新するユーザーが見つかりません",
      },
    });

    // Act
    const result = await updateUserProfile(userId, updateData, mockPrisma as PrismaClient);

    // Assert
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
    }
  });
});

describe("hashPassword", () => {
  it("should hash password correctly", async () => {
    // モックの設定
    vi.mocked(bcrypt.genSalt).mockResolvedValue("salt" as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as never);

    const result = await hashPassword("password123");

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith("password123", "salt");
    expect(result).toBe("hashedPassword");
  });

  it("should throw error if password is empty", async () => {
    await expect(hashPassword("")).rejects.toThrow("Password is required");
  });
});

describe("checkUserExists", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
      },
    };
  });

  it("should not throw error if user does not exist", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);

    await expect(
      checkUserExists("newuser", "new@example.com", mockPrisma as PrismaClient),
    ).resolves.not.toThrow();

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [{ username: "newuser" }, { email: "new@example.com" }],
      },
    });
  });

  it("should throw error if username already exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      username: "newuser",
      email: "existing@example.com",
    });

    await expect(
      checkUserExists("newuser", "new@example.com", mockPrisma as PrismaClient),
    ).rejects.toThrow("Username already exists");
  });

  it("should throw error if email already exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      username: "existinguser",
      email: "new@example.com",
    });

    await expect(
      checkUserExists("newuser", "new@example.com", mockPrisma as PrismaClient),
    ).rejects.toThrow("Email already exists");
  });
});

describe("createUser", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
    };

    vi.mocked(bcrypt.genSalt).mockResolvedValue("salt" as never);
    vi.mocked(bcrypt.hash).mockResolvedValue("hashedPassword" as never);
  });

  it("should create user successfully", async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({
      id: 1,
      username: "newuser",
      displayName: "New User",
      email: "new@example.com",
      passwordHash: "hashedPassword",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await createUser(
      {
        username: "newuser",
        displayName: "New User",
        email: "new@example.com",
        password: "password123",
      },
      mockPrisma as PrismaClient,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveProperty("id", 1);
      expect(result.value).toHaveProperty("username", "newuser");
    }
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        username: "newuser",
        displayName: "New User",
        email: "new@example.com",
        passwordHash: "hashedPassword",
      },
    });
  });

  it("should return error if user already exists", async () => {
    mockPrisma.user.findFirst.mockResolvedValue({
      username: "newuser",
      email: "existing@example.com",
    });

    const result = await createUser(
      {
        username: "newuser",
        displayName: "New User",
        email: "new@example.com",
        password: "password123",
      },
      mockPrisma as PrismaClient,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe(UserErrorType.USER_ALREADY_EXISTS);
    }
  });
});
