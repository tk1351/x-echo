import { describe, expect, it, vi } from "vitest";
import { createTweet, getTweetById } from "./tweetRepository.ts";

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
});
