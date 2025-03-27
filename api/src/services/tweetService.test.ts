import { describe, expect, it, vi } from "vitest";
import * as tweetRepository from "../domain/tweet/tweetRepository.ts";
import { TweetErrorType } from "../utils/errors.ts";
import {
  createTweet,
  getLatestTweets,
  getTimeline,
  getTweetById,
  getTweetsByUsername,
} from "./tweetService.ts";

vi.mock("../domain/tweet/tweetRepository.ts");

describe("tweetService", () => {
  describe("createTweet", () => {
    it("should validate tweet content length", async () => {
      // Arrange
      const mockPrisma = {} as any;
      const emptyContent = "";
      const tooLongContent = "a".repeat(281);

      // Act
      const emptyResult = await createTweet(
        { content: emptyContent, userId: 1 },
        mockPrisma,
      );
      const tooLongResult = await createTweet(
        { content: tooLongContent, userId: 1 },
        mockPrisma,
      );

      // Assert
      expect(emptyResult.ok).toBe(false);
      if (!emptyResult.ok) {
        expect(emptyResult.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
      }
      expect(tooLongResult.ok).toBe(false);
      if (!tooLongResult.ok) {
        expect(tooLongResult.error.type).toBe(
          TweetErrorType.INVALID_TWEET_DATA,
        );
      }
    });

    it("should check if user exists", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any;

      // Act
      const result = await createTweet(
        { content: "Valid content", userId: 999 },
        mockPrisma,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INVALID_TWEET_DATA);
      }
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it("should create tweet when validation passes", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      const mockTweet = {
        id: 1,
        content: "Valid content",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(tweetRepository, "createTweet").mockResolvedValue({
        ok: true,
        value: mockTweet,
      });

      // Act
      const result = await createTweet(
        { content: "Valid content", userId: 1 },
        mockPrisma,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockTweet);
      }
      expect(tweetRepository.createTweet).toHaveBeenCalledWith(
        { content: "Valid content", userId: 1 },
        mockPrisma,
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      vi.spyOn(tweetRepository, "createTweet").mockResolvedValue({
        ok: false,
        error: new Error("Repository error"),
      });

      // Act
      const result = await createTweet(
        { content: "Valid content", userId: 1 },
        mockPrisma,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.TWEET_CREATION_FAILED);
      }
    });
  });

  describe("getTweetById", () => {
    it("should return tweet when found", async () => {
      // Arrange
      const mockPrisma = {} as any;
      const mockTweet = {
        id: 1,
        content: "Test tweet",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.spyOn(tweetRepository, "getTweetById").mockResolvedValue({
        ok: true,
        value: mockTweet,
      });

      // Act
      const result = await getTweetById(1, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(mockTweet);
      }
      expect(tweetRepository.getTweetById).toHaveBeenCalledWith(1, mockPrisma);
    });

    it("should return TWEET_NOT_FOUND error when tweet is not found", async () => {
      // Arrange
      const mockPrisma = {} as any;
      vi.spyOn(tweetRepository, "getTweetById").mockResolvedValue({
        ok: false,
        error: new Error("Tweet not found with id: 999"),
      });

      // Act
      const result = await getTweetById(999, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.TWEET_NOT_FOUND);
        expect(result.error.message).toBe("Tweet with id 999 not found");
      }
    });

    it("should return INTERNAL_ERROR when repository throws unexpected error", async () => {
      // Arrange
      const mockPrisma = {} as any;
      vi.spyOn(tweetRepository, "getTweetById").mockResolvedValue({
        ok: false,
        error: new Error("Database error"),
      });

      // Act
      const result = await getTweetById(1, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INTERNAL_ERROR);
        expect(result.error.message).toBe("Failed to retrieve tweet");
      }
    });
  });

  describe("getTweetsByUsername", () => {
    it("should validate limit parameter", async () => {
      // Arrange
      const mockPrisma = {} as any;

      // Act
      const tooSmallResult = await getTweetsByUsername("user1", 0, mockPrisma);
      const tooLargeResult = await getTweetsByUsername(
        "user1",
        101,
        mockPrisma,
      );

      // Assert
      expect(tooSmallResult.ok).toBe(false);
      expect(tooLargeResult.ok).toBe(false);
      if (!tooSmallResult.ok && !tooLargeResult.ok) {
        expect(tooSmallResult.error.type).toBe(
          TweetErrorType.INVALID_PAGINATION_PARAMS,
        );
        expect(tooLargeResult.error.type).toBe(
          TweetErrorType.INVALID_PAGINATION_PARAMS,
        );
      }
    });

    it("should check if user exists", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any;

      // Act
      const result = await getTweetsByUsername("nonexistent", 10, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.USER_NOT_FOUND);
        expect(result.error.message).toBe(
          "User with username nonexistent not found",
        );
      }
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { username: "nonexistent" },
        select: { id: true },
      });
    });

    it("should retrieve tweets by username successfully", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      const mockTweets = [
        {
          id: 3,
          content: "Tweet 3",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          content: "Tweet 2",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.spyOn(tweetRepository, "getTweetsByUserId").mockResolvedValue({
        ok: true,
        value: {
          tweets: mockTweets,
          hasMore: true,
        },
      });

      // Act
      const result = await getTweetsByUsername("user1", 10, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets).toEqual(mockTweets);
        expect(result.value.pagination.hasMore).toBe(true);
        expect(result.value.pagination.nextCursor).toBe("2");
      }
      expect(tweetRepository.getTweetsByUserId).toHaveBeenCalledWith(
        1,
        10,
        mockPrisma,
        undefined,
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      vi.spyOn(tweetRepository, "getTweetsByUserId").mockResolvedValue({
        ok: false,
        error: new Error("Repository error"),
      });

      // Act
      const result = await getTweetsByUsername("user1", 10, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INTERNAL_ERROR);
        expect(result.error.message).toBe("Failed to retrieve tweets");
      }
    });
  });

  describe("getLatestTweets", () => {
    it("should validate limit parameter", async () => {
      // Arrange
      const mockPrisma = {} as any;

      // Act
      const tooSmallResult = await getLatestTweets(0, mockPrisma);
      const tooLargeResult = await getLatestTweets(101, mockPrisma);

      // Assert
      expect(tooSmallResult.ok).toBe(false);
      expect(tooLargeResult.ok).toBe(false);
      if (!tooSmallResult.ok && !tooLargeResult.ok) {
        expect(tooSmallResult.error.type).toBe(
          TweetErrorType.INVALID_PAGINATION_PARAMS,
        );
        expect(tooLargeResult.error.type).toBe(
          TweetErrorType.INVALID_PAGINATION_PARAMS,
        );
      }
    });

    it("should retrieve latest tweets successfully", async () => {
      // Arrange
      const mockPrisma = {} as any;
      const mockTweets = [
        {
          id: 3,
          content: "Tweet 3",
          userId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          content: "Tweet 2",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.spyOn(tweetRepository, "getLatestTweets").mockResolvedValue({
        ok: true,
        value: {
          tweets: mockTweets,
          hasMore: true,
        },
      });

      // Act
      const result = await getLatestTweets(10, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets).toEqual(mockTweets);
        expect(result.value.pagination.hasMore).toBe(true);
        expect(result.value.pagination.nextCursor).toBe("2");
      }
      expect(tweetRepository.getLatestTweets).toHaveBeenCalledWith(
        10,
        mockPrisma,
        undefined,
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockPrisma = {} as any;
      vi.spyOn(tweetRepository, "getLatestTweets").mockResolvedValue({
        ok: false,
        error: new Error("Repository error"),
      });

      // Act
      const result = await getLatestTweets(10, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INTERNAL_ERROR);
        expect(result.error.message).toBe("Failed to retrieve tweets");
      }
    });
  });

  describe("getTimeline", () => {
    it("should validate limit parameter", async () => {
      // Arrange
      const mockPrisma = {} as any;

      // Act
      const tooSmallResult = await getTimeline(1, 0, mockPrisma);
      const tooLargeResult = await getTimeline(1, 101, mockPrisma);

      // Assert
      expect(tooSmallResult.ok).toBe(false);
      expect(tooLargeResult.ok).toBe(false);
      if (!tooSmallResult.ok && !tooLargeResult.ok) {
        expect(tooSmallResult.error.type).toBe(
          TweetErrorType.INVALID_PAGINATION_PARAMS,
        );
        expect(tooLargeResult.error.type).toBe(
          TweetErrorType.INVALID_PAGINATION_PARAMS,
        );
      }
    });

    it("should check if user exists", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as any;

      // Act
      const result = await getTimeline(999, 10, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.USER_NOT_FOUND);
        expect(result.error.message).toBe("User with id 999 not found");
      }
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
        select: { id: true },
      });
    });

    it("should retrieve timeline tweets successfully", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      const mockTweets = [
        {
          id: 3,
          content: "Tweet 3",
          userId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          content: "Tweet 2",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.spyOn(tweetRepository, "getTimelineTweets").mockResolvedValue({
        ok: true,
        value: {
          tweets: mockTweets,
          hasMore: true,
        },
      });

      // Act
      const result = await getTimeline(1, 10, mockPrisma);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets).toEqual(mockTweets);
        expect(result.value.pagination.hasMore).toBe(true);
        expect(result.value.pagination.nextCursor).toBe("2");
      }
      expect(tweetRepository.getTimelineTweets).toHaveBeenCalledWith(
        1,
        10,
        mockPrisma,
        undefined,
      );
    });

    it("should handle cursor-based pagination", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      const mockTweets = [
        {
          id: 2,
          content: "Tweet 2",
          userId: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 1,
          content: "Tweet 1",
          userId: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      vi.spyOn(tweetRepository, "getTimelineTweets").mockResolvedValue({
        ok: true,
        value: {
          tweets: mockTweets,
          hasMore: false,
        },
      });

      // Act
      const result = await getTimeline(1, 10, mockPrisma, 3);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets).toEqual(mockTweets);
        expect(result.value.pagination.hasMore).toBe(false);
        expect(result.value.pagination.nextCursor).toBeUndefined();
      }
      expect(tweetRepository.getTimelineTweets).toHaveBeenCalledWith(
        1,
        10,
        mockPrisma,
        3,
      );
    });

    it("should handle repository errors", async () => {
      // Arrange
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: 1 }),
        },
      } as any;
      vi.spyOn(tweetRepository, "getTimelineTweets").mockResolvedValue({
        ok: false,
        error: new Error("Repository error"),
      });

      // Act
      const result = await getTimeline(1, 10, mockPrisma);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe(TweetErrorType.INTERNAL_ERROR);
        expect(result.error.message).toBe("Failed to retrieve timeline tweets");
      }
    });
  });
});
