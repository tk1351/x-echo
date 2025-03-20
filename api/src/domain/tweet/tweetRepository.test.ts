import { describe, expect, it, vi } from "vitest";
import { createTweet } from "./tweetRepository.ts";

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
});
