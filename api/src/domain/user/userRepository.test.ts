import type { PrismaClient, User } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserUpdateData } from "../../types/index.js";
import { UserErrorType } from "../../utils/errors.js";
import {
  findUserById,
  findUserByIdentifier,
  findUserByUsername,
  updateUser,
} from "./userRepository.js";

describe("userRepository", () => {
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
    mockPrisma = {
      user: {
        findFirst: vi.fn(),
        findUnique: vi.fn(),
      },
    };
  });

  describe("findUserByIdentifier", () => {
    it("should return user when found by username", async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(mockUser);

      // Act
      const result = await findUserByIdentifier(
        "testuser",
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockUser);
      }
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ username: "testuser" }, { email: "testuser" }],
        },
      });
    });

    it("should return error when user not found", async () => {
      // Arrange
      mockPrisma.user.findFirst.mockResolvedValue(null);

      // Act
      const result = await findUserByIdentifier(
        "nonexistent",
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
        expect(result.error.message).toBe("ユーザーが見つかりません");
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.user.findFirst.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await findUserByIdentifier(
        "testuser",
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("findUserById", () => {
    it("should return user when found by id", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await findUserById(1, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockUser);
      }
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return error when user not found", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await findUserById(999, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
        expect(result.error.message).toBe("ユーザーが見つかりません");
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await findUserById(1, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("findUserByUsername", () => {
    beforeEach(() => {
      mockPrisma.user.findUnique = vi.fn();
    });

    it("should return user when found by username", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await findUserByUsername(
        "testuser",
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockUser);
      }
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "testuser" },
      });
    });

    it("should return error when user not found", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await findUserByUsername(
        "nonexistent",
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
        expect(result.error.message).toBe("ユーザーが見つかりません");
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await findUserByUsername(
        "testuser",
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("updateUser", () => {
    beforeEach(() => {
      mockPrisma.user.update = vi.fn();
    });

    it("should update user successfully", async () => {
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
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      // Act
      const result = await updateUser(
        userId,
        updateData,
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(updatedUser);
      }
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });

    it("should return error when user not found", async () => {
      // Arrange
      const userId = 999;
      const updateData: UserUpdateData = {
        displayName: "Updated Name",
      };
      mockPrisma.user.update.mockRejectedValue(
        new Error("Record to update not found"),
      );

      // Act
      const result = await updateUser(
        userId,
        updateData,
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      const userId = 1;
      const updateData: UserUpdateData = {
        displayName: "Updated Name",
      };
      mockPrisma.user.update.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await updateUser(
        userId,
        updateData,
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.INTERNAL_ERROR);
      }
    });
  });
});
