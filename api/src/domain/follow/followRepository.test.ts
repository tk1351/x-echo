import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowErrorType } from "../../utils/errors.js";
import {
  checkFollowStatus,
  createFollow,
  deleteFollow,
  getFollowers,
  getFollowing,
} from "./followRepository.ts";

describe("followRepository", () => {
  let mockPrisma: any;
  const mockFollow = {
    id: 1,
    followerId: 1,
    followingId: 2,
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockPrisma = {
      follow: {
        create: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
      user: {
        update: vi.fn(),
      },
      $transaction: vi.fn().mockImplementation((callbacks) => Promise.all(callbacks)),
    };
  });

  describe("createFollow", () => {
    it("should create a follow relationship successfully", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockResolvedValue(null);
      mockPrisma.follow.create.mockResolvedValue(mockFollow);
      mockPrisma.user.update.mockResolvedValue({});

      // Act
      const result = await createFollow(
        { followerId: 1, followingId: 2 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockFollow);
      }
      expect(mockPrisma.follow.create).toHaveBeenCalledWith({
        data: { followerId: 1, followingId: 2 },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return error when trying to follow self", async () => {
      // Act
      const result = await createFollow(
        { followerId: 1, followingId: 1 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.CANNOT_FOLLOW_SELF);
      }
      expect(mockPrisma.follow.create).not.toHaveBeenCalled();
    });

    it("should return error when already following", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockResolvedValue(mockFollow);

      // Act
      const result = await createFollow(
        { followerId: 1, followingId: 2 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.ALREADY_FOLLOWING);
      }
      expect(mockPrisma.follow.create).not.toHaveBeenCalled();
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await createFollow(
        { followerId: 1, followingId: 2 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("deleteFollow", () => {
    it("should delete a follow relationship successfully", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockResolvedValue(mockFollow);
      mockPrisma.follow.delete.mockResolvedValue(mockFollow);
      mockPrisma.user.update.mockResolvedValue({});

      // Act
      const result = await deleteFollow(1, 2, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(true);
      expect(mockPrisma.follow.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("should return error when not following", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockResolvedValue(null);

      // Act
      const result = await deleteFollow(1, 2, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.NOT_FOLLOWING);
      }
      expect(mockPrisma.follow.delete).not.toHaveBeenCalled();
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await deleteFollow(1, 2, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("checkFollowStatus", () => {
    it("should return true when following", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockResolvedValue(mockFollow);

      // Act
      const result = await checkFollowStatus(1, 2, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
    });

    it("should return false when not following", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockResolvedValue(null);

      // Act
      const result = await checkFollowStatus(1, 2, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.follow.findFirst.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await checkFollowStatus(1, 2, mockPrisma as PrismaClient);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("getFollowers", () => {
    it("should return followers with pagination", async () => {
      // Arrange
      const mockFollows = [
        { ...mockFollow, id: 3 },
        { ...mockFollow, id: 2 },
        { ...mockFollow, id: 1 },
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockFollows);

      // Act
      const result = await getFollowers(
        2,
        { limit: 2 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.follows).toHaveLength(2);
        expect(result.value.hasMore).toBe(true);
        expect(result.value.nextCursor).toBe(2);
      }
    });

    it("should handle empty followers list", async () => {
      // Arrange
      mockPrisma.follow.findMany.mockResolvedValue([]);

      // Act
      const result = await getFollowers(
        2,
        { limit: 10 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.follows).toHaveLength(0);
        expect(result.value.hasMore).toBe(false);
        expect(result.value.nextCursor).toBeUndefined();
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.follow.findMany.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await getFollowers(
        2,
        { limit: 10 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.INTERNAL_ERROR);
      }
    });
  });

  describe("getFollowing", () => {
    it("should return following users with pagination", async () => {
      // Arrange
      const mockFollows = [
        { ...mockFollow, id: 3 },
        { ...mockFollow, id: 2 },
        { ...mockFollow, id: 1 },
      ];
      mockPrisma.follow.findMany.mockResolvedValue(mockFollows);

      // Act
      const result = await getFollowing(
        1,
        { limit: 2 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.follows).toHaveLength(2);
        expect(result.value.hasMore).toBe(true);
        expect(result.value.nextCursor).toBe(2);
      }
    });

    it("should handle empty following list", async () => {
      // Arrange
      mockPrisma.follow.findMany.mockResolvedValue([]);

      // Act
      const result = await getFollowing(
        1,
        { limit: 10 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.follows).toHaveLength(0);
        expect(result.value.hasMore).toBe(false);
        expect(result.value.nextCursor).toBeUndefined();
      }
    });

    it("should return error when database throws error", async () => {
      // Arrange
      mockPrisma.follow.findMany.mockRejectedValue(new Error("Database error"));

      // Act
      const result = await getFollowing(
        1,
        { limit: 10 },
        mockPrisma as PrismaClient,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.INTERNAL_ERROR);
      }
    });
  });
});
