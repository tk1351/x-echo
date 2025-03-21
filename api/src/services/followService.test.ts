import { beforeEach, describe, expect, it, vi } from "vitest";
import * as followRepository from "../domain/follow/followRepository.js";
import * as userRepository from "../domain/user/userRepository.js";
import { FollowErrorType, UserErrorType } from "../utils/errors.js";
import { Role } from "../types/role.js";
import {
  followUser,
  getUserFollowers,
  getUserFollowing,
  getUserProfileWithFollowStatus,
  isFollowing,
  unfollowUser,
} from "./followService.js";

vi.mock("../domain/follow/followRepository.js");
vi.mock("../domain/user/userRepository.js");
vi.mock("../lib/prisma.js", () => ({
  default: {},
}));

describe("followService", () => {
  const mockUser = {
    id: 2,
    username: "testuser",
    displayName: "Test User",
    email: "test@example.com",
    passwordHash: "hashedpassword",
    bio: "Test bio",
    profileImageUrl: null,
    headerImageUrl: null,
    followersCount: 0,
    followingCount: 0,
    isVerified: false,
    isActive: true,
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFollow = {
    id: 1,
    followerId: 1,
    followingId: 2,
    createdAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("followUser", () => {
    it("should follow a user successfully", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.createFollow).mockResolvedValue({
        ok: true,
        value: mockFollow,
      });

      // Act
      const result = await followUser(1, "testuser");

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          id: 1,
          followerId: 1,
          followingId: 2,
          createdAt: expect.any(Date),
        });
      }
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(
        "testuser",
        expect.anything()
      );
      expect(followRepository.createFollow).toHaveBeenCalledWith(
        { followerId: 1, followingId: 2 },
        expect.anything()
      );
    });

    it("should return error when user is not found", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const result = await followUser(1, "nonexistentuser");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
      expect(followRepository.createFollow).not.toHaveBeenCalled();
    });

    it("should return error when already following", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.createFollow).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.ALREADY_FOLLOWING,
          message: "Already following this user",
        },
      });

      // Act
      const result = await followUser(1, "testuser");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.ALREADY_FOLLOWING);
      }
    });
  });

  describe("unfollowUser", () => {
    it("should unfollow a user successfully", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.deleteFollow).mockResolvedValue({
        ok: true,
        value: undefined,
      });

      // Act
      const result = await unfollowUser(1, "testuser");

      // Assert
      expect(result.ok).toBe(true);
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(
        "testuser",
        expect.anything()
      );
      expect(followRepository.deleteFollow).toHaveBeenCalledWith(
        1,
        2,
        expect.anything()
      );
    });

    it("should return error when user is not found", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const result = await unfollowUser(1, "nonexistentuser");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
      expect(followRepository.deleteFollow).not.toHaveBeenCalled();
    });

    it("should return error when not following", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.deleteFollow).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.NOT_FOLLOWING,
          message: "Not following this user",
        },
      });

      // Act
      const result = await unfollowUser(1, "testuser");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(FollowErrorType.NOT_FOLLOWING);
      }
    });
  });

  describe("isFollowing", () => {
    it("should return true when following", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.checkFollowStatus).mockResolvedValue({
        ok: true,
        value: true,
      });

      // Act
      const result = await isFollowing(1, "testuser");

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(true);
      }
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(
        "testuser",
        expect.anything()
      );
      expect(followRepository.checkFollowStatus).toHaveBeenCalledWith(
        1,
        2,
        expect.anything()
      );
    });

    it("should return false when not following", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.checkFollowStatus).mockResolvedValue({
        ok: true,
        value: false,
      });

      // Act
      const result = await isFollowing(1, "testuser");

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(false);
      }
    });

    it("should return error when user is not found", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const result = await isFollowing(1, "nonexistentuser");

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
      expect(followRepository.checkFollowStatus).not.toHaveBeenCalled();
    });
  });

  describe("getUserProfileWithFollowStatus", () => {
    it("should return user profile with follow status when following", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.checkFollowStatus).mockResolvedValue({
        ok: true,
        value: true,
      });

      // Act
      const result = await getUserProfileWithFollowStatus("testuser", 1);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({
          id: 2,
          username: "testuser",
          displayName: "Test User",
          bio: "Test bio",
          profileImageUrl: null,
          headerImageUrl: null,
          followersCount: 0,
          followingCount: 0,
          isVerified: false,
          createdAt: expect.any(Date),
          isFollowing: true,
        });
      }
    });

    it("should return user profile with isFollowing=false when not following", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.checkFollowStatus).mockResolvedValue({
        ok: true,
        value: false,
      });

      // Act
      const result = await getUserProfileWithFollowStatus("testuser", 1);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isFollowing).toBe(false);
      }
    });

    it("should return user profile with isFollowing=false when no current user", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });

      // Act
      const result = await getUserProfileWithFollowStatus("testuser");

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isFollowing).toBe(false);
      }
      expect(followRepository.checkFollowStatus).not.toHaveBeenCalled();
    });

    it("should return error when user is not found", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const result = await getUserProfileWithFollowStatus("nonexistentuser", 1);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
    });
  });

  describe("getUserFollowers", () => {
    it("should return followers with pagination", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.getFollowers).mockResolvedValue({
        ok: true,
        value: {
          follows: [
            { ...mockFollow, id: 2, followerId: 3 },
            { ...mockFollow, id: 1, followerId: 1 },
          ],
          hasMore: true,
          nextCursor: 1,
        },
      });

      // Act
      const result = await getUserFollowers("testuser", { limit: 2 });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.follows).toHaveLength(2);
        expect(result.value.pagination.hasMore).toBe(true);
        expect(result.value.pagination.nextCursor).toBe("1");
      }
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(
        "testuser",
        expect.anything()
      );
      expect(followRepository.getFollowers).toHaveBeenCalledWith(
        2,
        { limit: 2 },
        expect.anything()
      );
    });

    it("should return error when user is not found", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const result = await getUserFollowers("nonexistentuser", { limit: 10 });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
      expect(followRepository.getFollowers).not.toHaveBeenCalled();
    });
  });

  describe("getUserFollowing", () => {
    it("should return following users with pagination", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: true,
        value: mockUser,
      });
      vi.mocked(followRepository.getFollowing).mockResolvedValue({
        ok: true,
        value: {
          follows: [
            { ...mockFollow, id: 2, followingId: 3 },
            { ...mockFollow, id: 1, followingId: 4 },
          ],
          hasMore: true,
          nextCursor: 1,
        },
      });

      // Act
      const result = await getUserFollowing("testuser", { limit: 2 });

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.follows).toHaveLength(2);
        expect(result.value.pagination.hasMore).toBe(true);
        expect(result.value.pagination.nextCursor).toBe("1");
      }
      expect(userRepository.findUserByUsername).toHaveBeenCalledWith(
        "testuser",
        expect.anything()
      );
      expect(followRepository.getFollowing).toHaveBeenCalledWith(
        2,
        { limit: 2 },
        expect.anything()
      );
    });

    it("should return error when user is not found", async () => {
      // Arrange
      vi.mocked(userRepository.findUserByUsername).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      const result = await getUserFollowing("nonexistentuser", { limit: 10 });

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(UserErrorType.USER_NOT_FOUND);
      }
      expect(followRepository.getFollowing).not.toHaveBeenCalled();
    });
  });
});
