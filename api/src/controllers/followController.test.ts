import type { Context } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowErrorType, UserErrorType } from "../utils/errors.js";
import {
  followUserController,
  getUserFollowersController,
  getUserFollowingController,
  unfollowUserController,
} from "./followController.js";

// Mock the followService
vi.mock("../services/followService.js", () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
  getUserFollowers: vi.fn(),
  getUserFollowing: vi.fn(),
}));

// Import the mocked services
import {
  followUser,
  getUserFollowers,
  getUserFollowing,
  unfollowUser,
} from "../services/followService.js";

describe("followController", () => {
  let mockContext: any;

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Create mock context
    mockContext = {
      get: vi.fn().mockReturnValue({ id: 1 }), // Mock JWT payload
      req: {
        param: vi.fn(),
        query: vi.fn(),
      },
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe("followUserController", () => {
    it("should follow a user successfully", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(followUser).mockResolvedValue({
        ok: true,
        value: {
          id: 1,
          followerId: 1,
          followingId: 2,
          createdAt: new Date(),
        },
      });

      // Act
      await followUserController(mockContext as unknown as Context);

      // Assert
      expect(followUser).toHaveBeenCalledWith(1, "testuser");
      expect(mockContext.status).toHaveBeenCalledWith(201);
      expect(mockContext.json).toHaveBeenCalledWith({
        follow: expect.objectContaining({
          id: 1,
          followerId: 1,
          followingId: 2,
        }),
      });
    });

    it("should return 404 when user is not found", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("nonexistentuser");
      vi.mocked(followUser).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      await followUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(404);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });
    });

    it("should return 409 when already following", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(followUser).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.ALREADY_FOLLOWING,
          message: "Already following this user",
        },
      });

      // Act
      await followUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(409);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.ALREADY_FOLLOWING,
          message: "Already following this user",
        },
      });
    });

    it("should return 400 when trying to follow self", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("currentuser");
      vi.mocked(followUser).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.CANNOT_FOLLOW_SELF,
          message: "Cannot follow yourself",
        },
      });

      // Act
      await followUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.CANNOT_FOLLOW_SELF,
          message: "Cannot follow yourself",
        },
      });
    });

    it("should return 500 on internal error", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(followUser).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal error",
        },
      });

      // Act
      await followUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(followUser).mockRejectedValue(new Error("Unexpected error"));

      // Act
      await followUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });
  });

  describe("unfollowUserController", () => {
    it("should unfollow a user successfully", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(unfollowUser).mockResolvedValue({
        ok: true,
        value: undefined,
      });

      // Act
      await unfollowUserController(mockContext as unknown as Context);

      // Assert
      expect(unfollowUser).toHaveBeenCalledWith(1, "testuser");
      expect(mockContext.status).toHaveBeenCalledWith(200);
      expect(mockContext.json).toHaveBeenCalledWith({
        message: "Successfully unfollowed user",
      });
    });

    it("should return 404 when user is not found", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("nonexistentuser");
      vi.mocked(unfollowUser).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      await unfollowUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(404);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });
    });

    it("should return 400 when not following", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(unfollowUser).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.NOT_FOLLOWING,
          message: "Not following this user",
        },
      });

      // Act
      await unfollowUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.NOT_FOLLOWING,
          message: "Not following this user",
        },
      });
    });

    it("should return 500 on internal error", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(unfollowUser).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal error",
        },
      });

      // Act
      await unfollowUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      vi.mocked(unfollowUser).mockRejectedValue(new Error("Unexpected error"));

      // Act
      await unfollowUserController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });
  });

  describe("getUserFollowersController", () => {
    it("should return followers with pagination", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowers).mockResolvedValue({
        ok: true,
        value: {
          follows: [
            { id: 1, followerId: 3, followingId: 2, createdAt: new Date() },
            { id: 2, followerId: 4, followingId: 2, createdAt: new Date() },
          ],
          pagination: {
            hasMore: true,
            nextCursor: "1",
          },
        },
      });

      // Act
      await getUserFollowersController(mockContext as unknown as Context);

      // Assert
      expect(getUserFollowers).toHaveBeenCalledWith("testuser", { limit: 20 });
      expect(mockContext.status).toHaveBeenCalledWith(200);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          follows: expect.arrayContaining([
            expect.objectContaining({ id: 1 }),
            expect.objectContaining({ id: 2 }),
          ]),
          pagination: expect.objectContaining({
            hasMore: true,
            nextCursor: "1",
          }),
        })
      );
    });

    it("should handle pagination parameters", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "10", cursor: "5" });
      vi.mocked(getUserFollowers).mockResolvedValue({
        ok: true,
        value: {
          follows: [
            { id: 3, followerId: 5, followingId: 2, createdAt: new Date() },
          ],
          pagination: {
            hasMore: false,
            nextCursor: undefined,
          },
        },
      });

      // Act
      await getUserFollowersController(mockContext as unknown as Context);

      // Assert
      expect(getUserFollowers).toHaveBeenCalledWith("testuser", {
        limit: 10,
        cursor: 5,
      });
      expect(mockContext.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "invalid" });

      // Act
      await getUserFollowersController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: "VALIDATION_ERROR",
          }),
        })
      );
    });

    it("should return 404 when user is not found", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("nonexistentuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowers).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      await getUserFollowersController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(404);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });
    });

    it("should return 500 on internal error", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowers).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal error",
        },
      });

      // Act
      await getUserFollowersController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowers).mockRejectedValue(
        new Error("Unexpected error")
      );

      // Act
      await getUserFollowersController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });
  });

  describe("getUserFollowingController", () => {
    it("should return following users with pagination", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowing).mockResolvedValue({
        ok: true,
        value: {
          follows: [
            { id: 1, followerId: 2, followingId: 3, createdAt: new Date() },
            { id: 2, followerId: 2, followingId: 4, createdAt: new Date() },
          ],
          pagination: {
            hasMore: true,
            nextCursor: "1",
          },
        },
      });

      // Act
      await getUserFollowingController(mockContext as unknown as Context);

      // Assert
      expect(getUserFollowing).toHaveBeenCalledWith("testuser", { limit: 20 });
      expect(mockContext.status).toHaveBeenCalledWith(200);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          follows: expect.arrayContaining([
            expect.objectContaining({ id: 1 }),
            expect.objectContaining({ id: 2 }),
          ]),
          pagination: expect.objectContaining({
            hasMore: true,
            nextCursor: "1",
          }),
        })
      );
    });

    it("should handle pagination parameters", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "10", cursor: "5" });
      vi.mocked(getUserFollowing).mockResolvedValue({
        ok: true,
        value: {
          follows: [
            { id: 3, followerId: 2, followingId: 5, createdAt: new Date() },
          ],
          pagination: {
            hasMore: false,
            nextCursor: undefined,
          },
        },
      });

      // Act
      await getUserFollowingController(mockContext as unknown as Context);

      // Assert
      expect(getUserFollowing).toHaveBeenCalledWith("testuser", {
        limit: 10,
        cursor: 5,
      });
      expect(mockContext.status).toHaveBeenCalledWith(200);
    });

    it("should return 400 for invalid pagination parameters", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "invalid" });

      // Act
      await getUserFollowingController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(400);
      expect(mockContext.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            type: "VALIDATION_ERROR",
          }),
        })
      );
    });

    it("should return 404 when user is not found", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("nonexistentuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowing).mockResolvedValue({
        ok: false,
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });

      // Act
      await getUserFollowingController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(404);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: UserErrorType.USER_NOT_FOUND,
          message: "User not found",
        },
      });
    });

    it("should return 500 on internal error", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowing).mockResolvedValue({
        ok: false,
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal error",
        },
      });

      // Act
      await getUserFollowingController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockContext.req.param.mockReturnValue("testuser");
      mockContext.req.query.mockReturnValue({ limit: "20" });
      vi.mocked(getUserFollowing).mockRejectedValue(
        new Error("Unexpected error")
      );

      // Act
      await getUserFollowingController(mockContext as unknown as Context);

      // Assert
      expect(mockContext.status).toHaveBeenCalledWith(500);
      expect(mockContext.json).toHaveBeenCalledWith({
        error: {
          type: FollowErrorType.INTERNAL_ERROR,
          message: "Internal server error",
        },
      });
    });
  });
});
