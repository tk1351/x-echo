import { describe, expect, it, vi } from "vitest";
import {
  createTweet,
  getLatestTweets,
  getTimelineTweets,
  getTweetById,
  getTweetsByUserId,
} from "./tweetRepository.ts";

describe("tweetRepository", () => {
  describe("createTweet", () => {
    it("should create a tweet successfully", async () => {
      // Arrange
      const mockPrisma = {
        tweet: {
          create: vi.fn().mockResolvedValue({
            id: 1,
            content: "Test tweet",
            userId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      };

      // Act
      const result = await createTweet(
        { content: "Test tweet", userId: 1 },
        mockPrisma as any,
      );

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveProperty("id", 1);
        expect(result.value).toHaveProperty("content", "Test tweet");
        expect(result.value).toHaveProperty("userId", 1);
      }
      expect(mockPrisma.tweet.create).toHaveBeenCalledWith({
        data: {
          content: "Test tweet",
          userId: 1,
        },
      });
    });

    it("should return error when tweet creation fails", async () => {
      // Arrange
      const mockError = new Error("Database error");
      const mockPrisma = {
        tweet: {
          create: vi.fn().mockRejectedValue(mockError),
        },
      };

      // Act
      const result = await createTweet(
        { content: "Test tweet", userId: 1 },
        mockPrisma as any,
      );

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });

  describe("getTweetById", () => {
    it("should retrieve a tweet by id successfully", async () => {
      // Arrange
      const expectedTweet = {
        id: 1,
        content: "Test tweet",
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockPrisma = {
        tweet: {
          findUnique: vi.fn().mockResolvedValue(expectedTweet),
        },
      };

      // Act
      const result = await getTweetById(1, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(expectedTweet);
      }
      expect(mockPrisma.tweet.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it("should return error when tweet is not found", async () => {
      // Arrange
      const mockPrisma = {
        tweet: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };

      // Act
      const result = await getTweetById(999, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBeInstanceOf(Error);
        expect(result.error.message).toBe("Tweet not found with id: 999");
      }
    });

    it("should return error when database query fails", async () => {
      // Arrange
      const mockError = new Error("Database error");
      const mockPrisma = {
        tweet: {
          findUnique: vi.fn().mockRejectedValue(mockError),
        },
      };

      // Act
      const result = await getTweetById(1, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });

  describe("getTweetsByUserId", () => {
    it("should retrieve tweets by user ID with pagination", async () => {
      // Arrange
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
        {
          id: 1,
          content: "Tweet 1",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockPrisma = {
        tweet: {
          findMany: vi.fn().mockResolvedValue(mockTweets),
        },
      };

      // Act
      const result = await getTweetsByUserId(1, 2, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets.length).toBe(2);
        expect(result.value.hasMore).toBe(true);
        expect(result.value.tweets[0].id).toBe(3);
        expect(result.value.tweets[1].id).toBe(2);
      }
      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
      });
    });

    it("should handle cursor-based pagination", async () => {
      // Arrange
      const mockTweets = [
        {
          id: 2,
          content: "Tweet 2",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 1,
          content: "Tweet 1",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockPrisma = {
        tweet: {
          findMany: vi.fn().mockResolvedValue(mockTweets),
        },
      };

      // Act
      const result = await getTweetsByUserId(1, 2, mockPrisma as any, 3);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets.length).toBe(2);
        expect(result.value.hasMore).toBe(false);
      }
      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: { userId: 1, id: { lt: 3 } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
      });
    });

    it("should return error when database query fails", async () => {
      // Arrange
      const mockError = new Error("Database error");
      const mockPrisma = {
        tweet: {
          findMany: vi.fn().mockRejectedValue(mockError),
        },
      };

      // Act
      const result = await getTweetsByUserId(1, 10, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });

  describe("getLatestTweets", () => {
    it("should retrieve latest tweets with pagination", async () => {
      // Arrange
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
        {
          id: 1,
          content: "Tweet 1",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockPrisma = {
        tweet: {
          findMany: vi.fn().mockResolvedValue(mockTweets),
        },
      };

      // Act
      const result = await getLatestTweets(2, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets.length).toBe(2);
        expect(result.value.hasMore).toBe(true);
        expect(result.value.tweets[0].id).toBe(3);
        expect(result.value.tweets[1].id).toBe(2);
      }
      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
      });
    });

    it("should handle cursor-based pagination", async () => {
      // Arrange
      const mockTweets = [
        {
          id: 2,
          content: "Tweet 2",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 1,
          content: "Tweet 1",
          userId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const mockPrisma = {
        tweet: {
          findMany: vi.fn().mockResolvedValue(mockTweets),
        },
      };

      // Act
      const result = await getLatestTweets(2, mockPrisma as any, 3);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets.length).toBe(2);
        expect(result.value.hasMore).toBe(false);
      }
      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: { id: { lt: 3 } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
      });
    });

    it("should return error when database query fails", async () => {
      // Arrange
      const mockError = new Error("Database error");
      const mockPrisma = {
        tweet: {
          findMany: vi.fn().mockRejectedValue(mockError),
        },
      };

      // Act
      const result = await getLatestTweets(10, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });

  describe("getTimelineTweets", () => {
    it("should retrieve timeline tweets from followed users and self", async () => {
      // Arrange
      const userId = 1;
      const followingIds = [2, 3];
      const mockFollowings = followingIds.map(followingId => ({ followingId }));
      const mockTweets = [
        {
          id: 3,
          content: "Tweet 3",
          userId: 2,
          createdAt: new Date("2023-01-03"),
          updatedAt: new Date(),
        },
        {
          id: 2,
          content: "Tweet 2",
          userId: 1,
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date(),
        },
        {
          id: 1,
          content: "Tweet 1",
          userId: 3,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date(),
        },
      ];
      const mockPrisma = {
        follow: {
          findMany: vi.fn().mockResolvedValue(mockFollowings),
        },
        tweet: {
          findMany: vi.fn().mockResolvedValue(mockTweets),
        },
      };

      // Act
      const result = await getTimelineTweets(userId, 2, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets.length).toBe(2);
        expect(result.value.hasMore).toBe(true);
        expect(result.value.tweets[0].id).toBe(3);
        expect(result.value.tweets[1].id).toBe(2);
      }
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: userId },
        select: { followingId: true },
      });
      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: [...followingIds, userId] },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
      });
    });

    it("should handle cursor-based pagination", async () => {
      // Arrange
      const userId = 1;
      const followingIds = [2, 3];
      const mockFollowings = followingIds.map(followingId => ({ followingId }));
      const mockTweets = [
        {
          id: 2,
          content: "Tweet 2",
          userId: 2,
          createdAt: new Date("2023-01-02"),
          updatedAt: new Date(),
        },
        {
          id: 1,
          content: "Tweet 1",
          userId: 3,
          createdAt: new Date("2023-01-01"),
          updatedAt: new Date(),
        },
      ];
      const cursorTweet = {
        createdAt: new Date("2023-01-03"),
      };
      const mockPrisma = {
        follow: {
          findMany: vi.fn().mockResolvedValue(mockFollowings),
        },
        tweet: {
          findUnique: vi.fn().mockResolvedValue(cursorTweet),
          findMany: vi.fn().mockResolvedValue(mockTweets),
        },
      };

      // Act
      const result = await getTimelineTweets(userId, 2, mockPrisma as any, 3);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.tweets.length).toBe(2);
        expect(result.value.hasMore).toBe(false);
      }
      expect(mockPrisma.follow.findMany).toHaveBeenCalledWith({
        where: { followerId: userId },
        select: { followingId: true },
      });
      expect(mockPrisma.tweet.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: { createdAt: true },
      });
      expect(mockPrisma.tweet.findMany).toHaveBeenCalledWith({
        where: {
          userId: { in: [...followingIds, userId] },
          OR: [
            { createdAt: { lt: cursorTweet.createdAt } },
            {
              AND: [
                { createdAt: { equals: cursorTweet.createdAt } },
                { id: { lt: 3 } },
              ],
            },
          ],
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 3,
      });
    });

    it("should return error when database query fails", async () => {
      // Arrange
      const mockError = new Error("Database error");
      const mockPrisma = {
        follow: {
          findMany: vi.fn().mockRejectedValue(mockError),
        },
      };

      // Act
      const result = await getTimelineTweets(1, 10, mockPrisma as any);

      // Assert
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe(mockError);
      }
    });
  });
});
